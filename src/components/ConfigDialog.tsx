import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

interface ConfigDialogProps {
  open: boolean;
  device: any;
  onClose: () => void;
  onSave: (ip: string, netmask: string) => void;
}

const ConfigDialog: React.FC<ConfigDialogProps> = ({
  open,
  device,
  onClose,
  onSave
}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [netmask, setNetmask] = useState('');

  useEffect(() => {
    if (device && device.params.netSettings.interface.ipv4 && device.params.netSettings.interface.ipv4.length > 0) {
      setIpAddress(device.params.netSettings.interface.ipv4[0].address || '');
      setNetmask(device.params.netSettings.interface.ipv4[0].netmask || '');
    }
  }, [device]);

  const handleSubmit = () => {
    onSave(ipAddress, netmask);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configure Device</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, pb: 1 }}>
          <TextField
            label="IP Address"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            placeholder="192.168.1.100"
          />
          <TextField
            label="Netmask"
            value={netmask}
            onChange={(e) => setNetmask(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            placeholder="255.255.255.0"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary"
          variant="contained"
          sx={{ 
            backgroundColor: '#103277',
            '&:hover': {
              backgroundColor: '#09245a',
            }
          }}
        >
          Apply Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigDialog;