import { useEffect, useRef, useState } from "react"
import { Room } from "./Room"

export const Landing = () => {
    const [name, setName] = useState("")
    const [joined, setJoined] = useState(false)
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            audio:true,
            video:true
        })

        const localAudioTrack = stream.getAudioTracks()[0]
        const localVideoTrack = stream.getVideoTracks()[0]

        setLocalAudioTrack(localAudioTrack)
        setLocalVideoTrack(localVideoTrack)

        if(!videoRef.current) {
            return
        }

        videoRef.current.srcObject = new MediaStream([localVideoTrack])
        videoRef.current.play()
    }

    useEffect(() => {
        if(videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef])

    if(!joined) {
        return <div>
            <video autoPlay ref={videoRef}></video>
            <input type='text' value={name} onChange={(e) =>
                setName(e.target.value)
            }/>
            <button onClick={() => setJoined(true)}>Join</button>
        </div>
    }

    return <Room name={name} localAudio={localAudioTrack} localVideo={localVideoTrack}></Room>
}