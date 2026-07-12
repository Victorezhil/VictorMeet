// ============================================================
// VictorMeet — Donation Modal Controller
// ============================================================

export function openDonateModal() {
  // If modal already exists, remove it
  let existing = document.getElementById('donateModalOverlay');
  if (existing) existing.remove();

  // Create the modal overlay element
  const overlay = document.createElement('div');
  overlay.id = 'donateModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.zIndex = '9999';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.backdropFilter = 'blur(4px)';

  overlay.innerHTML = `
    <div class="card" style="width: 380px; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); background: #FFF; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); border: 1px solid var(--border); color: #333; position: relative; font-family: sans-serif; box-sizing: border-box; text-align: left;">
      
      <!-- Close button -->
      <button id="closeDonateModal" style="position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; font-size: 18px; font-weight: bold; cursor: pointer; color: #777;">✕</button>
      
      <!-- Header -->
      <div style="text-align: center;">
        <h3 style="font-size: 20px; font-weight: 800; color: var(--primary); margin: 0 0 6px 0;">Support VictorMeet</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Help keep our video servers running! Donate any amount from ₹50 to unlimited.</p>
      </div>

      <!-- Quick Amount selection -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); margin-top: var(--space-2);">
        <button class="amount-btn btn btn-outline" data-amount="50" style="padding: var(--space-2) 0; font-size: 13px; font-weight: bold; border-color: var(--border); color: #333; border: 1px solid var(--border); text-align: center; border-radius: var(--radius-md); background: #FFF;">₹50</button>
        <button class="amount-btn btn btn-outline" data-amount="100" style="padding: var(--space-2) 0; font-size: 13px; font-weight: bold; border-color: var(--border); color: #333; border: 1px solid var(--border); text-align: center; border-radius: var(--radius-md); background: #FFF;">₹100</button>
        <button class="amount-btn btn btn-outline" data-amount="500" style="padding: var(--space-2) 0; font-size: 13px; font-weight: bold; border-color: var(--border); color: #333; border: 1px solid var(--border); text-align: center; border-radius: var(--radius-md); background: #FFF;">₹500</button>
        <button class="amount-btn btn btn-outline" data-amount="1000" style="padding: var(--space-2) 0; font-size: 13px; font-weight: bold; border-color: var(--border); color: #333; border: 1px solid var(--border); text-align: center; border-radius: var(--radius-md); background: #FFF;">₹1000</button>
      </div>

      <!-- Custom Amount Input -->
      <div>
        <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #555; display: block; margin-bottom: var(--space-1.5);">Custom Amount (INR):</label>
        <input type="number" id="customAmountInput" class="input" value="50" min="50" style="width: 100%; box-sizing: border-box; font-size: 14px; font-weight: bold; padding: 8px var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary);" />
      </div>

      <!-- UPI App Button (Mobile Deep Link) -->
      <a id="upiPayLink" href="upi://pay?pa=arasu9629hf@okhdfcbank&pn=VictorMeet&cu=INR&am=50&tn=Support%20VictorMeet" style="display: block; text-decoration: none; text-align: center; background: #28a745; color: #FFF; font-size: 15px; font-weight: 800; padding: var(--space-3) 0; border-radius: var(--radius-lg); box-shadow: 0 4px 6px rgba(40,167,69,0.25); transition: background 0.15s;">
        📱 Pay via UPI App (Mobile)
      </a>

      <!-- Desktop QR Code Area -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2); border-top: 1px solid var(--border); padding-top: var(--space-4); margin-top: var(--space-2);">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #555;">Or Scan QR Code to Pay (Desktop)</span>
        <div id="upiQRCodeContainer" style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #FFF; border: 1px solid var(--border); padding: 4px; border-radius: var(--radius-md);">
          <img id="upiQRCodeImg" src="" style="width: 100%; height: 100%; object-fit: contain;" alt="UPI QR Code" />
        </div>
        <span style="font-size: 11.5px; color: var(--text-secondary); font-family: monospace; word-break: break-all; background: #F6F6F6; padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border);">arasu9629hf@okhdfcbank</span>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // DOM elements references
  const closeBtn = document.getElementById('closeDonateModal');
  const customInput = document.getElementById('customAmountInput');
  const upiLink = document.getElementById('upiPayLink');
  const qrImg = document.getElementById('upiQRCodeImg');
  const amountBtns = overlay.querySelectorAll('.amount-btn');

  function updatePaymentValues(amount) {
    const validAmount = Math.max(50, parseInt(amount) || 50);
    // 1. Update UPI Deep Link
    const linkStr = `upi://pay?pa=arasu9629hf@okhdfcbank&pn=VictorMeet&cu=INR&am=${validAmount}&tn=Support%20VictorMeet`;
    upiLink.href = linkStr;

    // 2. Generate Dynamic UPI QR Code using QR Server API
    const upiPayPayload = `upi://pay?pa=arasu9629hf@okhdfcbank&pn=VictorMeet&cu=INR&am=${validAmount}&tn=Support%20VictorMeet`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiPayPayload)}`;
    qrImg.src = qrApiUrl;
  }

  // Initial update
  updatePaymentValues(50);

  // Listeners
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  customInput.addEventListener('input', (e) => {
    updatePaymentValues(e.target.value);
    amountBtns.forEach(btn => btn.style.borderColor = 'var(--border)');
  });

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const amt = btn.dataset.amount;
      customInput.value = amt;
      updatePaymentValues(amt);
      amountBtns.forEach(b => b.style.borderColor = 'var(--border)');
      btn.style.borderColor = 'var(--primary)';
    });
  });
}
