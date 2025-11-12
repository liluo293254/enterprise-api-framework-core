import { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { AppError } from '../lib/errors';

// eslint-disable-next-line @typescript-eslint/require-await
export const errorHandler: FastifyPluginAsync = async fastify => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const requestId = (request as any).requestId || 'unknown';

    // Log error with detailed context
    const errorContext = {
      err: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
      },
      requestId,
      url: request.url,
      method: request.method,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
      },
      query: request.query,
      params: request.params,
      body: request.body,
      ip: request.ip,
    };

    fastify.log.error(errorContext, `Request error: ${error.message}`);

    // Handle known error types
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    }

    // Handle validation errors (Fastify validation errors)
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.validation,
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    }

    // Handle unknown errors
    const isDevelopment = process.env.NODE_ENV === 'development';
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isDevelopment ? error.message : 'An internal server error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  });
};
