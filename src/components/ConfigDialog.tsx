/* eslint-disable @typescript-eslint/prefer-destructuring */
/* eslint-disable complexity */
import React, { useState, useEffect } from 'react'
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
} from '@mui/material'
import type { DeviceParams, IP4Address } from 'Types'

interface ConfigDialogProps {
  readonly open: boolean
  readonly device?: { params: DeviceParams }
  readonly onClose: () => void
  readonly onSave: (config: DeviceConfig) => void
}

// Konfigurationsobjekt-Typ
interface DeviceConfig {
  uuid: string
  useDhcp: boolean
  ip: string
  netmask: string
  gateway: string
  interfaceName: string
}

// IP- und Netmask-Validierungsmuster
const IP_REGEX =
  /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
const NETMASK_REGEX =
  /^(255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/
const GATEWAY_REGEX = IP_REGEX

const ConfigDialog = ({
  open,
  device,
  onClose,
  onSave
}: ConfigDialogProps): React.JSX.Element => {
  const [ipAddress, setIpAddress] = useState('')
  const [netmask, setNetmask] = useState('')
  const [gateway, setGateway] = useState('')
  const [useDhcp, setUseDhcp] = useState(false)
  const [errors, setErrors] = useState({
    ipAddress: false,
    netmask: false,
    gateway: false
  })
  const [confirmMode, setConfirmMode] = useState(false)
  const [configChanged, setConfigChanged] = useState(false)

  useEffect(() => {
    if (device?.params.netSettings.interface != null) {
      setUseDhcp(false)

      // IP-Adresse, Netzmaske und Gateway laden
      if (
        device.params.netSettings.interface.ipv4 != null &&
        device.params.netSettings.interface.ipv4.length > 0
      ) {
        const ipv4Config = device.params.netSettings.interface.ipv4[0] as
          | IP4Address
          | undefined

        setIpAddress(ipv4Config?.address ?? '')
        setNetmask(ipv4Config?.netmask ?? '')
        setGateway(device.params.netSettings.defaultGateway?.ipv4Address ?? '')
      }

      setConfigChanged(false)
      setConfirmMode(false)
    }
  }, [device, open])

  const dhcpToggle = (): void => {
    setUseDhcp((prev) => !prev)
    setConfigChanged(true)
  }

  // IP-Adresse validiert und aktualisiert
  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target

    if (/^[0-9.]*$/.test(value)) {
      setIpAddress(value.slice(0, 15))

      if (value.length > 0) {
        const isCompleteIP =
          value.split('.').length === 4 &&
          value.split('.').every((part) => part.length > 0)
        setErrors((prev) => ({
          ...prev,
          ipAddress: isCompleteIP && !IP_REGEX.test(value)
        }))
      } else {
        setErrors((prev) => ({ ...prev, ipAddress: false }))
      }

      if (
        device?.params.netSettings.interface.ipv4 != null &&
        device.params.netSettings.interface.ipv4[0].address !== value
      ) {
        setConfigChanged(true)
      }
    }
  }

  // Netmask validiert und aktualisiert
  const handleNetmaskChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { value } = e.target

    if (/^[0-9.]*$/.test(value)) {
      setNetmask(value.slice(0, 15))

      if (value.length > 0) {
        const isCompleteNetmask =
          value.split('.').length === 4 &&
          value.split('.').every((part) => part.length > 0)
        setErrors((prev) => ({
          ...prev,
          netmask: isCompleteNetmask && !NETMASK_REGEX.test(value)
        }))
      } else {
        setErrors((prev) => ({ ...prev, netmask: false }))
      }
    }
  }

  // Gateway validiert und aktualisiert
  const handleGatewayChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { value } = e.target

    const isTyping =
      value === '' ||
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)?(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)?){0,3}$/.test(
        value
      )

    if (isTyping) {
      const sanitizedValue = value.slice(0, 15)
      setGateway(sanitizedValue)

      if (sanitizedValue.length > 0) {
        const isCompleteGateway =
          sanitizedValue.split('.').length === 4 &&
          sanitizedValue.split('.').every((part) => part.length > 0)

        setErrors((prev) => ({
          ...prev,
          gateway: isCompleteGateway && !GATEWAY_REGEX.test(sanitizedValue)
        }))
      } else {
        // Leeres Gateway ist gültig
        setErrors((prev) => ({ ...prev, gateway: false }))
      }

      if (
        device?.params.netSettings.interface.ipv4 != null &&
        device.params.netSettings.defaultGateway?.ipv4Address !== sanitizedValue
      ) {
        setConfigChanged(true)
      }
    }
  }

  // Form Validierung
  const isFormValid = (): boolean => {
    if (useDhcp) {
      return true
    }

    const isGatewayValid = gateway === '' || GATEWAY_REGEX.test(gateway)

    return (
      IP_REGEX.test(ipAddress) &&
      NETMASK_REGEX.test(netmask) &&
      isGatewayValid &&
      !errors.ipAddress &&
      !errors.netmask &&
      !errors.gateway
    )
  }

  const handleSubmit = (): void => {
    // Bei manueller Konfiguration erst alle Felder validieren
    if (!useDhcp) {
      if (!IP_REGEX.test(ipAddress)) {
        setErrors((prev) => ({ ...prev, ipAddress: true }))
        return
      }

      if (!NETMASK_REGEX.test(netmask)) {
        setErrors((prev) => ({ ...prev, netmask: true }))
        return
      }

      if (gateway !== '' && !GATEWAY_REGEX.test(gateway)) {
        setErrors((prev) => ({ ...prev, gateway: true }))
        return
      }
    }

    if (configChanged && !confirmMode) {
      setConfirmMode(true)
      return
    }

    const interfaceName = device?.params.netSettings.interface.name ?? 'ETH0'

    onSave({
      uuid: device?.params.device.uuid ?? '',
      useDhcp,
      ip: ipAddress,
      netmask,
      gateway,
      interfaceName
    })
  }

  const handleClose = (): void => {
    setErrors({ ipAddress: false, netmask: false, gateway: false })
    setConfirmMode(false)
    onClose()
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={confirmMode ? undefined : handleClose}
      open={open}
    >
      <DialogTitle>
        {confirmMode ? 'Confirm Configuration' : 'Configure Device'}
      </DialogTitle>
      <DialogContent>
        {confirmMode ? (
          <Box sx={{ pt: 1, pb: 1 }}>
            <Typography variant="subtitle2">
              The following configuration will be applied:
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Device:</strong>{' '}
                {device?.params.device.name ?? 'Unkown'}
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
                  <Typography variant="body2">
                    <strong>Gateway:</strong> {gateway}
                  </Typography>
                </>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography color="text.secondary" variant="body2">
              Click on “Confirm Configuration” to apply the changes.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ pt: 1, pb: 1 }}>
            <Typography gutterBottom variant="subtitle2">
              Network settings for: {device?.params.device.name ?? 'Unkown'}
            </Typography>

            {/* DHCP Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={useDhcp}
                  color="primary"
                  onChange={dhcpToggle}
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
              disabled={useDhcp}
              error={errors.ipAddress}
              fullWidth
              label="IP-Adress"
              margin="normal"
              onChange={handleIpChange}
              placeholder="192.168.1.100"
              value={ipAddress}
              variant="outlined"
            />
            {errors.ipAddress ? (
              <FormHelperText error>
                Please provide a valid IP-Address (e.g. 192.168.1.100)
              </FormHelperText>
            ) : null}
            <TextField
              disabled={useDhcp}
              error={errors.netmask}
              fullWidth
              label="Netmask"
              margin="normal"
              onChange={handleNetmaskChange}
              placeholder="255.255.255.0"
              value={netmask}
              variant="outlined"
            />
            {errors.netmask ? (
              <FormHelperText error>
                Please provide a valid Netmask (e.g. 255.255.255.0)
              </FormHelperText>
            ) : null}
            <TextField
              disabled={useDhcp}
              error={errors.gateway}
              fullWidth
              label="Gateway"
              margin="normal"
              onChange={handleGatewayChange}
              placeholder="192.168.1.100"
              value={gateway}
              variant="outlined"
            />
            {errors.gateway ? (
              <FormHelperText error>
                Please provide a valid Gateway-Address (e.g. 192.168.1.100)
              </FormHelperText>
            ) : null}

            {useDhcp ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                If DHCP is activated, all network settings are automatically
                obtained from the DHCP server.
              </Alert>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose}>
          {confirmMode ? 'Cancel' : 'Close'}
        </Button>
        <Button
          color="primary"
          disabled={!isFormValid()}
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#103277',
            '&:hover': {
              backgroundColor: '#09245a'
            }
          }}
          variant="contained"
        >
          {confirmMode ? 'Confirm Configuration' : 'Apply Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfigDialog
