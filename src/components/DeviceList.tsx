import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Collapse,
  Box
} from '@mui/material';
import DeviceRow from './DeviceRow';
import DeviceDetails from './DeviceDetails';

interface DeviceListProps {
  devices: any[];
  onConfigureDevice: (device: any) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onConfigureDevice }) => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  const handleToggleDetails = (uuid: string) => {
    setExpandedDevice(expandedDevice === uuid ? null : uuid);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        backgroundColor: 'white',
        boxShadow: '0 3px 7px rgba(0, 0, 0, 0.15)',
        flex: 1,
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Discovered Devices
      </Typography>
      
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>UUID</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No devices found yet
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <React.Fragment key={device.device.params.device.uuid}>
                  <DeviceRow 
                    device={device} 
                    isExpanded={expandedDevice === device.device.params.device.uuid}
                    onToggleDetails={() => handleToggleDetails(device.device.params.device.uuid)}
                    onConfigureClick={() => onConfigureDevice(device.device)}
                  />
                  <TableRow>
                    <TableCell 
                      colSpan={5} 
                      sx={{ 
                        p: 0,
                        border: expandedDevice === device.device.params.device.uuid ? '1px solid #e0e0e0' : 'none',
                        borderLeft: expandedDevice === device.device.params.device.uuid ? '6px solid #3273dc' : 'none',
                      }}
                    >
                      <Collapse in={expandedDevice === device.device.params.device.uuid}>
                        <Box sx={{ py: 2 }}>
                          {expandedDevice === device.device.params.device.uuid && (
                            <DeviceDetails device={device.device} />
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DeviceList;