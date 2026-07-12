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
          <a href="#/landing" class="nav-logo" style="font-size: 28px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none;">VictorMeet</a>
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Talk to Strangers!</span>
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">
          <span id="onlineCountStatHeader">0</span> users online
        </div>
      </div>

      <!-- Top Ad Banner -->
      <div class="ad-top-banner" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: var(--space-2) var(--space-6); display: flex; align-items: center; justify-content: center; gap: var(--space-4); flex-shrink: 0; min-height: 40px; box-sizing: border-box; width: 100%;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider); font-weight: 600;">Advertisement</span>
        <span style="font-size: 12px; color: var(--text-secondary); text-align: center;">💬 <strong>VictorMeet Premium:</strong> Connect with users by gender &amp; region! Get 50% off today.</span>
        <a href="#/pricing" class="btn btn-primary" style="font-size: 10px; padding: 4px var(--space-3); text-decoration: none; border-radius: var(--radius-sm); font-weight: 700;">Upgrade Now</a>
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
            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: #fff; z-index: 10;">You</div>
          </div>
          
          <!-- Video controls overlay (Mute audio/video toggles) -->
          <div style="display: flex; gap: var(--space-3); margin-top: var(--space-1); flex-shrink: 0;">
            <button class="btn btn-secondary" id="muteBtn" style="flex: 1; font-size: 12px; padding: var(--space-2) 0; display: flex; align-items: center; justify-content: center; gap: 4px;">🎤 Mute</button>
            <button class="btn btn-secondary" id="videoToggleBtn" style="flex: 1; font-size: 12px; padding: var(--space-2) 0; display: flex; align-items: center; justify-content: center; gap: 4px;">📹 Camera</button>
          </div>
        </div>

        <!-- Right Column: Text Chat Area -->
        <div class="chat-container-classic" style="width: 60%; display: flex; flex-direction: column; background: var(--bg-secondary); position: relative; height: 100%;">
          
          <!-- Chat message logs -->
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); font-size: 14px; font-family: sans-serif; line-height: 1.5; border-bottom: 1px solid var(--border);">
            <div style="color: var(--text-tertiary); font-style: italic;">System: Click "Start" below to begin talking to a random stranger.</div>
          </div>

          <!-- Connection Status indicator -->
          <div id="connectionStatus" style="padding: var(--space-2) var(--space-6); font-size: 12px; color: var(--text-secondary); background: rgba(0,0,0,0.15); flex-shrink: 0; min-height: 32px;"></div>

          <!-- Controls Area (Stop / Input / Send) -->
          <div style="display: flex; padding: var(--space-4); border-top: 1px solid var(--border); background: var(--bg-primary); gap: var(--space-3); align-items: stretch; flex-shrink: 0;">
            
            <!-- Big Stop/Next Button -->
            <button class="btn" id="classicStopBtn" style="width: 120px; font-size: 16px; font-weight: 700; background-color: var(--primary); background: var(--gradient-primary); color: #fff; border-radius: var(--radius-md); transition: all 0.2s;">
              Start
            </button>

            <!-- Chat Input field -->
            <textarea id="chatInput" placeholder="Type a message..." style="flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); padding: var(--space-2.5) var(--space-3); resize: none; font-size: 14px; height: 50px; font-family: sans-serif;" disabled></textarea>

            <!-- Send Button -->
            <button class="btn btn-primary" id="sendMsgBtn" style="width: 90px; font-size: 15px; font-weight: 700; border-radius: var(--radius-md); background-color: var(--primary); background: var(--gradient-primary);" disabled>
              Send
            </button>
          </div>

        </div>
      </div>

      <!-- Bottom Ad Banner -->
      <div class="ad-bottom-banner" style="background: var(--bg-secondary); border-top: 1px solid var(--border); padding: var(--space-2) var(--space-6); display: flex; align-items: center; justify-content: center; gap: var(--space-4); flex-shrink: 0; min-height: 40px; box-sizing: border-box; width: 100%;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider); font-weight: 600;">Sponsored</span>
        <span style="font-size: 12px; color: var(--text-secondary); text-align: center;">🎮 <strong>Apex Host:</strong> High-performance game servers starting at $4.99/mo. Get 10% off with code MEET.</span>
        <a href="https://github.com" target="_blank" class="btn btn-secondary" style="font-size: 10px; padding: 4px var(--space-3); text-decoration: none; border-radius: var(--radius-sm); font-weight: 700; color: var(--text-primary); border: 1px solid var(--border);">Learn More</a>
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
    socket = initSocket();
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
