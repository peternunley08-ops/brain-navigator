import { Linking } from 'react-native';

const ALLOWED = ['https:', 'tel:', 'sms:', 'mailto:'];

/** Turns a saved link into a safe URL, or null. Bare domains become https. */
export function safeUrl(raw: string): string | null {
  const u = (raw ?? '').trim();
  if (!u) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(u);
  // "district.aeries.net:8080" is host:port, not a scheme
  if (scheme && !/^[^\s/:]+:\d/.test(u)) {
    return ALLOWED.includes(`${scheme[1].toLowerCase()}:`) ? u : null;
  }
  return /^[^\s/]+\.[^\s/]+/.test(u) ? `https://${u}` : null;
}

/** Opens user-saved links only when the scheme is https, tel, sms or mailto. */
export function openSafe(raw: string): Promise<void> {
  const url = safeUrl(raw);
  if (!url) return Promise.resolve();
  return Linking.openURL(url).catch(() => {});
}
