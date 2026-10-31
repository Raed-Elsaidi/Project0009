import { getCustomToken, clearCustomToken, decodeCustomToken } from './customSession'

export const getCustomSession = () => {
  const token = getCustomToken()
  const claims = decodeCustomToken()
  if (!token || !claims?.sub || !claims?.exp || claims.exp < Date.now() / 1000) return null
  return { access_token: token, user: { id: claims.sub, app_role: claims.app_role } }
}
export const clearCustomSession = () => clearCustomToken()
export const logoutEmployee = async () => { clearCustomToken(); window.dispatchEvent(new Event('counselor-session-change')) }
export const validateCustomSession = async () => Boolean(getCustomSession())
export const loginWithEmployeeCredentials = async (username, password, remember = true) => {
  const { loginEmployee } = await import('./data')
  return loginEmployee(username, password, remember)
}
