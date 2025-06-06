// React Einstiegspunkt
/*
Einstiegspunkt für React
Erzeugt die React-Root und rendert die App-Komponente
Richtet das MUI-Theme ein
*/
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './components/App'

const theme = createTheme({
  palette: {
    primary: {
      main: '#09245a',
      light: '#103277',
      dark: '#07183f'
    },
    secondary: {
      main: '#3273dc'
    },
    success: {
      main: '#48c774'
    },
    error: {
      main: '#f14668'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  }
})

// React app initialisert
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/non-nullable-type-assertion-style
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
