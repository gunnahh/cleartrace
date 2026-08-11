const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type AuthInput = { email: string; password: string }

export const authApi = {
  login: (input: AuthInput) => request('/auth/login', input),
  register: (input: AuthInput) => request('/auth/register', input),
  forgotPassword: (email: string) => request('/auth/forgot-password', { email }),
  logout: () => request('/auth/logout'),
  me: () => request('/auth/me', undefined, 'GET'),
}

async function request(path: string, body?: unknown, method = 'POST') {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Authentication service is unavailable. Please try again shortly.')
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null
  if (!response.ok) throw new Error(payload?.message || 'Something went wrong. Please try again.')
  return payload
}
