const path = require('path');
const { z } = require('zod');

require('dotenv').config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '.env.test' : '.env'),
});

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(7),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  APP_TIMEZONE: z
    .string()
    .refine((tz) => {
      try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); return true; }
      catch { return false; }
    }, 'APP_TIMEZONE must be a valid IANA timezone, e.g. Asia/Kolkata')
    .default('Asia/Kolkata'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  process.exit(1);
}
module.exports = parsed.data;
