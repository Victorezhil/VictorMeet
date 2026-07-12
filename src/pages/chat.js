// ============================================================
// VictorMeet — Main Chat Page (Classic Omegle style Copy)
// ============================================================

import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { getSocket, initSocket } from '../socket.js';
import {
  getLocalStream,
  setVideoElements,
  createOffer,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  toggleAudio,
  toggleVideo,
  closePeerConnection,
  stopLocalStream,
} from '../webrtc.js';

let socketHandlers = {};
let unsubs = [];
let stopConfirmState = false; // Tracks if "Stop" button is in "Really?" confirmation state

// ── Render ────────────────────────────────────────────────────

export function render() {
  return `
    <div class="chat-container classic-layout" style="width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-primary);">
      
      <!-- Classic Header -->
      <div class="chat-header-classic" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-6); background: var(--bg-secondary); border-bottom: 1px solid var(--border); flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <a href="#/landing" class="nav-logo" style="font-size: 28px; font-weight: 900; text-decoration: none; font-family: sans-serif;">
            <span style="color: var(--primary);">Victor</span><span style="color: var(--secondary);">Meet</span>
          </a>
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Talk to Strangers!</span>
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">
          <span id="onlineCountStatHeader">0</span> users online
        </div>
      </div>

      <!-- Top Ad Banner -->
      <div class="ad-top-banner" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: var(--space-1) var(--space-6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 50px; box-sizing: border-box; width: 100%;">
        <ins class="adsbygoogle"
             style="display:block; width:100%; min-height:50px;"
             data-ad-client="ca-pub-3286584236618316"
             data-ad-slot="2000000001"
             data-ad-format="horizontal"
             data-full-width-responsive="true"></ins>
      </div>

      <!-- Classic Work Area -->
      <div class="chat-main-classic" style="display: flex; flex: 1; overflow: hidden; background: var(--bg-primary); width: 100%;">
        
        <!-- Left Column: Stacked Videos -->
        <div class="video-container-classic" style="width: 40%; display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); border-right: 1px solid var(--border); box-sizing: border-box; position: relative; height: 100%;">
          
          <!-- Remote Video Frame -->
          <div class="video-frame" style="flex: 1; background: #000; border: 2px solid var(--border); border-radius: var(--radius-md); overflow: hidden; position: relative;">
            <video id="remoteVideo" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: #fff; z-index: 10;">Stranger</div>
            
            <!-- Video Placeholder / Matching Overlay -->
            <div id="videoPlaceholder" style="position: absolute; inset: 0; background: rgba(11,15,26,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5;">
              <div style="font-size: 36px; margin-bottom: var(--space-2);">📹</div>
              <div style="font-size: 14px; color: var(--text-secondary); font-weight: 500;">Click Start to begin matching</div>
            </div>
            
            <div id="matchingOverlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 6; gap: var(--space-3);">
              <div class="matching-spinner" style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <div style="font-size: 14px; color: var(--text-primary); font-weight: 600;">Looking for a match...</div>
            </div>
          </div>

          <!-- Local Video Frame -->
          <div class="video-frame" style="flex: 1; background: #000; border: 2px solid var(--border); border-radius: var(--radius-md); overflow: hidden; position: relative;">
            <video id="localVideo" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
            <div style="position: absolute; color: #FFF; font-size: 20px; font-weight: 800; pointer-events: none; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">You</div>
          </div>

        </div>

        <!-- Right Column: Text Chat Area -->
        <div class="chat-container-classic" style="width: 52%; display: flex; flex-direction: column; background: #FFF; position: relative; height: 100%;">
          
          <!-- Chat message logs -->
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2.5); font-size: 14.5px; font-family: Arial, sans-serif; line-height: 1.4; border-bottom: 1px solid var(--border); background: #FFF;">
            <div style="color: #555; font-weight: bold; font-size: 13.5px;">System: Click "Start" below to begin talking to a random stranger.</div>
          </div>

          <!-- Connection Status indicator -->
          <div id="connectionStatus" style="padding: 6px var(--space-4); font-size: 13px; font-weight: 600; color: #444; background: #F6F6F6; flex-shrink: 0; min-height: 28px; border-bottom: 1px solid var(--border); display: flex; align-items: center;"></div>

          <!-- Controls Area (Stop / Input / Send) -->
          <div style="display: flex; padding: var(--space-3); border-top: 1px solid var(--border); background: #F6F6F6; gap: var(--space-3); align-items: center; flex-shrink: 0; min-height: 70px; box-sizing: border-box;">
            
            <!-- Big Stop/Next Button -->
            <button class="btn" id="classicStopBtn" style="width: 110px; height: 46px; font-size: 16px; font-weight: 800; background-color: var(--primary); background: var(--gradient-primary); color: #fff; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.1s;">
              Start
            </button>

            <!-- Chat Input field -->
            <textarea id="chatInput" placeholder="Type a message..." style="flex: 1; height: 46px; background: #FFF; border: 1px solid #CCC; border-radius: var(--radius-md); color: #222; padding: var(--space-2) var(--space-3); resize: none; font-size: 14px; font-family: Arial, sans-serif; box-sizing: border-box;" disabled></textarea>

            <!-- Send Button -->
            <button class="btn btn-primary" id="sendMsgBtn" style="width: 80px; height: 46px; font-size: 15px; font-weight: 800; border-radius: var(--radius-md); background-color: var(--primary); background: var(--gradient-primary); border: none; cursor: pointer;" disabled>
              Send
            </button>
          </div>

        </div>
      </div>

      <!-- Bottom Ad Banner -->
      <div class="ad-bottom-banner" style="background: var(--bg-secondary); border-top: 1px solid var(--border); padding: var(--space-1) var(--space-6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 50px; box-sizing: border-box; width: 100%;">
        <ins class="adsbygoogle"
             style="display:block; width:100%; min-height:50px;"
             data-ad-client="ca-pub-3286584236618316"
             data-ad-slot="2000000002"
             data-ad-format="horizontal"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  const matchingOverlay = document.getElementById('matchingOverlay');
  const connectionStatus = document.getElementById('connectionStatus');
  const muteBtn = document.getElementById('muteBtn');
  const videoToggleBtn = document.getElementById('videoToggleBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendMsgBtn = document.getElementById('sendMsgBtn');
  const classicStopBtn = document.getElementById('classicStopBtn');
  const countHeaderEl = document.getElementById('onlineCountStatHeader');

  setVideoElements(localVideo, remoteVideo);

  // Acquire local media
  getLocalStream()
    .then(() => {
      console.log('[chat] local stream acquired');
    })
    .catch((err) => {
      console.error('[chat] getUserMedia error:', err);
      appendSystemMessage('System: Camera/mic access denied. Please allow permissions.');
    });

  // Ensure socket
  let socket = getSocket();
  if (!socket && getState('token')) {
    const savedUsername = localStorage.getItem('vm_username') || 'Stranger';
    socket = initSocket(savedUsername);
  }

  // Update online count in header
  if (countHeaderEl) {
    countHeaderEl.textContent = getState('onlineCount') || 0;
    const countUnsub = subscribe('onlineCount', (count) => {
      countHeaderEl.textContent = count;
    });
    unsubs.push(countUnsub);
  }

  // Handle page load state
  updateUIForState(getState('callState'));

  function updateUIForState(callState) {
    if (callState === 'idle') {
      if (placeholder) placeholder.style.display = '';
      if (matchingOverlay) matchingOverlay.style.display = 'none';
      classicStopBtn.textContent = 'Start';
      classicStopBtn.style.background = 'var(--gradient-primary)';
      chatInput.disabled = true;
      sendMsgBtn.disabled = true;
      stopConfirmState = false;
    } else if (callState === 'queued') {
      if (placeholder) placeholder.style.display = 'none';
      if (matchingOverlay) matchingOverlay.style.display = 'flex';
      classicStopBtn.textContent = 'Stop';
      classicStopBtn.style.background = 'var(--accent-rose)';
      chatInput.disabled = true;
      sendMsgBtn.disabled = true;
      stopConfirmState = false;
    } else if (callState === 'connected') {
      if (placeholder) placeholder.style.display = 'none';
      if (matchingOverlay) matchingOverlay.style.display = 'none';
      classicStopBtn.textContent = 'Stop';
      classicStopBtn.style.background = 'var(--accent-rose)';
      chatInput.disabled = false;
      sendMsgBtn.disabled = false;
      chatInput.focus();
      stopConfirmState = false;
    } else if (callState === 'ended') {
      if (placeholder) placeholder.style.display = '';
      if (matchingOverlay) matchingOverlay.style.display = 'none';
      classicStopBtn.textContent = 'Start';
      classicStopBtn.style.background = 'var(--gradient-primary)';
      chatInput.disabled = true;
      sendMsgBtn.disabled = true;
      stopConfirmState = false;
    }
  }

  function appendSystemMessage(text) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.style.color = 'var(--accent-amber)';
    div.style.fontWeight = '600';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendChatMessage(sender, text) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.style.marginBottom = '4px';

    const strong = document.createElement('strong');
    if (sender === 'me') {
      strong.style.color = 'var(--secondary)';
      strong.textContent = 'You: ';
    } else {
      strong.style.color = 'var(--accent-rose)';
      strong.textContent = 'Stranger: ';
    }

    const span = document.createElement('span');
    span.style.color = 'var(--text-primary)';
    span.textContent = text;

    div.appendChild(strong);
    div.appendChild(span);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Socket routing
  if (socket) {
    socketHandlers.matched = (data) => {
      const { roomId, partnerId, partnerNickname, isInitiator } = data;
      setState('callState', 'connected');
      setState('currentRoom', roomId);
      setState('partnerId', partnerId);
      setState('partnerNickname', partnerNickname);
      setState('isInitiator', isInitiator);
      
      updateUIForState('connected');
      chatMessages.innerHTML = '';
      appendSystemMessage("You're now chatting with a random stranger. Say hi!");

      if (isInitiator) {
        createOffer(socket, roomId).catch((err) =>
          console.error('[chat] createOffer error:', err),
        );
      }
    };

    socketHandlers.offer = (data) => {
      const roomId = getState('currentRoom');
      handleOffer(socket, roomId, data.offer).catch((err) =>
        console.error('[chat] handleOffer error:', err),
      );
    };

    socketHandlers.answer = (data) => {
      handleAnswer(data.answer).catch((err) =>
        console.error('[chat] handleAnswer error:', err),
      );
    };

    socketHandlers['ice-candidate'] = (data) => {
      handleIceCandidate(data.candidate).catch((err) =>
        console.error('[chat] handleIceCandidate error:', err),
      );
    };

    socketHandlers['partner-left'] = () => {
      closePeerConnection();
      setState('callState', 'ended');
      setState('partnerId', null);
      setState('partnerNickname', null);
      updateUIForState('ended');
      appendSystemMessage('Stranger has disconnected.');
    };

    socketHandlers['chat-message'] = (data) => {
      appendChatMessage('partner', data.message);
    };

    socketHandlers['queue-status'] = (data) => {
      if (connectionStatus) {
        connectionStatus.textContent = data.message || `Position in queue: ${data.position || '…'}`;
      }
    };

    // Bind listeners
    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
  }

  // Action Button (Start / Stop / Really?) handler
  if (classicStopBtn) {
    classicStopBtn.addEventListener('click', () => {
      const callState = getState('callState');

      if (callState === 'idle' || callState === 'ended') {
        // Start matching
        if (!socket) {
          socket = initSocket();
        }
        const interests = getState('selectedInterests') || [];
        socket.emit('join-queue', { interests, filters: { gender: null, region: null } });
        setState('callState', 'queued');
        updateUIForState('queued');
      } else {
        // Confirm stop / next
        if (!stopConfirmState) {
          stopConfirmState = true;
          classicStopBtn.textContent = 'Really?';
          classicStopBtn.style.background = 'var(--accent-amber)';
        } else {
          // Disconnect
          const roomId = getState('currentRoom');
          if (socket && roomId) {
            socket.emit('stop', { roomId });
          }
          closePeerConnection();
          setState('callState', 'idle');
          setState('currentRoom', null);
          setState('partnerId', null);
          setState('partnerNickname', null);
          updateUIForState('idle');
          chatMessages.innerHTML = '<div style="color: var(--text-tertiary); font-style: italic;">System: Click "Start" below to begin talking to a random stranger.</div>';
          if (connectionStatus) connectionStatus.textContent = '';
        }
      }
    });
  }

  // Mute audio
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = toggleAudio();
      muteBtn.classList.toggle('active', isMuted);
      muteBtn.textContent = isMuted ? '🔇 Muted' : '🎤 Mute';
    });
  }

  // Toggle video
  if (videoToggleBtn) {
    videoToggleBtn.addEventListener('click', () => {
      const isOff = toggleVideo();
      videoToggleBtn.classList.toggle('active', isOff);
      videoToggleBtn.textContent = isOff ? '📷 Cam Off' : '📹 Camera';
    });
  }

  // Send message helpers
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    const roomId = getState('currentRoom');
    if (socket && roomId) {
      socket.emit('chat-message', { roomId, message: text });
      appendChatMessage('me', text);
      chatInput.value = '';
    }
  }

  if (sendMsgBtn) {
    sendMsgBtn.addEventListener('click', sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Trigger AdSense ad loading (two ads on this page)
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn('[AdSense] Load error:', e);
  }
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  const socket = getSocket();
  if (socket) {
    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.off(event, handler);
    });
  }
  socketHandlers = {};

  closePeerConnection();
  stopLocalStream();

  unsubs.forEach((fn) => fn());
  unsubs = [];
  stopConfirmState = false;
}
