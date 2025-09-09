/* eslint-disable complexity */

/* eslint-disable @typescript-eslint/prefer-destructuring */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ipcRenderer } from 'electron'
import type { DeviceParams, IP4Address, IP6Address } from 'Types'
import type { DeviceProps } from 'components/DeviceRow'
// Filtern Interface
export interface DeviceFilters {
  name?: string
  family?: string[]
  interface?: string[]
  ipAddress?: string
  port?: string
}

interface AlertInfo {
  message: string
  type: 'success' | 'error' | 'info'
}
interface useDevicesReturn {
  devices: Map<string, DeviceProps>
  filteredDevices: DeviceProps[]
  filters: DeviceFilters
  updateFilters: (newFilters: Partial<DeviceFilters>) => void
  isScanning: boolean
  alertInfo: AlertInfo | null
  clearAlert: () => void
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void
  startScanning: () => void
  stopScanning: () => void
  configureDevice: (config: {
    uuid?: string
    useDhcp: boolean
    ip: string
    netmask: string
    gateway?: string
    interfaceName: string
  }) => Promise<void>
  availableInterfaces: string[]
  favorites: Set<String>
  toggleFavorite: (deviceId: string) => void
  isFavorite: (deviceId: string) => boolean
}

// Validierungsmuster für IP und Netmask
const IP_REGEX =
  /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
