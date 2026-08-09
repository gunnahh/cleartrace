import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })
const user = await prisma.user.upsert({
  where: { email: 'researcher@cleartrace.test' },
  update: {},
  create: {
    name: 'Mali Researcher',
    email: 'researcher@cleartrace.test',
    passwordHash: await hash('ClearTraceDemo123!', 12),
    role: 'RESEARCHER',
  },
})

await prisma.report.deleteMany()
await prisma.assignment.deleteMany()
const base = { researcherId: user.id, dueDate: new Date('2026-09-01') }

await prisma.assignment.create({
  data: {
    ...base,
    referenceNumber: 'CTR-DEMO-LEGAL',
    status: 'READY_TO_SUBMIT',
    companyProfile: {
      create: {
        registeredNameTh: 'บริษัท เมอริเดียน ตัวอย่าง จำกัด',
        registeredNameEn: 'Meridian Example Co., Ltd.',
        registrationNumber: 'DEMO-010001',
        registrationDate: new Date('2018-03-12'),
        businessType: 'Fictional logistics services',
        registeredAddress: '99 Example Road, Bangkok',
        sourceReference: 'Fictional corporate registry extract',
      },
    },
    targets: {
      create: {
        type: 'COMPANY',
        nameTh: 'บริษัท เมอริเดียน ตัวอย่าง จำกัด',
        nameEn: 'Meridian Example Co., Ltd.',
        checks: {
          create: {
            category: 'CIVIL',
            status: 'MATCH_FOUND',
            conclusion: 'One fictional civil match reviewed',
            completedAt: new Date(),
            legalCases: {
              create: {
                caseType: 'Civil',
                caseNumber: 'DEMO-CIV-001',
                courtName: 'Example Civil Court',
                plaintiff: 'Meridian Example Co., Ltd.',
                defendant: 'Sample Trading Co., Ltd.',
                filingDate: new Date('2024-01-10'),
                caseStatus: 'Final',
                summary: 'Fictional commercial dispute used only for demonstration.',
                sourceUrl: 'https://example.com/legal/DEMO-CIV-001',
              },
            },
          },
        },
      },
    },
  },
})

await prisma.assignment.create({
  data: {
    ...base,
    referenceNumber: 'CTR-DEMO-NORESULT',
    status: 'READY_TO_SUBMIT',
    companyProfile: {
      create: {
        registeredNameTh: 'บริษัท นอร์ธสตาร์ เดโม จำกัด',
        registeredNameEn: 'Northstar Demo Co., Ltd.',
        registrationNumber: 'DEMO-010002',
        registrationDate: new Date('2020-05-20'),
        businessType: 'Fictional consulting',
        registeredAddress: '12 Demo Avenue, Bangkok',
        sourceReference: 'Fictional registry source',
      },
    },
    targets: {
      create: {
        type: 'COMPANY',
        nameTh: 'บริษัท นอร์ธสตาร์ เดโม จำกัด',
        nameEn: 'Northstar Demo Co., Ltd.',
        checks: {
          create: {
            category: 'BANKRUPTCY',
            status: 'NO_RESULT',
            conclusion: 'No result in fictional source',
            completedAt: new Date(),
            searchAttempts: {
              create: {
                sourceName: 'Demo Insolvency Search',
                sourceUrl: 'https://example.com/search',
                queryText: 'Northstar Demo',
                searchedAt: new Date(),
                result: 'NO_RESULT',
                evidence: {
                  create: {
                    storageKey: 'seed/no-result.png',
                    originalFileName: 'no-result.png',
                    mimeType: 'image/png',
                    size: 128,
                    caption: 'Fictional no-result screenshot',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})

await prisma.assignment.create({
  data: {
    ...base,
    referenceNumber: 'CTR-DEMO-DRAFT',
    status: 'DRAFT',
    companyProfile: {
      create: {
        registeredNameTh: 'บริษัท โอไรออน สมมติ จำกัด',
        registeredNameEn: 'Orion Fictional Co., Ltd.',
        registrationNumber: 'DEMO-010003',
        registrationDate: new Date('2025-02-14'),
        businessType: 'Fictional wholesale',
        registeredAddress: '7 Sample Lane, Bangkok',
        sourceReference: 'Fictional registry source',
      },
    },
    targets: {
      create: {
        type: 'DIRECTOR',
        nameTh: '',
        nameEn: 'Anan Example',
        notes: 'Thai name pending verification',
      },
    },
  },
})

console.info('Seeded fictional ClearTrace data for', user.email)
await prisma.$disconnect()
