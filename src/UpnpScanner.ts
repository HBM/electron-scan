import EventEmitter from 'events'
import { UPNPDEVICE, type UpnpType, type cbType } from './Types'
import { UPNPSocket } from './UpnpHelper'

export class UPNPScanner extends EventEmitter {
  upnpSocket = new UPNPSocket()
  startScanning = (): void => {
    this.upnpSocket.sendMsearch((device: UpnpType) => {
      this.emit(UPNPDEVICE, device)
    })
  }

  stopScanning = (): void => {
    this.upnpSocket.close()
  }

  addListener<T extends typeof UPNPDEVICE | 'error'>(
    eventName: T,
    listener: cbType[T]
  ): this {
    super.addListener(eventName, listener)

    return this
  }

  removeListener<T extends typeof UPNPDEVICE | 'error'>(
    eventName: T,
    listener: cbType[T]
  ): this {
    super.removeListener(eventName, listener)
    return this
  }
}
