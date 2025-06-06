import React from 'react'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'

const AppHeader: React.FC = () => (
  <AppBar
    position="sticky"
    sx={{
      backgroundColor: '#09245a',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }}
  >
    <Toolbar>
      <Box
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          mr: 2
        }}
      >
        <Box
          alt="HBK Logo"
          component="img"
          src="assets/hbk-logo.png"
          sx={{
            height: 50,
            width: 50,
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: 'white',
            padding: '4px'
          }}
        />
      </Box>
      <Typography component="h1" sx={{ fontWeight: 600 }} variant="h5">
        HBK Device Discovery
      </Typography>
    </Toolbar>
  </AppBar>
)

export default AppHeader
