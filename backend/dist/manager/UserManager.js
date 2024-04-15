"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.notifyUser();
        this.initSocketHandlers(socket);
    }
    removeUser(socketId) {
        const user = this.users.find(u => u.socket.id === socketId);
        if (!user) {
            return;
        }
        this.users = this.users.filter(u => u.socket.id !== socketId);
        this.queue = this.queue.filter(id => id !== socketId);
        // this.roomManager.deleteRoomForUser(user)
    }
    notifyUser() {
        console.log("queue length:" + this.queue.length);
        console.log("user length:" + this.users.length);
        if (this.users.length < 2) {
            return;
        }
        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        const user1 = this.users.find(u => u.socket.id == id1);
        const user2 = this.users.find(u => u.socket.id == id2);
        if (!user1 || !user2) {
            return;
        }
        this.roomManager.createRooom(user1, user2);
        this.notifyUser();
    }
    initSocketHandlers(socket) {
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", ({ sdp, roomId }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, type, roomId }) => {
            this.roomManager.addIceCandidate(candidate, type, socket.id, roomId);
        });
    }
}
exports.UserManager = UserManager;
