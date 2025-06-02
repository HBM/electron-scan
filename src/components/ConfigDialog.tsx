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
  Divider,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';

interface ConfigDialogProps {
  open: boolean;
  device: any;
  onClose: () => void;
  onSave: (config: DeviceConfig) => void;
}

// Konfigurationsobjekt-Typ
interface DeviceConfig {
  uuid: string;
  useDhcp: boolean;
  ip: string;
  netmask: string;
  gateway: string;
  interfaceName: string;
}

// IP- und Netmask-Validierungsmuster
const IP_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const NETMASK_REGEX = /^(255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/;
const GATEWAY_REGEX = IP_REGEX;

const ConfigDialog: React.FC<ConfigDialogProps> = ({
  open,
  device,
  onClose,
  onSave
}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [netmask, setNetmask] = useState('');
  const [gateway, setGateway] = useState('');
  const [useDhcp, setUseDhcp] = useState(false);
  const [errors, setErrors] = useState({
    ipAddress: false,
    netmask: false,
    gateway: false
  });
  const [confirmMode, setConfirmMode] = useState(false);
  const [configChanged, setConfigChanged] = useState(false);

  useEffect(() => {
    if (device && device.params?.netSettings?.interface) {
      setUseDhcp(false);
      
      // IP-Adresse, Netzmaske und Gateway laden
      if (device.params.netSettings.interface.ipv4 && device.params.netSettings.interface.ipv4.length > 0) {
        const ipv4Config = device.params.netSettings.interface.ipv4[0];
        
        setIpAddress(ipv4Config?.address || '');
        setNetmask(ipv4Config?.netmask || '');
        setGateway(ipv4Config?.gateway || '');
      }
      
      setConfigChanged(false);
      setConfirmMode(false);
    }
  }, [device, open]);

  const dhcpToggle = () => {
    setUseDhcp(prev => !prev);
    setConfigChanged(true);
  };

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
        setConfigChanged(true);
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

  // Gateway validiert und aktualisiert
  const handleGatewayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    const isTyping = value === '' || /^(25[0-5]|2[0-4]\d|[01]?\d\d?)?(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)?){0,3}$/.test(value);
    
    if (isTyping) {
      const sanitizedValue = value.slice(0, 15);
      setGateway(sanitizedValue);
      
      if (sanitizedValue.length > 0) {
        const isCompleteGateway = sanitizedValue.split('.').length === 4 && sanitizedValue.split('.').every(part => part.length > 0);
        
        setErrors(prev => ({ 
          ...prev, 
          gateway: isCompleteGateway && !GATEWAY_REGEX.test(sanitizedValue)
        }));
      } else {
        // Leeres Gateway ist gültig
        setErrors(prev => ({ ...prev, gateway: false }));
      }
      
      if (device?.params?.netSettings?.interface?.ipv4[0]?.gateway !== sanitizedValue) {
        setConfigChanged(true);
      }
    }
  };

  // Form Validierung
  const isFormValid = () => {
    if (useDhcp) {
      return true; // Bei DHCP müssen keine anderen Felder validiert werden
    }

    const isGatewayValid = gateway === '' || GATEWAY_REGEX.test(gateway);

    return IP_REGEX.test(ipAddress) && NETMASK_REGEX.test(netmask) && isGatewayValid &&
           !errors.ipAddress && !errors.netmask && !errors.gateway;
  };

  const handleSubmit = () => {
    // Bei manueller Konfiguration erst alle Felder validieren
    if (!useDhcp) {
      if (!IP_REGEX.test(ipAddress)) {
        setErrors(prev => ({ ...prev, ipAddress: true }));
        return;
      }
      
      if (!NETMASK_REGEX.test(netmask)) {
        setErrors(prev => ({ ...prev, netmask: true }));
        return;
      }
      
      if (gateway !== '' && !GATEWAY_REGEX.test(gateway)) {
        setErrors(prev => ({ ...prev, gateway: true }));
        return;
      }
    }
    
    if (configChanged && !confirmMode) {
      setConfirmMode(true);
      return;
    }
    
    const interfaceName = device?.params?.netSettings?.interface?.name || 'ETH0';
    
    onSave({
      uuid: device?.params?.device?.uuid,
      useDhcp,
      ip: ipAddress,
      netmask,
      gateway,
      interfaceName
    });
  };

  const handleClose = () => {
    setErrors({ ipAddress: false, netmask: false, gateway: false });
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
                    <strong>DHCP:</strong> {useDhcp ? 'Activated' : 'Deactivated'}
                  </Typography>

                  {!useDhcp && (
                    <>
                      <Typography variant="body2">
                        <strong>New IP-Adress:</strong> {ipAddress}
                      </Typography>
                      <Typography variant="body2">
                        <strong>New Netmask:</strong> {netmask}
                      </Typography>
                      {gateway && (
                        <Typography variant="body2">
                          <strong>Gateway:</strong> {gateway}
                        </Typography>
                      )}
                    </>
                  )}
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

                {/* DHCP Toggle */}
                <FormControlLabel
                  control={
                    <Switch 
                      checked={useDhcp}
                      onChange={dhcpToggle}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Activate DHCP (Automatic Network Configuration)
                    </Typography>
                  }
                  sx={{ my: 2, display: 'block' }}
                />

                {/* Manuelle Konfiguration (deaktiviert wenn DHCP aktiviert wird) */}
                <TextField
                  label="IP-Adress"
                  value={ipAddress}
                  onChange={handleIpChange}
                  disabled={useDhcp}
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
                  label="Netmask"
                  value={netmask}
                  onChange={handleNetmaskChange}
                  disabled={useDhcp}
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
                <TextField
                  label="Gateway"
                  value={gateway}
                  onChange={handleGatewayChange}
                  disabled={useDhcp}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="192.168.1.100"
                  error={errors.gateway}
                  InputProps={{
                    inputProps: {
                      maxLength: 15
                    }
                  }}
                />
                {errors.gateway && (
                  <FormHelperText error>
                    Please provide a valid Gateway-Address (e.g. 192.168.1.100)
                  </FormHelperText>
                )}

                {useDhcp && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    If DHCP is activated, all network settings are automatically obtained from the DHCP server.
                  </Alert>
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