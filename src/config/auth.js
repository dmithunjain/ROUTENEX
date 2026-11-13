/**
 * Demo authentication configuration.
 *
 * This static build keeps the reference admin account in the client bundle so the
 * demo can be evaluated without a server. A production deployment must validate
 * credentials on a backend and never ship passwords to the browser.
 */
export const ADMIN_LOGIN = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'routenex@1',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'routenex755',
}
