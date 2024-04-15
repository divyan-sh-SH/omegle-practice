import { useEffect, useRef, useState } from "react"
import { Socket, io } from "socket.io-client"

const URL = "http://localhost:3000"

export const Room = ({
    name, 
    localAudio, 
    localVideo
    } : {
        name: string, 
        localAudio: MediaStreamTrack | null
        localVideo: MediaStreamTrack | null}) => {
    const [socket, setSocket] = useState<null | Socket>(null)

    const [lobby, setLobby] = useState(false)

    const [sendingPc, setSendingPc] = useState<RTCPeerConnection|null>(null)
    const [recievingPc, setRecievingPc] = useState<RTCPeerConnection|null>(null)    

    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Login to init user room 
        const socket = io(URL)

        socket.on('send-offer', (roomId) => {
            setLobby(true)
            const pc = new RTCPeerConnection() 
            setSendingPc(pc)
            if(localAudio) {
                pc.addTrack(localAudio)
            }

            if(localVideo) {
                pc.addTrack(localVideo)
            }

            // add ice candidate for sender
            pc.onicecandidate = e => {
                if(e.candidate) {
                    console.log("found ice candidate to add")
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate, 
                        type: "sender",
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer()
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp, 
                    roomId
                })
            }
        })

        socket.on("offer", async ({sdp, roomId}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(sdp)
            const localSDP = await pc.createAnswer()
            pc.setLocalDescription(localSDP)

            const remoteStream = new MediaStream()
            if(remoteVideRef.current) {
                remoteVideRef.current.srcObject = remoteStream;
            }

            setRemoteMediaStream(remoteStream)
            setRecievingPc(pc)
            pc.ontrack = e => {
                const {track, type} = e
                if(type == "audio") {
                    setRemoteAudioTrack(track)
                } else {
                    setRemoteVideoTrack(track)
                }

                 // @ts-ignore
                 remoteVideRef.current?.srcObject.addTrack(track)
                 // @ts-ignore
                 remoteVideRef.current?.play()
            }

            // add ice candidate for recieveing 
            pc.onicecandidate = e => {
                if(!e.candidate) {
                    return
                }

                socket.emit("add-ice-candidate", {
                    candidate: e.candidate, 
                    type: "reciever", 
                    roomId
                })
            }

            socket.emit("answer", {
                roomId, 
                sdp: localSDP
            })
        })

        socket.on("answer", ({sdp, roomId}) => {
            setLobby(false)
            setSendingPc(pc  => {
                pc?.setRemoteDescription(sdp)
                return pc
            })
        })

        socket.on("lobby", () => {
            console.log("new user in lobby")
            setLobby(true)
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("adding ice candidate")
            if(type === "sender") {
                setRecievingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            } else {
                setSendingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            }
        })

        setSocket(socket)
    }, [name])

    useEffect(() => {
        if(localVideoRef.current) {
            if(localVideo) {
                localVideoRef.current.srcObject = new MediaStream([localVideo])
                localVideoRef.current.play()
            }
        }
    }, [localVideoRef])

    return <>
        <video autoPlay ref={localVideoRef}></video>
        {lobby ? "waiting for someone" : <video autoPlay ref={remoteVideRef}></video> }
        
    </>
}