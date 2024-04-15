import { Socket, Server } from  "socket.io"
import express from "express"
import http from "http"
import { UserManager } from "./manager/UserManager";

const app = express()
const server  = http.createServer(http);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

const userManager = new UserManager()

io.on('connection', (socket:Socket) => {
    userManager.addUser("name", socket)
    socket.on('disconnect', () => {
        userManager.removeUser(socket.id)
    })
})

server.listen(3000, () => {
    console.log('listening on *:3000');
});