import { z } from 'zod'

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).default({}),
  requestId: z.string(),
})

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public fieldErrors: Record<string, string[]>,
    public requestId: string,
    public status: number,
  ) {
    super(message)
  }
}

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null))
    if (parsed.success)
      throw new ApiError(
        parsed.data.code,
        parsed.data.message,
        parsed.data.fieldErrors,
        parsed.data.requestId,
        response.status,
      )
    throw new ApiError(
      'NETWORK_ERROR',
      'The server returned an unexpected response',
      {},
      '',
      response.status,
    )
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function applyServerErrors(
  error: unknown,
  setError: (name: string, error: { type: 'server'; message: string }) => void,
) {
  if (!(error instanceof ApiError)) return
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    setError(field, { type: 'server', message: messages[0] ?? error.message })
  }
}
