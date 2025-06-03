import { HBKScanner } from '../src/HbkScanner'
import { HBKDEVICE } from '../src/Types'

const scanner = new HBKScanner()

scanner.addListener(HBKDEVICE, (device) => {
  // UUID of the discovered device
  const uuid = device.params?.device?.uuid

  if (uuid) {
    // Configuration message
    const configMessage = {
      device: {
        uuid: uuid
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

    scanner.configureDevice(configMessage)
  }
})

scanner.addListener('error', (error) => {
  console.error('Error:', error)
})

scanner.startScanning()
