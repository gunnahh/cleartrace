import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  createAssignmentSchema,
  paginationSchema,
  targetSchema,
  checkSchema,
  completeCheckSchema,
  searchAttemptSchema,
  legalCaseSchema,
  mediaFindingSchema,
  companyProfileSchema,
  updateAssignmentSchema,
} from '@cleartrace/contracts'
import { authenticate } from './auth.js'
import { AppError } from './errors.js'
import {
  assertWritable,
  assembleReport,
  createAssignment,
  submitAssignment,
} from './assignment-service.js'
import { validateCheckCompletion, validateFile } from './rules.js'
import { config } from './config.js'

const id = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value))
    throw new AppError('INVALID_PARAMETER', `Invalid ${name}`, 400)
  return value
}
async function assignmentForTarget(app: FastifyInstance, targetId: string) {
  const row = await app.prisma.researchTarget.findUnique({
    where: { id: targetId },
    select: { assignmentId: true },
  })
  if (!row) throw new AppError('NOT_FOUND', 'Target not found', 404)
  return row.assignmentId
}
async function assignmentForCheck(app: FastifyInstance, checkId: string) {
  const row = await app.prisma.researchCheck.findUnique({
    where: { id: checkId },
    select: { target: { select: { assignmentId: true } } },
  })
  if (!row) throw new AppError('NOT_FOUND', 'Check not found', 404)
  return row.target.assignmentId
}

