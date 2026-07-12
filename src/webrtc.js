// ============================================================
// VictorMeet — WebRTC Peer Connection Manager
// ============================================================

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/** @type {RTCPeerConnection | null} */
let peerConnection = null;

/** @type {MediaStream | null} */
let localStream = null;

/** @type {MediaStream | null} */
let remoteStream = null;

/** @type {HTMLVideoElement | null} */
let localVideoEl = null;

/** @type {HTMLVideoElement | null} */
let remoteVideoEl = null;

// ── Local Media ──────────────────────────────────────────────

/**
 * Acquire camera + microphone.
 * @param {{ video?: boolean|MediaTrackConstraints, audio?: boolean }} [constraints]
 * @returns {Promise<MediaStream>}
 */
export async function getLocalStream(constraints) {
  const defaults = { video: true, audio: true };
  localStream = await navigator.mediaDevices.getUserMedia(constraints || defaults);
  if (localVideoEl) localVideoEl.srcObject = localStream;
  return localStream;
}

/**
 * Bind the DOM <video> elements so streams are rendered automatically.
 * @param {HTMLVideoElement} local
 * @param {HTMLVideoElement} remote
 */
export function setVideoElements(local, remote) {
  localVideoEl = local;
  remoteVideoEl = remote;
  if (localStream && localVideoEl) localVideoEl.srcObject = localStream;
  if (remoteStream && remoteVideoEl) remoteVideoEl.srcObject = remoteStream;
}

// ── Peer Connection ──────────────────────────────────────────

/**
 * Create a fresh RTCPeerConnection, attach local tracks, and wire
 * up the ICE / track / state-change callbacks.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} roomId
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(socket, roomId) {
  peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Add local tracks to the connection
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Receive remote tracks
  peerConnection.ontrack = (event) => {
    remoteStream = event.streams[0];
    if (remoteVideoEl) remoteVideoEl.srcObject = remoteStream;
  };

  // Trickle ICE candidates to the signaling server
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    }
  };

  // Logging
  peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection) {
      console.log('[webrtc] ICE state:', peerConnection.iceConnectionState);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection) {
      console.log('[webrtc] connection state:', peerConnection.connectionState);
    }
  };

  return peerConnection;
}

// ── Offer / Answer ───────────────────────────────────────────

/**
 * Create an SDP offer and send it through the signaling server.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} roomId
 * @returns {Promise<RTCPeerConnection>}
 */
export async function createOffer(socket, roomId) {
  const pc = createPeerConnection(socket, roomId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', { roomId, offer });
  return pc;
}

/**
 * Accept an incoming SDP offer, create a peer connection, and reply
 * with an answer.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} roomId
 * @param {RTCSessionDescriptionInit} offer
 * @returns {Promise<RTCPeerConnection>}
 */
export async function handleOffer(socket, roomId, offer) {
  const pc = createPeerConnection(socket, roomId);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', { roomId, answer });
  return pc;
}

/**
 * Apply an incoming SDP answer to the existing peer connection.
 * @param {RTCSessionDescriptionInit} answer
 */
export async function handleAnswer(answer) {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
}

/**
 * Add a received ICE candidate.
 * @param {RTCIceCandidateInit} candidate
 */
export async function handleIceCandidate(candidate) {
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

// ── Media Controls ───────────────────────────────────────────

/**
 * Toggle the microphone on/off.
 * @returns {boolean} true if audio is now MUTED
 */
export function toggleAudio() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // true = muted
    }
  }
  return false;
}

/**
 * Toggle the camera on/off.
 * @returns {boolean} true if video is now OFF
 */
export function toggleVideo() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // true = video off
    }
  }
  return false;
}

// ── Cleanup ──────────────────────────────────────────────────

/**
 * Close the current peer connection and clear the remote video.
 */
export function closePeerConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (remoteVideoEl) remoteVideoEl.srcObject = null;
  remoteStream = null;
}

/**
 * Fully stop all local media tracks (camera LED turns off).
 */
export function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  if (localVideoEl) localVideoEl.srcObject = null;
}

/**
 * Return the raw local MediaStream reference.
 * @returns {MediaStream | null}
 */
export function getLocalStreamRef() {
  return localStream;
}