const NETMASK_REGEX =
  /^(255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/

export const useDevices = (): useDevicesReturn => {
  const [devices, setDevices] = useState<Map<string, DeviceProps>>(new Map())
  const [isScanning, setIsScanning] = useState(false)
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null)
  // Rate-Limiting für Konfigurationsanfragen
  const configRequestTimestamp = useRef<number>(0)
  const CONFIG_COOLDOWN = 2000 // 2 Sekunden Abkühlzeit zwischen Konfigurationsanfragen

  // Filtern State
  const [filters, setFilters] = useState<DeviceFilters>({})

  // Favorites storage utilities
  const favoriten_key = 'device-favorites'

  const loadFavorites = (): Set<string> => {
    try {
      const stored = localStorage.getItem(favoriten_key)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        return new Set(parsed)
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
    return new Set()
  }

  // Favoriten
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites())

  // IPC Listeners
  useEffect(() => {
    ipcRenderer.on('scanner-status', (_event, status: string) => {
      // Status-Validierung gegen bekannte Werte
      if (status !== 'running' && status !== 'stopped') {
        // eslint-disable-next-line no-console
        console.error('Ungültiger Scanner-Status empfangen:', status)
        return
      }
      setIsScanning(status === 'running')
    })

    // Device Discovery
    ipcRenderer.on(
      'hbk-device-found',
      (_event, device: { params: DeviceParams }) => {
        // eslint-disable-next-line no-console
        setDevices((prevDevices) => {
          const { uuid } = device.params.device
          const newDevices = new Map(prevDevices)

          const isNewDevice = !prevDevices.get(uuid)

          const wasOffline = prevDevices.get(uuid) && !prevDevices.get(uuid)?.isOnline

          const sanitizedName =
            (device.params.device.name as string | undefined) != null
              ? device.params.device.name.slice(0, 100).replace(/<[^>]*>/g, '')
              : 'Unkown device'

          const sanitizedDevice: { params: DeviceParams } = {
            ...device,
            params: {
              ...device.params,
              device: {
                ...device.params.device,
                name: sanitizedName
              }
            }
          }

          newDevices.set(uuid, {
            device: sanitizedDevice,
            lastSeen: Date.now(),
            isOnline: true
          })

          if (isNewDevice) {
            showAlert(`New device found: ${sanitizedName}`, 'success')
          } else if (wasOffline) {
            showAlert(`Device came back online: ${sanitizedName}`, 'info')
          }

          return newDevices
        })
      }
    )

    // Scanner errors
    ipcRenderer.on('hbk-scanner-error', (_event, error: string) => {
      // Fehlervalidierung und -sanitierung
      const sanitizedError =
        typeof error === 'string'
          ? error.slice(0, 200).replace(/<[^>]*>/g, '')
          : 'Unkown error'

      showAlert(`Scanner error: ${sanitizedError}`, 'error')
    })

    // Check device status periodically
    const statusCheckInterval = setInterval(() => {
      const now = Date.now()
      const offlineThreshold = 15000

      setDevices((prevDevices) => {
        let updated = false
        const newDevices = new Map(prevDevices)

        for (const [uuid, deviceStatus] of newDevices.entries()) {
          const timeSinceLastSeen = now - deviceStatus.lastSeen
          const wasOnline = deviceStatus.isOnline

          // Mark as offline if no updates for 15 seconds
          if (timeSinceLastSeen > offlineThreshold && wasOnline) {
            newDevices.set(uuid, {
              ...deviceStatus,
              isOnline: false
            })
            updated = true

            const deviceName = deviceStatus.device.params.device.name || 'Unknown device'
            showAlert(`Device went offline: ${deviceName}`, 'info')
          }
        }

        return updated ? newDevices : prevDevices
      })
    }, 5000)

    return () => {
      ipcRenderer.removeAllListeners('scanner-status')
      ipcRenderer.removeAllListeners('hbk-device-found')
      ipcRenderer.removeAllListeners('hbk-scanner-error')
      clearInterval(statusCheckInterval)
    }
  }, [])

  const showAlert = (
    message: string,
    type: 'success' | 'error' | 'info'
  ): void => {
    // XSS-Schutz
    const sanitizedMessage = message.slice(0, 200).replace(/<[^>]*>/g, '')

    setAlertInfo({ message: sanitizedMessage, type })

    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setAlertInfo((prevAlertInfo) =>
          prevAlertInfo?.message === sanitizedMessage ? null : prevAlertInfo
        )
      }, 5000)
    }
  }

  const clearAlert = useCallback(() => {
    setAlertInfo(null)
  }, [])

  const startScanning = useCallback(() => {
    try {
      void ipcRenderer.invoke('start-scanning')
      showAlert('HBK Scanner started device search...', 'info')
    } catch (err) {
      showAlert('Failed to start scanning', 'error')
    }
  }, [])

  const stopScanning = useCallback(() => {
    try {
      void ipcRenderer.invoke('stop-scanning')
      showAlert('Scanner stopped', 'info')
    } catch (err) {
      showAlert('Failed to stop scanning', 'error')
    }
  }, [])

  const configureDevice = useCallback(
    async (config: {
      uuid?: string
      useDhcp: boolean
      ip: string
      netmask: string
      gateway?: string
      interfaceName: string
    }) => {
      // Rate-Limiting
      const now = Date.now()
      if (now - configRequestTimestamp.current < CONFIG_COOLDOWN) {
        showAlert(
          'Too many requests. Please wait a short time before making another configuration.',
          'error'
        )
        return
      }
      configRequestTimestamp.current = now

      const sanitizedUuid = config.uuid?.trim()
      // Validieren der Eingaben
      if (sanitizedUuid == null) {
        showAlert('Invalid device ID', 'error')
        return
      }

      // Bei DHCP brauchen wir keine IP/Netmask/Gateway zu validieren
      if (!config.useDhcp) {
        if (!IP_REGEX.test(config.ip)) {
          showAlert('Invalid IP address format', 'error')
          return
        }

        if (!NETMASK_REGEX.test(config.netmask)) {
          showAlert('Invalid netmask format', 'error')
          return
        }

        // Gateway ist optional, aber wenn angegeben, muss es gültig sein
        if (config.gateway && !IP_REGEX.test(config.gateway)) {
          showAlert('Invalid gateway format', 'error')
          return
        }
      }

      const deviceStatus = devices.get(sanitizedUuid)
      if (deviceStatus == null) {
        showAlert(`Device ${sanitizedUuid} not found`, 'error')
        return
      }

      // Konfigurationsnachricht basierend auf DHCP-Status
      const configMessage = {
        device: {
          uuid: sanitizedUuid
        },
        netSettings: {
          interface: {
            name: config.interfaceName,
            configurationMethod: config.useDhcp ? 'dhcp' : 'manual',
            ipv4: [] as IP4Address[],
            ipv6: [] as IP6Address[]
          }
        },
        ttl: 120
      }

      // Manueller Konfiguration
      if (!config.useDhcp) {
        configMessage.netSettings.interface.ipv4[0] = {
          address: config.ip,
          netmask: config.netmask,
          gateway: config.gateway ?? ''
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const response = (await ipcRenderer.invoke(
          'configure-device',
          configMessage
        )) as {
          success: boolean
          error?: string
        }

        if (response.success) {
          setDevices((prevDevices) => {
            const newDevices = new Map(prevDevices)
            const deviceStatus = newDevices.get(sanitizedUuid)

            if (deviceStatus?.device.params.netSettings.interface != null) {
              // DHCP-Status aktualisieren
              deviceStatus.device.params.netSettings.interface.configurationMethod =
                config.useDhcp ? 'dhcp' : 'manual'

              // Bei manueller Konfiguration IP-Daten aktualisieren
              if (
                !config.useDhcp &&
                deviceStatus.device.params.netSettings.interface.ipv4 != null
              ) {
                if (
                  deviceStatus.device.params.netSettings.interface.ipv4
                    .length === 0
                ) {
                  deviceStatus.device.params.netSettings.interface.ipv4.push({
                    address: config.ip,
                    netmask: config.netmask,
                    gateway: config.gateway ?? ''
                  })
                }
              }

              newDevices.set(sanitizedUuid, deviceStatus)
            }

            return newDevices
          })

          showAlert(`Configuration sent to device ${config.uuid}`, 'success')
        } else {
          showAlert(`Configuration failed: ${response.error}`, 'error')
        }
      } catch (err) {
        showAlert('Failed to configure device', 'error')
      }
    },
    [devices]
  )

  // Filtern updaten
  const updateFilters = useCallback((newFilters: Partial<DeviceFilters>) => {
    // Filtereingaben validiert und sanitiert
    const sanitizedFilters: Partial<DeviceFilters> = {}

    // Name-Filter sanitiert
    if (newFilters.name !== undefined) {
      sanitizedFilters.name = newFilters.name
        .slice(0, 50)
        .replace(/[^\w\s-_.]/g, '')
    }

    // Array-Filter validiert (family und interface)
    if (newFilters.family !== undefined) {
      if (Array.isArray(newFilters.family)) {
        sanitizedFilters.family = newFilters.family
      } else {
        // eslint-disable-next-line no-console
        console.error('Invalid Family filter format')
      }
    }

    if (newFilters.interface !== undefined) {
      if (Array.isArray(newFilters.interface)) {
        sanitizedFilters.interface = newFilters.interface
      } else {
        // eslint-disable-next-line no-console
        console.error('Invalid Interface filter format')
      }
    }

    // IP-Adresse validiert
    if (newFilters.ipAddress !== undefined) {
      if (
        newFilters.ipAddress === '' ||
        /^[0-9.]*$/.test(newFilters.ipAddress)
      ) {
        sanitizedFilters.ipAddress = newFilters.ipAddress
      } else {
        // eslint-disable-next-line no-console
        console.error('Invalid IP filter')
      }
    }

    // Port validiert
    if (newFilters.port !== undefined) {
      if (newFilters.port === '' || /^\d*$/.test(newFilters.port)) {
        sanitizedFilters.port = newFilters.port
      } else {
        // eslint-disable-next-line no-console
        console.error('Invalid port filter')
      }
    }

    setFilters((prevFilters) => ({ ...prevFilters, ...sanitizedFilters }))
  }, [])

  function getInterfaceTypes(device: { params: DeviceParams }): string[] {
    const types: string[] = []
    try {
      if (device.params.services != null && device.params.services.length > 0) {
        for (const s of device.params.services) {
          if (typeof s.type === 'string') {
            const t = s.type.toLowerCase()
            if (t.includes('hbm') && !types.includes('HBM')) {
              types.push('HBM')
            }
            if (t.includes('dcp') && !types.includes('DCP')) {
              types.push('DCP')
            }
            if (t.includes('upnp') && !types.includes('UPNP')) {
              types.push('UPNP')
            }
            if (t.includes('avahi') && !types.includes('AVAHI')) {
              types.push('AVAHI')
            }
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during interface type extraction:', err)
    }
    return types
  }

  // Für Favoriten
  const getDeviceIdentifier = (device: { params: DeviceParams }): string => {
    return `uuid:${device.params.device.uuid}`
  }

  // Gefiltert Geräte Liste
  const filteredDevices = useMemo(() => {
  try {
    const filtered = Array.from(devices.values()).filter(({ device }) => {      
      // Name filtern
      if (filters.name && filters.name.trim() !== '') {
        const nameMatch = device.params.device.name
          .toLowerCase()
          .includes(filters.name.toLowerCase())
        if (!nameMatch) {
          return false
        }
      }

      // Familie filtern
      if (filters.family && filters.family.length > 0) {
        const familyMatch = filters.family.includes(device.params.device.familyType)
        if (!familyMatch) {
          return false
        }
      }

      // Interface filtern
      if (filters.interface && filters.interface.length > 0) {
        const deviceInterfaces = getInterfaceTypes(device)
        const interfaceMatch = filters.interface.some(filterInterface =>
          deviceInterfaces.includes(filterInterface)
        )
        if (!interfaceMatch) {
          return false
        }
      }

      // IP-Adresse filtern
      if (filters.ipAddress && filters.ipAddress.trim() !== '') {
        const ipAddress = device.params.netSettings.interface.ipv4?.[0]?.address
        const ipMatch = ipAddress?.includes(filters.ipAddress)
        if (!ipMatch) {
          return false
        }
      }

      // Port filtern
      if (filters.port && filters.port.trim() !== '') {
        const portMatch = device.params.services?.some(service =>
          service.port?.toString().includes(filters.port!)
        )
        if (!portMatch) {
          return false
        }
      }

      return true
    })

    // Sort: favorites first, then by name
    return filtered.sort((a, b) => {
      const aId = getDeviceIdentifier(a.device)
      const bId = getDeviceIdentifier(b.device)
      const aIsFav = favorites.has(aId)
      const bIsFav = favorites.has(bId)

      if (aIsFav && !bIsFav) return -1
      if (!aIsFav && bIsFav) return 1
      
      // Both same favorite status, sort by name
      return a.device.params.device.name.localeCompare(b.device.params.device.name)
    })
  } catch (err) {
    console.error('Error in filtering:', err)
    return []
  }
}, [devices, filters, favorites])

  const availableInterfaces = useMemo(() => {
    const interfaces = new Set<string>()

    Array.from(devices.values()).forEach((deviceStatus) => {
      const types = getInterfaceTypes(deviceStatus.device)
      types.forEach((t) => interfaces.add(t))
    })

    const ORDER = ['HBM', 'DCP', 'UPNP', 'AVAHI']
    return ORDER.filter((i) => interfaces.has(i))
  }, [devices])

  // Favoriten
  const saveFavorites = (favorites: Set<string>): void => {
    try {
      const array = Array.from(favorites)
      localStorage.setItem(favoriten_key, JSON.stringify(array))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }

  // Toggle favorite status
  const toggleFavorite = useCallback((deviceId: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites)
      if (newFavorites.has(deviceId)) {
        newFavorites.delete(deviceId)
        showAlert('Device removed from favorites', 'info')
      } else {
        newFavorites.add(deviceId)
        showAlert('Device added to favorites', 'success')
      }
      saveFavorites(newFavorites)
      return newFavorites
    })
  }, [])

  // Check if device is favorite
  const isFavorite = useCallback((deviceId: string): boolean => {
    return favorites.has(deviceId)
  }, [favorites])

  return {
    devices,
    filteredDevices,
    filters,
    updateFilters,
    isScanning,
    alertInfo,
    clearAlert,
    showAlert,
    startScanning,
    stopScanning,
    configureDevice,
    availableInterfaces,
    favorites,
    toggleFavorite,
    isFavorite
  }
}
