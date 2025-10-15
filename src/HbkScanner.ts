import EventEmitter from 'events'
import dgram, { type Socket } from 'dgram'
import { HBKDEVICE, type cbType } from './Types'

export interface ConfigMessage {
  device: {
    uuid: string
  },
  defaultGateway: {
    ipv4: string
  },
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

  static listAllIPv4Interfaces(): { name: string; address: string }[] {
    const os = require('os')
    const nets = os.networkInterfaces()
    const results: { name: string; address: string }[] = []
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          results.push({ name, address: net.address })
        }
      }
    }
    return results
  }
  constructor() {
    super()
    this.#socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    this.#sendSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    this.#sendSocket.bind(31417, '0.0.0.0', () => {
      const interfaces = HBKScanner.listAllIPv4Interfaces()

      for (const iface of interfaces) {
        try {
          this.#sendSocket.addMembership('239.255.77.77', iface.address)
          console.log(
            `Added membership for interface ${iface.name} (${iface.address})`
          )
        } catch (err) {
          console.warn(
            `Could not add membership for interface ${iface.name} (${iface.address}):`,
            err
          )
        }
      }
    })
  }

  startScanning = (): void => {
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    sock.bind(31416, '0.0.0.0', () => {
      const interfaces = HBKScanner.listAllIPv4Interfaces()
      console.log('Detected network interfaces:', interfaces)

      for (const iface of interfaces) {
        try {
          sock.addMembership('239.255.77.76', iface.address)
          console.log(
            `Added membership for interface ${iface.name} (${iface.address})`
          )
        } catch (err) {
          console.warn(
            `Could not add membership for interface ${iface.name} (${iface.address}):`,
            err
          )
        }
      }
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
      try {
        this.#socket.close()
      } catch (err) {
        console.warn('Socket close warning:', err)
      }
      this.#socket = undefined
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
