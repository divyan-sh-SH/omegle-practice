"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
let GLOBAL_ROOM_ID = 1;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRooom(user1, user2) {
        const roomId = this.generateRoomID().toString();
        this.rooms.set(roomId.toString(), {
            user1,
            user2
        });
        user1.socket.emit("send-offer", {
            roomId
        });
        user2.socket.emit("send-offer", {
            roomId
        });
    }
    onOffer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const recievingUser = room.user1.socket.id == senderSocketId ?
            room.user2 : room.user1;
        recievingUser.socket.emit("offer", {
            sdp,
            roomId
        });
    }
    onAnswer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const recievingUser = room.user1.socket.id == senderSocketId ?
            room.user2 : room.user1;
        recievingUser.socket.emit("answer", {
            sdp,
            roomId
        });
    }
    addIceCandidate(candidate, type, senderSocketId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const recievingUser = room.user1.socket.id == senderSocketId ?
            room.user2 : room.user1;
        recievingUser.socket.emit("add-ice-candidate", {
            candidate,
            type
        });
    }
    getUserRoom(user) {
        this.rooms.forEach((v, k) => {
            if (v.user1.socket.id == user.socket.id || v.user2.socket.id == user.socket.id) {
                return k;
            }
        });
        return null;
    }
    deleteRoomForUser(user) {
        const roomId = this.getUserRoom(user);
        if (!roomId) {
            return;
        }
        this.deleteRoom(roomId);
    }
    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
    generateRoomID() {
        return GLOBAL_ROOM_ID++;
    }
}
exports.RoomManager = RoomManager;
