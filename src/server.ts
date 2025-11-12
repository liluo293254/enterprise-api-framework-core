import { createServer } from './lib/create-server';
import { buildApp } from './app';
import { loadConfig } from './lib/config';

async function start() {
  try {
    const server = createServer();
    const app = await buildApp(server);
    const config = loadConfig();

    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Server listening on http://${config.host}:${config.port}`);
    app.log.info(`API docs available at http://${config.host}:${config.port}${config.swagger.path}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
