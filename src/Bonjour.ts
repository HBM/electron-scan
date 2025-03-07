import EventEmitter from 'events'
import Bonjour from 'bonjour-service'
import { BONJOURSERVICE, type AvahiType, type cbType } from './Types'

export class BonjourScanner extends EventEmitter {
  instance: Bonjour
  constructor() {
    super()
    this.instance = new Bonjour()
  }

  startScanning = (): void => {
    this.instance.find(null, (service: AvahiType) =>
      this.emit(BONJOURSERVICE, service)
    )
  }

  addListener<T extends typeof BONJOURSERVICE | 'error'>(
    eventName: T,
    listener: cbType[T]
  ): this {
    super.addListener(eventName, listener)
    return this
  }

  removeListener<T extends typeof BONJOURSERVICE | 'error'>(
    eventName: T,
    listener: cbType[T]
  ): this {
    super.removeListener(eventName, listener)
    return this
  }
}
