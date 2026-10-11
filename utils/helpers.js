const HEX = /^#[0-9a-fA-F]{6}$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeTags(input) {
  let list = input;
  if (typeof list === 'string') list = list.split(',');
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = String(raw).trim().replace(/^#/, '').slice(0, 30);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeColor(color, fallback) {
  return typeof color === 'string' && HEX.test(color) ? color : fallback;
}

module.exports = { HttpError, normalizeTags, normalizeColor };
