import React from 'react';
import { 
  Box,
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardHeader,
  CardContent,
  Button,
  Divider,
} from '@mui/material';

// Import the correct Grid component for MUI v7
import Grid from '@mui/material/Grid';

import { 
  Memory as MemoryIcon, 
  Router as RouterIcon,
  Language as LanguageIcon, 
  Public as PublicIcon,
  Storage as StorageIcon,
  OpenInBrowser as OpenInBrowserIcon
} from '@mui/icons-material';

interface DeviceDetailsProps {
  device: any;
}

const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device }) => {
  const { ipcRenderer } = require('electron');
  const fs = require('fs');
  const path = require('path');
  const { imageMap } = require('../icons/map');

  // Helper functions from your original code
  const getDeviceImage = () => {
    const deviceType = device.params.device.type.toLowerCase();
    let imageName = imageMap[deviceType];
    
    if (!imageName && device.params.device.familyType) {
      const familyType = device.params.device.familyType.toLowerCase();
      imageName = imageMap[familyType];
    }
    
    if (!imageName) {
      return 'assets/default-device.webp';
    }
    
    const distPath = path.join(__dirname, 'icons', imageName);
    const srcPath = path.join(__dirname, '../src/icons', imageName);
    
    if (fs.existsSync(distPath)) {
      return `icons/${imageName}`;
    } else if (fs.existsSync(srcPath)) {
      return `../src/icons/${imageName}`;
    } else {
      return 'assets/default-device.webp';
    }
  };

  const getDeviceWebsite = () => {
    // IPv4
    const ipv4Address = device.params.netSettings.interface.ipv4 && 
                    device.params.netSettings.interface.ipv4.length > 0 
                    ? device.params.netSettings.interface.ipv4[0].address 
                    : null;

    // IPv6
    if (!ipv4Address && device.params.netSettings.interface.ipv6 && 
        device.params.netSettings.interface.ipv6.length > 0) {
      const ipv6 = device.params.netSettings.interface.ipv6[0].address;
      return `http://[${ipv6}]`;
    }
    
    return ipv4Address ? `http://${ipv4Address}` : '#';
  };

  const handleOpenWebsite = () => {
    const url = getDeviceWebsite();
    if (url && url !== '#') {
      const { shell } = require('electron');
      shell.openExternal(url).catch(err => {
        console.error('Failed to open device website:', err);
        // You would need to handle the alert here
      });
    } else {
      // Handle error
      console.error('No valid IP address available for this device');
    }
  };

  const imagePath = getDeviceImage();
  const websiteUrl = getDeviceWebsite();

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Device Image and Website Link */}
        <Grid sx={{ width: '100%', textAlign: 'center', mb: 2 }}>
          <Box 
            component="img" 
            src={imagePath}
            alt={device.params.device.name}
            onError={(e: any) => { e.target.src = 'assets/default-device.webp'; }}
            sx={{
              maxHeight: 150,
              maxWidth: '100%',
              objectFit: 'contain',
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: '#fafafa',
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 4px rgba(10, 10, 10, 0.1)'
            }}
          />
          
          {websiteUrl !== '#' ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenWebsite}
              startIcon={<OpenInBrowserIcon />}
              sx={{ 
                mt: 1,
                backgroundColor: '#09245a',
                '&:hover': {
                  backgroundColor: '#103277',
                  boxShadow: '0 2px 5px rgba(9, 36, 90, 0.3)'
                }
              }}
            >
              Open Device Website
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              disabled
              startIcon={<OpenInBrowserIcon />}
              sx={{ mt: 1 }}
            >
              No Web Interface Available
            </Button>
          )}
        </Grid>

        {/* Device Information */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card variant="outlined">
            <CardHeader 
              title="Device Information" 
              avatar={<MemoryIcon color="primary" />}
              sx={{ 
                backgroundColor: '#fafafa', 
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" width="30%">Name</TableCell>
                      <TableCell>{device.params.device.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">UUID</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{device.params.device.uuid}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Type</TableCell>
                      <TableCell>{device.params.device.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Family</TableCell>
                      <TableCell>{device.params.device.familyType}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Firmware</TableCell>
                      <TableCell>{device.params.device.firmwareVersion}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">API Version</TableCell>
                      <TableCell>{device.params.apiVersion}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Expiration</TableCell>
                      <TableCell>{device.params.expiration}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Interface */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card variant="outlined">
            <CardHeader 
              title="Network Interface" 
              avatar={<RouterIcon color="primary" />}
              sx={{ 
                backgroundColor: '#fafafa', 
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" width="30%">Interface</TableCell>
                      <TableCell>{device.params.netSettings.interface.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Description</TableCell>
                      <TableCell>{device.params.netSettings.interface.description || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Type</TableCell>
                      <TableCell>{device.params.netSettings.interface.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Configuration</TableCell>
                      <TableCell>{device.params.netSettings.interface.configurationMethod || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* IPv4 Addresses */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card variant="outlined">
            <CardHeader 
              title="IPv4 Addresses" 
              avatar={<LanguageIcon color="primary" />}
              sx={{ 
                backgroundColor: '#fafafa', 
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="60%">IP Address</TableCell>
                      <TableCell width="40%">Netmask</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.netSettings.interface.ipv4 && device.params.netSettings.interface.ipv4.length > 0 
                      ? device.params.netSettings.interface.ipv4.map((ip: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontWeight: 'medium' }}>{ip.address}</TableCell>
                          <TableCell>{ip.netmask}</TableCell>
                        </TableRow>
                      ))
                      : <TableRow><TableCell colSpan={2} align="center">No IPv4 addresses configured</TableCell></TableRow>
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Services */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card variant="outlined">
            <CardHeader 
              title="Services" 
              avatar={<StorageIcon color="primary" />}
              sx={{ 
                backgroundColor: '#fafafa', 
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="70%">Type</TableCell>
                      <TableCell width="30%">Port</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.services && device.params.services.length > 0 
                      ? device.params.services.map((service: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{service.type}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'medium' }}>{service.port}</TableCell>
                        </TableRow>
                      ))
                      : <TableRow><TableCell colSpan={2} align="center">No services available</TableCell></TableRow>
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* IPv6 Addresses */}
        <Grid sx={{ width: '100%' }}>
          <Card variant="outlined">
            <CardHeader 
              title="IPv6 Addresses" 
              avatar={<PublicIcon color="primary" />}
              sx={{ 
                backgroundColor: '#fafafa', 
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="80%">Address</TableCell>
                      <TableCell width="20%">Prefix</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.netSettings.interface.ipv6 && device.params.netSettings.interface.ipv6.length > 0 
                      ? device.params.netSettings.interface.ipv6.map((ip: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{ip.address}</TableCell>
                          <TableCell align="center">{ip.prefix}</TableCell>
                        </TableRow>
                      ))
                      : <TableRow><TableCell colSpan={2} align="center">No IPv6 addresses configured</TableCell></TableRow>
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeviceDetails;