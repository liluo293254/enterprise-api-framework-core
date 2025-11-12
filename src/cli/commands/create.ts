import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';

export interface CreateProjectOptions {
  template?: string;
  skipInstall?: boolean;
}

interface ProjectAnswers {
  name: string;
  description: string;
  port: string;
  databaseUrl: string;
  installDeps?: boolean;
}

interface OverwriteAnswer {
  overwrite: boolean;
}

export async function createProject(
  projectName?: string,
  options: CreateProjectOptions = {}
): Promise<void> {
  // Collect project information
  const answers = await inquirer.prompt<ProjectAnswers>([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName || 'my-api-project',
      validate: (input: string): boolean | string => {
        if (!input.trim()) {
          return 'Project name is required';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'Enterprise API project',
    },
    {
      type: 'input',
      name: 'port',
      message: 'Server port:',
      default: '3000',
      validate: (input: string): boolean | string => {
        const port = parseInt(input, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return 'Port must be a number between 1 and 65535';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'databaseUrl',
      message: 'Database URL:',
      default: 'mysql://user:password@localhost:3306/mydb',
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies?',
      default: true,
      when: () => !options.skipInstall,
    },
  ]);

  const projectPath = path.resolve(answers.name);

  // Check if directory exists
  try {
    await fs.access(projectPath);
    const overwrite = await inquirer.prompt<OverwriteAnswer>([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${answers.name} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite.overwrite) {
      console.log('Cancelled.');
      return;
    }

    await fs.rm(projectPath, { recursive: true });
  } catch {
    // Directory doesn't exist, continue
  }

  // Create project structure
  await createProjectStructure(projectPath, answers);

  console.log(`\n✓ Project created successfully at ${projectPath}`);
  console.log('\nNext steps:');
  console.log(`  cd ${answers.name}`);
  if (answers.installDeps) {
    console.log('  npm install');
  }
  console.log('  npm run dev');
}

async function createProjectStructure(projectPath: string, config: ProjectAnswers): Promise<void> {
  // Create directories
  const directories = [
    'src/routes/v1',
    'src/plugins',
    'src/services',
    'src/utils',
    'src/lib',
    'tests',
    'prisma',
  ];

  for (const dir of directories) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }

  // Generate files
  await generatePackageJson(projectPath, config);
  await generateTsConfig(projectPath);
  await generateEnvExample(projectPath, config);
  await generatePrismaSchema(projectPath, config);
  await generateAppFile(projectPath, config);
  await generateExampleRoute(projectPath);
  await generateReadme(projectPath, config);
  await generateGitIgnore(projectPath);
}

async function generatePackageJson(projectPath: string, config: ProjectAnswers): Promise<void> {
  const content = `{
  "name": "${config.name}",
  "version": "1.0.0",
  "description": "${config.description}",
  "main": "dist/app.js",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \\"src/**/*.ts\\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/swagger": "^8.12.0",
    "@fastify/swagger-ui": "^1.9.3",
    "@fastify/cors": "^8.4.0",
    "@fastify/helmet": "^11.1.1",
    "@prisma/client": "^5.7.1",
    "@sinclair/typebox": "^0.32.15",
    "@fastify/type-provider-typebox": "^3.4.0",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "pino": "^8.16.2",
    "pino-pretty": "^10.2.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "prisma": "^5.7.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
`;

  await fs.writeFile(path.join(projectPath, 'package.json'), content);
}

async function generateTsConfig(projectPath: string): Promise<void> {
  const content = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
`;

  await fs.writeFile(path.join(projectPath, 'tsconfig.json'), content);
}

async function generateEnvExample(projectPath: string, config: ProjectAnswers): Promise<void> {
  const content = `# Server Configuration
PORT=${config.port}
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
DATABASE_URL="${config.databaseUrl}"

# API Configuration
API_VERSION=v1
API_BASE_PATH=/api

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
`;

  await fs.writeFile(path.join(projectPath, '.env.example'), content);
}

async function generatePrismaSchema(projectPath: string, _config: ProjectAnswers): Promise<void> {
  const content = `// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  await fs.writeFile(path.join(projectPath, 'prisma/schema.prisma'), content);
}

async function generateAppFile(projectPath: string, config: ProjectAnswers): Promise<void> {
  const content = `import Fastify from 'fastify';
import { buildApp } from './app';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
    const app = await buildApp(server);
    const port = parseInt(process.env.PORT || '${config.port}', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(\`Server listening on http://\${host}:\${port}\`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
`;

  await fs.writeFile(path.join(projectPath, 'src/app.ts'), content);
}

async function generateExampleRoute(projectPath: string): Promise<void> {
  const routeContent = `import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const HealthResponse = Type.Object({
  status: Type.String(),
  timestamp: Type.String(),
});

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: HealthResponse,
        },
      },
    },
    async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    }
  );
};

export default healthRoutes;
`;

  await fs.writeFile(path.join(projectPath, 'src/routes/v1/health.ts'), routeContent);
}

async function generateReadme(projectPath: string, config: ProjectAnswers): Promise<void> {
  const content = `# ${config.name}

${config.description}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Setup environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. Setup database:
\`\`\`bash
npx prisma generate
npx prisma migrate dev
\`\`\`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

## API Documentation

Once the server is running, visit http://localhost:${config.port}/api-docs for Swagger UI.

## Project Structure

\`\`\`
src/
├── routes/     # API routes
├── plugins/    # Fastify plugins
├── services/   # Business logic
├── utils/      # Utility functions
└── lib/        # Library code
\`\`\`

## Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm test\` - Run tests
- \`npm run lint\` - Lint code
- \`npm run format\` - Format code
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), content);
}

async function generateGitIgnore(projectPath: string): Promise<void> {
  const content = `node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), content);
}
