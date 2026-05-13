export function isLocalAuthBypassEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_AUTH_BYPASS === 'true';
}
