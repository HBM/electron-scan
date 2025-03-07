import { BONJOURSERVICE, UPNPDEVICE } from '../src/Types'
import { BonjourScanner } from '../src/Bonjour'
const scan = new BonjourScanner()
scan.addListener(BONJOURSERVICE, (args) => {
  console.log('device')
})
scan.startScanning()
