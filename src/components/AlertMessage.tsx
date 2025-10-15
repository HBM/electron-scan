import React, { useState, useEffect } from 'react'
import { Alert, type AlertColor, Collapse, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AlertMessageProps {
  readonly message: string
  readonly severity: 'success' | 'error' | 'info'
  readonly onClose: () => void
  readonly autoHideDuration?: number
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  severity,
  onClose,
  autoHideDuration = 3000
}) => {
  if (severity === 'success') return null
  const [open, setOpen] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let timer: NodeJS.Timeout
  }, [severity, autoHideDuration, onClose])

  const handleClose = (): void => {
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const alertSeverity: AlertColor = severity === 'error' ? 'error' : 'info'

  return (
    <Collapse in={open} sx={{ height: '100%', width: '100%' }}>
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
    </Collapse>
  )
}

export default AlertMessage
