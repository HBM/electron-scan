import { Socket } from 'dgram'

// Mocked dgram module
jest.mock('dgram', () => {
  // Mock sockets
  const mockSockets: Record<string, any> = {}

  return {
    createSocket: jest.fn().mockImplementation(({ type }) => {
      // New mock socket
      const socket = {
        bind: jest.fn((port, address, callback) => {
          if (callback) callback()
          return socket
        }),
        addMembership: jest.fn(),
        on: jest.fn((event, handler) => {
          socket.handlers = socket.handlers || {}
          socket.handlers[event] = handler
          return socket
        }),
        emit: jest.fn((event, ...args) => {
          if (socket.handlers && socket.handlers[event]) {
            socket.handlers[event](...args)
          }
          return true
        }),
        send: jest.fn((data, port, address) => {}),
        close: jest.fn()
      }

      // Sockets stored
      const id = `${type}-${Date.now()}-${Math.random()}`
      mockSockets[id] = socket

      return socket
    }),

    __getMockSockets: () => mockSockets
  }
})
