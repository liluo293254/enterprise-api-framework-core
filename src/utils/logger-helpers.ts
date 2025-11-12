import { FastifyRequest } from 'fastify';
import { Logger } from '../lib/logger';

/**
 * 日志辅助函数
 * 提供常用的日志记录模式
 */

/**
 * 记录性能指标
 */
export function logPerformance(
  logger: Logger,
  operation: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
  logger[level](
    {
      operation,
      duration,
      durationMs: `${duration}ms`,
      ...context,
    },
    `Performance: ${operation} took ${duration}ms`
  );
}

/**
 * 记录数据库操作
 */
export function logDatabaseOperation(
  logger: Logger,
  operation: string,
  table: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  logger.debug(
    {
      type: 'database',
      operation,
      table,
      duration,
      durationMs: `${duration}ms`,
      ...context,
    },
    `DB ${operation} on ${table} (${duration}ms)`
  );
}

/**
 * 记录业务操作
 */
export function logBusinessOperation(
  logger: Logger,
  operation: string,
  userId?: string,
  context?: Record<string, unknown>
): void {
  logger.info(
    {
      type: 'business',
      operation,
      userId,
      ...context,
    },
    `Business operation: ${operation}`
  );
}

/**
 * 记录 API 调用（外部服务）
 */
export function logExternalApiCall(
  logger: Logger,
  service: string,
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](
    {
      type: 'external-api',
      service,
      endpoint,
      method,
      statusCode,
      duration,
      durationMs: `${duration}ms`,
      ...context,
    },
    `External API: ${service} ${method} ${endpoint} - ${statusCode} (${duration}ms)`
  );
}

/**
 * 记录请求上下文（用于在业务逻辑中使用）
 */
export function getRequestContext(request: FastifyRequest): {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
} {
  return {
    requestId: request.requestId || 'unknown',
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

/**
 * 创建带请求上下文的 logger 绑定
 */
export function createRequestLogger(
  logger: Logger,
  request: FastifyRequest
): Logger & {
  requestContext: Record<string, unknown>;
} {
  const context = getRequestContext(request);
  const requestLogger = logger.child({
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    ip: context.ip,
  });

  return Object.assign(requestLogger, {
    requestContext: context,
  });
}
