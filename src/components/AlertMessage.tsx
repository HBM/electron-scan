import React, { useState, useEffect } from 'react'
import { Snackbar, Alert, type AlertColor, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AlertMessageProps {
  readonly message: string
  readonly severity: 'success' | 'error' | 'info'
  readonly onClose: () => void
  readonly autoHideDuration?: number
  readonly index?: number
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  severity,
  onClose,
  autoHideDuration = 4000,
  index = 0
}) => {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (autoHideDuration > 0) {
      timer = setTimeout(() => {
        handleClose()
      }, autoHideDuration)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [autoHideDuration])

  const handleClose = (): void => {
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const alertSeverity: AlertColor =
    severity === 'error' ? 'error' : severity === 'success' ? 'success' : 'info'

  return (
    <Snackbar
      open={open}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      sx={{
        transform: `translateY(-${index * 80}px)`,
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1400,
        marginBottom: '1rem',
        marginRight: '1rem'
      }}
    >
      <Alert
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            onClick={handleClose}
            size="small"
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        severity={alertSeverity}
        sx={{
          width: '100%',
          height: '100%',
          m: 0,
          boxShadow: 'none',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

export default AlertMessage
