import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './errors.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string }
    user: { sub: string; role: string }
  }
}

export async function authenticate(request: FastifyRequest) {
  try {
    await request.jwtVerify()
  } catch {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  }
}

export function registerAuth(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const { registerSchema } = await import('@cleartrace/contracts')
    const input = registerSchema.parse(request.body)
    const existingUser = await app.prisma.user.findUnique({ where: { email: input.email } })
    if (existingUser) throw new AppError('EMAIL_IN_USE', 'An account already uses this email', 409)
    const { hash } = await import('bcryptjs')
    const user = await app.prisma.user.create({
      data: {
        email: input.email,
        name: input.email.split('@')[0] ?? input.email,
        passwordHash: await hash(input.password, 12),
      },
    })
    const token = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '8h' })
    setSessionCookie(reply, token)
    return reply.code(201).send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  })
  app.post('/auth/login', async (request, reply) => {
    const { loginSchema } = await import('@cleartrace/contracts')
    const input = loginSchema.parse(request.body)
    const user = await app.prisma.user.findUnique({ where: { email: input.email } })
    const { compare } = await import('bcryptjs')
    if (!user || !(await compare(input.password, user.passwordHash)))
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
    const token = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '8h' })
    setSessionCookie(reply, token)
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  })
  app.post('/auth/forgot-password', async (request, reply) => {
    const { forgotPasswordSchema } = await import('@cleartrace/contracts')
    forgotPasswordSchema.parse(request.body)
    return reply.code(202).send({
      message: 'If an account exists for this email, password reset instructions will be sent.',
    })
  })
  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('cleartrace_session', { path: '/' })
    return reply.code(204).send()
  })
  app.get('/auth/me', { preHandler: authenticate }, async (request) =>
    app.prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true },
    }),
  )
}

function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie('cleartrace_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 28800,
  })
}
