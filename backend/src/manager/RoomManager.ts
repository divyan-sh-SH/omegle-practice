import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;
interface Room {
    user1: User, 
    user2: User
}

export class RoomManager {
    private rooms: Map<string, Room>
    constructor() {
        this.rooms = new Map<string, Room>()
    }

    createRooom(user1: User, user2: User) {
        const roomId = this.generateRoomID().toString()
        this.rooms.set(roomId.toString(), {
            user1, 
            user2
        })

        user1.socket.emit("send-offer", {
            roomId
        })

        user2.socket.emit("send-offer", {
            roomId
        })
    }

    onOffer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId)

        if(!room) {
            return
        }

        const recievingUser = room.user1.socket.id == senderSocketId ? 
                        room.user2 : room.user1

        recievingUser.socket.emit("offer", {
            sdp, 
            roomId
        })
    }

    onAnswer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId)

        if(!room) {
            return
        }

        const recievingUser = room.user1.socket.id == senderSocketId ? 
                        room.user2 : room.user1

        recievingUser.socket.emit("answer", {
            sdp, 
            roomId
        })
    }

    addIceCandidate(candidate: any, type: string, senderSocketId: string, roomId: string) {
        const room = this.rooms.get(roomId)

        if(!room) {
            return
        }

        const recievingUser = room.user1.socket.id == senderSocketId ? 
                        room.user2 : room.user1

        recievingUser.socket.emit("add-ice-candidate", {
            candidate,
            type
        })
    }

    getUserRoom(user: User): (string | null) {
        this.rooms.forEach((v,k) => {
            if(v.user1.socket.id == user.socket.id || v.user2.socket.id == user.socket.id) {
                return k
            }
        })

        return null
    }

    deleteRoomForUser(user: User) {
        const roomId = this.getUserRoom(user)
        if(!roomId) {
            return 
        }

        this.deleteRoom(roomId)
    }

    deleteRoom(roomId: string) {
        this.rooms.delete(roomId)
    }

    generateRoomID() {
        return GLOBAL_ROOM_ID++;
    }
}