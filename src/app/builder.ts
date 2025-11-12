import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { loadRoutes } from '../plugins/route-loader';
import { errorHandler } from '../plugins/error-handler';
import { correlationId } from '../plugins/correlation-id';
import { requestLogger } from '../plugins/request-logger';
import { loadConfig } from '../lib/config';
import { createLogger } from '../lib/logger';

export async function buildApp(server: FastifyInstance): Promise<FastifyInstance> {
  const config = loadConfig();
  createLogger();

  server.log.info(
    {
      port: config.port,
      host: config.host,
      nodeEnv: config.nodeEnv,
      apiVersion: config.api.version,
      apiBasePath: config.api.basePath,
    },
    'Starting application'
  );

  await server.register(helmet);
  server.log.debug('Security plugin (helmet) registered');

  await server.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });
  server.log.debug('CORS plugin registered');

  await server.register(correlationId);
  server.log.debug('Correlation ID plugin registered');

  if (config.logging.enableRequestLogging) {
    await server.register(requestLogger);
    server.log.debug('Request logger plugin registered');
  }

  await server.register(errorHandler);
  server.log.debug('Error handler plugin registered');

  if (config.swagger.enabled) {
    await server.register(swagger, {
      openapi: {
        info: {
          title: config.swagger.info.title,
          description: config.swagger.info.description,
          version: config.swagger.info.version,
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Development server',
          },
        ],
      },
    });
    server.log.info(`Swagger documentation enabled at ${config.swagger.path}`);

    await server.register(swaggerUI, {
      routePrefix: config.swagger.path,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
        persistAuthorization: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }

  await server.register(loadRoutes, {
    prefix: `${config.api.basePath}/${config.api.version}`,
  });
  server.log.info(
    {
      prefix: `${config.api.basePath}/${config.api.version}`,
    },
    'Routes loaded'
  );

  server.get('/health', async (request) => {
    server.log.debug({ requestId: request.requestId }, 'Health check requested');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  });

  server.log.info('Application built successfully');
  return server;
}
