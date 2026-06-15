const sensitivePatterns = [/password/gi, /senha/gi, /token/gi, /authorization/gi, /api[_-]?key/gi, /bearer\s+[\w.-]+/gi];

export function sanitizeError(value: string, maxLength = 500) {
  return sensitivePatterns.reduce((text, pattern) => text.replace(pattern, "[protegido]"), value).slice(0, maxLength);
}

export function errorProtocol() {
  return `ERR-${Date.now().toString(36).toUpperCase()}`;
}
