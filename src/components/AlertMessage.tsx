import React, { useState, useEffect } from 'react';
import { Alert, AlertColor, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AlertMessageProps {
  message: string;
  severity: 'success' | 'error' | 'info';
  onClose: () => void;
  autoHideDuration?: number;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ 
  message, 
  severity, 
  onClose,
  autoHideDuration
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (severity === 'success' && autoHideDuration) {
      timer = setTimeout(() => {
        setOpen(false);
        setTimeout(onClose, 300);
      }, autoHideDuration);
    }
    return () => clearTimeout(timer);
  }, [severity, autoHideDuration, onClose]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const alertSeverity: AlertColor = 
    severity === 'error' ? 'error' :
    severity === 'success' ? 'success' : 'info';

  return (
    <Collapse in={open}>
      <Alert
        severity={alertSeverity}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2, alignItems: 'center' }}
      >
        {message}
      </Alert>
    </Collapse>
  );
};

export default AlertMessage;