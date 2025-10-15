import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SettingsIcon from '@mui/icons-material/Settings'
import DeviceDetails from './DeviceDetails'
import type { DeviceProps } from './DeviceRow'

interface DeviceDetailsDialogProps {
  readonly device: DeviceProps
  readonly open: boolean
  readonly onClose: () => void
  readonly onConfigure?: (device: DeviceProps) => void
}

const DeviceDetailsDialog: React.FC<DeviceDetailsDialogProps> = ({
  device,
  open,
  onClose,
  onConfigure
}) => {
  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure(device)
    }
    onClose() // Close the details dialog after opening configure
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#09245a',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            Device Details
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            {device.device.params.device.name} -{' '}
            {device.device.params.device.familyType}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <DeviceDetails device={device.device} />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {onConfigure && (
          <Button
            onClick={handleConfigure}
            variant="contained"
            startIcon={<SettingsIcon />}
            sx={{
              backgroundColor: '#103277',
              color: 'white',
              '&:hover': {
                backgroundColor: '#0d2760'
              }
            }}
          >
            Configure
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default DeviceDetailsDialog
