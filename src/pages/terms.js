// ============================================================
// VictorMeet — Terms and Conditions Page
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

      <!-- Terms Body -->
      <div style="max-width: 800px; margin: var(--space-10) auto; padding: 0 var(--space-6); line-height: 1.6;">
        <h1 style="font-size: 32px; font-weight: 800; border-bottom: 2px solid var(--border); padding-bottom: var(--space-2); margin-bottom: var(--space-6);">Terms and Conditions</h1>
        
        <p style="font-size: 14.5px; color: var(--text-secondary);">Last updated: July 12, 2026</p>
        
        <p style="font-size: 15px;">Welcome to VictorMeet. By using this website, you agree to comply with and be bound by the following terms and conditions of use. Please read these terms carefully before accessing the video matching service.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">1. Age Requirement</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">You must be at least 18 years of age to use this website. If you are between 13 and 18 years old, you may only use this website under the direct supervision of a parent or legal guardian who agrees to be bound by these Terms. Anyone under 13 is strictly prohibited from using the service.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">2. User Conduct & Clean Behavior</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">By starting a text or video session, you agree to maintain clean and respectful behavior. You are strictly prohibited from transmitting or showing:</p>
        <ul style="color: var(--text-secondary); font-size: 15px; padding-left: var(--space-6);">
          <li>Nudity, pornography, or sexually explicit content.</li>
          <li>Harassment, bullying, hate speech, or threats against other users.</li>
          <li>Spam, advertisements, phishing links, or malware.</li>
          <li>Intellectual property infringements or unauthorized recordings.</li>
        </ul>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">3. Disclaimers & Limitation of Liability</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">VictorMeet is provided "as is" without warranties of any kind. Conversations are unmoderated, spontaneous interactions between anonymous strangers. We do not control or endorse user actions or content. You use this site at your own risk. The site owners shall not be held liable for any damages resulting from your interactions.</p>

        <h3 style="font-size: 20px; font-weight: 700; margin-top: var(--space-6);">4. Modifications to Service</h3>
        <p style="font-size: 15px; color: var(--text-secondary);">We reserve the right to modify, suspend, or terminate the website, its services, or your access at any time without notice for violating user conduct standards.</p>
      </div>
    </div>
  `;
}

export function mount() {}
export function unmount() {}
