// Hook zur IPC Kommunikation und Device State Management
// Benutzerdefinierter React-Hook, der den Gerätezustand verwaltet
// Behandelt die IPC-Kommunikation mit dem Hauptprozess
// Bietet Methoden zum Starten/Stoppen des Scannens und zur Konfiguration von Geräten

import { useState, useEffect, useCallback } from 'react';

interface AlertInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useDevices = () => {
  const [devices, setDevices] = useState<Map<string, any>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);
  
  const { ipcRenderer } = window.require('electron');

  // IPC Listeners
  useEffect(() => {
    ipcRenderer.on('scanner-status', (_event: any, status: string) => {
      setIsScanning(status === 'running');
    });
    
    // Device Discovery
    ipcRenderer.on('hbk-device-found', (_event: any, device: any) => {
      setDevices(prevDevices => {
        const uuid = device.params.device.uuid;
        const newDevices = new Map(prevDevices);
        
        const isNewDevice = !prevDevices.has(uuid);
        
        newDevices.set(uuid, {
          device,
          lastSeen: Date.now(),
          isOnline: true
        });
        
        if (isNewDevice) {
          showAlert(`New device found: ${device.params.device.name}`, 'success');
        }
        
        return newDevices;
      });
    });
    
    // Device updates
    ipcRenderer.on('hbk-device-updated', (_event: any, device: any) => {
      setDevices(prevDevices => {
        const uuid = device.params.device.uuid;
        const newDevices = new Map(prevDevices);
        
        newDevices.set(uuid, {
          device,
          lastSeen: Date.now(),
          isOnline: true
        });
        
        return newDevices;
      });
    });
    
    // Scanner errors
    ipcRenderer.on('hbk-scanner-error', (_event: any, error: string) => {
      showAlert(`Scanner error: ${error}`, 'error');
    });
    
    // Check device status periodically
    const statusCheckInterval = setInterval(() => {
      const now = Date.now();
      const offlineThreshold = 15000;
      
      setDevices(prevDevices => {
        let updated = false;
        const newDevices = new Map(prevDevices);
        
        newDevices.forEach((deviceStatus, uuid) => {
          const timeSinceLastSeen = now - deviceStatus.lastSeen;
          const wasOnline = deviceStatus.isOnline;
          
          // Mark as offline if no updates for 15 seconds
          if (timeSinceLastSeen > offlineThreshold && wasOnline) {
            newDevices.set(uuid, {
              ...deviceStatus,
              isOnline: false
            });
            updated = true;
          }
        });
        
        return updated ? newDevices : prevDevices;
      });
    }, 5000);
    
    return () => {
      ipcRenderer.removeAllListeners('scanner-status');
      ipcRenderer.removeAllListeners('hbk-device-found');
      ipcRenderer.removeAllListeners('hbk-device-updated');
      ipcRenderer.removeAllListeners('hbk-scanner-error');
      clearInterval(statusCheckInterval);
    };
  }, []);
  
  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlertInfo({ message, type });
    
    // Success messages
    if (type === 'success') {
      setTimeout(() => {
        setAlertInfo(null);
      }, 5000);
    }
  };
  
  const clearAlert = useCallback(() => {
    setAlertInfo(null);
  }, []);
  
  const startScanning = useCallback(async () => {
    try {
      await ipcRenderer.invoke('start-scanning');
      showAlert('HBK Scanner started device search...', 'info');
    } catch (err) {
      showAlert('Failed to start scanning', 'error');
    }
  }, []);
  
  const stopScanning = useCallback(async () => {
    try {
      await ipcRenderer.invoke('stop-scanning');
      showAlert('Scanner stopped', 'info');
    } catch (err) {
      showAlert('Failed to stop scanning', 'error');
    }
  }, []);
  
  const configureDevice = useCallback(async (uuid: string, ip: string, netmask: string) => {
    const deviceStatus = devices.get(uuid);
    if (!deviceStatus) {
      showAlert(`Device ${uuid} not found`, 'error');
      return;
    }
    
    const existingDevice = deviceStatus.device;
    const interfaceName = existingDevice.params.netSettings.interface.name || '';
    
    if (!uuid || !ip || !netmask) {
      showAlert('Fill all required fields', 'error');
      return;
    }
    
    const configMessage = {
      device: {
        uuid
      },
      netSettings: {
        interface: {
          name: interfaceName,
          ipv4: {
            manualAddress: ip,
            manualNetmask: netmask
          },
          configurationMethod: 'manual'
        }
      },
      ttl: 120
    };
    
    try {
      const response = await ipcRenderer.invoke('configure-device', configMessage);
      
      if (response.success) {
        setDevices(prevDevices => {
          const newDevices = new Map(prevDevices);
          const deviceStatus = newDevices.get(uuid);
          
          if (deviceStatus && deviceStatus.device.params.netSettings.interface.ipv4[0]) {
            deviceStatus.device.params.netSettings.interface.ipv4[0].address = ip;
            deviceStatus.device.params.netSettings.interface.ipv4[0].netmask = netmask;
            deviceStatus.device.params.netSettings.interface.name = interfaceName;
            deviceStatus.device.params.netSettings.interface.configurationMethod = 'manual';
            
            newDevices.set(uuid, deviceStatus);
          }
          
          return newDevices;
        });
        
        showAlert(`Configuration sent to device ${uuid}`, 'success');
      } else {
        showAlert(`Configuration failed: ${response.error}`, 'error');
      }
    } catch (err) {
      showAlert('Failed to configure device', 'error');
    }
  }, [devices]);

  return {
    devices,
    isScanning,
    alertInfo,
    clearAlert,
    showAlert,
    startScanning,
    stopScanning,
    configureDevice
  };
};