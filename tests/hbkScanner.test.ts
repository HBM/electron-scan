import { HBKScanner } from '../src/HbkScanner'
import { HBKDEVICE } from '../src/Types'
import dgram from 'dgram'

// Access to mocked sockets
const mockDgram = dgram as jest.Mocked<typeof dgram> & {
  __getMockSockets: () => Record<string, any>
}

describe('HBKScanner', () => {
  let scanner: HBKScanner
  let mockSockets: Record<string, any>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    scanner = new HBKScanner()
    mockSockets = mockDgram.__getMockSockets()
  })

  test('should initialize correctly with two sockets', () => {
    // Check that two sockets were created in the constructor
    expect(mockDgram.createSocket).toHaveBeenCalledTimes(2)

    // Check socket configuration
    expect(mockDgram.createSocket).toHaveBeenCalledWith({
      type: 'udp4',
      reuseAddr: true
    })

    // Get the last created socket (sendSocket)
    const lastSocketKey = Object.keys(mockSockets).pop()
    const sendSocket = mockSockets[lastSocketKey!]

    expect(sendSocket.bind).toHaveBeenCalledWith(
      31417,
      '0.0.0.0',
      expect.any(Function)
    )
    expect(sendSocket.addMembership).toHaveBeenCalledWith('239.255.77.77')
  })

  test('should start scanning and listen for messages', () => {
    scanner.startScanning()

    // Three sockets should be created now (2 in constructor, 1 in startScanning)
    expect(mockDgram.createSocket).toHaveBeenCalledTimes(3)

    // Get the last created socket (scanning socket)
    const lastSocketKey = Object.keys(mockSockets).pop()
    const scanSocket = mockSockets[lastSocketKey!]

    // Verify scanning setup
    expect(scanSocket.bind).toHaveBeenCalledWith(
      31416,
      '0.0.0.0',
      expect.any(Function)
    )
    expect(scanSocket.addMembership).toHaveBeenCalledWith('239.255.77.76')
    expect(scanSocket.on).toHaveBeenCalledWith('message', expect.any(Function))

    // Test message handling
    const deviceListener = jest.fn()
    scanner.addListener(HBKDEVICE, deviceListener)

    // Message receiving simulation
    const mockMessage = {
      jsonrpc: '2.0',
      method: 'announce',
      params: {
        device: {
          uuid: 'test-uuid'
        }
      }
    }

    // Find message handler and call it with a mock buffer
    scanSocket.emit('message', Buffer.from(JSON.stringify(mockMessage)))

    // Verify event was emitted with parsed data
    expect(deviceListener).toHaveBeenCalledWith(mockMessage)
  })

  test('should send configuration messages', () => {
    jest.clearAllMocks()
    jest.resetModules()
    const configScanner = new HBKScanner()

    const freshSockets = mockDgram.__getMockSockets()

    const socketKeys = Object.keys(freshSockets)

    const sendSocket = freshSockets[socketKeys[socketKeys.length - 1]]

    console.log('Testing socket:', socketKeys[socketKeys.length - 1])

    expect(typeof sendSocket.send).toBe('function')

    console.log('All mock sockets:', Object.keys(mockSockets))
    console.log('Number of sockets:', Object.keys(mockSockets).length)

    // Test configuration
    const configMsg = {
      device: {
        uuid: 'test-device'
      },
      netSettings: {
        interface: {
          name: 'eth0',
          ipv4: {
            manualAddress: '192.168.1.100',
            manualNetmask: '255.255.255.0'
          },
          configurationMethod: 'manual'
        }
      },
      ttl: 120
    }

    expect(typeof configScanner.configureDevice).toBe('function')

    configScanner.configureDevice(configMsg)

    console.log('Send mock:', sendSocket.send.mock)
    console.log('Send called times:', sendSocket.send.mock?.calls?.length || 0)

    // Check that send was called with proper params
    expect(sendSocket.send).toHaveBeenCalled()
    expect(sendSocket.send).toHaveBeenCalledWith(
      expect.any(String),
      31417,
      '239.255.77.77'
    )

    // Parse sent message to verify structure
    const sentData = JSON.parse(sendSocket.send.mock.calls[0][0])
    expect(sentData).toEqual({
      jsonrpc: '2.0',
      method: 'configure',
      id: '1',
      params: configMsg
    })
  })

  test('should stop scanning and close socket', () => {
    scanner.startScanning()

    // Get scan socket
    const socketKeys = Object.keys(mockSockets)
    const scanSocket = mockSockets[socketKeys[socketKeys.length - 1]]

    expect(typeof scanSocket.close).toBe('function')

    scanner.stopScanning()
    expect(scanSocket.close).toHaveBeenCalled()
  })

  test('should handle invalid JSON gracefully', () => {
    // Start scanning (which creates a scanning socket)
    scanner.startScanning()

    // Get scanning socket (last created)
    const socketKeys = Object.keys(mockSockets)
    const scanSocket = mockSockets[socketKeys[socketKeys.length - 1]]

    // Set up error listener
    const errorListener = jest.fn()
    scanner.addListener('error', errorListener)

    // Simulate receiving invalid JSON
    scanSocket.emit('message', Buffer.from('invalid-json'))

    // Verify error emittion
    expect(errorListener).toHaveBeenCalledWith(
      expect.stringContaining('invalid json')
    )
  })
})
