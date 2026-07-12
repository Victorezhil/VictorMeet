// ============================================================
// VictorMeet — Privacy Policy Page
// ============================================================

export function render() {
  return `
    <div style="background: var(--bg-primary); min-height: 100vh; font-family: sans-serif; color: var(--text-primary);">
      <!-- Navbar -->
      <nav class="navbar" style="position: static; height: auto; padding: var(--space-4) var(--space-6); background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <a href="#/landing" class="nav-logo" style="font-size: 32px; font-weight: 900; text-decoration: none;">
          <span style="color: var(--primary);">Victor</span><span style="color: var(--secondary);">Meet</span>
        </a>
        <div style="font-size: var(--text-sm); color: var(--text-secondary); font-weight: 500;">
          <a href="#/landing" style="color: var(--primary); text-decoration: none; font-weight: bold;">Home</a>
        </div>
      </nav>

      <!-- Privacy Body -->
      <div style="max-width: 800px; margin: var(--space-10) auto; padding: 0 var(--space-6); line-height: 1.6;">
        <h1 style="font-size: 32px; font-weight: 800; border-bottom: 2px solid var(--border); padding-bottom: var(--space-2); margin-bottom: var(--space-6);">Privacy Policy</h1>
        
        <p style="font-size: 14.5px; color: var(--text-secondary);">Last updated: July 12, 2026</p>
        
        <p style="font-size: 15px;">Your privacy is extremely important to us. This Privacy Policy describes how VictorMeet collects, uses, and safeguards the limited information generated during your use of our chat service.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">1. Information We Do NOT Collect</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">We are committed to absolute anonymity. We do not require registration, email addresses, phone numbers, or passwords. We do not record, save, or store your video or audio chat logs. All video/audio streams are direct peer-to-peer (P2P) connections and are not routed through our servers.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">2. Limited Data We Process</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">To operate the website, we process the following temporary session metadata:</p>
        <ul style="color: var(--text-secondary); font-size: 15px; padding-left: var(--space-6);">
          <li>Your temporary socket ID (deleted immediately upon disconnect).</li>
          <li>The nickname/username and age you enter on the home page (deleted on session end).</li>
          <li>Temporary WebRTC signaling payloads to bridge connections.</li>
        </ul>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">3. Third-Party Advertisements</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">We use Google AdSense and other third-party networks to display ads. These networks may place and read cookies on your browser, or use web beacons to collect information as a result of ad serving on this site. You can manage your ad personalization options via Google's settings page.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">4. Data Security</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">We implement standard industry safety practices to secure connection handshakes. However, since the service pairs you with random strangers, please protect your identity and never share private credentials during chats.</p>
      </div>
    </div>
  `;
}

export function mount() {}
export function unmount() {}
