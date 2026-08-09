import type { Prisma, PrismaClient } from '@prisma/client'
import type { CreateAssignmentInput } from '@cleartrace/contracts'
import { immutableError, AppError } from './errors.js'

export async function assertWritable(
  prisma: PrismaClient | Prisma.TransactionClient,
  assignmentId: string,
  researcherId: string,
) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, researcherId },
    select: { status: true },
  })
  if (!assignment) throw new AppError('NOT_FOUND', 'Assignment not found', 404)
  if (assignment.status === 'SUBMITTED') throw immutableError()
}

export async function createAssignment(
  prisma: PrismaClient,
  input: CreateAssignmentInput,
  researcherId: string,
) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.assignment.count()
    return tx.assignment.create({
      data: {
        referenceNumber: `CTR-${new Date().getUTCFullYear()}-${String(count + 1).padStart(5, '0')}`,
        dueDate: input.dueDate,
        researcherId,
        companyProfile: { create: input.companyProfile },
        targets: {
          create: {
            type: 'COMPANY',
            nameTh: input.companyProfile.registeredNameTh,
            nameEn: input.companyProfile.registeredNameEn,
            identifier: input.companyProfile.registrationNumber,
          },
        },
      },
      include: { companyProfile: true, targets: true },
    })
  })
}

export async function assembleReport(
  prisma: PrismaClient | Prisma.TransactionClient,
  assignmentId: string,
  researcherId: string,
) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, researcherId },
    include: {
      companyProfile: true,
      targets: {
        include: {
          checks: {
            include: {
              searchAttempts: { include: { evidence: true } },
              legalCases: true,
              mediaFindings: true,
            },
          },
        },
      },
    },
  })
  if (!assignment) throw new AppError('NOT_FOUND', 'Assignment not found', 404)
  return { generatedAt: new Date().toISOString(), assignment }
}

export async function submitAssignment(
  prisma: PrismaClient,
  assignmentId: string,
  researcherId: string,
) {
  return prisma.$transaction(async (tx) => {
    await assertWritable(tx, assignmentId, researcherId)
    const snapshot = await assembleReport(tx, assignmentId, researcherId)
    const incomplete = snapshot.assignment.targets
      .flatMap((t) => t.checks)
      .filter((c) => !['MATCH_FOUND', 'NO_RESULT'].includes(c.status))
    if (incomplete.length)
      throw new AppError(
        'REPORT_INCOMPLETE',
        `${incomplete.length} research checks are incomplete`,
        422,
      )
    const version = (await tx.report.count({ where: { assignmentId } })) + 1
    const report = await tx.report.create({
      data: {
        assignmentId,
        version,
        snapshotJson: snapshot as unknown as Prisma.InputJsonValue,
        submittedAt: new Date(),
        submittedById: researcherId,
      },
    })
    await tx.assignment.update({
      where: { id: assignmentId },
      data: { status: 'SUBMITTED', submittedAt: report.submittedAt },
    })
    return report
  })
}
