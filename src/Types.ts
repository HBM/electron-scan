import type { Service } from 'bonjour-service'

export interface HbmType {
  jsonrpc: string
  method: string
  params: DeviceParams
}
export interface DeviceParams {
  apiVersion: string
  device: Device
  defaultGateway?: DefaultGateway
  netSettings: NetworkSetting
  services?: service[]
  expiration: number
}
export interface Device {
  name: string
  uuid: string
  type: string
  label: string
  familyType:
    | 'MGCplus'
    | 'ClipX'
    | 'PMX'
    | 'WTX'
    | 'QuantumX'
    | 'SmartTorque'
    | 'digiBox'
    | 'Fusion'
    | 'Other'
  firmwareVersion: string
}
export interface DefaultGateway {
  ipv4Address: string
}
export interface NetworkSetting {
  interface: {
    name: string
    type: string
    ipv4?: IP4Address[]
    ipv6?: IP6Address[]
    configurationMethod: 'manual' | 'dhcp'
    description?: string
  }
  defaultGateway?: DefaultGateway
}
export interface IP4Address {
  address: string
  netmask: string
}
export interface IP6Address {
  address: string
  prefix: number
}
export interface service {
  type: string
  port: number
  path?: string
}

export interface ConfigMessage {
  jsonrpc: string
  method: string
  params: DeviceParamsConfig
}
export interface DeviceParamsConfig {
  device: Device
  defaultGateway?: DefaultGateway
  netSettings: NetworkSettingsConfig
  ttl: number
}
export interface DeviceConfig {
  uuid: string
}
export interface NetworkSettingsConfig {
  interface: {
    name: string
    ipv4?: IPv4Config
    configurationMethod: 'manual' | 'dhcp'
  }
}
export interface IPv4Config {
  manualAddress: string
  manualNetmask: string
}

export type AvahiType = Service

export interface UpnpType {
  hostName: string
  ip: string
  service: service[]
  type: string
  uuid: string
}

export const HBKDEVICE = 'hbk-device'
export const UPNPDEVICE = 'upnp-device'
export const BONJOURSERVICE = 'avahi-service'

export const devTypes = [HBKDEVICE, UPNPDEVICE, BONJOURSERVICE] as const

export type devTypes = (typeof devTypes)[number]

export interface cbType {
  [HBKDEVICE]: (dev: HbmType) => void
  [UPNPDEVICE]: (dev: UpnpType) => void
  [BONJOURSERVICE]: (dev: AvahiType) => void
  error: (error: string) => void
}
