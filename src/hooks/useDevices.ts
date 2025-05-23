// Hook zur IPC Kommunikation und Device State Management
// Benutzerdefinierter React-Hook, der den Gerätezustand verwaltet
// Behandelt die IPC-Kommunikation mit dem Hauptprozess
// Bietet Methoden zum Starten/Stoppen des Scannens und zur Konfiguration von Geräten

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Filtern Interface
export interface DeviceFilters {
  name: string;
  family: string[]; 
  interface: string[];
  ipAddress: string;
  port: string;
}

interface AlertInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Validierungsmuster für IP und Netmask
const IP_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const NETMASK_REGEX = /^(255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/;

export const useDevices = () => {
  const [devices, setDevices] = useState<Map<string, any>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);
  // Rate-Limiting für Konfigurationsanfragen
  const configRequestTimestamp = useRef<number>(0);
  const CONFIG_COOLDOWN = 2000; // 2 Sekunden Abkühlzeit zwischen Konfigurationsanfragen

  // Filtern State
  const [filters, setFilters] = useState<DeviceFilters>({
    name: '',
    family: [],
    interface: [],
    ipAddress: '',
    port: '',
  });
  
  const { ipcRenderer } = window.require('electron');

  // IPC Listeners
  useEffect(() => {
    ipcRenderer.on('scanner-status', (_event: any, status: string) => {
      // Status-Validierung gegen bekannte Werte
      if (status !== 'running' && status !== 'stopped') {
        console.error('Ungültiger Scanner-Status empfangen:', status);
        return;
      }
      setIsScanning(status === 'running');
    });
    
    // Device Discovery
    ipcRenderer.on('hbk-device-found', (_event: any, device: any) => {
      setDevices(prevDevices => {
        const uuid = device.params.device.uuid;
        const newDevices = new Map(prevDevices);
        
        const isNewDevice = !prevDevices.has(uuid);
        
        // Sanitize device name für die UI
        const sanitizedName = device.params.device.name 
          ? device.params.device.name.slice(0, 100).replace(/<[^>]*>/g, '') 
          : 'Unkown device';
        
        // Gerät mit sanitiertem Namen speichern
        const sanitizedDevice = {
          ...device,
          params: {
            ...device.params,
            device: {
              ...device.params.device,
              name: sanitizedName
            }
          }
        };
        
        newDevices.set(uuid, {
          device: sanitizedDevice,
          lastSeen: Date.now(),
          isOnline: true
        });
        
        if (isNewDevice) {
          showAlert(`New device found: ${sanitizedName}`, 'success');
        }
        
        return newDevices;
      });
    });
    
    // Device updates
    ipcRenderer.on('hbk-device-updated', (_event: any, device: any) => {
      setDevices(prevDevices => {
        const uuid = device.params.device.uuid;
        const newDevices = new Map(prevDevices);
        
        // Sanitize device name für die UI
        const sanitizedName = device.params.device.name 
          ? device.params.device.name.slice(0, 100).replace(/<[^>]*>/g, '') 
          : 'Unkown device';
        
        // Gerät mit sanitiertem Namen speichern
        const sanitizedDevice = {
          ...device,
          params: {
            ...device.params,
            device: {
              ...device.params.device,
              name: sanitizedName
            }
          }
        };
        
        newDevices.set(uuid, {
          device: sanitizedDevice,
          lastSeen: Date.now(),
          isOnline: true
        });
        
        return newDevices;
      });
    });
    
    // Scanner errors
    ipcRenderer.on('hbk-scanner-error', (_event: any, error: string) => {
      // Fehlervalidierung und -sanitierung
      const sanitizedError = typeof error === 'string' 
        ? error.slice(0, 200).replace(/<[^>]*>/g, '') 
        : 'Unkown error';
      
      showAlert(`Scanner error: ${sanitizedError}`, 'error');
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
    // XSS-Schutz
    const sanitizedMessage = message.slice(0, 200).replace(/<[^>]*>/g, '');
    
    setAlertInfo({ message: sanitizedMessage, type });
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setAlertInfo(prevAlertInfo => 
          prevAlertInfo?.message === sanitizedMessage ? null : prevAlertInfo
        );
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
      console.error('Scanning error:', err);
    }
  }, []);
  
  const stopScanning = useCallback(async () => {
    try {
      await ipcRenderer.invoke('stop-scanning');
      showAlert('Scanner stopped', 'info');
    } catch (err) {
      showAlert('Failed to stop scanning', 'error');
      console.error('Stop scanning error:', err);
    }
  }, []);
  
  const configureDevice = useCallback(async (uuid: string, ip: string, netmask: string) => {
    // Rate-Limiting
    const now = Date.now();
    if (now - configRequestTimestamp.current < CONFIG_COOLDOWN) {
      showAlert('Too many requests. Please wait a short time before making another configuration.', 'error');
      return;
    }
    configRequestTimestamp.current = now;
    
    // Validieren der Eingaben
    if (!uuid || !uuid.trim()) {
      showAlert('Invalid device ID', 'error');
      return;
    }
    
    if (!IP_REGEX.test(ip)) {
      showAlert('Invalid IP address format', 'error');
      return;
    }
    
    if (!NETMASK_REGEX.test(netmask)) {
      showAlert('Invalid netmask format', 'error');
      return;
    }

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
        uuid: uuid.trim()
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
        const errorMsg = response.error 
          ? response.error.toString().slice(0, 200).replace(/<[^>]*>/g, '')
          : 'Unkown error';
        showAlert(`Configuration failed: ${response.error}`, 'error');
      }
    } catch (err) {
      console.error('Configruation error:', err);
      showAlert('Failed to configure device', 'error');
    }
  }, [devices]);

  // Filtern updaten
  const updateFilters = useCallback((newFilters: Partial<DeviceFilters>) => {
    // Filtereingaben validiert und sanitiert
    const sanitizedFilters: Partial<DeviceFilters> = {};
    
    // Name-Filter sanitiert
    if (newFilters.name !== undefined) {
      sanitizedFilters.name = newFilters.name.slice(0, 50).replace(/[^\w\s-_.]/g, '');
    }
    
    // Array-Filter validiert (family und interface)
    if (newFilters.family !== undefined) {
      if (Array.isArray(newFilters.family)) {
        sanitizedFilters.family = newFilters.family;
      } else {
        console.error('Invalid Family filter format');
      }
    }
    
    if (newFilters.interface !== undefined) {
      if (Array.isArray(newFilters.interface)) {
        sanitizedFilters.interface = newFilters.interface;
      } else {
        console.error('Invalid Interface filter format');
      }
    }
    
    // IP-Adresse validiert
    if (newFilters.ipAddress !== undefined) {
      if (newFilters.ipAddress === '' || /^[0-9.]*$/.test(newFilters.ipAddress)) {
        sanitizedFilters.ipAddress = newFilters.ipAddress;
      } else {
        console.error('Invalid IP filter');
      }
    }
    
    // Port validiert
    if (newFilters.port !== undefined) {
      if (newFilters.port === '' || /^\d*$/.test(newFilters.port)) {
        sanitizedFilters.port = newFilters.port;
      } else {
        console.error('Invalid port filter');
      }
  }
    
    setFilters(prevFilters => ({ ...prevFilters, ...sanitizedFilters }));
  }, []);

  function getInterfaceTypes(device: any): string[] {
    const types: string[] = [];
    try {
      if (device.params?.services) {
        for (const s of device.params.services) {
          if (typeof s.type === 'string') {
            const t = s.type.toLowerCase();
            if (t.includes('hbm') && !types.includes('HBM')) types.push('HBM');
            if (t.includes('dcp') && !types.includes('DCP')) types.push('DCP');
            if (t.includes('upnp') && !types.includes('UPNP')) types.push('UPNP');
            if (t.includes('avahi') && !types.includes('AVAHI')) types.push('AVAHI');
          }
        }
      }
    } catch (err) {
      console.error('Error during interface type extraction:', err);
    }
    return types;
  }
  
  // Gefiltert Geräte Liste
  const filteredDevices = useMemo(() => {
    try {
      return Array.from(devices.values()).filter(deviceStatus => {
        if (!deviceStatus || !deviceStatus.device || !deviceStatus.device.params) {
          return false;
        }
        
        const device = deviceStatus.device;
        
        try {
          // Name Filter mit Nullprüfung
          if (filters.name && device.params.device && device.params.device.name &&
              !device.params.device.name.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
          }
          
          // Family Filter mit Nullprüfung
          if (filters.family.length > 0 && device.params.device && 
              !filters.family.includes(device.params.device.familyType)) {
            return false;
          }
          
          // Interface Filter mit sicherer Evaluation
          if (filters.interface.length > 0) {
            const deviceInterfaces = getInterfaceTypes(device);
            if (!filters.interface.some(f => deviceInterfaces.includes(f))) {
              return false;
            }
          }
          
          // IP-Adresse Filter mit Nullprüfung und Fehlerbehandlung
          if (filters.ipAddress && device.params.netSettings?.interface?.ipv4) {
            const ipMatches = device.params.netSettings.interface.ipv4.some((ip: any) => {
              try {
                return ip && ip.address && ip.address.includes(filters.ipAddress);
              } catch (err) {
                console.error('IP-Filterungsfehler:', err);
                return false;
              }
            });
            
            if (!ipMatches) return false;
          }
          
          // Port Filter mit Nullprüfung und Fehlerbehandlung
          if (filters.port && device.params.services) {
            const portMatches = device.params.services.some((service: any) => {
              try {
                return service && service.port !== undefined && service.port !== null && service.port.toString() === filters.port.trim();
              } catch (err) {
                console.error('Port-Filterungsfehler:', err);
                return false;
              }
            });
            
            if (!portMatches) return false;
          }
          return true;
        } catch (err) {
          console.error('Fehler bei der Gerätefilterung:', err);
          return false;
        }
      });
    } catch (err) {
      console.error('Kritischer Fehler bei der Gerätefilterung:', err);
      return [];
    }
  }, [devices, filters]);

  const availableInterfaces = useMemo(() => {
    const interfaces = new Set<string>();
    try {
      Array.from(devices.values()).forEach(deviceStatus => {
        if (deviceStatus && deviceStatus.device) {
          const types = getInterfaceTypes(deviceStatus.device);
          types.forEach(t => interfaces.add(t));
        }
      });
    } catch (err) {
      console.error('Error when extracting the interface types:', err);
    }
    
    const ORDER = ['HBM', 'DCP', 'UPNP', 'AVAHI'];
    return ORDER.filter(i => interfaces.has(i));
  }, [devices]);

  return {
    devices,
    filteredDevices,
    filters,
    updateFilters,
    isScanning,
    alertInfo,
    clearAlert,
    showAlert,
    startScanning,
    stopScanning,
    configureDevice,
    availableInterfaces
  };
};