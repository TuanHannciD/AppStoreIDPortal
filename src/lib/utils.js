export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return String(date);
  }
}

export function formatDaysLeft(expiryDate) {
  const now = new Date();
  const ms = expiryDate.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function parseSlugFromInput(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Try URL parsing first.
  try {
    const maybeUrl = raw.startsWith('http://') || raw.startsWith('https://') ? raw : null;
    if (maybeUrl) {
      const url = new URL(maybeUrl);
      const path = (url.pathname || '').replace(/\/+$/, '');
      const seg = path.split('/').filter(Boolean).pop();
      return sanitizeSlug(seg);
    }
  } catch {
    // fall through
  }

  // Accept '/slug', 'slug', 'domain.com/slug?x=y'
  const cleaned = raw.replace(/^[#?]+/, '');
  const withoutHash = cleaned.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  const lastSeg = withoutQuery.replace(/\/+$/, '').split('/').filter(Boolean).pop();
  return sanitizeSlug(lastSeg);
}

function sanitizeSlug(seg) {
  if (!seg) return null;
  const normalized = String(seg).trim().toLowerCase();
  // Allow a-z, 0-9, '-', '_'
  const safe = normalized.replace(/[^a-z0-9-_]/g, '');
  return safe || null;
}

export function maskEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at <= 1) return '••••••';
  const name = s.slice(0, at);
  const domain = s.slice(at);
  const keep = Math.min(3, name.length);
  return `${name.slice(0, keep)}••••${domain}`;
}

export function maskSecret(value, { visible = 0 } = {}) {
  const s = String(value || '');
  if (visible <= 0) return '••••••••';
  const keep = Math.min(visible, s.length);
  return `${s.slice(0, keep)}${'•'.repeat(Math.max(0, s.length - keep))}`;
}