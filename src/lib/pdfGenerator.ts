// PDF Acknowledgement Generator using browser print API
// Generates a proper acknowledgement slip for any complaint type

export interface ComplaintAck {
  refNumber: string;
  type: string;
  complainantName: string;
  complainantPhone: string;
  stationName: string;
  stationPhone: string;
  date: string;
  details: string;
  status: string;
}

export function generateAcknowledgementPDF(ack: ComplaintAck): void {
  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) { alert('Please allow popups to download PDF'); return; }
  
  const qrData = `https://surakshakarnataka.gov.in/track?ref=${ack.refNumber}`;
  
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Acknowledgement — ${ack.refNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Arial', sans-serif; background: #fff; color: #111; padding: 32px; }
  .header { display:flex; align-items:center; gap:16px; border-bottom:3px solid #081428; padding-bottom:16px; margin-bottom:20px; }
  .emblem { width:60px; height:60px; background:#081428; display:flex; align-items:center; justify-content:center; color:#F0C75E; font-size:28px; font-weight:bold; }
  .header-text h1 { font-size:16px; font-weight:bold; color:#081428; text-transform:uppercase; letter-spacing:1px; }
  .header-text h2 { font-size:13px; color:#A8362A; margin-top:2px; }
  .header-text p { font-size:11px; color:#666; margin-top:2px; }
  .kannada { font-size:14px; color:#081428; margin-bottom:4px; }
  .ack-box { background:#F5F5F0; border:2px solid #081428; padding:16px; margin:20px 0; text-align:center; }
  .ack-box .label { font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#666; }
  .ack-box .ref { font-size:18px; font-weight:bold; color:#A8362A; font-family:monospace; letter-spacing:2px; margin:6px 0; }
  .ack-box .type { font-size:12px; background:#081428; color:#F0C75E; padding:3px 12px; display:inline-block; text-transform:uppercase; letter-spacing:1px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0; }
  .field { background:#f9f9f9; border:1px solid #e5e7eb; padding:10px 12px; }
  .field .label { font-size:9px; text-transform:uppercase; letter-spacing:1px; color:#888; margin-bottom:4px; }
  .field .value { font-size:12px; font-weight:600; color:#111; }
  .notice { background:#FEF3C7; border-left:4px solid #F59E0B; padding:12px 16px; margin:16px 0; font-size:11px; color:#92400E; }
  .footer { border-top:1px solid #e5e7eb; padding-top:16px; margin-top:20px; display:flex; justify-content:space-between; align-items:flex-end; }
  .footer-text { font-size:10px; color:#666; line-height:1.6; }
  .qr-placeholder { width:80px; height:80px; border:2px solid #081428; display:flex; align-items:center; justify-content:center; font-size:8px; text-align:center; color:#081428; padding:4px; }
  .helplines { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:16px 0; }
  .helpline { text-align:center; padding:8px; border:1px solid #e5e7eb; }
  .helpline .num { font-size:16px; font-weight:bold; color:#A8362A; }
  .helpline .lbl { font-size:9px; color:#666; text-transform:uppercase; }
  .status-badge { display:inline-block; padding:4px 12px; background:#FEF3C7; color:#92400E; border:1px solid #FCD34D; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; }
  @media print { body { padding:16px; } .no-print { display:none; } }
</style>
</head>
<body>
<div class="header">
  <div class="emblem">🛡</div>
  <div class="header-text">
    <p class="kannada">ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್</p>
    <h1>Karnataka State Police</h1>
    <p style="font-size:10px;color:#888;margin-bottom:2px;">Government of Karnataka — ಕರ್ನಾಟಕ ಸರ್ಕಾರ</p><h2>SurakshaKarnataka — ಕರ್ನಾಟಕ ಅಪರಾಧ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ</h2>
    <p>Complaint Acknowledgement / ದೂರು ಸ್ವೀಕೃತಿ ಪ್ರಮಾಣಪತ್ರ</p>
  </div>
</div>

<div class="ack-box">
  <p class="label">Reference Number / ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ</p>
  <p class="ref">${ack.refNumber}</p>
  <p class="type">${ack.type}</p>
  <p style="margin-top:8px;font-size:11px;color:#666;">Filed on: ${ack.date} &nbsp;|&nbsp; <span class="status-badge">${ack.status}</span></p>
</div>

<div class="grid">
  <div class="field"><div class="label">Complainant / ದೂರುದಾರ</div><div class="value">${ack.complainantName}</div></div>
  <div class="field"><div class="label">Contact / ಸಂಪರ್ಕ</div><div class="value">${ack.complainantPhone}</div></div>
  <div class="field"><div class="label">Police Station / ಠಾಣೆ</div><div class="value">${ack.stationName}</div></div>
  <div class="field"><div class="label">Station Phone / ಠಾಣೆ ಫೋನ್</div><div class="value">${ack.stationPhone || 'See station details'}</div></div>
</div>

<div class="field" style="margin:0 0 16px 0;">
  <div class="label">Details / ವಿವರ</div>
  <div class="value" style="font-weight:normal;font-size:11px;line-height:1.6;margin-top:4px;">${ack.details}</div>
</div>

<div class="notice">
  <strong>Important / ಮುಖ್ಯ ಸೂಚನೆ:</strong> Keep this reference number safe. Use it to track your complaint status at 
  <strong>surakshakarnataka.gov.in/track</strong> or scan the QR code below. 
  This is a computer-generated acknowledgement and does not require a signature.
  <br><br>
  <strong>ಈ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸಿ.</strong>
</div>

<div class="helplines">
  ${[['112','Emergency'],['1930','Cyber Crime'],['1091','Women Safety'],['1098','Child Helpline'],['100','Police Control'],['14410','Anti-Drug']].map(([n,l]) => `<div class="helpline"><a href="tel:${n}" style="text-decoration:none"><div class="num">${n}</div><div class="lbl">${l}</div></a></div>`).join('')}
</div>

<div class="footer">
  <div class="footer-text">
    <p><strong>Karnataka State Police</strong> · CCTNS Portal</p>
    <p>This document is valid for official use as complaint acknowledgement.</p>
    <p>For queries: Visit your nearest police station or call 100</p>
    <p style="margin-top:6px;color:#A8362A;font-weight:bold;">Track at: surakshakarnataka.gov.in/track?ref=${ack.refNumber}</p>
  </div>
  <div style="width:80px;height:80px;" id="qr-container"></div>
  <p style="font-size:7px;color:#888;text-align:center;margin-top:2px;">Scan to track</p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
window.onload = function() {
  try {
    new QRCode(document.getElementById("qr-container"), {
      text: window.location.protocol + "//" + window.location.hostname + ":3000/track?ref=" + ack.refNumber,
      width: 80, height: 80,
      colorDark: "#081428", colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {
    document.getElementById("qr-container").innerHTML = '<div style="width:80px;height:80px;border:2px solid #081428;display:flex;align-items:center;justify-content:center;font-size:8px;text-align:center;padding:4px">QR: ' + "${ack.refNumber.split('/').slice(-1)[0]}" + '</div>';
  }
};
</script>
<div class="no-print" style="margin-top:24px;text-align:center;">
  <button onclick="window.print()" style="padding:10px 32px;background:#081428;color:#F0C75E;border:none;font-size:13px;font-weight:bold;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">
    🖨 Print / Download PDF
  </button>
  <button onclick="window.close()" style="margin-left:12px;padding:10px 24px;background:#fff;border:1px solid #e5e7eb;font-size:13px;cursor:pointer;">
    Close
  </button>
</div>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 800);
}
