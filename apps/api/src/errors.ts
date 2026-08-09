export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}

export const immutableError = () =>
  new AppError('ASSIGNMENT_SUBMITTED', 'Submitted assignments are immutable', 409)
