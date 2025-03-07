import { HBKDEVICE } from '../src/Types'
import { HBKScanner } from '../src/HbkScanner'
const scan = new HBKScanner()
scan.addListener(HBKDEVICE, (args) => {
  console.log('device')
  //console.log(args)
})
scan.startScanning()
