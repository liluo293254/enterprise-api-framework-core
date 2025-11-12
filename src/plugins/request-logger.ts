import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

interface RequestLogContext {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
      query: Record<string, unknown> | undefined;
      params: Record<string, unknown> | undefined;
  ip: string;
  userAgent?: string;
  startTime: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    logContext?: RequestLogContext;
  }
}

/**
 * 请求日志插件
 * 记录所有 HTTP 请求的详细信息，包括：
 * - 请求开始时间
 * - 请求方法、URL、参数
 * - 请求头信息
 * - 响应状态码和耗时
 * - 请求 ID（correlation ID）
 */
export const requestLogger: FastifyPluginAsync = async fastify => {
  // 记录请求开始
  fastify.addHook('onRequest', (request: FastifyRequest, _reply, done) => {
    const startTime = Date.now();
    const requestId = request.requestId || 'unknown';

    // 构建请求上下文
    const logContext: RequestLogContext = {
      requestId,
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        'accept': request.headers['accept'],
        'authorization': request.headers['authorization']
          ? '[REDACTED]'
          : undefined,
      },
      query: (request.query as Record<string, unknown>) || undefined,
      params: (request.params as Record<string, unknown>) || undefined,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      startTime,
    };

    request.logContext = logContext;

    // 记录请求开始
    fastify.log.info(
      {
        requestId,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        query: request.query,
        params: request.params,
      },
      `→ ${request.method} ${request.url}`
    );

    done();
  });

  // 记录响应
  fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
    const logContext = request.logContext;
    if (!logContext) {
      done();
      return;
    }

    const duration = Date.now() - logContext.startTime;
    const statusCode = reply.statusCode;
    const requestId = logContext.requestId;

    // 根据状态码选择日志级别
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // 构建日志数据
    const logData = {
      requestId,
      method: logContext.method,
      url: logContext.url,
      statusCode,
      duration,
      responseTime: `${duration}ms`,
      ip: logContext.ip,
      userAgent: logContext.userAgent,
      contentLength: reply.getHeader('content-length'),
    };

    // 记录响应
    fastify.log[logLevel](
      logData,
      `← ${logContext.method} ${logContext.url} ${statusCode} (${duration}ms)`
    );

    done();
  });

  // 记录错误（补充 error-handler 的日志）
  fastify.addHook('onError', (request: FastifyRequest, reply: FastifyReply, error, done) => {
    const logContext = request.logContext;
    const requestId = logContext?.requestId || 'unknown';

    fastify.log.error(
      {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        duration: logContext ? Date.now() - logContext.startTime : undefined,
      },
      `✗ ${request.method} ${request.url} - Error: ${error.message}`
    );

    done();
  });
};
