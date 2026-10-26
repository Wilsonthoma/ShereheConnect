import { Request } from 'express';

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
}

/**
 * Extract client context from an Express request.
 * Used for login session tracking.
 */
export function extractRequestContext(req: Request): RequestContext {
  const forwarded = req.headers['x-forwarded-for'];
  let ipAddress: string | null = null;

  if (typeof forwarded === 'string') {
    ipAddress = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ipAddress = forwarded[0].trim();
  } else {
    ipAddress = req.ip || req.socket?.remoteAddress || null;
  }

  const userAgent = (req.headers['user-agent'] as string) || null;

  return {
    ipAddress,
    userAgent,
    deviceLabel: userAgent ? parseUserAgent(userAgent) : null,
  };
}

/**
 * Turn a user agent string into a human-readable device label.
 * Examples: "Chrome on Windows", "Safari on iPhone"
 */
function parseUserAgent(ua: string): string {
  const lower = ua.toLowerCase();

  let browser = 'Unknown';
  if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('chrome/') && !lower.includes('edg/')) browser = 'Chrome';
  else if (lower.includes('firefox/')) browser = 'Firefox';
  else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('opera') || lower.includes('opr/')) browser = 'Opera';

  let os = 'Unknown';
  if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) os = 'iOS';
  else if (lower.includes('linux')) os = 'Linux';

  if (browser === 'Unknown' && os === 'Unknown') {
    return 'Unknown device';
  }

  return `${browser} on ${os}`;
}