export function registerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.get('/assignments', async (request) => {
    const q = paginationSchema.parse(request.query)
    const where = {
      researcherId: request.user.sub,
      ...(q.status && { status: q.status }),
      ...(q.search && {
        OR: [
          { referenceNumber: { contains: q.search, mode: 'insensitive' as const } },
          {
            companyProfile: {
              registeredNameEn: { contains: q.search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    }
    const [items, total] = await app.prisma.$transaction([
      app.prisma.assignment.findMany({
        where,
        include: { companyProfile: true },
        orderBy: { [q.sort]: q.order },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      app.prisma.assignment.count({ where }),
    ])
    return { items, page: q.page, pageSize: q.pageSize, total }
  })
  app.post('/assignments', async (request, reply) => {
    const item = await createAssignment(
      app.prisma,
      createAssignmentSchema.parse(request.body),
      request.user.sub,
    )
    return reply.code(201).send(item)
  })
  app.get('/assignments/:assignmentId', async (request) =>
    app.prisma.assignment.findFirstOrThrow({
      where: {
        id: id((request.params as Record<string, unknown>).assignmentId, 'assignmentId'),
        researcherId: request.user.sub,
      },
      include: { companyProfile: true, targets: true },
    }),
  )
  app.patch('/assignments/:assignmentId', async (request) => {
    const assignmentId = id(
      (request.params as Record<string, unknown>).assignmentId,
      'assignmentId',
    )
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return app.prisma.assignment.update({
      where: { id: assignmentId },
      data: updateAssignmentSchema.parse(request.body),
    })
  })
  app.delete('/assignments/:assignmentId', async (request, reply) => {
    const assignmentId = id(
      (request.params as Record<string, unknown>).assignmentId,
      'assignmentId',
    )
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    await app.prisma.assignment.delete({ where: { id: assignmentId } })
    return reply.code(204).send()
  })
  app.get('/assignments/:assignmentId/company-profile', async (request) =>
    app.prisma.companyProfile.findUniqueOrThrow({
      where: {
        assignmentId: id((request.params as Record<string, unknown>).assignmentId, 'assignmentId'),
      },
    }),
  )
  app.put('/assignments/:assignmentId/company-profile', async (request) => {
    const assignmentId = id(
      (request.params as Record<string, unknown>).assignmentId,
      'assignmentId',
    )
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return app.prisma.companyProfile.upsert({
      where: { assignmentId },
      create: { assignmentId, ...companyProfileSchema.parse(request.body) },
      update: companyProfileSchema.parse(request.body),
    })
  })
  app.get('/assignments/:assignmentId/targets', async (request) =>
    app.prisma.researchTarget.findMany({
      where: {
        assignmentId: id((request.params as Record<string, unknown>).assignmentId, 'assignmentId'),
      },
    }),
  )
  app.post('/assignments/:assignmentId/targets', async (request, reply) => {
    const assignmentId = id(
      (request.params as Record<string, unknown>).assignmentId,
      'assignmentId',
    )
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return reply.code(201).send(
      await app.prisma.researchTarget.create({
        data: { assignmentId, ...targetSchema.parse(request.body) },
      }),
    )
  })
  app.patch('/targets/:targetId', async (request) => {
    const targetId = id((request.params as Record<string, unknown>).targetId, 'targetId'),
      assignmentId = await assignmentForTarget(app, targetId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return app.prisma.researchTarget.update({
      where: { id: targetId },
      data: targetSchema.partial().parse(request.body),
    })
  })
  app.delete('/targets/:targetId', async (request, reply) => {
    const targetId = id((request.params as Record<string, unknown>).targetId, 'targetId'),
      assignmentId = await assignmentForTarget(app, targetId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    await app.prisma.researchTarget.delete({ where: { id: targetId } })
    return reply.code(204).send()
  })
  app.get('/targets/:targetId/checks', async (request) =>
    app.prisma.researchCheck.findMany({
      where: { targetId: id((request.params as Record<string, unknown>).targetId, 'targetId') },
    }),
  )
  app.post('/targets/:targetId/checks', async (request, reply) => {
    const targetId = id((request.params as Record<string, unknown>).targetId, 'targetId'),
      assignmentId = await assignmentForTarget(app, targetId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return reply.code(201).send(
      await app.prisma.researchCheck.create({
        data: { targetId, ...checkSchema.parse(request.body) },
      }),
    )
  })
  app.patch('/checks/:checkId', async (request) => {
    const checkId = id((request.params as Record<string, unknown>).checkId, 'checkId'),
      assignmentId = await assignmentForCheck(app, checkId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return app.prisma.researchCheck.update({
      where: { id: checkId },
      data: checkSchema.partial().parse(request.body),
    })
  })
  app.post('/checks/:checkId/complete', async (request) => {
    const checkId = id((request.params as Record<string, unknown>).checkId, 'checkId'),
      assignmentId = await assignmentForCheck(app, checkId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    const input = completeCheckSchema.parse(request.body)
    return app.prisma.$transaction(async (tx) => {
      const check = await tx.researchCheck.findUniqueOrThrow({
        where: { id: checkId },
        include: { searchAttempts: { include: { evidence: true } }, legalCases: true },
      })
      validateCheckCompletion(check, input.status)
      return tx.researchCheck.update({
        where: { id: checkId },
        data: { ...input, completedAt: new Date() },
      })
    })
  })
  app.get('/checks/:checkId/search-attempts', async (request) =>
    app.prisma.searchAttempt.findMany({
      where: {
        researchCheckId: id((request.params as Record<string, unknown>).checkId, 'checkId'),
      },
      include: { evidence: true },
    }),
  )
  app.post('/checks/:checkId/search-attempts', async (request, reply) => {
    const checkId = id((request.params as Record<string, unknown>).checkId, 'checkId'),
      assignmentId = await assignmentForCheck(app, checkId)
    await assertWritable(app.prisma, assignmentId, request.user.sub)
    return reply.code(201).send(
      await app.prisma.searchAttempt.create({
        data: { researchCheckId: checkId, ...searchAttemptSchema.parse(request.body) },
      }),
    )
  })
  app.patch('/search-attempts/:searchAttemptId', async (request) =>
    app.prisma.searchAttempt.update({
      where: {
        id: id((request.params as Record<string, unknown>).searchAttemptId, 'searchAttemptId'),
      },
      data: searchAttemptSchema.partial().parse(request.body),
    }),
  )
  app.post('/search-attempts/:searchAttemptId/evidence', async (request, reply) => {
    const attemptId = id(
      (request.params as Record<string, unknown>).searchAttemptId,
      'searchAttemptId',
    )
    const part = await request.file({ limits: { fileSize: config.MAX_UPLOAD_BYTES, files: 1 } })
    if (!part) throw new AppError('FILE_REQUIRED', 'Select a file', 422)
    const buffer = await part.toBuffer()
    validateFile(buffer.subarray(0, 8), part.mimetype, buffer.length, config.MAX_UPLOAD_BYTES)
    const storageKey = randomUUID()
    await mkdir(config.UPLOAD_DIR, { recursive: true })
    await writeFile(join(config.UPLOAD_DIR, storageKey), buffer, { flag: 'wx' })
    return reply.code(201).send(
      await app.prisma.evidenceFile.create({
        data: {
          searchAttemptId: attemptId,
          storageKey,
          originalFileName: part.filename,
          mimeType: part.mimetype,
          size: buffer.length,
          caption: undefined,
        },
      }),
    )
  })
  app.delete('/evidence/:evidenceId', async (request, reply) => {
    await app.prisma.evidenceFile.delete({
      where: { id: id((request.params as Record<string, unknown>).evidenceId, 'evidenceId') },
    })
    return reply.code(204).send()
  })
  app.get('/checks/:checkId/legal-cases', async (request) =>
    app.prisma.legalCase.findMany({
      where: {
        researchCheckId: id((request.params as Record<string, unknown>).checkId, 'checkId'),
      },
    }),
  )
  app.post('/checks/:checkId/legal-cases', async (request, reply) =>
    reply.code(201).send(
      await app.prisma.legalCase.create({
        data: {
          researchCheckId: id((request.params as Record<string, unknown>).checkId, 'checkId'),
          ...legalCaseSchema.parse(request.body),
        },
      }),
    ),
  )
  app.patch('/legal-cases/:caseId', async (request) =>
    app.prisma.legalCase.update({
      where: { id: id((request.params as Record<string, unknown>).caseId, 'caseId') },
      data: legalCaseSchema.partial().parse(request.body),
    }),
  )
  app.delete('/legal-cases/:caseId', async (request, reply) => {
    await app.prisma.legalCase.delete({
      where: { id: id((request.params as Record<string, unknown>).caseId, 'caseId') },
    })
    return reply.code(204).send()
  })
  app.get('/checks/:checkId/media-findings', async (request) =>
    app.prisma.mediaFinding.findMany({
      where: {
        researchCheckId: id((request.params as Record<string, unknown>).checkId, 'checkId'),
      },
    }),
  )
  app.post('/checks/:checkId/media-findings', async (request, reply) =>
    reply.code(201).send(
      await app.prisma.mediaFinding.create({
        data: {
          researchCheckId: id((request.params as Record<string, unknown>).checkId, 'checkId'),
          ...mediaFindingSchema.parse(request.body),
        },
      }),
    ),
  )
  app.patch('/media-findings/:findingId', async (request) =>
    app.prisma.mediaFinding.update({
      where: { id: id((request.params as Record<string, unknown>).findingId, 'findingId') },
      data: mediaFindingSchema.partial().parse(request.body),
    }),
  )
  app.delete('/media-findings/:findingId', async (request, reply) => {
    await app.prisma.mediaFinding.delete({
      where: { id: id((request.params as Record<string, unknown>).findingId, 'findingId') },
    })
    return reply.code(204).send()
  })
  app.get('/assignments/:assignmentId/report-preview', async (request) =>
    assembleReport(
      app.prisma,
      id((request.params as Record<string, unknown>).assignmentId, 'assignmentId'),
      request.user.sub,
    ),
  )
  app.post('/assignments/:assignmentId/submit', async (request) =>
    submitAssignment(
      app.prisma,
      id((request.params as Record<string, unknown>).assignmentId, 'assignmentId'),
      request.user.sub,
    ),
  )
  app.get('/reports', async (request) =>
    app.prisma.report.findMany({
      where: { submittedById: request.user.sub },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, assignmentId: true, version: true, submittedAt: true },
    }),
  )
  app.get('/reports/:reportId', async (request) =>
    app.prisma.report.findFirstOrThrow({
      where: {
        id: id((request.params as Record<string, unknown>).reportId, 'reportId'),
        submittedById: request.user.sub,
      },
    }),
  )
}
