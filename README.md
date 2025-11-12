# Enterprise API Framework

基于 Node.js、Fastify 和 TypeScript 构建的企业级高性能后端 API 开发框架。

## 特性

- 🚀 **高性能**: 基于 Fastify，最快的 Node.js Web 框架之一
- 📝 **API优先**: 自动生成 Swagger/OpenAPI 文档
- 🔄 **自动路由发现**: 从文件结构自动注册路由
- 🔒 **安全性**: 内置 CORS、Helmet 和安全最佳实践
- 🗄️ **数据库**: Prisma ORM 集成，支持 MySQL
- 📊 **可观测性**: 结构化日志记录，支持关联 ID
- ⚡ **TypeScript**: 完整的 TypeScript 支持，类型安全
- 🛠️ **CLI工具**: 项目脚手架工具，快速开发

## 快速开始

### 安装

```bash
npm install -g @enterprise-api-framework/core
```

### 创建新项目

使用 CLI 工具创建新项目：

```bash
api-framework create my-api-project
cd my-api-project
npm install
npm run dev
```

CLI 工具会引导您完成项目配置：
- 项目名称和描述
- 服务器端口配置
- 数据库连接 URL
- 其他配置选项

### 手动设置

如果您想手动设置项目：

1. **安装依赖**:
```bash
npm install
```

2. **配置环境变量**:
```bash
cp .env.example .env
# 编辑 .env 文件，配置您的设置
```

环境变量配置示例：
```env
# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# 数据库配置
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# API 配置
API_VERSION=v1
API_BASE_PATH=/api

# Swagger 配置
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
```

3. **设置数据库**:
```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev
```

4. **启动开发服务器**:
```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## 项目结构

```
src/
├── routes/          # API 路由（自动发现）
│   └── v1/          # API 版本 1
│       ├── health.ts        # 健康检查路由示例
│       └── users/           # 用户相关路由
│           ├── index.ts     # GET /api/v1/users
│           └── [id].ts      # GET /api/v1/users/:id
├── plugins/         # Fastify 插件
│   ├── route-loader.ts     # 路由加载器
│   ├── error-handler.ts     # 错误处理
│   └── correlation-id.ts    # 关联 ID
├── services/        # 业务逻辑层
├── utils/           # 工具函数
└── lib/             # 库代码
    ├── config.ts            # 配置管理
    ├── errors.ts            # 错误类定义
    └── prisma.ts            # Prisma 客户端
```

## 使用方法

### 创建路由

在 `src/routes/v1/` 目录下创建路由文件，框架会自动发现并注册：

**示例：创建用户路由 (`src/routes/v1/users/index.ts`)**

```typescript
import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

// 定义响应模式
const GetUsersResponse = Type.Object({
  users: Type.Array(Type.Object({
    id: Type.Number(),
    name: Type.String(),
    email: Type.String(),
  })),
});

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/users',
    {
      schema: {
        description: '获取所有用户',
        tags: ['users'],
        response: {
          200: GetUsersResponse,
        },
      },
    },
    async (request, reply) => {
      // 您的业务逻辑
      const users = await prisma.user.findMany();
      return { users };
    }
  );
};

export default usersRoutes;
```

**示例：创建带参数的路由 (`src/routes/v1/users/[id].ts`)**

```typescript
import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

