import EventEmitter from 'events'
import {
  type devTypes,
  type cbType,
  HBKDEVICE,
  BONJOURSERVICE,
  UPNPDEVICE
} from './Types'
import { HBKScanner } from './HbkScanner'
import { BonjourScanner } from './Bonjour'
import { UPNPScanner } from './UpnpScanner'

interface scanParams {
  hbmScan: boolean
  bonjour: boolean
  upnp: boolean
}

export class Scanner extends EventEmitter {
  hbmscanner: HBKScanner | undefined
  bonjurScanner: BonjourScanner | undefined
  upnpScanner: UPNPScanner | undefined

  constructor({ hbmScan = true, bonjour = true, upnp = true }: scanParams) {
    super()
    if (hbmScan) {
      this.hbmscanner = new HBKScanner()
    }
    if (bonjour) {
      this.bonjurScanner = new BonjourScanner()
    }

    if (upnp) {
      this.upnpScanner = new UPNPScanner()
    }
  }

  startScanning = ({ bonjour, hbmScan, upnp }: scanParams): void => {
    if (hbmScan) {
      this.startHBMScanning()
    }
    if (bonjour) {
      this.startBonjourScanning()
    }
    if (upnp) {
      this.startUPNPScanning()
    }
  }

  private startHBMScanning(): void {
    if (this.hbmscanner == null) {
      throw new Error('Scanner was started without HBM Scan')
    } else {
      this.hbmscanner.addListener(HBKDEVICE, (args) => {
        this.emit(HBKDEVICE, args)
      })
      this.hbmscanner.addListener('error', (args) => this.emit('error', args))
      this.hbmscanner.startScanning()
    }
  }

  private startBonjourScanning(): void {
    if (this.bonjurScanner == null) {
      throw new Error('Scanner was started without Bonjour Scan')
    } else {
      this.bonjurScanner.addListener(BONJOURSERVICE, (args) =>
        this.emit(BONJOURSERVICE, args)
      )
      this.bonjurScanner.startScanning()
    }
  }

  private startUPNPScanning(): void {
    if (this.upnpScanner == null) {
      throw new Error('Scanner was started without UPNP Scan')
    } else {
      this.upnpScanner.addListener(UPNPDEVICE, (args) => {
        this.emit(UPNPDEVICE, args)
      })
      this.upnpScanner.startScanning()
    }
  }

  stopScanning = (): void => {
    if (this.hbmscanner != null) {
      this.hbmscanner.stopScanning()
      this.hbmscanner.removeAllListeners(HBKDEVICE)
    }
    if (this.bonjurScanner != null) {
      this.bonjurScanner.removeAllListeners(BONJOURSERVICE)
    }
    if (this.upnpScanner != null) {
      this.upnpScanner.removeAllListeners(UPNPDEVICE)
    }
  }

  addListener<T extends devTypes>(eventName: T, listener: cbType[T]): this {
    super.addListener(eventName, listener)
    return this
  }

  removeListener<T extends devTypes>(eventName: T, listener: cbType[T]): this {
    super.removeListener(eventName, listener)
    return this
  }
}
