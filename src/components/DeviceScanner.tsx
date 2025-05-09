import React from 'react';
import { Box, Button, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StopIcon from '@mui/icons-material/Stop';

interface DeviceScannerProps {
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
}

// Bietet Steuerelemente (Kontrolle) zum Starten/Stoppen des Scannens
// Zeigt den Scanstatus an
const DeviceScanner: React.FC<DeviceScannerProps> = ({
  isScanning,
  onStartScan,
  onStopScan
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(10, 10, 10, 0.15)',
      }}
    >
      <Button
        variant="contained"
        color={isScanning ? "error" : "primary"}
        startIcon={isScanning ? <StopIcon /> : <SearchIcon />}
        onClick={isScanning ? onStopScan : onStartScan}
        sx={{ 
          fontSize: '1.1rem', 
          py: 1,
          px: 2,
          mr: 2
        }}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </Button>
    </Paper>
  );
};

export default DeviceScanner;