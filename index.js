const express = require('express')
const http = require('http')
const cors = require('cors')
const { Queue } = require('./Queue.js')
const expressApp = express()
const server = http.createServer(expressApp)
const io = require('./io').init(server)
// Cors
expressApp.use(
  cors({
    origin: ['http://localhost:5173', 'http://192.168.100.12:5173']
  })
)

// Lectura y parseo del body
expressApp.use(express.json())
const socketQueue = new Queue()
let staffData = null
let clientData = null

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    socketQueue.enqueue(socket)
    console.log(socket.id)
    socket.username = username
    socket.rol = 'client'
    console.log(`${username} has joined. su id: ${socket.id}`)
    socket.emit('informacionCola', socketQueue.findIndex(socket) + 1)

    console.log('Position in queue: ', socketQueue.findIndex(socket) + 1)

    const userIndex = socketQueue.findIndex(socket)
    if (userIndex === 0) {
      clientData = {
        rol: 'client',
        username: socket.username
      }
      io.emit('firstClient', socket.username)
      if (staffData) {
        socket.emit('infoStaff', staffData.username)
      }
    }
  })

  socket.on('joinStaff', (data) => {
    socket.rol = 'staff'
    socket.username = data
    staffData = {
      rol: socket.rol,
      username: socket.username
    }
    console.log(staffData.username)
    if (clientData) {
      socket.emit('firstClient', clientData.username)
    }
    if (socketQueue.items[0]) {
      io.to(socketQueue.items[0].id).emit('infoStaff', staffData.username)
    }
  })

  socket.on('sendMessageStaff', (data) => {
    console.log('se recibió del cliente y para el staff', data)
    io.emit('receiveMessageClient', {
      message: data,
      username: socket.username,
      rol: 'client'
    })
  })

  socket.on('sendMessageClient', (data) => {
    console.log('se recibió del staff y va para el cliente', data)
    if (socketQueue.items[0]) {
      io.to(socketQueue.items[0].id).emit('receiveMessageStaff', {
        message: data,
        username: socket.username,
        rol: 'staff'
      })
    }
  })

  socket.on('nextClient', () => {
    console.log('nextClient')
    const client = socketQueue.items[0]
    if (client && client.disconnect) {
      io.to(socketQueue.items[0].id).emit('finalizeChat', true)
      client.disconnect()
    }
  })

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`${socket.username} has disconnected.`)
    }
    console.log(socket.rol)
    if (socket.rol === 'staff') {
      staffData = null
      if (socketQueue.items[0]) {
        io.to(socketQueue.items[0].id).emit('infoStaff', null)
      }
    }
    const userIndex = socketQueue.findIndex(socket)
    if (userIndex === 0) {
      clientData = null
      io.emit('firstClient', null)
    }
    if (userIndex !== -1) {
      socketQueue.items.splice(userIndex, 1)
      socketQueue.items.forEach((socket, index) => {
        if (index === 0) {
          clientData = {
            rol: 'client',
            username: socket.username
          }
          console.log('nuevo client')
          io.emit('firstClient', clientData.username)
          if (socketQueue.items[0]) {
            io.to(socketQueue.items[0].id).emit('infoStaff', staffData.username)
          }
        }
        io.to(socket.id).emit('informacionCola', index + 1)
      })
    }
  })
})
server.listen(8080, () => {
  console.log('Servidor Express corriendo en puerto ' + 8080)
})
