import React, { useMemo, useState } from 'react'
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip
} from '@mui/material'
import DeviceRow, { type DeviceProps } from './DeviceRow'
import DeviceDetailsDialog from './DeviceDetailsDialog' // New component
import type { DeviceParams } from 'Types'

interface DeviceListProps {
  readonly devices: DeviceProps[]
  readonly onConfigureDevice: (device: { params: DeviceParams }) => void
  readonly isFavorite: (deviceId: string) => boolean
  readonly onToggleFavorite: (deviceId: string) => void
}

// Rendert die Liste der gefundenen Geräte
// Verwaltet die Geräteauswahl und -erweiterung
const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onConfigureDevice,
  isFavorite,
  onToggleFavorite
}) => {
  // Replace expandedDevice state with dialog state
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] =
    useState<DeviceProps | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Geräte in favs und andere getrennt
  const { favoriteDevices, otherDevices } = useMemo(() => {
    const favorites: DeviceProps[] = []
    const others: DeviceProps[] = []

    devices.forEach((device) => {
      const deviceId = `uuid:${device.device.params.device.uuid}`
      if (isFavorite(deviceId)) {
        favorites.push(device)
      } else {
        others.push(device)
      }
    })

    return { favoriteDevices: favorites, otherDevices: others }
  }, [devices, isFavorite])

  // Replace handleToggleDetails with handleOpenDetails
  const handleOpenDetails = (device: DeviceProps): void => {
    setSelectedDeviceForDetails(device)
    setDetailsDialogOpen(true)
  }

  const handleCloseDetails = (): void => {
    setDetailsDialogOpen(false)
    setSelectedDeviceForDetails(null)
  }

  const renderDeviceSection = (
    sectionDevices: DeviceProps[],
    title: string
  ) => (
    <>
      {sectionDevices.length > 0 && (
        <>
          <TableRow>
            <TableCell
              colSpan={5}
              sx={{ bgcolor: '#f5f5f5', fontWeight: 600, py: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2">{title}</Typography>
                <Chip
                  size="small"
                  label={sectionDevices.length}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </TableCell>
          </TableRow>
          {sectionDevices.map((device) => (
            <DeviceRow
              key={device.device.params.device.uuid}
              device={device}
              isExpanded={false} // No longer needed for expansion
              isFavorite={isFavorite(
                `uuid:${device.device.params.device.uuid}`
              )}
              onConfigureClick={() => {
                onConfigureDevice(device.device)
              }}
              onToggleDetails={() => {
                handleOpenDetails(device) // Open dialog instead of toggle
              }}
              onToggleFavorite={() =>
                onToggleFavorite(`uuid:${device.device.params.device.uuid}`)
              }
            />
          ))}
        </>
      )}
    </>
  )

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          backgroundColor: 'white',
          boxShadow: '0 3px 7px rgba(0, 0, 0, 0.15)',
          flex: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography
            component="h2"
            sx={{ fontWeight: 600, mr: 2 }}
            variant="h5"
          >
            Discovered Devices
          </Typography>
          {devices.length > 0 && (
            <Chip
              color="primary"
              label={`${devices.length}`}
              size="small"
              sx={{
                fontWeight: 500,
                backgroundColor: '#103277',
                fontSize: '0.75rem',
                height: '22px'
              }}
            />
          )}
        </Box>

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
                  <TableCell align="center" colSpan={5}>
                    No devices found yet
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {renderDeviceSection(favoriteDevices, 'Favorites')}
                  {renderDeviceSection(otherDevices, 'Other Devices')}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Device Details Dialog */}
      {selectedDeviceForDetails && (
        <DeviceDetailsDialog
          device={selectedDeviceForDetails}
          open={detailsDialogOpen}
          onClose={handleCloseDetails}
          onConfigure={(device) => {
            onConfigureDevice(device.device)
            handleCloseDetails() // Optional: close details after opening configure
          }}
        />
      )}
    </>
  )
}

export default DeviceList
