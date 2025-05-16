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

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  filters,
  onFilterChange,
  availableFamilies,
  availableInterfaces,
  activeFilterCount
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ [event.target.name]: event.target.value });
  };

  const handleCheckboxChange = (filterKey: 'family' | 'interface', value: string) => {
    const currentValues = filters[filterKey] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    onFilterChange({ [filterKey]: newValues });
  };

  const handleClearFilters = () => {
    onFilterChange({
      name: '',
      family: [],
      interface: [],
      ipAddress: '',
      port: ''
    });
  };

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
            placeholder="Search by device name or IP"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
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
                  {availableInterfaces.map((iface) => (
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
              <TextField
                fullWidth
                label="IP Address"
                name="ipAddress"
                value={filters.ipAddress}
                onChange={handleInputChange}
                size="small"
                variant="outlined"
                placeholder="e.g. 192.168.1.x"
              />
              <TextField
                fullWidth
                label="Port"
                name="port"
                value={filters.port}
                onChange={handleInputChange}
                size="small"
                variant="outlined"
                placeholder="e.g. 80"
                type="number"
              />
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default DeviceFilters;