import Fastify, { FastifyInstance } from 'fastify';
import { loadConfig } from './config';
import { createLogger } from './logger';

/**
 * 创建配置了 logger 的 Fastify 实例
 * 这个函数确保 Fastify 使用统一的 logger 配置
 */
export function createServer(): FastifyInstance {
  const config = loadConfig();
  // 初始化 logger（确保 logger 已创建）
  createLogger();

  // 创建 Fastify 实例，配置 logger
  const server = Fastify({
    logger: {
      level: config.logging.level,
      // 在开发环境使用 pino-pretty
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
                messageFormat: '{requestId} {msg}',
              },
            }
          : undefined,
    },
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-correlation-id',
    disableRequestLogging: !config.logging.enableRequestLogging,
  });

  // 记录服务器创建信息
  server.log.info(
    {
      nodeEnv: config.nodeEnv,
      logLevel: config.logging.level,
      requestLoggingEnabled: config.logging.enableRequestLogging,
    },
    'Fastify server instance created'
  );

  return server;
}
