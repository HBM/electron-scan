// Main App/React Komponente
// Verwaltet den Applikationsstatus mithilfe von Hooks
// Koordiniert alle anderen UI-Komponenten

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Container } from '@mui/material';
import AppHeader from './AppHeader';
import DeviceScanner from './DeviceScanner';
import DeviceList from './DeviceList';
import DeviceFilters from './DeviceFilters';
import ConfigDialog from './ConfigDialog';
import { useDevices } from '../hooks/useDevices';
import AlertMessage from './AlertMessage';

const App: React.FC = () => {
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
    configureDevice
  } = useDevices();
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  // Abrufen eindeutiger Familientypen von Geräten
  const availableFamilies = useMemo(() => {
    const families = new Set<string>();
    Array.from(devices.values()).forEach(deviceStatus => {
      const familyType = deviceStatus.device?.params?.device?.familyType;
      if (familyType) families.add(familyType);
    });
    return Array.from(families).sort();
  }, [devices]);

  // TODO!!!
  // Eindeutige Interfaces abrufen
  const availableInterfaces = useMemo(() => {
    const interfaces = new Set<string>(['HBM', 'DCP', 'UPNP', 'AVAHI']);
    return Array.from(interfaces).sort();
  }, [devices]);

  // Aktive Filter zählen
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.name) count++;
    if (filters.family.length > 0) count++;
    if (filters.interface.length > 0) count++;
    if (filters.ipAddress) count++;
    if (filters.port) count++;
    return count;
  }, [filters]);

  const handleOpenConfig = (device: any) => {
    setSelectedDevice(device);
    setConfigDialogOpen(true);
  };

  const handleCloseConfig = () => {
    setConfigDialogOpen(false);
    setSelectedDevice(null);
  };

  const handleConfigureSave = async (ip: string, netmask: string) => {
    if (selectedDevice) {
      await configureDevice(selectedDevice.params.device.uuid, ip, netmask);
      setConfigDialogOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />
      
      <Container maxWidth={false} disableGutters>
        <DeviceScanner 
          isScanning={isScanning}
          onStartScan={startScanning}
          onStopScan={stopScanning}
        />
        
        {alertInfo && (
          <AlertMessage
            message={alertInfo.message}
            severity={alertInfo.type}
            onClose={clearAlert}
          />
        )}

        <DeviceFilters
          filters={filters}
          onFilterChange={updateFilters}
          availableFamilies={availableFamilies}
          availableInterfaces={availableInterfaces}
          activeFilterCount={activeFilterCount}
        />
        
        <DeviceList 
          devices={filteredDevices} // filteredDevices anstatt alle devices
          onConfigureDevice={handleOpenConfig}
        />
      </Container>
      
      {selectedDevice && (
        <ConfigDialog 
          open={configDialogOpen}
          device={selectedDevice}
          onClose={handleCloseConfig}
          onSave={handleConfigureSave}
        />
      )}
    </Box>
  );
};

export default App;