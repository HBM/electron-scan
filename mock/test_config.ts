import { HBKScanner } from '../src/HbkScanner'
import { HBKDEVICE } from '../src/Types'

const scanner = new HBKScanner()

// Device announcements
scanner.addListener(HBKDEVICE, () => {
  // Device found -> send configuration
  const configMessage = {
    device: {
      uuid: '0009E50046CC' // UUID of mock device
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
})

scanner.startScanning()
