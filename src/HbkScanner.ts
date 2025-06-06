import EventEmitter from 'events'
import dgram, { type Socket } from 'dgram'
import { HBKDEVICE, type cbType } from './Types'

export interface ConfigMessage {
  device: {
    uuid: string
  }
  netSettings: {
    interface: {
      name: string
      ipv4: {
        manualAddress: string
        manualNetmask: string
      }
      configurationMethod: string
    }
  }
  ttl: number
}

export class HBKScanner extends EventEmitter {
  #id = 0
  #socket: Socket | undefined
  readonly #sendSocket: Socket

  constructor() {
    super()
    this.#socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    this.#sendSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    this.#sendSocket.bind(31417, '0.0.0.0', () => {
      this.#sendSocket.addMembership('239.255.77.77')
    })
  }

  startScanning = (): void => {
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    sock.bind(31416, '0.0.0.0', () => {
      sock.addMembership('239.255.77.76')
    })
    sock.on('message', (msg: Buffer) => {
      try {
        this.emit(HBKDEVICE, JSON.parse(msg.toString()))
      } catch (ex) {
        this.emit('error', `invalid json: ${msg.toString()}`)
      }
    })
    this.#socket = sock
  }

  configureDevice = (msg: ConfigMessage): void => {
    this.#id++
    const message = {
      jsonrpc: '2.0',
      method: 'configure',
      id: this.#id.toString(),
      params: msg
    }
    this.#sendSocket.send(JSON.stringify(message), 31417, '239.255.77.77')
  }

  stopScanning = (): void => {
    if (this.#socket != null) {
      this.#socket.close()
    }
    // Cleanup code
  }

  addListener<T extends typeof HBKDEVICE | 'error'>(
    eventName: T,
    listener: cbType[T]
  ): this {
    super.addListener(eventName, listener)
    return this
  }
}
