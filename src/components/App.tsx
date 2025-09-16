/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/prefer-destructuring */
import React, { useState, useMemo } from 'react'
import { Box, Container } from '@mui/material'
import AppHeader from './AppHeader'
import DeviceList from './DeviceList'
import DeviceFilters from './DeviceFilters'
import ConfigDialog from './ConfigDialog'
import { useDevices } from '../hooks/useDevices'
import type { DeviceParams } from 'Types'
import AlertMessage from './AlertMessage'

const App = (): React.JSX.Element => {
  const {
    devices,
    filteredDevices,
    isScanning,
    alertInfo,
    filters,
    updateFilters,
    clearAlert,
    startScanning,
    stopScanning,
    configureDevice,
    isFavorite,
    toggleFavorite
  } = useDevices()

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<
    { params: DeviceParams } | undefined
  >(undefined)

  // Abrufen eindeutiger Familientypen von Geräten
  const availableFamilies = useMemo(() => {
    const families = new Set<string>()
    Array.from(devices.values()).forEach((deviceStatus) => {
      const familyType = deviceStatus.device.params.device.familyType
      families.add(familyType)
    })
    return Array.from(families).sort()
  }, [devices])

  // Eindeutige Interfaces abrufen
  const availableInterfaces = useMemo(() => {
    const interfaces = new Set<string>(['HBM', 'DCP', 'UPNP', 'AVAHI'])
    return Array.from(interfaces).sort()
  }, [devices])

  // Aktive Filter zählen
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.name != null && filters.name.length > 0) {
      count++
    }
    if (filters.family != null && filters.family.length > 0) {
      count++
    }
    if (filters.interface != null && filters.interface.length > 0) {
      count++
    }
    if (filters.ipAddress != null && filters.ipAddress.length > 0) {
      count++
    }
    if (filters.port != null && filters.port.length > 0) {
      count++
    }
    return count
  }, [filters])

  const handleOpenConfig = (device: { params: DeviceParams }): void => {
    setSelectedDevice(device)
    setConfigDialogOpen(true)
  }

  const handleCloseConfig = (): void => {
    setConfigDialogOpen(false)
    setSelectedDevice(undefined)
  }

  const handleConfigureSave = (config: {
    uuid: string
    useDhcp: boolean
    ip: string
    netmask: string
    gateway: string
    interfaceName: string
  }): void => {
    void configureDevice(config)
    setConfigDialogOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />

      <Container disableGutters maxWidth={false}>
        <Box sx={{
          minHeight: 64,
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
          mb: 1
        }}>
          {alertInfo != null ? (
            <AlertMessage
              message={alertInfo.message}
              onClose={clearAlert}
              severity={alertInfo.type}
            />
          ) : null}
        </Box>

        <DeviceFilters
          activeFilterCount={activeFilterCount}
          availableFamilies={availableFamilies}
          availableInterfaces={availableInterfaces}
          filters={filters}
          onFilterChange={updateFilters}
        />

        <DeviceList
          devices={filteredDevices} // filteredDevices anstatt alle devices
          onConfigureDevice={handleOpenConfig}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </Container>

      {selectedDevice != null ? (
        <ConfigDialog
          device={selectedDevice}
          onClose={handleCloseConfig}
          onSave={handleConfigureSave}
          open={configDialogOpen}
        />
      ) : null}
    </Box>
  )
}

export default App
