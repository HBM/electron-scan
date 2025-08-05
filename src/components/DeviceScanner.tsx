import React from 'react'
import { Button, Paper } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import StopIcon from '@mui/icons-material/Stop'

interface DeviceScannerProps {
  readonly isScanning: boolean
  readonly onStartScan: () => void
  readonly onStopScan: () => void
}

// Bietet Steuerelemente (Kontrolle) zum Starten/Stoppen des Scannens
// Zeigt den Scanstatus an
const DeviceScanner: React.FC<DeviceScannerProps> = ({
  isScanning,
  onStartScan,
  onStopScan
}) => (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(10, 10, 10, 0.15)'
    }}
  ></Paper>
)

export default DeviceScanner
