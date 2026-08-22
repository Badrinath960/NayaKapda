'use client';

const DEVICE_ID_KEY = 'nayakapda_device_client_id';

/**
 * Gets or creates a persistent client-side device ID
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId =
      'dev_' +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  // Also set cookie if not present
  if (!document.cookie.includes('nayakapda_device_id=')) {
    const d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    document.cookie = `nayakapda_device_id=${deviceId};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  return deviceId;
}

/**
 * Derives a human-friendly device name from User-Agent
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Web Browser';

  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Device';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}
