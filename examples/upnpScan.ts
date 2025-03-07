import { UPNPDEVICE } from '../src/Types'
import { UPNPScanner } from '../src/UpnpScanner'
const scan = new UPNPScanner()
scan.addListener(UPNPDEVICE, (args) => {
  console.log('device')
})
scan.startScanning()
