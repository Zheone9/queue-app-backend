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
    socket.username = username
    console.log(`${username} has joined.`)
    socket.emit('informacionCola', socketQueue.find(socket) + 1)
    console.log('Position in queue: ', socketQueue.find(socket) + 1)
    const userIndex = socketQueue.find(socket)
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
    io.to(socketQueue.items[0]).emit('infoStaff', staffData.username)
  })

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`${socket.username} has disconnected.`)
    }
    if (socket.rol === 'staff') {
      staffData = null
      io.to(socketQueue.items[0]).emit('infoStaff', null)
    }
    const userIndex = socketQueue.find(socket)
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
          io.emit('firstClient', clientData.username)
          io.to(socketQueue.items[0].id).emit('infoStaff', staffData.username)
        }
        io.to(socket.id).emit('informacionCola', index + 1)
      })
    }
  })
})
server.listen(8080, () => {
  console.log('Servidor Express corriendo en puerto ' + 8080)
})
