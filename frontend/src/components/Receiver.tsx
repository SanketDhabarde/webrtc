import { useEffect, useRef } from "react";

export function Receiver() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    startReceiving(socket);
  }, []);

  function startReceiving(socket: WebSocket) {
    const pc = new RTCPeerConnection();

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "createOffer") {
        pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(
          JSON.stringify({ type: "createAnswer", sdp: pc.localDescription })
        );
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.iceCandidate);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({
            type: "iceCandidate",
            iceCandidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      console.log(event.track);

      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream([event.track]);
        console.log(videoRef.current);
      }
    };
  }

  function getVideo() {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }
  return (
    <div>
      Receiver
      <video ref={videoRef} autoPlay playsInline></video>
      <button onClick={getVideo}>StartStream</button>
    </div>
  );
}
