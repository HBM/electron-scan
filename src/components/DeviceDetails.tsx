/* eslint-disable @typescript-eslint/prefer-destructuring */
import React from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import MemoryIcon from '@mui/icons-material/Memory'
import RouterIcon from '@mui/icons-material/Router'
import LanguageIcon from '@mui/icons-material/Language'
import PublicIcon from '@mui/icons-material/Public'
import StorageIcon from '@mui/icons-material/Storage'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'
import fs from 'fs'
import path from 'path'
import { imageMap } from '../icons/map'
import type { DeviceParams } from 'Types'
import { shell } from 'electron'

interface DeviceDetailsProps {
  readonly device: { params: DeviceParams }
}

// Zeigt detaillierte Informationen über ein ausgewähltes Gerät an
// Zeigt Gerätebilder, Netzwerkinformationen und Dienste
const DeviceDetails = ({ device }: DeviceDetailsProps): React.JSX.Element => {
  const getDeviceImage = (): string => {
    const deviceType =
      (device.params.device.type.toLowerCase() as string | undefined) ?? ''
    let imageName = imageMap[deviceType] as string | undefined

    if (
      imageName != null &&
      (device.params.device.familyType as string | undefined) != null
    ) {
      const familyType = device.params.device.familyType.toLowerCase()
      imageName = imageMap[familyType]
    }

    if (imageName == null) {
      return 'assets/default-device.webp'
    }

    const distPath = path.join(__dirname, 'icons', imageName)
    const srcPath = path.join(__dirname, '../src/icons', imageName)

    if (fs.existsSync(distPath)) {
      return `icons/${imageName}`
    } else if (fs.existsSync(srcPath)) {
      return `../src/icons/${imageName}`
    } else {
      return 'assets/default-device.webp'
    }
  }

  const getDeviceWebsite = (): string => {
    const ipv4Address = device.params.netSettings.interface.ipv4?.[0]?.address
    const ipv6Address = device.params.netSettings.interface.ipv6?.[0]?.address
    if (ipv6Address != null) {
      return `http://[${ipv6Address}]`
    }
    return ipv4Address != null ? `http://${ipv4Address}` : '#'
  }

  const handleOpenWebsite = (): void => {
    const url = getDeviceWebsite()
    if (url !== '#') {
      shell.openExternal(url).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Failed to open device website:', err)
      })
    }
  }

  const imagePath = getDeviceImage()
  const websiteUrl = getDeviceWebsite()

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: 0 }}>
        {/* Device Image and Website Link */}
        <Box sx={{ width: '100%', px: 2, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            textAlign="center"
          >
            <Box
              alt={device.params.device.name}
              component="img"
              src={imagePath}
              sx={{
                maxHeight: 180,
                maxWidth: '100%',
                objectFit: 'contain',
                mb: 3.5,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#fafafa',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 4px rgba(10, 10, 10, 0.1)'
              }}
            />
            {websiteUrl !== '#' ? (
              <Button
                color="primary"
                onClick={handleOpenWebsite}
                size="large"
                startIcon={<OpenInBrowserIcon />}
                sx={{
                  mt: 0,
                  mb: 1,
                  py: 1.2,
                  px: 4,
                  backgroundColor: '#103277',
                  '&:hover': {
                    backgroundColor: '#09245a',
                    boxShadow: '0 2px 5px rgba(9, 36, 90, 0.3)'
                  }
                }}
                variant="contained"
              >
                Open Device Website
              </Button>
            ) : (
              <Button
                color="primary"
                disabled
                size="large"
                startIcon={<OpenInBrowserIcon />}
                sx={{ mt: 0, mb: 1, py: 1.2, px: 4 }}
                variant="contained"
              >
                No Web Interface Available
              </Button>
            )}
          </Box>
        </Box>

        {[
          {
            title: 'Device Information',
            icon: <MemoryIcon color="primary" />,
            rows: [
              ['Name', device.params.device.name],
              ['UUID', device.params.device.uuid],
              ['Type', device.params.device.type],
              ['Family', device.params.device.familyType],
              ['Firmware', device.params.device.firmwareVersion],
              ['API Version', device.params.apiVersion],
              ['Expiration', device.params.expiration]
            ]
          },
          {
            title: 'Network Interface',
            icon: <RouterIcon color="primary" />,
            rows: [
              ['Interface', device.params.netSettings.interface.name],
              [
                'Description',
                device.params.netSettings.interface.description ?? 'N/A'
              ],
              ['Type', device.params.netSettings.interface.type],
              [
                'Configuration',
                (device.params.netSettings.interface.configurationMethod as
                  | string
                  | undefined) ?? 'N/A'
              ]
            ]
          }
        ].map((section) => (
          <Box
            key={section.title}
            sx={{
              width: { xs: '100%', md: '50%' },
              px: 2,
              mb: 4,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Card sx={{ width: '100%', maxWidth: 550 }} variant="outlined">
              <CardHeader
                avatar={section.icon}
                sx={{
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  '& .MuiCardHeader-title': { fontSize: '1.2rem' }
                }}
                title={section.title}
              />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {section.rows.map(([key, val], i) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell>{val}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        ))}

        {/* IPv4 Addresses */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            px: 2,
            mb: 4,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 550 }} variant="outlined">
            <CardHeader
              avatar={<LanguageIcon color="primary" />}
              sx={{
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
              title="IPv4 Addresses"
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Netmask</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.netSettings.interface.ipv4 != null &&
                    device.params.netSettings.interface.ipv4.length > 0 ? (
                      device.params.netSettings.interface.ipv4.map((ip) => (
                        <TableRow key={ip.address}>
                          <TableCell sx={{ fontWeight: 'medium' }}>
                            {ip.address}
                          </TableCell>
                          <TableCell>{ip.netmask}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell align="center" colSpan={2}>
                          No IPv4 addresses configured
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            px: 2,
            mb: 4,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 550 }} variant="outlined">
            <CardHeader
              avatar={<StorageIcon color="primary" />}
              sx={{
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
              title="Services"
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Port</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.services != null &&
                    device.params.services.length > 0 ? (
                      device.params.services.map((service, index) => (
                        <TableRow key={service.type}>
                          <TableCell>{service.type}</TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {service.port}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell align="center" colSpan={2}>
                          No services available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* IPv6 Addresses */}
        <Box
          sx={{
            width: '100%',
            px: 2,
            mb: 2,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 1100 }} variant="outlined">
            <CardHeader
              avatar={<PublicIcon color="primary" />}
              sx={{
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': { fontSize: '1.2rem' }
              }}
              title="IPv6 Addresses"
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Address</TableCell>
                      <TableCell>Prefix</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {device.params.netSettings.interface.ipv6 != null &&
                    device.params.netSettings.interface.ipv6.length > 0 ? (
                      device.params.netSettings.interface.ipv6.map((ip) => (
                        <TableRow key={ip.address}>
                          <TableCell
                            sx={{ fontFamily: 'monospace', fontSize: '1rem' }}
                          >
                            {ip.address}
                          </TableCell>
                          <TableCell align="center">{ip.prefix}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell align="center" colSpan={2}>
                          No IPv6 addresses configured
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default DeviceDetails