const GetUserResponse = Type.Object({
  user: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    email: Type.String(),
  }),
});

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users/:id
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/users/:id',
    {
      schema: {
        description: '根据 ID 获取用户',
        tags: ['users'],
        params: Type.Object({
          id: Type.Number(),
        }),
        response: {
          200: GetUserResponse,
          404: Type.Object({
            error: Type.Object({
              code: Type.String(),
              message: Type.String(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('用户');
      }

      return { user };
    }
  );
};

export default userRoutes;
```

### 错误处理

框架提供了标准化的错误处理。使用预定义的错误类：

```typescript
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

// 资源未找到
if (!user) {
  throw new NotFoundError('用户');
}

// 验证错误
if (!email || !isValidEmail(email)) {
  throw new ValidationError('邮箱格式无效');
}

// 未授权
if (!isAuthenticated) {
  throw new UnauthorizedError('请先登录');
}
```

错误会自动格式化为标准响应：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "用户未找到",
    "timestamp": "2025-11-12T10:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 数据库访问

使用 Prisma Client 进行类型安全的数据库操作：

```typescript
import { prisma } from '@/lib/prisma';

// 查询所有用户
const users = await prisma.user.findMany({
  where: { active: true },
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// 创建用户
const newUser = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

// 更新用户
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' },
});

// 删除用户
await prisma.user.delete({
  where: { id: 1 },
});
```

### 请求验证

使用 TypeBox 定义请求验证模式：

```typescript
import { Type } from '@sinclair/typebox';

const CreateUserRequest = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
});

fastify.withTypeProvider<TypeBoxTypeProvider>().post(
  '/users',
  {
    schema: {
      body: CreateUserRequest,
      response: {
        201: GetUserResponse,
      },
    },
  },
  async (request, reply) => {
    const { name, email } = request.body; // 类型安全
    // ...
  }
);
```

### 日志记录

框架自动为每个请求生成关联 ID，并在日志中包含：

```typescript
// 日志会自动包含关联 ID
fastify.log.info({ userId: user.id }, '用户创建成功');

// 错误日志
fastify.log.error({ err: error, userId: user.id }, '创建用户失败');
```

日志格式：
```json
{
  "level": 30,
  "time": 1700000000000,
  "msg": "用户创建成功",
  "userId": 123,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## API 文档

启动服务器后，访问 `http://localhost:3000/api-docs` 查看交互式 Swagger UI。

所有路由的文档会根据您的 TypeBox schema 自动生成。

## 可用脚本

- `npm run dev` - 启动开发服务器（支持热重载）
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm test` - 运行测试
- `npm run test:watch` - 监视模式运行测试
- `npm run test:coverage` - 生成测试覆盖率报告
- `npm run lint` - 代码检查
- `npm run lint:fix` - 自动修复代码问题
- `npm run format` - 格式化代码
- `npm run format:check` - 检查代码格式
- `npm run type-check` - TypeScript 类型检查
- `npm run prisma:generate` - 生成 Prisma Client
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开 Prisma Studio

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `3000` |
| `HOST` | 服务器主机 | `0.0.0.0` |
| `NODE_ENV` | 运行环境 | `development` |
| `DATABASE_URL` | 数据库连接 URL | 必填 |
| `API_VERSION` | API 版本 | `v1` |
| `API_BASE_PATH` | API 基础路径 | `/api` |
| `SWAGGER_ENABLED` | 启用 Swagger | `true` |
| `SWAGGER_PATH` | Swagger UI 路径 | `/api-docs` |
| `LOG_LEVEL` | 日志级别 | `info` |

### CORS 配置

在 `.env` 文件中配置 CORS：

```env
# 允许所有来源
CORS_ORIGIN=true

# 或指定特定来源
CORS_ORIGIN=http://localhost:3000,https://example.com

# 允许携带凭证
CORS_CREDENTIALS=true
```

## 最佳实践

1. **路由组织**: 按功能模块组织路由文件，使用目录结构反映 API 结构
2. **类型安全**: 始终使用 TypeBox 定义请求/响应模式
3. **错误处理**: 使用框架提供的错误类，保持错误响应一致性
4. **日志记录**: 使用结构化日志，包含相关上下文信息
5. **数据库操作**: 使用 Prisma 进行类型安全的数据库操作
6. **代码组织**: 将业务逻辑放在 `services/` 目录，保持路由处理函数简洁

## 故障排除

### 路由未加载

确保路由文件：
- 位于 `src/routes/v1/` 目录下
- 导出默认的 FastifyPluginAsync 函数
- 文件扩展名为 `.ts` 或 `.js`

### 数据库连接失败

检查：
- `DATABASE_URL` 环境变量是否正确
- 数据库服务是否运行
- 网络连接是否正常

### Swagger 文档未显示

检查：
- `SWAGGER_ENABLED` 是否设置为 `true`
- 路由是否包含有效的 schema 定义
- 服务器是否正常启动

## 许可证

MIT
