// Main App/React Komponente
// Verwaltet den Applikationsstatus mithilfe von Hooks
// Koordiniert alle anderen UI-Komponenten

import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import AppHeader from './AppHeader';
import DeviceScanner from './DeviceScanner';
import DeviceList from './DeviceList';
import ConfigDialog from './ConfigDialog';
import { useDevices } from '../hooks/useDevices';
import AlertMessage from './AlertMessage';

const App: React.FC = () => {
  const { 
    devices,
    isScanning,
    alertInfo,
    clearAlert,
    startScanning,
    stopScanning,
    configureDevice
  } = useDevices();
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

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
        
        <DeviceList 
          devices={Array.from(devices.values())} 
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