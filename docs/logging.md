# 日志系统使用指南

框架集成了基于 [Pino](https://getpino.io/) 的详细日志记录系统，提供结构化的日志输出和丰富的上下文信息。

## 功能特性

- ✅ **结构化日志**：所有日志都是 JSON 格式，便于解析和分析
- ✅ **请求追踪**：自动记录所有 HTTP 请求的详细信息
- ✅ **性能监控**：记录请求响应时间和性能指标
- ✅ **错误追踪**：详细的错误日志，包含堆栈信息和上下文
- ✅ **开发友好**：开发环境使用彩色输出，生产环境可配置文件输出
- ✅ **可配置**：通过环境变量灵活配置日志级别和行为

## 配置

### 环境变量

```bash
# 日志级别: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# 日志文件路径（生产环境，可选）
LOG_FILE=./logs/app.log

# 是否启用请求日志
LOG_ENABLE_REQUEST=true

# 是否启用错误日志
LOG_ENABLE_ERROR=true

# 是否启用性能日志
LOG_ENABLE_PERFORMANCE=true
```

## 日志级别

- `trace`: 最详细的日志，用于调试
- `debug`: 调试信息，开发时使用
- `info`: 一般信息，记录应用运行状态
- `warn`: 警告信息，需要注意但不影响运行
- `error`: 错误信息，需要关注
- `fatal`: 致命错误，可能导致应用崩溃

## 自动日志记录

### HTTP 请求日志

框架自动记录所有 HTTP 请求：

```json
{
  "level": "info",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/api/v1/users",
  "statusCode": 200,
  "duration": 45,
  "responseTime": "45ms",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "msg": "← GET /api/v1/users 200 (45ms)"
}
```

### 错误日志

自动记录详细的错误信息：

```json
{
  "level": "error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "err": {
    "name": "ValidationError",
    "message": "Invalid input",
    "stack": "..."
  },
  "url": "/api/v1/users",
  "method": "POST",
  "query": {},
  "params": {},
  "body": {...},
  "msg": "Request error: Invalid input"
}
```

## 在代码中使用日志

### 基本用法

```typescript
import { FastifyInstance } from 'fastify';

export const myRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/example', async (request, reply) => {
    // 使用 fastify.log（已配置好的 logger）
    fastify.log.info('Processing request');
    
    // 带上下文的日志
    fastify.log.info(
      {
        userId: '123',
        action: 'get_user',
      },
      'User action performed'
    );
    
    return { success: true };
  });
};
```

### 使用日志辅助函数

```typescript
import { logPerformance, logDatabaseOperation, createRequestLogger } from '@/utils/logger-helpers';

export const myRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/example', async (request) => {
    const startTime = Date.now();
    
    // 记录性能
    const duration = Date.now() - startTime;
    logPerformance(fastify.log, 'process_request', duration, {
      requestId: request.requestId,
    });
    
    // 记录数据库操作
    logDatabaseOperation(
      fastify.log,
      'SELECT',
      'users',
      25,
      { userId: '123' }
    );
    
    // 创建带请求上下文的 logger
    const requestLogger = createRequestLogger(fastify.log, request);
    requestLogger.info('Request processed');
    
    return { success: true };
  });
};
```

### 使用独立的 Logger

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger();

logger.info('Application started');
logger.error({ err: error }, 'Something went wrong');
logger.debug({ data }, 'Debug information');
```

## 日志格式

### 开发环境

开发环境使用 `pino-pretty` 进行格式化输出，提供彩色和易读的日志：

```
[2024-01-15 10:30:45.123] INFO (12345): Starting application
    port: 3000
    host: "0.0.0.0"
    nodeEnv: "development"
```

### 生产环境

生产环境输出 JSON 格式的日志，便于日志收集和分析：

```json
{
  "level": 30,
  "time": 1705294245123,
  "pid": 12345,
  "hostname": "server-01",
  "env": "production",
  "msg": "Starting application",
  "port": 3000,
  "host": "0.0.0.0"
}
```

## 最佳实践

1. **使用适当的日志级别**
   - `debug`: 开发调试信息
   - `info`: 重要的业务操作
   - `warn`: 需要注意的情况
   - `error`: 错误和异常

2. **包含上下文信息**
   ```typescript
   logger.info(
     {
       userId: user.id,
       action: 'create_order',
       orderId: order.id,
     },
     'Order created'
   );
   ```

3. **不要在日志中记录敏感信息**
   - 密码、token、API keys 等会被自动隐藏或标记为 `[REDACTED]`

4. **使用 requestId 追踪请求**
   - 所有请求都有唯一的 `requestId`，便于追踪整个请求链路

5. **记录性能指标**
   - 使用 `logPerformance` 记录慢操作
   - 自动记录所有 HTTP 请求的响应时间

## 日志文件管理

生产环境可以配置日志文件输出：

```bash
LOG_FILE=./logs/app.log
```

日志文件会自动创建目录（如果不存在），并支持日志轮转（需要配置额外的工具如 `logrotate`）。

## 集成日志收集工具

由于日志是 JSON 格式，可以轻松集成到日志收集系统：

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** (Grafana Loki)
- **Datadog**
- **CloudWatch** (AWS)
- **其他支持 JSON 日志的工具**

## 示例

查看以下文件了解日志系统的实现：

- `src/lib/logger.ts` - Logger 配置和初始化
- `src/plugins/request-logger.ts` - HTTP 请求日志插件
- `src/utils/logger-helpers.ts` - 日志辅助函数
- `src/app.ts` - 应用启动日志
