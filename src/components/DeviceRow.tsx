import React from 'react';
import { 
  TableRow, 
  TableCell, 
  Button, 
  IconButton,
  Box,
  Tooltip,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SettingsIcon from '@mui/icons-material/Settings';

interface DeviceRowProps {
  device: any;
  isExpanded: boolean;
  onToggleDetails: () => void;
  onConfigureClick: () => void;
}

const DeviceRow: React.FC<DeviceRowProps> = ({ 
  device, 
  isExpanded, 
  onToggleDetails,
  onConfigureClick
}) => {
  const { device: deviceData, isOnline, lastSeen } = device;
  const uuid = deviceData.params.device.uuid;
  const ipAddress = deviceData.params.netSettings.interface.ipv4[0]?.address || 'N/A';
  
  const formatTimeSince = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const statusTooltip = isOnline 
    ? 'Online' 
    : `Offline - Last seen ${formatTimeSince(lastSeen)}`;

  return (
    <TableRow 
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { backgroundColor: '#f5f5f5' },
        backgroundColor: isExpanded ? '#eef6fc' : 'inherit',
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
      }}
      onClick={onToggleDetails}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={statusTooltip} placement="top">
            <FiberManualRecordIcon 
              color={isOnline ? 'success' : 'error'} 
              sx={{ 
                mr: 1.5,
                filter: `drop-shadow(0 0 2px ${isOnline ? 'rgba(72, 199, 116, 0.5)' : 'rgba(241, 70, 104, 0.5)'})`
              }} 
            />
          </Tooltip>
          <Typography>{deviceData.params.device.name}</Typography>
        </Box>
      </TableCell>
      <TableCell>{deviceData.params.device.type}</TableCell>
      <TableCell>{uuid}</TableCell>
      <TableCell>{ipAddress}</TableCell>
      <TableCell align="right">
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onConfigureClick();
          }}
          sx={{ 
            mr: 1, 
            backgroundColor: '#103277',
            '&:hover': {
              backgroundColor: '#09245a',
            }
          }}
        >
          Configure
        </Button>
        <IconButton 
          size="small" 
          onClick={onToggleDetails}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default DeviceRow;