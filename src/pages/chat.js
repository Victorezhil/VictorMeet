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
  changeVideoSource,
} from '../webrtc.js';
import { openDonateModal } from './donate.js';
import { TRANSLATIONS } from './languages.js';

let socketHandlers = {};
let unsubs = [];
let stopConfirmState = false; // Tracks if "Stop" button is in "Really?" confirmation state

// ── Render ────────────────────────────────────────────────────

export function render() {
  const langCode = localStorage.getItem('vm_lang') || 'en';
  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

  return `
    <div class="chat-container classic-layout" style="width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-primary);">
      
      <!-- Classic Header -->
      <div class="chat-header-classic" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-6); background: var(--bg-secondary); border-bottom: 1px solid var(--border); flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <a href="#/landing" class="nav-logo" style="font-size: 28px; font-weight: 900; text-decoration: none; font-family: sans-serif;">
            <span style="color: var(--primary);">Victor</span><span style="color: var(--secondary);">Meet</span>
          </a>
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">${t.tagline}</span>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <div style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">
            <span id="onlineCountStatHeader">0</span> ${t.usersOnline}
          </div>
          <button id="donateBtn" class="btn" style="background: #28a745; color: #FFF; font-size: 12px; font-weight: 800; padding: 4px var(--space-3.5); border-radius: var(--radius-full); cursor: pointer; border: none; box-shadow: 0 2px 4px rgba(40,167,69,0.2);">₹ ${t.donateLabel}</button>
        </div>
      </div>

      <!-- Top Ad Banner (Multiplex unit) -->
      <div class="ad-top-banner" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: var(--space-1) var(--space-6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 50px; box-sizing: border-box; width: 100%;">
        <ins class="adsbygoogle"
             style="display:block; width:100%; min-height:50px;"
             data-ad-format="autorelaxed"
             data-ad-client="ca-pub-9747982919206794"
             data-ad-slot="2740597990"></ins>
      </div>

      <!-- Classic Work Area -->
      <div class="chat-main-classic" style="display: flex; flex: 1; min-height: 0; overflow: hidden; background: var(--bg-primary); width: 100%;">
        
        <!-- Left Column: Classic Stacked Videos (Stranger & You) -->
        <div class="video-container-classic" style="display: flex; flex-direction: column; width: 45%; background: #000; box-sizing: border-box; border-right: 1px solid var(--border);">
          
          <!-- Stranger Video Box -->
          <div class="video-box-wrapper stranger" style="flex: 1; position: relative; border-bottom: 2px solid var(--bg-primary); overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center;">
            <video id="remoteVideo" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;"></video>
            
            <!-- Label -->
            <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #FFF; z-index: 10;">Stranger</div>
            
            <!-- Video Placeholder -->
            <div id="videoPlaceholder" style="position: absolute; inset: 0; background: #111; display: flex; align-items: center; justify-content: center; z-index: 5;">
              <div style="color: #666; font-size: 14px; font-weight: bold; text-transform: uppercase;">Stranger</div>
            </div>
            
            <!-- Matching Overlay -->
            <div id="matchingOverlay" style="position: absolute; inset: 0; background: #111; display: none; flex-direction: row; align-items: center; justify-content: center; z-index: 6; gap: 12px;">
              <div class="matching-spinner" style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #FFF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <div style="font-size: 13px; color: #FFF; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${t.matchingOverlayText}</div>
            </div>
          </div>

          <!-- Local Video Box -->
          <div class="video-box-wrapper you" style="flex: 1; position: relative; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center;">
            <video id="localVideo" autoplay playsinline muted style="transform: scaleX(-1); width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;"></video>
            <!-- Label -->
            <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #FFF; z-index: 10;">You</div>
          </div>

          <!-- Media Controls & Camera Selector -->
          <div style="padding: 10px; background: var(--bg-secondary); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button id="muteBtn" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 700; background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;">🎤 Mute</button>
              <button id="videoToggleBtn" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 700; background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;">📹 Camera</button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 11px; font-weight: bold; color: var(--text-secondary); text-transform: uppercase; white-space: nowrap;">Camera:</label>
              <select id="cameraSelect" style="flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px; font-size: 12px; font-weight: bold; color: var(--text-primary); cursor: pointer; outline: none; appearance: auto;">
                <option value="">${t.detectingCameras}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Right Column: Text Chat Area -->
        <div class="chat-container-classic" style="width: 52%; display: flex; flex-direction: column; background: var(--bg-secondary); position: relative; height: 100%; border-left: 1px solid var(--border);">
          
          <!-- Chat message logs -->
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2.5); font-size: 14.5px; font-family: Arial, sans-serif; line-height: 1.4; border-bottom: 1px solid var(--border); background: var(--bg-primary);">
            <div style="color: var(--text-secondary); font-weight: bold; font-size: 13.5px;">${t.systemWelcome}</div>
          </div>

          <!-- Connection Status indicator -->
          <div id="connectionStatus" style="padding: 6px var(--space-4); font-size: 13px; font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); flex-shrink: 0; min-height: 28px; border-bottom: 1px solid var(--border); display: flex; align-items: center;"></div>

          <!-- Controls Area (Stop / Input / Send) -->
          <div style="display: flex; padding: var(--space-3); border-top: 1px solid var(--border); background: var(--bg-secondary); gap: var(--space-3); align-items: center; flex-shrink: 0; min-height: 70px; box-sizing: border-box;">
            
            <!-- Big Stop/Next Button -->
            <button class="btn" id="classicStopBtn" style="width: 110px; height: 46px; font-size: 16px; font-weight: 800; background-color: var(--primary); background: var(--gradient-primary); color: #fff; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.1s;">
              ${t.startBtn}
            </button>

            <!-- Chat Input field -->
            <textarea id="chatInput" placeholder="${t.placeholderMsg}" style="flex: 1; height: 46px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); padding: var(--space-2) var(--space-3); resize: none; font-size: 14px; font-family: Arial, sans-serif; box-sizing: border-box;" disabled></textarea>

            <!-- Send Button -->
            <button class="btn btn-primary" id="sendMsgBtn" style="width: 80px; height: 46px; font-size: 15px; font-weight: 800; border-radius: var(--radius-md); background-color: var(--primary); background: var(--gradient-primary); border: none; cursor: pointer;" disabled>
              ${t.sendBtn}
            </button>
          </div>

        </div>
      </div>

      <!-- Bottom Ad Banner (Multiplex unit) -->
      <div class="ad-bottom-banner" style="background: var(--bg-secondary); border-top: 1px solid var(--border); padding: var(--space-1) var(--space-6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 50px; box-sizing: border-box; width: 100%;">
        <ins class="adsbygoogle"
             style="display:block; width:100%; min-height:50px;"
             data-ad-format="autorelaxed"
             data-ad-client="ca-pub-9747982919206794"
             data-ad-slot="2740597990"></ins>
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
  const cameraSelect = document.getElementById('cameraSelect');

  setVideoElements(localVideo, remoteVideo);

  // Request camera access immediately on page load so user sees preview
  // and we get the real device names instead of 'Camera 1'
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = {
      audio: true,
      video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
    };
    getLocalStream(constraints)
      .then((stream) => {
        // Stream is now playing in localVideo thanks to setVideoElements
        // Now enumerate devices to get real labels
        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            const videoDevices = devices.filter((d) => d.kind === 'videoinput');
            if (cameraSelect) {
              cameraSelect.innerHTML = videoDevices
                .map((d, i) => `<option value="${d.deviceId}">${d.label || `Camera ${i + 1}`}</option>`)
                .join('');
              if (videoDevices.length === 0) {
                cameraSelect.innerHTML = '<option value="">No cameras detected</option>';
              }
            }
          });
        }
      })
      .catch((err) => {
        console.warn('[chat] Initial camera permission denied or failed:', err);
        // It's okay, we'll ask again when they click Start
      });
  }

  // Handle camera switch selection
  if (cameraSelect) {
    cameraSelect.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      if (deviceId) {
        try {
          await changeVideoSource(deviceId);
          console.log('[chat] Camera swapped successfully to device:', deviceId);
        } catch (err) {
          console.error('[chat] changeVideoSource error:', err);
          appendSystemMessage('System: Failed to switch camera source.');
        }
      }
    });
  }



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
    const langCode = localStorage.getItem('vm_lang') || 'en';
    const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

    if (callState === 'idle') {
      if (placeholder) placeholder.style.display = '';
      if (matchingOverlay) matchingOverlay.style.display = 'none';
      classicStopBtn.textContent = t.startBtn;
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
      classicStopBtn.textContent = t.startBtn;
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
      
      const langCode = localStorage.getItem('vm_lang') || 'en';
      const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;
      
      updateUIForState('connected');
      chatMessages.innerHTML = '';
      appendSystemMessage(t.systemMatched);

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
      const langCode = localStorage.getItem('vm_lang') || 'en';
      const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

      closePeerConnection();
      setState('callState', 'ended');
      setState('partnerId', null);
      setState('partnerNickname', null);
      updateUIForState('ended');
      appendSystemMessage(t.systemLeft);
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
        // Start matching - require camera access first
        const originalText = classicStopBtn.textContent;
        classicStopBtn.textContent = 'Accessing...';
        classicStopBtn.disabled = true;

        getLocalStream()
          .then(() => {
            console.log('[chat] camera stream acquired on Start click');
            classicStopBtn.disabled = false;

            // Re-trigger enumerate devices after user grants permission to get actual labels (OBS, etc.)
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
              navigator.mediaDevices.enumerateDevices().then((devices) => {
                const videoDevices = devices.filter((d) => d.kind === 'videoinput');
                if (cameraSelect && videoDevices.length > 0) {
                  cameraSelect.innerHTML = videoDevices
                    .map((d, i) => `<option value="${d.deviceId}">${d.label || `Camera ${i + 1}`}</option>`)
                    .join('');
                }
              });
            }

            if (!socket) {
              socket = initSocket();
            }
            const interests = getState('selectedInterests') || [];
            socket.emit('join-queue', { interests, filters: { gender: null, region: null } });
            setState('callState', 'queued');
            updateUIForState('queued');
          })
          .catch((err) => {
            console.error('[chat] getUserMedia error:', err);
            classicStopBtn.disabled = false;
            classicStopBtn.textContent = originalText;
            alert('Camera and microphone access are required to start video chatting. Please allow permissions and try again.');
          });
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
          stopLocalStream();
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

  // Donate Button Handler
  const donateBtn = document.getElementById('donateBtn');
  if (donateBtn) {
    donateBtn.addEventListener('click', openDonateModal);
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

  // Handle auto-start from landing page
  if (getState('autoStartQueue')) {
    setState('autoStartQueue', false);
    setTimeout(() => {
      if (classicStopBtn) {
        classicStopBtn.click();
      }
    }, 100);
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
