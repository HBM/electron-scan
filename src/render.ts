// Renderer process verwaltet UI und user interaktionen
// User konfiguriert Gerät via UI (config modal)
// Renderer sammelt Konfiguration und sendet es zum main process
// Main process erhält Konfiguration und ruft eigentliche Funktion für Gerät Konfiguration im HbkScanner

declare namespace Electron {
    interface NativeImage {}
}

// @ts-ignore
const path = require('path');
const fs = require('fs');
const electronRemote = require('@electron/remote');
const { dialog, Menu } = electronRemote;
const { ipcRenderer } = require('electron');

// Image Map für Geräte Bildern
const { imageMap } = require('./icons/map');

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
    // Scanner initialisert
    initScanner();
});

function initScanner() {
    ipcRenderer.on('scanner-status', (_event, status) => {
        console.log('Scanner status updated:', status);
        if (status === 'running') {
            scanBtn.classList.remove('is-primary');
            scanBtn.classList.add('is-danger');
            scanBtn.textContent = 'Stop Scanning';
            isScanning = true;
        } else {
            scanBtn.classList.remove('is-danger');
            scanBtn.classList.add('is-primary');
            scanBtn.textContent = 'Start Scanning';
            isScanning = false;
        }
    });
    
    // Device scanning Elemente
    const scanBtn = document.getElementById('scanBtn') as HTMLButtonElement;
    const deviceList = document.getElementById('deviceList') as HTMLTableSectionElement;
    const scannerAlerts = document.getElementById('scannerAlerts') as HTMLDivElement;
    const alertMessage = document.getElementById('alertMessage') as HTMLParagraphElement;
    const deleteAlertBtn = scannerAlerts.querySelector('.delete') as HTMLButtonElement;

    // Konfig Elemente
    const configModal = document.getElementById('configModal') as HTMLDivElement;
    //const configUuid = document.getElementById('configUuid') as HTMLInputElement;
    const configIp = document.getElementById('configIp') as HTMLInputElement;
    const configNetmask = document.getElementById('configNetmask') as HTMLInputElement;
    //const configInterface = document.getElementById('configInterface') as HTMLInputElement;
    const configSaveBtn = document.getElementById('configSaveBtn') as HTMLButtonElement;
    const cancelConfigBtns = document.querySelectorAll('.cancel-config, .modal-background, .delete');

    const discoveredDevices = new Map();
    let isScanning = false;
    let currentDeviceUuid = '';

    // Event delegation
    deviceList.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const row = target.closest('.device-row');
        
        if (!row) return;
        
        if (target.closest('.configure-btn')) return;
        
        const uuid = row.id.replace('device-', '');
        toggleDeviceDetails(uuid);
    });
    
    // event handlers
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
    
    // IPC event listeners für scanner/discovery events die von Einstieg prozess gesendet werden

    ipcRenderer.on('hbk-device-found', (_event: any, device: HbkDevice) => {
        console.log('Renderer: Device found:', device);
        addOrUpdateDevice(device);
    });
    
    ipcRenderer.on('hbk-scanner-error', (_event: any, error: string) => {
        console.error('Renderer: Scanner error:', error);
        showAlert(`Scanner error: ${error}`, 'error');
    });

    ipcRenderer.on('hbk-device-updated', (_event: any, device: HbkDevice) => {
        console.log('Renderer: Device updated:', device);
        addOrUpdateDevice(device);
    });
    
    // Scanning on/off (kommunikation mit main process)
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
                showAlert('HBK Scanner started device search...', 'info');
            } catch (err) {
                console.error('Failed to start scanning:', err);
                showAlert('Failed to start scanning', 'error');
            }
        }
    }
    
    // Fügt Geräte zu Geräte Liste hin
    function addOrUpdateDevice(device: HbkDevice) {
        const uuid = device.params.device.uuid;

        const isNewDevice = !discoveredDevices.has(uuid);
        
        // Gerät speichern
        discoveredDevices.set(uuid, device);
        
        const noDevicesRow = document.getElementById('no-devices');
        if (noDevicesRow) {
            noDevicesRow.remove();
        }
        
        let deviceRow = document.getElementById(`device-${uuid}`);
        
        if (!deviceRow) {
            deviceRow = document.createElement('tr');
            deviceRow.id = `device-${uuid}`;
            deviceRow.className = 'device-row';
            deviceList.appendChild(deviceRow);

            if (isNewDevice) {
                showAlert(`New device found: ${device.params.device.name}`, 'success');
            }
        }
        
        // IPv4 addresse
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
                <span class="icon toggle-details">
                    <i class="fas fa-chevron-down"></i>
                </span>
            </td>
        `;

        let detailsRow = document.getElementById(`device-details-${uuid}`);
        if (!detailsRow) {
            detailsRow = document.createElement('tr');
            detailsRow.id = `device-details-${uuid}`;
            detailsRow.className = 'device-details-row';
            detailsRow.style.display = 'none';
            // Alte Reihe entfernt
            const oldDetailsRow = document.getElementById(`device-details-${uuid}`);
            if (oldDetailsRow) {
                oldDetailsRow.remove();
            }
            
            if (deviceRow.nextSibling) {
                deviceList.insertBefore(detailsRow, deviceRow.nextSibling);
            } else {
                deviceList.appendChild(detailsRow);
            }
        }

        detailsRow.innerHTML = `<td colspan="5" class="details-content"></td>`;
        
        // Event listener zum Konfiguration button
        const configureBtn = deviceRow.querySelector('.configure-btn') as HTMLButtonElement;
        if (configureBtn) {
            configureBtn.replaceWith(configureBtn.cloneNode(true));
    
            deviceRow.querySelector('.configure-btn')?.addEventListener('click', (event) => {
                event.stopPropagation();
                openConfigModal(uuid);
            });
        }
    }
    
    // Konfiguration Modal
    function openConfigModal(uuid: string) {
        const device = discoveredDevices.get(uuid);
        if (!device) {
            showAlert(`Device ${uuid} not found`, 'error');
            return;
        }

        currentDeviceUuid = uuid;
        
        // IPv4 addresse und netmask
        const ipv4 = device.params.netSettings.interface.ipv4[0];
        if (ipv4) {
            configIp.value = ipv4.address;
            configNetmask.value = ipv4.netmask;
        }
        
        configModal.classList.add('is-active');
    }
    
    // Behandelt Geräte Konfiguration Form
    async function configureDevice() {
        const uuid = currentDeviceUuid;
        const ip = configIp.value;
        const netmask = configNetmask.value;

        const existingDevice = discoveredDevices.get(uuid);

        const interfaceName = existingDevice?.params.netSettings.interface.name;
        
        if (!uuid || !ip || !netmask) {
            showAlert('Fill all required fields', 'error');
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
        console.log('Sending configuration:', configMessage);
        try {
            const response = await ipcRenderer.invoke('configure-device', configMessage);
            
            if (response.success) {
                // Neue Konfig Werte
                const device = discoveredDevices.get(uuid);
                if (device && device.params.netSettings.interface.ipv4[0]) {
                    device.params.netSettings.interface.ipv4[0].address = ip;
                    device.params.netSettings.interface.ipv4[0].netmask = netmask;
                    device.params.netSettings.interface.name = interfaceName;
                    device.params.netSettings.interface.configurationMethod = 'manual';
                    
                    // UI aktualisieren
                    const deviceRow = document.getElementById(`device-${uuid}`);
                    if (deviceRow) {
                        const ipCell = deviceRow.querySelector('td:nth-child(4)');
                        if (ipCell) ipCell.textContent = ip;
                    }

                    showAlert(`Configuration sent to device ${uuid}`, 'success');
                }
            } else {
                showAlert(`Configuration failed: ${response.error}`, 'error');
            }
            configModal.classList.remove('is-active');
        } catch (err) {
            console.error('Failed to configure device:', err);
            showAlert('Failed to configure device', 'error');
        }
    }

    function getDeviceImage(device: HbkDevice): string {
        const deviceType = device.params.device.type.toLowerCase();
        let imageName = imageMap[deviceType];
        
        if (!imageName && device.params.device.familyType) {
            const familyType = device.params.device.familyType.toLowerCase();
            imageName = imageMap[familyType];
        }
        
        if (!imageName) {
            return 'assets/default-device.webp';
        }
        
        const distPath = path.join(__dirname, 'icons', imageName);
        const srcPath = path.join(__dirname, '../src/icons', imageName);
        
        if (fs.existsSync(distPath)) {
            return `icons/${imageName}`;
        } else if (fs.existsSync(srcPath)) {
            return `../src/icons/${imageName}`;
        } else {
            return 'assets/default-device.webp';
        }
    }

    function getDeviceWebsite(device: HbkDevice): string {
        // MIT ECHTEN WEBSITE URL IMPLEMENTIEREN
        const deviceType = device.params.device.type.toLowerCase();
        // Mock
        const ipAddress = device.params.netSettings.interface.ipv4[0]?.address || '0.0.0.0';
        
        // Mock
        return `http://${ipAddress}`;
        
        // Echte implementierung
        // return deviceWebsiteMap[deviceType] || `http://${ipAddress}`;
        /*
            const websiteMap: Record<string, string> = {
            'mx410': 'http://example.com/mx410',
            'mx460': 'http://example.com/mx460',
            // Add more mappings as needed
        };*/
        // EVENT LISTENR IMPLEMENTIEREN (IN POPULATEDEVICE)
    }
    
    // Geräte Details werden gezeigt wenn Gerät geclickt wird
    function toggleDeviceDetails(uuid: string) {
        const device = discoveredDevices.get(uuid);
        if (!device) {
            showAlert(`Device ${uuid} not found`, 'error');
            return;
        }
        
        const deviceRow = document.getElementById(`device-${uuid}`);
        const detailsRow = document.getElementById(`device-details-${uuid}`);
        
        if (!deviceRow || !detailsRow) {
            console.error('Could not find device or details row', uuid);
            return;
        }
        
        const chevron = deviceRow.querySelector('.toggle-details i');
        
        const isExpanded = deviceRow.classList.contains('expanded');
        
        if (isExpanded) {
            detailsRow.style.display = 'none';
            if (chevron) chevron.className = 'fas fa-chevron-down';
            deviceRow.classList.remove('expanded');
        } else {
            const detailsContent = detailsRow.querySelector('.details-content');
            if (detailsContent) {
                populateDeviceDetails(device, detailsContent);
                
                // Kleine Verzögerung um sicherzustellen dass das DOM aktualisiert wird
                setTimeout(() => {
                    detailsRow.style.display = 'table-row';
                    if (chevron) chevron.className = 'fas fa-chevron-up';
                    deviceRow.classList.add('expanded');
                }, 0);
            }
        }
    }
    
    // Geräte Details mit Elemente erstellt
    function populateDeviceDetails(device: HbkDevice, container: Element) {
        const imagePath = getDeviceImage(device);
        const websiteUrl = getDeviceWebsite(device);

        container.innerHTML = `
        <div class="device-details-container">
            <div class="columns is-multiline">
                <!-- Gerät Bild -->
                <div class="column is-full has-text-centered mb-4">
                    <img src="${imagePath}" alt="${device.params.device.name}" class="device-image"
                        onerror="this.onerror=null; this.src='assets/default-device.webp';">
                    
                    <!-- Website Link -->
                    <div class="mt-3">
                        <a href="#" class="button is-link website-link" data-url="${websiteUrl}">
                            <span class="icon">
                                <i class="fas fa-external-link-alt"></i>
                            </span>
                            <span>Open Device Website</span>
                        </a>
                    </div>
                </div>
                <!-- Info -->
                <div class="column is-half">
                    <div class="detail-card">
                        <h4 class="title is-5 has-text-primary">
                            <span class="icon-text">
                                <span class="icon"><i class="fas fa-microchip"></i></span>
                                <span>Device Information</span>
                            </span>
                        </h4>
                        <div class="detail-section">
                            <table class="table is-striped is-fullwidth">
                                <tbody>
                                    <tr><th width="30%">Name</th><td>${device.params.device.name}</td></tr>
                                    <tr><th>UUID</th><td class="has-text-grey-dark">${device.params.device.uuid}</td></tr>
                                    <tr><th>Type</th><td>${device.params.device.type}</td></tr>
                                    <tr><th>Family</th><td>${device.params.device.familyType}</td></tr>
                                    <tr><th>Firmware</th><td>${device.params.device.firmwareVersion}</td></tr>
                                    <tr><th>API Version</th><td>${device.params.apiVersion}</td></tr>
                                    <tr><th>Expiration</th><td>${device.params.expiration}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Network Info -->
                <div class="column is-half">
                    <div class="detail-card">
                        <h4 class="title is-5 has-text-primary">
                            <span class="icon-text">
                                <span class="icon"><i class="fas fa-network-wired"></i></span>
                                <span>Network Interface</span>
                            </span>
                        </h4>
                        <div class="detail-section">
                            <table class="table is-striped is-fullwidth">
                                <tbody>
                                    <tr><th width="30%">Interface</th><td>${device.params.netSettings.interface.name}</td></tr>
                                    <tr><th>Description</th><td>${device.params.netSettings.interface.description || 'N/A'}</td></tr>
                                    <tr><th>Type</th><td>${device.params.netSettings.interface.type}</td></tr>
                                    <tr><th>Configuration</th><td>${device.params.netSettings.interface.configurationMethod || 'N/A'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- IP Addressen -->
                <div class="column is-half">
                    <div class="detail-card">
                        <h4 class="title is-5 has-text-primary">
                            <span class="icon-text">
                                <span class="icon"><i class="fas fa-globe"></i></span>
                                <span>IPv4 Addresses</span>
                            </span>
                        </h4>
                        <div class="detail-section">
                            <table class="table is-striped is-fullwidth is-hoverable">
                                <thead>
                                    <tr>
                                        <th width="60%">IP Address</th>
                                        <th width="40%">Netmask</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${device.params.netSettings.interface.ipv4 && device.params.netSettings.interface.ipv4.length > 0 
                                        ? device.params.netSettings.interface.ipv4.map(ip => 
                                            `<tr>
                                                <td class="has-text-link has-text-weight-medium">${ip.address}</td>
                                                <td>${ip.netmask}</td>
                                            </tr>`).join('')
                                        : '<tr><td colspan="2" class="has-text-centered">No IPv4 addresses configured</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Services -->
                <div class="column is-half">
                    <div class="detail-card">
                        <h4 class="title is-5 has-text-primary">
                            <span class="icon-text">
                                <span class="icon"><i class="fas fa-server"></i></span>
                                <span>Services</span>
                            </span>
                        </h4>
                        <div class="detail-section">
                            <table class="table is-striped is-fullwidth is-hoverable">
                                <thead>
                                    <tr>
                                        <th width="70%">Type</th>
                                        <th width="30%">Port</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${device.params.services && device.params.services.length > 0 
                                        ? device.params.services.map(service => 
                                            `<tr>
                                                <td>${service.type}</td>
                                                <td class="has-text-centered has-text-weight-medium">${service.port}</td>
                                            </tr>`).join('')
                                        : '<tr><td colspan="2" class="has-text-centered">No services available</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- IPv6 Addresses Section -->
                <div class="column is-full">
                    <div class="detail-card">
                        <h4 class="title is-5 has-text-primary">
                            <span class="icon-text">
                                <span class="icon"><i class="fas fa-globe-americas"></i></span>
                                <span>IPv6 Addresses</span>
                            </span>
                        </h4>
                        <div class="detail-section">
                            <table class="table is-striped is-fullwidth is-hoverable">
                                <thead>
                                    <tr>
                                        <th width="80%">Address</th>
                                        <th width="20%">Prefix</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${device.params.netSettings.interface.ipv6 && device.params.netSettings.interface.ipv6.length > 0 
                                        ? device.params.netSettings.interface.ipv6.map(ip => 
                                            `<tr>
                                                <td class="ipv6-address">${ip.address}</td>
                                                <td class="has-text-centered">${ip.prefix}</td>
                                            </tr>`).join('')
                                        : '<tr><td colspan="2" class="has-text-centered">No IPv6 addresses configured</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    // Alert Nachrichten
    function showAlert(message: string, type: 'success' | 'error' | 'info') {
        alertMessage.textContent = message;
        scannerAlerts.style.display = 'block';
        
        scannerAlerts.classList.remove('is-success', 'is-danger', 'is-info');
        
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
        
        if (type === 'success') {
            setTimeout(() => {
                scannerAlerts.style.display = 'none';
            }, 5000);
        }
    }
}