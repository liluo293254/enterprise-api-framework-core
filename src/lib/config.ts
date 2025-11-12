import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const ConfigSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  api: z.object({
    version: z.string().default('v1'),
    basePath: z.string().default('/api'),
  }),
  swagger: z.object({
    enabled: z.coerce.boolean().default(true),
    path: z.string().default('/api-docs'),
    info: z.object({
      title: z.string().default('API Documentation'),
      description: z.string().default('API Documentation'),
      version: z.string().default('1.0.0'),
    }),
  }),
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default(true),
    credentials: z.boolean().default(true),
  }),
  database: z.object({
    url: z.string().url().optional(),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    file: z.string().optional(), // 日志文件路径（生产环境）
    enableRequestLogging: z.coerce.boolean().default(true), // 是否启用请求日志
    enableErrorLogging: z.coerce.boolean().default(true), // 是否启用错误日志
    enablePerformanceLogging: z.coerce.boolean().default(true), // 是否启用性能日志
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = {
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    api: {
      version: process.env.API_VERSION,
      basePath: process.env.API_BASE_PATH,
    },
    swagger: {
      enabled: process.env.SWAGGER_ENABLED,
      path: process.env.SWAGGER_PATH,
      info: {
        title: process.env.SWAGGER_TITLE,
        description: process.env.SWAGGER_DESCRIPTION,
        version: process.env.SWAGGER_VERSION,
      },
    },
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: process.env.CORS_CREDENTIALS,
    },
    database: {
      url: process.env.DATABASE_URL || (process.env.NODE_ENV === 'development' ? 'file:./dev.db' : undefined),
    },
    logging: {
      level: process.env.LOG_LEVEL,
      file: process.env.LOG_FILE,
      enableRequestLogging: process.env.LOG_ENABLE_REQUEST,
      enableErrorLogging: process.env.LOG_ENABLE_ERROR,
      enablePerformanceLogging: process.env.LOG_ENABLE_PERFORMANCE,
    },
  };

  try {
    cachedConfig = ConfigSchema.parse(rawConfig);
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid configuration');
    }
    throw error;
  }
}
