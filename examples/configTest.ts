import { HBKScanner } from '../src/HbkScanner'
import { HBKDEVICE } from '../src/Types'

const scanner = new HBKScanner()

console.log('Starting HBK device scanner...')

scanner.addListener(HBKDEVICE, (device) => {
  console.log('Found device:', JSON.stringify(device, null, 2))
  
  // Extract the UUID of the discovered device
  const uuid = device.params?.device?.uuid
  
  if (uuid) {
    console.log(`Configuring device with UUID: ${uuid}`)
    
    // Configuration message for device
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

    console.log('Sending configuration:', configMessage)
    scanner.configureDevice(configMessage)
    console.log('Configuration sent!')
  } else {
    console.log('Found device without UUID, cannot configure')
  }
})

scanner.addListener('error', (error) => {
  console.error('Error:', error)
})

console.log('Starting scanner...')
scanner.startScanning()