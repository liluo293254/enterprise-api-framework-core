import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { readdir, stat } from 'fs/promises';
import path, { join, extname } from 'path';

interface RouteLoaderOptions {
  prefix?: string;
}

async function loadRoutesFromDirectory(
  fastify: FastifyInstance,
  dirPath: string,
  basePath: string = ''
): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const statInfo = await stat(fullPath);

      if (statInfo.isDirectory()) {
        // Recursively load routes from subdirectories
        await loadRoutesFromDirectory(fastify, fullPath, join(basePath, entry.name));
      } else if (
        statInfo.isFile() &&
        (extname(entry.name) === '.ts' || extname(entry.name) === '.js')
      ) {
        // Load route file
        try {
          const routeModule = await import(`file://${fullPath}`);
          const routePlugin = routeModule.default;

          if (routePlugin && typeof routePlugin === 'function') {
            // Determine route path from file structure
            const routePath = determineRoutePath(fullPath, basePath);
            await fastify.register(routePlugin, { prefix: routePath });
            fastify.log.info(
              {
                routePath,
                filePath: fullPath,
                basePath,
              },
              `✓ Loaded route: ${routePath}`
            );
          } else {
            fastify.log.warn(
              {
                filePath: fullPath,
              },
              `Route file does not export a valid plugin function`
            );
          }
        } catch (error) {
          fastify.log.error(
            {
              filePath: fullPath,
              error: {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
            },
            `Failed to load route from ${fullPath}`
          );
        }
      }
    }
  } catch (error) {
    fastify.log.error(
      {
        dirPath,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      `Error loading routes from directory ${dirPath}`
    );
  }
}

function determineRoutePath(filePath: string, _basePath: string): string {
  // Extract route path from file structure
  // Example: src/routes/v1/users/index.ts -> /users
  // Example: src/routes/v1/users/[id].ts -> /users/:id

  const relativePath = filePath.replace(/.*\/routes\/v\d+\//, '').replace(/\.(ts|js)$/, '');

  let routePath = relativePath
    .split(path.sep)
    .map(segment => {
      // Handle dynamic routes: [id] -> :id
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return `:${segment.slice(1, -1)}`;
      }
      // Skip index files
      if (segment === 'index') {
        return '';
      }
      return segment;
    })
    .filter(Boolean)
    .join('/');

  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath;
  }

  return routePath;
}

export const loadRoutes: FastifyPluginAsync<RouteLoaderOptions> = async (fastify, _options) => {
  const routesDir = join(process.cwd(), 'src', 'routes');

  try {
    fastify.log.info({ routesDir }, 'Loading routes from directory');
    await loadRoutesFromDirectory(fastify, routesDir);
    fastify.log.info('All routes loaded successfully');
  } catch (error) {
    fastify.log.error(
      {
        routesDir,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      'Failed to load routes'
    );
    throw error;
  }
};
