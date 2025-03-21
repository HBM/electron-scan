declare namespace Electron {
    interface NativeImage {}
}

// @ts-ignore
const electronRemote = require('@electron/remote');
const { dialog, Menu } = electronRemote;
const { ipcRenderer } = require('electron');

interface HbkDevice {
    jsonrpc: string;
    method: string;
    params: {
        apiVersion: string;
        device: {
            familyType: string;
            firmwareVersion: string;
            name: string;
            type: string;
            uuid: string;
        };
        expiration: number;
        netSettings: {
            interface: {
                configurationMethod: string;
                description: string;
                ipv4: Array<{
                    address: string;
                    netmask: string;
                }>;
                ipv6: Array<{
                    address: string;
                    prefix: number;
                }>;
                name: string;
                type: string;
            };
        };
        services: Array<{
            port: number;
            type: string;
        }>;
    };
}

console.log('Renderer script loading');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded - initializing application');

    initScanner();
});

function initScanner() {
    // Device scanning elements
    const scanBtn = document.getElementById('scanBtn') as HTMLButtonElement;
    const deviceList = document.getElementById('deviceList') as HTMLTableSectionElement;
    const scannerAlerts = document.getElementById('scannerAlerts') as HTMLDivElement;
    const alertMessage = document.getElementById('alertMessage') as HTMLParagraphElement;
    const deleteAlertBtn = scannerAlerts.querySelector('.delete') as HTMLButtonElement;
    const configModal = document.getElementById('configModal') as HTMLDivElement;
    const configUuid = document.getElementById('configUuid') as HTMLInputElement;
    const configIp = document.getElementById('configIp') as HTMLInputElement;
    const configNetmask = document.getElementById('configNetmask') as HTMLInputElement;
    const configInterface = document.getElementById('configInterface') as HTMLInputElement;
    const configSaveBtn = document.getElementById('configSaveBtn') as HTMLButtonElement;
    const cancelConfigBtns = document.querySelectorAll('.cancel-config, .modal-background, .delete');
    
    // Store discovered devices
    const discoveredDevices = new Map();
    let isScanning = false;
    
    // Set up event handlers
    scanBtn.addEventListener('click', toggleScanning);
    deleteAlertBtn.addEventListener('click', () => {
        scannerAlerts.style.display = 'none';
    });
    
    cancelConfigBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            configModal.classList.remove('is-active');
        });
    });
    
    configSaveBtn.addEventListener('click', configureDevice);
    
    // IPC event listeners for scanner events
    ipcRenderer.on('hbk-device-found', (_event: any, device: HbkDevice) => {
        console.log('Renderer: Device found:', device);
        addOrUpdateDevice(device);
        showAlert(`Device found: ${device.params.device.name}`, 'success');
    });
    
    ipcRenderer.on('hbk-scanner-error', (_event: any, error: string) => {
        console.error('Renderer: Scanner error:', error);
        showAlert(`Scanner error: ${error}`, 'error');
    });
    
    // Toggle scanning on/off
    async function toggleScanning() {
        if (isScanning) {
            try {
                await ipcRenderer.invoke('stop-scanning');
                scanBtn.classList.remove('is-danger');
                scanBtn.classList.add('is-primary');
                scanBtn.textContent = 'Start Scanning';
                isScanning = false;
                showAlert('Scanner stopped', 'info');
            } catch (err) {
                console.error('Failed to stop scanning:', err);
                showAlert('Failed to stop scanning', 'error');
            }
        } else {
            try {
                await ipcRenderer.invoke('start-scanning');
                scanBtn.classList.remove('is-primary');
                scanBtn.classList.add('is-danger');
                scanBtn.textContent = 'Stop Scanning';
                isScanning = true;
                showAlert('Scanner started, looking for devices...', 'info');
            } catch (err) {
                console.error('Failed to start scanning:', err);
                showAlert('Failed to start scanning', 'error');
            }
        }
    }
    
    // Add or update device in the table
    function addOrUpdateDevice(device: HbkDevice) {
        const uuid = device.params.device.uuid;
        
        // Store device in map
        discoveredDevices.set(uuid, device);
        
        // Remove "no devices" row if it exists
        const noDevicesRow = document.getElementById('no-devices');
        if (noDevicesRow) {
            noDevicesRow.remove();
        }
        
        // Check if device is already in table
        let deviceRow = document.getElementById(`device-${uuid}`);
        
        if (!deviceRow) {
            // Create new row
            deviceRow = document.createElement('tr');
            deviceRow.id = `device-${uuid}`;
            deviceRow.className = 'device-row';
            deviceList.appendChild(deviceRow);
            
            // Add click event to show details
            deviceRow.addEventListener('click', () => {
                showDeviceDetails(uuid);
            });
        }
        
        // Get the first IPv4 address
        const ipAddress = device.params.netSettings.interface.ipv4[0]?.address || 'N/A';
        
        // Update row content
        deviceRow.innerHTML = `
            <td>
                <span class="status-indicator online"></span>
                ${device.params.device.name}
            </td>
            <td>${device.params.device.type}</td>
            <td>${uuid}</td>
            <td>${ipAddress}</td>
            <td>
                <button class="button is-small is-info configure-btn" data-uuid="${uuid}">Configure</button>
            </td>
        `;
        
        // Add event listener to the configure button
        const configureBtn = deviceRow.querySelector('.configure-btn') as HTMLButtonElement;
        configureBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent row click
            openConfigModal(uuid);
        });
    }
    
    // Open configuration modal
    function openConfigModal(uuid: string) {
        const device = discoveredDevices.get(uuid);
        if (!device) {
            showAlert(`Device ${uuid} not found`, 'error');
            return;
        }
        
        // Populate modal fields
        configUuid.value = uuid;
        
        // Get first IPv4 address and netmask
        const ipv4 = device.params.netSettings.interface.ipv4[0];
        if (ipv4) {
            configIp.value = ipv4.address;
            configNetmask.value = ipv4.netmask;
        }
        
        // Set interface name
        configInterface.value = device.params.netSettings.interface.name;
        
        // Show modal
        configModal.classList.add('is-active');
    }
    
    // Configure device
    async function configureDevice() {
        const uuid = configUuid.value;
        const ip = configIp.value;
        const netmask = configNetmask.value;
        const interfaceName = configInterface.value;
        
        if (!uuid || !ip || !netmask) {
            showAlert('Please fill all required fields', 'error');
            return;
        }
        
        const configMessage = {
            device: {
                uuid: uuid
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
            await ipcRenderer.invoke('configure-device', configMessage);
            showAlert(`Configuration sent to device ${uuid}`, 'success');
            configModal.classList.remove('is-active');
        } catch (err) {
            console.error('Failed to configure device:', err);
            showAlert('Failed to configure device', 'error');
        }
    }
    
    // Show device details (could expand in the future)
    function showDeviceDetails(uuid: string) {
        const device = discoveredDevices.get(uuid);
        console.log('Device details:', device);
        // Future: Add a detailed view of device properties
    }
    
    // Show alert message
    function showAlert(message: string, type: 'success' | 'error' | 'info') {
        alertMessage.textContent = message;
        scannerAlerts.style.display = 'block';
        
        // Remove all type classes
        scannerAlerts.classList.remove('is-success', 'is-danger', 'is-info');
        
        // Add the appropriate class
        switch (type) {
            case 'success':
                scannerAlerts.classList.add('is-success');
                break;
            case 'error':
                scannerAlerts.classList.add('is-danger');
                break;
            case 'info':
                scannerAlerts.classList.add('is-info');
                break;
        }
        
        // Auto hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                scannerAlerts.style.display = 'none';
            }, 5000);
        }
    }
}