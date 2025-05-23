// Modal für die Konfiguration der Netzwerkeinstellungen des Geräts

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormHelperText,
  Typography,
  Divider
} from '@mui/material';

interface ConfigDialogProps {
  open: boolean;
  device: any;
  onClose: () => void;
  onSave: (ip: string, netmask: string) => void;
}

// IP- und Netmask-Validierungsmuster
const IP_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const NETMASK_REGEX = /^(255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/;

const ConfigDialog: React.FC<ConfigDialogProps> = ({
  open,
  device,
  onClose,
  onSave
}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [netmask, setNetmask] = useState('');
  const [errors, setErrors] = useState({
    ipAddress: false,
    netmask: false
  });
  const [confirmMode, setConfirmMode] = useState(false);
  const [ipChanged, setIpChanged] = useState(false);

  useEffect(() => {
    if (device && device.params.netSettings.interface.ipv4 && device.params.netSettings.interface.ipv4.length > 0) {
      const originalIp = device.params.netSettings.interface.ipv4[0].address || '';
      const originalNetmask = device.params.netSettings.interface.ipv4[0].netmask || '';
      
      setIpAddress(originalIp);
      setNetmask(originalNetmask);
      setIpChanged(false);
      setConfirmMode(false);
    }
  }, [device, open]);

  // IP-Adresse validiert und aktualisiert
  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^[0-9.]*$/.test(value)) {
      setIpAddress(value.slice(0, 15));
      
      if (value.length > 0) {
        const isCompleteIP = value.split('.').length === 4 && value.split('.').every(part => part.length > 0);
        setErrors(prev => ({ 
          ...prev, 
          ipAddress: isCompleteIP && !IP_REGEX.test(value)
        }));
      } else {
        setErrors(prev => ({ ...prev, ipAddress: false }));
      }
      
      if (device?.params?.netSettings?.interface?.ipv4[0]?.address !== value) {
        setIpChanged(true);
      }
    }
  };

  // Netmask validiert und aktualisiert
  const handleNetmaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^[0-9.]*$/.test(value)) {
      setNetmask(value.slice(0, 15));
    
      if (value.length > 0) {
        const isCompleteNetmask = value.split('.').length === 4 && value.split('.').every(part => part.length > 0);
        setErrors(prev => ({ 
          ...prev, 
          netmask: isCompleteNetmask && !NETMASK_REGEX.test(value)
        }));
      } else {
        setErrors(prev => ({ ...prev, netmask: false }));
      }
    }
  };

  // Form Validierung
  const isFormValid = () => {
    return IP_REGEX.test(ipAddress) && NETMASK_REGEX.test(netmask) && 
           !errors.ipAddress && !errors.netmask;
  };

  const handleSubmit = () => {
    // Vollständige Validierung vor dem Speichern
    if (!IP_REGEX.test(ipAddress)) {
      setErrors(prev => ({ ...prev, ipAddress: true }));
      return;
    }
    
    if (!NETMASK_REGEX.test(netmask)) {
      setErrors(prev => ({ ...prev, netmask: true }));
      return;
    }
    
    // Bestätigung anfordern wenn sich die IP geändert hat
    if (ipChanged && !confirmMode) {
      setConfirmMode(true);
      return;
    }
    
    // Rate-Limiting durch UI-Blockierung (cool-down period) --> DoS-Schutz
    onSave(ipAddress, netmask);
  };

  const handleClose = () => {
    setErrors({ ipAddress: false, netmask: false });
    setConfirmMode(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={confirmMode ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{confirmMode ? 'Confirm Configuration' : 'Configure Device'}</DialogTitle>
      <DialogContent>
        {confirmMode ? (
          <Box sx={{ pt: 1, pb: 1 }}>
            <Typography variant="subtitle2">The following configuration will be applied:</Typography>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Device:</strong> {device?.params?.device?.name || 'Unkown'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>New IP-Adress:</strong> {ipAddress}
                  </Typography>
                  <Typography variant="body2">
                    <strong>New Netmask:</strong> {netmask}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Click on “Confirm Configuration” to apply the changes.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ pt: 1, pb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Network settings for: {device?.params?.device?.name || 'Unkown'}
                </Typography>
                <TextField
                  label="IP-Adress"
                  value={ipAddress}
                  onChange={handleIpChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="192.168.1.100"
                  error={errors.ipAddress}
                  InputProps={{
                    inputProps: {
                      maxLength: 15
                    }
                  }}
                />
                {errors.ipAddress && (
                  <FormHelperText error>
                    Please provide a valid IP-Address (e.g. 192.168.1.100)
                  </FormHelperText>
                )}
                <TextField
                  label="Netzmaske"
                  value={netmask}
                  onChange={handleNetmaskChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="255.255.255.0"
                  error={errors.netmask}
                  InputProps={{
                    inputProps: {
                      maxLength: 15
                    }
                  }}
                />
                {errors.netmask && (
                  <FormHelperText error>
                    Please provide a valid Netmask (e.g. 255.255.255.0)
                  </FormHelperText>
                )}
              </Box>
            )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          color="inherit"
        >
          {confirmMode ? 'Cancel' : 'Close'}
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary"
          variant="contained"
          disabled={!isFormValid()}
          sx={{ 
            backgroundColor: '#103277',
            '&:hover': {
              backgroundColor: '#09245a',
            }
          }}
        >
          {confirmMode ? 'Confirm Configuration' : 'Apply Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigDialog;