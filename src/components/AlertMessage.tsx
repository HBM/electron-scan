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
  const [open, setOpen] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let timer: NodeJS.Timeout
    if (severity === 'success') {
      timer = setTimeout(() => {
        setOpen(false)
        setTimeout(onClose, 300)
      }, autoHideDuration)
    }
    return () => {
      clearTimeout(timer)
    }
  }, [severity, autoHideDuration, onClose])

  const handleClose = (): void => {
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const alertSeverity: AlertColor =
    severity === 'error' ? 'error' : severity === 'success' ? 'success' : 'info'

  return (
    <Collapse in={open}>
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
        sx={{ mb: 2, alignItems: 'center' }}
      >
        {message}
      </Alert>
    </Collapse>
  )
}

export default AlertMessage
