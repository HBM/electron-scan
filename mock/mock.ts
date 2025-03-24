import dgram, { type Socket } from 'dgram'
import { messages } from './messages'
const announceSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
const configSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
// Announce socket
announceSocket.bind(31416, '0.0.0.0', () => {
  announceSocket.addMembership('239.255.77.76')
})

// Configuration socket to receive configuration messages
configSocket.bind(31417, '0.0.0.0', () => {
  configSocket.addMembership('239.255.77.77')
})

// Listening for configuration messages
configSocket.on('message', (msg) => {
  console.log('Received configuration:')
  console.log(JSON.parse(msg.toString()))
})
let msgIdx = 0
// Announcement broadcasting
setInterval(() => {
  console.log('sending', messages[msgIdx].params.device.name)
  announceSocket.send(JSON.stringify(messages[msgIdx]), 31416, '239.255.77.76')
  msgIdx = ++msgIdx % messages.length
}, 2000)
