# Quick Start Guide: Enterprise API Framework

**Framework Version**: 1.0.0  
**Last Updated**: 2025-11-12

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: LTS version (18.x or higher)
- **npm** or **pnpm**: Package manager
- **MySQL**: 8.0 or higher (for database)
- **Git**: Version control

## Installation

### Step 1: Install Framework CLI (Future)

Once the framework is published, install it globally:

```bash
npm install -g @enterprise-api-framework/cli
```

### Step 2: Create New Project

Generate a new API project:

```bash
api-framework create my-api-project
cd my-api-project
```

This will create a project structure with:
- TypeScript configuration
- Fastify setup
- Prisma schema
- Example routes
- Configuration files

### Step 3: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 4: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# API Configuration
API_VERSION=v1
API_BASE_PATH=/api

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
```

### Step 5: Setup Database

Initialize Prisma and run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Step 6: Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Your First API Endpoint

### Step 1: Create Route File

Create a new route file in `src/routes/v1/users/index.ts`:

```typescript
import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, Static } from '@sinclair/typebox';

const GetUsersResponse = Type.Object({
  users: Type.Array(Type.Object({
    id: Type.Number(),
    name: Type.String(),
    email: Type.String(),
  })),
});

type GetUsersResponseType = Static<typeof GetUsersResponse>;

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/users',
    {
      schema: {
        description: 'Get all users',
        tags: ['users'],
        response: {
          200: GetUsersResponse,
        },
      },
    },
    async (request, reply) => {
      // Your business logic here
      return {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
        ],
      };
    }
  );
};

export default usersRoutes;
```

### Step 2: Register Route

The route will be automatically discovered if placed in the `src/routes/v1/` directory.

### Step 3: Test Your Endpoint

```bash
curl http://localhost:3000/api/v1/users
```

Or visit the Swagger UI at `http://localhost:3000/api-docs` to see your endpoint documented automatically.

## Project Structure

```
my-api-project/
├── src/
│   ├── routes/           # API routes
│   │   └── v1/          # API version 1
│   │       └── users/   # User endpoints
│   ├── plugins/         # Fastify plugins
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── app.ts           # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── contracts/           # OpenAPI specifications
├── tests/               # Test files
├── .env                 # Environment variables
└── package.json
```

## Key Features

### Automatic Swagger Documentation

Your API documentation is automatically generated from your route schemas. Visit `/api-docs` to see the interactive Swagger UI.

### Type-Safe Routes

Using TypeBox, your routes are fully type-safe with automatic TypeScript inference:

```typescript
fastify.withTypeProvider<TypeBoxTypeProvider>().get(
  '/users/:id',
  {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      response: {
        200: UserResponse,
      },
    },
  },
  async (request, reply) => {
    // request.params.id is typed as number
    const user = await getUserById(request.params.id);
    return user;
  }
);
```

### Database Access with Prisma

```typescript
import { prisma } from '@/lib/prisma';

const users = await prisma.user.findMany({
  where: { active: true },
  select: { id: true, name: true, email: true },
});
```

### Error Handling

The framework provides standardized error handling:

```typescript
import { NotFoundError } from '@/errors';

if (!user) {
  throw new NotFoundError('User not found');
}
```

This automatically returns a properly formatted error response:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "timestamp": "2025-11-12T10:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Logging

Structured logging with correlation IDs:

```typescript
fastify.log.info({ userId: user.id }, 'User created');
```

Logs are automatically formatted and include correlation IDs for request tracing.

## Development Workflow

### Hot Reload

The development server supports hot reload. Changes to your code will automatically restart the server.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_user_table

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Next Steps

1. **Read the Documentation**: Check out the full documentation for advanced features
2. **Explore Examples**: Look at the example routes in `src/routes/v1/`
3. **Customize Configuration**: Adjust settings in `.env` and configuration files
4. **Add Authentication**: Implement JWT or OAuth2 authentication
5. **Add More Routes**: Create additional endpoints following the same patterns

## Getting Help

- **Documentation**: [Framework Documentation URL]
- **Issues**: [GitHub Issues URL]
- **Community**: [Community Forum URL]

## Common Issues

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```env
PORT=3001
```

### Database Connection Error

Ensure MySQL is running and the connection string in `.env` is correct:

```env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

### Prisma Client Not Generated

Run Prisma generate:

```bash
npx prisma generate
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment variables
2. Build the application: `npm run build`
3. Run migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`

See the deployment guide for more details.

