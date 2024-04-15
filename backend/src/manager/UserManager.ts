import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    name:string, 
    socket:Socket
}

export class UserManager {
    private users: User[]
    private queue: string[]
    private roomManager: RoomManager
    constructor() {
        this.users = []
        this.queue = []
        this.roomManager = new RoomManager()
    }

    addUser(name:string, socket:Socket) {
        this.users.push({name, socket})
        this.queue.push(socket.id)
        socket.emit("lobby")
        this.notifyUser()
        this.initSocketHandlers(socket)
    }

    removeUser(socketId:string) {
        const user = this.users.find(u => u.socket.id === socketId)
        if(!user) {
            return 
        }
        this.users = this.users.filter(u => u.socket.id !== socketId)
        this.queue = this.queue.filter(id => id !== socketId)
        // this.roomManager.deleteRoomForUser(user)
    }

    notifyUser() {
        console.log("queue length:" + this.queue.length)
        console.log("user length:" + this.users.length)
        if(this.users.length < 2) {
            return
        }

        const id1 = this.queue.pop()
        const id2 = this.queue.pop()
        const user1 = this.users.find(u => u.socket.id == id1)
        const user2 = this.users.find(u => u.socket.id == id2)

        if(!user1 || !user2) {
            return
        }

        this.roomManager.createRooom(user1, user2)
        this.notifyUser()
     }

     initSocketHandlers(socket: Socket) {
        socket.on("offer", ({sdp, roomId} : {sdp: string, roomId: string }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id)
        }) 

        socket.on("answer", ({sdp, roomId} : {sdp: string, roomId: string }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id)
        })

        socket.on("add-ice-candidate", ({candidate, type, roomId} : {candidate:string, type: string, roomId:string}) => {
            this.roomManager.addIceCandidate(candidate, type, socket.id, roomId)
        })
     }


    
}