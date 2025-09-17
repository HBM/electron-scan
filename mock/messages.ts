export const messages = [
  {
    jsonrpc: '2.0',
    method: 'announce',
    params: {
      apiVersion: '1.0',
      device: {
        familyType: 'QuantumX',
        firmwareVersion: '4.46.18.0',
        name: 'MX1601B_Advantage',
        type: 'MX1601',
        uuid: '0009E50046CC'
      },
      expiration: 15,
      netSettings: {
        interface: {
          configurationMethod: 'manual',
          description: 'ethernet backplane side',
          ipv4: [
            { address: '172.19.106.101', netmask: '255.255.0.0' },
            { address: '169.254.141.62', netmask: '255.255.0.0' }
          ],
          ipv6: [{ address: 'fe80::209:e5ff:fe00:46cc', prefix: 64 }],
          name: 'eth0',
          type: 'ethernet'
        }
      },
      services: [
        { port: 7411, type: 'daqStream' },
        { port: 5001, type: 'hbmProtocol' },
        { port: 80, type: 'http' },
        { port: 11122, type: 'jetd' },
        { port: 22, type: 'ssh' }
      ]
    }
  },
  {
    jsonrpc: '2.0',
    method: 'announce',
    params: {
      apiVersion: '1.0',
      device: {
        familyType: 'SmartTorque',
        firmwareVersion: 'v1.0.5-4204\n',
        label: 'test1',
        name: 'T100',
        stator: { identNr: 'test1', kCode: 'K-T100-test1-test2-test2-U' },
        type: 'T100',
        uuid: '0009E50092B5'
      },
      expiration: 15,
      netSettings: {
        interface: {
          ipv4: [{ address: '172.19.211.95', netmask: '255.255.0.0' }],
          ipv6: [{ address: 'fe80::209:e5ff:fe00:92b5', prefix: 64 }],
          name: 'end0',
          type: 'wifi'
        },
        defaultGateway: {
          ipv4Address: '192.168.1.100'
        }
      },
      services: [
        { port: 7416, type: 'daqStream' },
        { port: 80, type: 'http' },
        { port: 11122, type: 'jetd' },
        { path: '/api/jet/', port: 11123, type: 'jetws' },
        { port: 22, type: 'ssh' }
      ]
    }
  },
  {
    jsonrpc: '2.0',
    method: 'announce',
    params: {
      apiVersion: '1.0',
      device: {
        familyType: 'digiBOX',
        firmwareVersion: '1.0.2+20250311',
        name: 'digiBOX-Web-A2E9',
        type: 'DBX4PADIEI',
        uuid: '0009E5AAA2E9'
      },
      netSettings: {
        interface: {
          name: 'ETH0',
          type: 'ethernet',
          description: 'Primary Ethernet Port',
          configurationMethod: 'dhcp',
          ipv4: [{ address: '172.19.190.76', netmask: '255.255.0.0' }]
        }
      },
      expiration: 30,
      services: [
        { port: 80, path: '/stream', type: 'daqStreamws' },
        { port: 80, type: 'http' },
        { port: 80, type: 'jetws', path: '/jet/canopen' }
      ]
    }
  },
  {
    jsonrpc: '2.0',
    method: 'announce',
    params: {
      apiVersion: '1.0',
      device: {
        familyType: 'BMX',
        firmwareVersion: '0.2.0+20250324',
        name: 'bmx60-9BEB-Carrier-NR3-Gianni',
        type: 'BMXenabler',
        uuid: '0009E5AA9BEB'
      },
      netSettings: {
        interface: {
          name: 'ETH0',
          type: 'ethernet',
          description: 'Primary Ethernet Port',
          configurationMethod: 'dhcp',
          ipv4: [{ address: '172.19.191.214', netmask: '255.255.0.0' }]
        }
      },
      expiration: 30,
      services: [
        { port: 80, type: 'http' },
        { port: 80, type: 'jetws', path: '/jet/canopen' },
        { port: 80, type: 'daqStreamws', path: '/stream' }
      ]
    }
  },
  {"jsonrpc":"2.0","method":"announce","params":{"apiVersion":"1.1","device":{"familyType":"SmartTorque","firmwareVersion":"v1.0.33-4566_7079b2011--clean","name":"T100","type":"T100","uuid":"0009E5AFFE00"},"expiration":15,"netSettings":{"interface":{"ipv4":[{"address":"172.19.192.253","netmask":"255.255.0.0"}],"ipv6":[{"address":"fe80::209:e5ff:feaf:fe00","prefix":64}],"name":"end0","type":"ethernet"}},"services":[{"port":7416,"type":"daqStream"},{"port":80,"type":"http"},{"port":11122,"type":"jetd"},{"path":"/api/jet/","port":11123,"type":"jetws"},{"port":22,"type":"ssh"}],"vendor":{"rotor":{"identNr":"234530042","kCode":"K-T110-500-S-H-M4-U"},"stator":{"kCode":"K-T100-STL-FAN-07-U"}}}}
]
