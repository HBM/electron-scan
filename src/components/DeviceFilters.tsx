import React, { useState } from 'react'
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
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { DeviceFilters as DeviceFiltersType } from '../hooks/useDevices'

interface DeviceFiltersProps {
  readonly filters: DeviceFiltersType
  readonly onFilterChange: (newFilters: Partial<DeviceFiltersType>) => void
  readonly availableFamilies: string[]
  readonly availableInterfaces: string[]
  readonly activeFilterCount: number
}

const INTERFACE_ORDER = ['HBM', 'DCP', 'UPNP', 'AVAHI']

// IPv4 Validierungsmuster
const IP_REGEX =
  /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){0,3}$/

const DeviceFilters = ({
  filters,
  onFilterChange,
  availableFamilies,
  availableInterfaces,
  activeFilterCount
}: DeviceFiltersProps): React.JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  // Validierungsfehler
  const [errors, setErrors] = useState({
    ipAddress: false,
    port: false
  })

  // Eingabevalidierung und -sanitisierung vor Aktualisierung der Filter
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    // eslint-disable-next-line @typescript-eslint/prefer-destructuring
    const { name, value } = event.target

    // Name-Eingabe sanitiert
    if (name === 'name') {
      // XSS-Schutz
      // 50 Zeichen Eingabe max
      const sanitizedValue = value.slice(0, 50).replace(/[^\w\s-_.]/g, '')
      onFilterChange({ [name]: sanitizedValue })
      return
    }

    // IP-Adresse Validierung
    if (name === 'ipAddress') {
      if (/^[0-9.]*$/.test(value)) {
        onFilterChange({ [name]: value })
        const isCompleteIP =
          value.split('.').length === 4 &&
          value.split('.').every((part) => part.length > 0)
        // Fehler nur anzeigen wenn vollständige aber ungültige IP
        setErrors((prev) => ({
          ...prev,
          ipAddress: isCompleteIP && !IP_REGEX.test(value)
        }))
      }
      return
    }

    // Port Validierung
    if (name === 'port') {
      if (/^\d*$/.test(value)) {
        onFilterChange({ [name]: value })

        if (value.length > 0) {
          const portNum = parseInt(value, 10)
          const isValidPort =
            !isNaN(portNum) && portNum >= 1 && portNum <= 65535
          setErrors((prev) => ({ ...prev, port: !isValidPort }))
        } else {
          setErrors((prev) => ({ ...prev, port: false }))
        }
      }
      return
    }

    onFilterChange({ [name]: value })
  }

  const handleCheckboxChange = (
    filterKey: 'family' | 'interface',
    value: string
  ): void => {
    // Validierung der Checkbox-Werte gegen vordefinierte Arrays
    // Schützt vor Injection-Angriffen durch manipulierte Werte
    if (filterKey === 'family' && !availableFamilies.includes(value)) {
      return
    }

    if (filterKey === 'interface' && !availableInterfaces.includes(value)) {
      return
    }

    const currentValues = filters[filterKey] ?? []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]
    onFilterChange({ [filterKey]: newValues })
  }

  const handleClearFilters = (): void => {
    // Zurücksetzen der Validierungsfehler beim Zurücksetzen der Filter
    setErrors({
      ipAddress: false,
      port: false
    })

    onFilterChange({
      name: '',
      ipAddress: '',
      port: '',
      family: [],
      interface: []
    })
  }

  const sortedInterfaces = INTERFACE_ORDER.filter((i) =>
    availableInterfaces.includes(i)
  )

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
          mb: 1
        }}
      >
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            name="name"
            onChange={handleInputChange}
            placeholder="Search by device name"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
            value={filters.name}
            variant="outlined"
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
              color="primary"
              label={`${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`}
              size="small"
              sx={{ mb: { xs: 1, md: 0 } }}
            />
          )}
          <Button
            color="primary"
            disabled={activeFilterCount === 0}
            onClick={handleClearFilters}
            size="small"
            variant="outlined"
          >
            Clear Filters
          </Button>
          <Button
            color="primary"
            onClick={() => {
              setExpanded(!expanded)
            }}
            size="small"
            startIcon={<FilterAltIcon />}
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
            variant="contained"
          >
            {expanded ? 'Hide' : 'Filters'}
          </Button>
        </Box>
      </Box>

      <Accordion
        expanded={expanded}
        onChange={(_event, isExpanded) => {
          setExpanded(isExpanded)
        }}
        sx={{
          mt: 2,
          boxShadow: 'none',
          '&:before': { display: 'none' },
          backgroundColor: 'transparent',
          '&.Mui-expanded': { margin: 0 }
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
          <Typography
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}
          >
            <FilterAltIcon
              sx={{ mr: 1, fontSize: 20, display: { xs: 'none', lg: 'block' } }}
            />
            Advanced Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 1, md: 2 }, pt: { xs: 2, lg: 1 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            divider={
              <Divider
                flexItem
                orientation="vertical"
                sx={{ display: { xs: 'none', md: 'block' } }}
              />
            }
            spacing={3}
          >
            {/* Family Filter */}
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="medium" gutterBottom variant="subtitle2">
                Family Type
              </Typography>
              <FormGroup>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {availableFamilies.map((family) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(filters.family ?? []).includes(family)}
                          onChange={() => {
                            handleCheckboxChange('family', family)
                          }}
                          size="small"
                        />
                      }
                      key={family}
                      label={<Typography variant="body2">{family}</Typography>}
                      sx={{ minWidth: 120, mr: 2 }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box>

            {/* Interface Filter 
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="medium" gutterBottom variant="subtitle2">
                Interface Type
              </Typography>
              <FormGroup>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {sortedInterfaces.map((iface) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(filters.interface ?? []).includes(iface)}
                          onChange={() => {
                            handleCheckboxChange('interface', iface)
                          }}
                          size="small"
                        />
                      }
                      key={iface}
                      label={<Typography variant="body2">{iface}</Typography>}
                      sx={{ minWidth: 120, mr: 2 }}
                    />
                  ))}
                </Stack>
              </FormGroup>
            </Box> */}
          </Stack>

          {/* Network Filter */}
          <Box sx={{ mt: 3 }}>
            <Typography
              fontWeight="medium"
              gutterBottom
              sx={{ mt: 1 }}
              variant="subtitle2"
            >
              Network
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  error={errors.ipAddress}
                  fullWidth
                  label="IP Address"
                  name="ipAddress"
                  onChange={handleInputChange}
                  placeholder="e.g. 172.19.190.76"
                  size="small"
                  value={filters.ipAddress}
                  variant="outlined"
                />
                {errors.ipAddress ? (
                  <FormHelperText error>
                    Please provide a valid IP-Address
                  </FormHelperText>
                ) : null}
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  error={errors.port}
                  fullWidth
                  label="Port"
                  name="port"
                  onChange={handleInputChange}
                  placeholder="e.g. 80"
                  size="small"
                  type="text"
                  value={filters.port}
                  variant="outlined"
                />
                {errors.port ? (
                  <FormHelperText error>
                    Please provide a valid Port (1-65535)
                  </FormHelperText>
                ) : null}
              </Box>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}

export default DeviceFilters
