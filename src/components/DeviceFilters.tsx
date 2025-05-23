import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Stack,
  Divider,
  FormHelperText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DeviceFilters as DeviceFiltersType } from '../hooks/useDevices';

interface DeviceFiltersProps {
  filters: DeviceFiltersType;
  onFilterChange: (newFilters: Partial<DeviceFiltersType>) => void;
  availableFamilies: string[];
  availableInterfaces: string[];
  activeFilterCount: number;
}

const INTERFACE_ORDER = ['HBM', 'DCP', 'UPNP', 'AVAHI'];

// IPv4 Validierungsmuster
const IP_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){0,3}$/;
// Port Validierungsmuster (1-65535)
const PORT_REGEX = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  filters,
  onFilterChange,
  availableFamilies,
  availableInterfaces,
  activeFilterCount
}) => {
  const [expanded, setExpanded] = useState(false);
  // Validierungsfehler
  const [errors, setErrors] = useState({
    ipAddress: false,
    port: false,
  });

  // Eingabevalidierung und -sanitisierung vor Aktualisierung der Filter
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    // Name-Eingabe sanitiert
    if (name === 'name') {
      // XSS-Schutz
      // 50 Zeichen Eingabe max
      const sanitizedValue = value.slice(0, 50).replace(/[^\w\s-_.]/g, '');
      onFilterChange({ [name]: sanitizedValue });
      return;
    }

    // IP-Adresse Validierung
    if (name === 'ipAddress') {
      if (/^[0-9.]*$/.test(value)) {
        onFilterChange({ [name]: value });
        const isCompleteIP = value.split('.').length === 4 && value.split('.').every(part => part.length > 0);
        // Fehler nur anzeigen wenn vollständige aber ungültige IP 
        setErrors(prev => ({ 
          ...prev, 
          ipAddress: isCompleteIP && !IP_REGEX.test(value) 
        }));
      }
      return;
    }
    
    // Port Validierung
    if (name === 'port') {
      if (/^\d*$/.test(value)) {
        onFilterChange({ [name]: value });
        
        if (value.length > 0) {
          const portNum = parseInt(value, 10);
          const isValidPort = !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
          setErrors(prev => ({ ...prev, port: !isValidPort }));
        } else {
          setErrors(prev => ({ ...prev, port: false }));
        }
      }
      return;
    }

    onFilterChange({ [name]: value });
  };

  const handleCheckboxChange = (filterKey: 'family' | 'interface', value: string) => {
    // Validierung der Checkbox-Werte gegen vordefinierte Arrays
    // Schützt vor Injection-Angriffen durch manipulierte Werte
    if (filterKey === 'family' && !availableFamilies.includes(value)) {
      console.error('Ungültiger Family-Wert: ', value);
      return;
    }
    
    if (filterKey === 'interface' && !availableInterfaces.includes(value)) {
      console.error('Ungültiger Interface-Wert: ', value);
      return;
    }
    
    const currentValues = filters[filterKey] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    onFilterChange({ [filterKey]: newValues });
  };

  const handleClearFilters = () => {
    // Zurücksetzen der Validierungsfehler beim Zurücksetzen der Filter
    setErrors({
      ipAddress: false,
      port: false,
    });

    onFilterChange({
      name: '',
      family: [],
      interface: [],
      ipAddress: '',
      port: ''
    });
  };

  const sortedInterfaces = INTERFACE_ORDER.filter(i => availableInterfaces.includes(i));

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 3,
        p: 2,
        backgroundColor: 'white',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 1,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            placeholder="Search by device name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              // Zusätzliche Sicherheitsmaßnahme (max Länge)
              inputProps: {
                maxLength: 50,
              }
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            gap: 1,
            mt: { xs: 1, md: 0 }
          }}
        >
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`}
              color="primary"
              size="small"
              sx={{ mb: { xs: 1, md: 0 } }}
            />
          )}
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear Filters
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setExpanded(!expanded)}
            startIcon={<FilterAltIcon />}
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
          >
            {expanded ? 'Hide' : 'Filters'}
          </Button>
        </Box>
      </Box>

      <Accordion
        expanded={expanded}
        onChange={(_event, isExpanded) => setExpanded(isExpanded)}
        sx={{
          mt: 2,
          boxShadow: 'none',
          '&:before': { display: 'none' },
          backgroundColor: 'transparent',
          '&.Mui-expanded': { margin: 0 },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 0,
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { margin: '12px 0' },
            '&.Mui-expanded': { minHeight: '48px' },
            display: { xs: 'none', lg: 'flex' }
          }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
            <FilterAltIcon sx={{ mr: 1, fontSize: 20, display: { xs: 'none', lg: 'block' } }} />
            Advanced Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 1, md: 2 }, pt: { xs: 2, lg: 1 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
          >
            {/* Family Filter */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Family Type
              </Typography>
              <FormGroup>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {availableFamilies.map((family) => (
                    <FormControlLabel
                      key={family}
                      control={
                        <Checkbox
                          checked={filters.family.includes(family)}
                          onChange={() => handleCheckboxChange('family', family)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{family}</Typography>}
                      sx={{ minWidth: 120, mr: 2 }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box>

            {/* Interface Filter */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Interface Type
              </Typography>
              <FormGroup>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {sortedInterfaces.map((iface) => (
                    <FormControlLabel
                      key={iface}
                      control={
                        <Checkbox
                          checked={filters.interface.includes(iface)}
                          onChange={() => handleCheckboxChange('interface', iface)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{iface}</Typography>}
                      sx={{ minWidth: 120, mr: 2 }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box>
          </Stack>

          {/* Network Filter */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="medium" gutterBottom sx={{ mt: 1 }}>
              Network
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="IP Address"
                  name="ipAddress"
                  value={filters.ipAddress}
                  onChange={handleInputChange}
                  size="small"
                  variant="outlined"
                  placeholder="e.g. 172.19.190.76"
                  error={errors.ipAddress}
                  InputProps={{
                    inputProps: {
                      maxLength: 15,
                    }
                  }}
                />
                {errors.ipAddress && (
                  <FormHelperText error>
                    Please provide a valid IP-Address
                  </FormHelperText>
                )}
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Port"
                  name="port"
                  value={filters.port}
                  onChange={handleInputChange}
                  size="small"
                  variant="outlined"
                  placeholder="e.g. 80"
                  type="text"
                  error={errors.port}
                  InputProps={{
                    inputProps: {
                      maxLength: 5,
                    }
                  }}
                />
                {errors.port && (
                  <FormHelperText error>
                    Please provide a valid Port (1-65535)
                  </FormHelperText>
                )}
              </Box>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default DeviceFilters;