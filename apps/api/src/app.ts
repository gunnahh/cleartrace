import Fastify from 'fastify'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import { config } from './config.js'
import { AppError } from './errors.js'
import { registerAuth } from './auth.js'
import { registerRoutes } from './routes.js'
import './types.js'

export async function buildApp(
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.DATABASE_URL }) }),
) {
  const app = Fastify({
    logger: { redact: ['req.headers.authorization', 'req.headers.cookie'] },
    bodyLimit: config.MAX_UPLOAD_BYTES + 1024,
  })
  app.decorate('prisma', prisma)
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  await app.register(cors, { origin: config.WEB_ORIGIN, credentials: true })
  await app.register(helmet)
  await app.register(cookie)
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: 'cleartrace_session', signed: false },
  })
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })
  await app.register(multipart, { limits: { fileSize: config.MAX_UPLOAD_BYTES, files: 1 } })
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ClearTrace API',
        version: '0.1.0',
        description: 'Company research workspace REST API',
      },
      servers: [{ url: 'http://localhost:3001' }],
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })
  app.get('/health', async () => ({ status: 'ok' }))
  registerAuth(app)
  await app.register(async (protectedApp) => {
    registerRoutes(protectedApp)
  })
  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      code: 'NOT_FOUND',
      message: 'Route not found',
      fieldErrors: {},
      requestId: request.id,
    }),
  )
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const key = issue.path.join('.') || 'root'
        ;(fieldErrors[key] ??= []).push(issue.message)
      }
      return reply.code(422).send({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fieldErrors,
        requestId: request.id,
      })
    }
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'An unexpected error occurred', 500)
    if (!(error instanceof AppError)) request.log.error(error)
    return reply.code(appError.statusCode).send({
      code: appError.code,
      message: appError.message,
      fieldErrors: appError.fieldErrors,
      requestId: request.id,
    })
  })
  app.addHook('onClose', () => prisma.$disconnect())
  return app
}
