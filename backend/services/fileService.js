const fs = require('fs');

function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_e) {
    // ignore
  }
}

module.exports = { safeUnlink };

