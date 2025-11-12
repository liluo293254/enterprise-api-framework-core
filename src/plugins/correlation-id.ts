import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export const correlationId: FastifyPluginAsync = async fastify => {
  fastify.addHook('onRequest', (request: FastifyRequest) => {
    // Get correlation ID from header or generate new one
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
    request.requestId = correlationId;

    // Add correlation ID to response headers
    request.headers['x-correlation-id'] = correlationId;
  });

  fastify.addHook('onSend', (request, reply) => {
    void reply.header('x-correlation-id', request.requestId);
  });
};
