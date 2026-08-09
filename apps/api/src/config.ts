import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./data/uploads'),
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .positive()
    .default(10 * 1024 * 1024),
})

export const config = envSchema.parse(process.env)
