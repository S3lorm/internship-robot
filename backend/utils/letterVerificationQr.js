const QRCode = require('qrcode');
const config = require('../config/config');

/** Hosted portal URL for QR codes and verify links on letters (never localhost). */
function getFrontendBaseUrl() {
  return String(config.publicAppUrl || 'https://internship-robot-omega.vercel.app').replace(
    /\/$/,
    ''
  );
}

function getLetterVerifyUrl(verificationCode) {
  const code = String(verificationCode || '').trim();
  return `${getFrontendBaseUrl()}/verify/${encodeURIComponent(code)}`;
}

async function generateQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 160,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

async function generateQrPngBuffer(url) {
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 160,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

async function buildLetterVerificationAssets(verificationCode) {
  const code = String(verificationCode || '').trim();
  if (!code) return null;

  const verifyUrl = getLetterVerifyUrl(code);
  const [qrDataUrl, qrPngBuffer] = await Promise.all([
    generateQrDataUrl(verifyUrl),
    generateQrPngBuffer(verifyUrl),
  ]);

  return {
    verificationCode: code,
    verifyUrl,
    qrDataUrl,
    qrPngBuffer,
  };
}

function renderVerificationHtmlBlock(assets) {
  if (!assets) return '';

  return `
  <div class="verification-block" style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #ccc; font-size: 11px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: top; width: 100px;">
          <img src="${assets.qrDataUrl}" alt="Scan to verify letter" width="96" height="96" style="display: block;" />
          <p style="margin: 6px 0 0; font-size: 9px; color: #444; text-align: center;">Scan to verify</p>
        </td>
        <td style="vertical-align: top; padding-left: 16px;">
          <p style="margin: 0 0 6px;"><strong>Verification Code:</strong> ${assets.verificationCode}</p>
          <p style="margin: 0 0 6px;"><strong>Verify online:</strong><br />
            <a href="${assets.verifyUrl}" style="color: #1e40af; word-break: break-all;">${assets.verifyUrl}</a>
          </p>
          <p style="margin: 0; font-style: italic; color: #444;">Scan the QR code or open the link to confirm this letter in the RMU Internship Portal.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

module.exports = {
  getFrontendBaseUrl,
  getLetterVerifyUrl,
  buildLetterVerificationAssets,
  renderVerificationHtmlBlock,
};
