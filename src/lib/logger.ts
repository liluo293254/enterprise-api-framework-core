import pino from 'pino';
import { loadConfig } from './config';

let loggerInstance: pino.Logger | null = null;

export function createLogger(): pino.Logger {
  if (loggerInstance) {
    return loggerInstance;
  }

  const config = loadConfig();
  const isDevelopment = config.nodeEnv === 'development';

  // 配置日志选项
  const loggerOptions: pino.LoggerOptions = {
    level: config.logging.level,
    base: {
      env: config.nodeEnv,
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    // 开发环境使用 pretty print
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{requestId} {msg}',
        },
      },
    }),
  };

  // 生产环境可以配置文件输出
  if (!isDevelopment && config.logging.file) {
    loggerOptions.transport = {
      targets: [
        {
          target: 'pino/file',
          options: {
            destination: config.logging.file,
            mkdir: true,
          },
          level: config.logging.level,
        },
        // 同时输出到控制台
        {
          target: 'pino-pretty',
          options: {
            colorize: false,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
          level: config.logging.level,
        },
      ],
    };
  }

  loggerInstance = pino(loggerOptions);

  // 记录启动信息
  loggerInstance.info(
    {
      level: config.logging.level,
      nodeEnv: config.nodeEnv,
    },
    'Logger initialized'
  );

  return loggerInstance;
}

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

// 导出类型
export type Logger = pino.Logger;
