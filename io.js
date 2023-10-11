let io = null

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: 'http://localhost:5173', // Reemplaza con la URL de tu frontend
        methods: ['GET', 'POST']
      }
    })
    return io
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!')
    }
    return io
  }
}
