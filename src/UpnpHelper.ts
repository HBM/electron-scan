import type { UpnpType } from './Types'
import dgram, { type Socket } from 'dgram'

export const keys = [
  'Cache-Control',
  'Date',
  'Ext',
  'Location',
  'Server',
  'ST',
  'USN',
  'Content-Length'
]
export type keyType = (typeof keys)[number]

export const checkHTTP = (msg: string): boolean =>
  msg.includes('HTTP/1.1 200 OK')

export const parseHeaders = (
  lines: string[]
): Partial<Record<keyType, string>> => {
  const headers: Partial<Record<keyType, string>> = {}
  lines.forEach((line) => {
    const sep = line.indexOf(':')
    if (sep !== -1) {
      const key = line.slice(0, sep)
      if (keys.includes(key)) {
        const value = line.slice(sep + 1)
        headers[key] = value
      }
    }
  })
  return headers
}

export const xmlKeys = [
  'friendlyName',
  'manufacturer',
  'modelDescription',
  'modelName',
  'modelNumber',
  'serialNumber',
  'presentationURL'
]
export type xmlKeyType = (typeof xmlKeys)[number]

export const checkXML = (msg: string): boolean => msg.includes('<?xml')
export const parseXML = (
  lines: string[]
): Partial<Record<xmlKeyType, string>> => {
  const values: Partial<Record<xmlKeyType, string>> = {}
  lines.forEach((line) => {
    const trimmed = line.trim()
    const sep = trimmed.indexOf('>')
    if (sep !== -1) {
      const key = trimmed.slice(1, sep)
      if (xmlKeys.includes(key)) {
        const value = trimmed.slice(sep + 1, trimmed.lastIndexOf('<'))
        values[key] = value
      }
    }
  })
  return values
}

export const parseUpnpDevice = (
  data: Partial<Record<xmlKeyType, string>>
): UpnpType => ({
  uuid: data.serialNumber ?? '',
  hostName: data.friendlyName ?? '',
  ip: new URL(data.presentationURL ?? '').hostname,
  type: data.modelName ?? '',
  service: [{ type: 'http', port: 80 }]
})
const MAXRESPONSETIME = 3
export class UPNPSocket {
  private readonly socket: Socket
  private readonly addr = '239.255.255.250'
  private readonly port = 1900
  private locations = new Set<string>()
  constructor() {
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    this.socket.bind(0, () => {
      this.socket.addMembership(this.addr)
    })
  }

  receiveMessage(msg: Buffer, cb: (dev: UpnpType) => void): void {
    const text = msg.toString('utf8')
    const lines = text.split('\r\n')
    if (!checkHTTP(lines.shift() ?? '')) {
      return
    }
    const headers = parseHeaders(lines)

    const { Location } = headers
    if (Location == null || this.locations.has(Location)) {
      return
    }
    this.locations.add(Location)
    void fetch(Location)
      .then(async (res) => {
        if (res.ok) {
          return await res.text()
        }
        throw new Error('Error')
      })
      .then((data) => {
        const xmlLines = data.split('\r\n')

        if (!checkXML(xmlLines.shift() ?? '')) {
          return
        }
        const res = parseXML(xmlLines)
        if (Object.keys(res).length === 0) {
          return
        }
        const device = parseUpnpDevice(res)
        try {
          cb(device)
        } catch {
          // TODO Error Handling
        }
      })
  }

  sendMsearch = (cb: (dev: UpnpType) => void): void => {
    this.locations = new Set()
    let ssdp = ''
    ssdp += `M-SEARCH * HTTP/1.1\r\n`
    ssdp += `HOST: ${this.addr}:${this.port}\r\n`
    ssdp += `MX:${MAXRESPONSETIME}\r\n`
    ssdp += `MAN: ssdp:discover\r\n`
    ssdp += `ST: upnp:rootdevice\r\n`
    ssdp += `\r\n`
    const buf = Buffer.from(ssdp, 'utf8')
    const receive = (msg: Buffer): void => {
      this.receiveMessage(msg, cb)
    }
    this.socket.on('message', receive)
    setTimeout(() => {
      this.socket.removeListener('message', receive)
    }, MAXRESPONSETIME * 1000)
    this.socket.send(buf, 0, buf.length, this.port, this.addr, (err) => {
      if (err != null) {
        // eslint-disable-next-line no-console
        console.error(err)
      }
    })
  }

  close = (): void => {
    this.socket.close()
  }
}
