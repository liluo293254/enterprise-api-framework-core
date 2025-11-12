# Data Model: Enterprise API Framework

**Feature**: Enterprise High-Performance Backend API Development Framework  
**Date**: 2025-11-12  
**Status**: Complete

## Overview

This document defines the core data models and entities for the enterprise API framework. These models represent the framework's internal structure and configuration.

## Core Entities

### Framework Configuration

**Entity**: `FrameworkConfig`

**Purpose**: Stores framework-level configuration settings for a project.

**Fields**:
- `projectName` (string, required): Name of the API project
- `version` (string, required): API version (semver format)
- `basePath` (string, default: "/api"): Base path for all API endpoints
- `port` (number, default: 3000): HTTP server port
- `host` (string, default: "0.0.0.0"): HTTP server host
- `environment` (enum: "development" | "staging" | "production", required): Environment name
- `swagger` (object): Swagger/OpenAPI configuration
  - `enabled` (boolean, default: true): Enable Swagger documentation
  - `path` (string, default: "/api-docs"): Swagger UI path
  - `info` (object): API information
    - `title` (string): API title
    - `description` (string): API description
    - `version` (string): API version
- `cors` (object): CORS configuration
  - `enabled` (boolean, default: true): Enable CORS
  - `origin` (string | string[] | boolean): Allowed origins
  - `credentials` (boolean, default: true): Allow credentials
- `database` (object): Database configuration
  - `provider` (enum: "mysql", required): Database provider
  - `url` (string, required): Database connection URL
  - `poolSize` (number, default: 10): Connection pool size
- `logging` (object): Logging configuration
  - `level` (enum: "trace" | "debug" | "info" | "warn" | "error" | "fatal", default: "info")
  - `pretty` (boolean, default: false): Pretty print logs (development only)
- `rateLimit` (object): Rate limiting configuration
  - `enabled` (boolean, default: true): Enable rate limiting
  - `max` (number, default: 100): Maximum requests per window
  - `timeWindow` (string, default: "1 minute"): Time window

**Validation Rules**:
- `projectName` must be a valid identifier (alphanumeric, hyphens, underscores)
- `version` must follow semantic versioning (x.y.z)
- `port` must be between 1 and 65535
- `database.url` must be a valid database connection string

**State Transitions**: None (static configuration)

### API Route Definition

**Entity**: `RouteDefinition`

**Purpose**: Represents an API endpoint definition with its metadata.

**Fields**:
- `path` (string, required): Route path (e.g., "/users/:id")
- `method` (enum: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", required): HTTP method
- `version` (string, default: "v1"): API version
- `handler` (function, required): Route handler function
- `schema` (object): Request/response schema
  - `querystring` (object, optional): Query string schema
  - `params` (object, optional): Path parameters schema
  - `body` (object, optional): Request body schema
  - `response` (object, optional): Response schema
- `tags` (string[], optional): OpenAPI tags for grouping
- `summary` (string, optional): Route summary for documentation
- `description` (string, optional): Route description for documentation
- `auth` (object, optional): Authentication requirements
  - `required` (boolean, default: false): Authentication required
  - `roles` (string[], optional): Required roles
- `rateLimit` (object, optional): Route-specific rate limiting
  - `max` (number): Maximum requests per window
  - `timeWindow` (string): Time window

**Validation Rules**:
- `path` must start with "/"
- `path` parameters must be valid (e.g., ":id", not "id")
- `handler` must be a function
- `schema` must be valid JSON Schema

**State Transitions**: None (static route definitions)

### API Specification

**Entity**: `APISpecification`

**Purpose**: Complete OpenAPI specification for the API.

**Fields**:
- `openapi` (string, required): OpenAPI version (e.g., "3.0.0")
- `info` (object, required): API information
  - `title` (string, required): API title
  - `version` (string, required): API version
  - `description` (string, optional): API description
  - `contact` (object, optional): Contact information
  - `license` (object, optional): License information
- `servers` (array, optional): Server URLs
- `paths` (object, required): API paths and operations
- `components` (object, optional): Reusable components
  - `schemas` (object, optional): Data models
  - `responses` (object, optional): Reusable responses
  - `parameters` (object, optional): Reusable parameters
  - `securitySchemes` (object, optional): Security schemes
- `security` (array, optional): Global security requirements
- `tags` (array, optional): API tags

**Validation Rules**:
- Must conform to OpenAPI 3.0 specification
- All referenced schemas must be defined
- All paths must have at least one operation

**State Transitions**: 
- Generated from route definitions
- Updated when routes change
- Versioned for API versioning

### Database Schema (Prisma)

**Entity**: `PrismaSchema`

**Purpose**: Prisma schema definition for database models.

**Fields**:
- `datasource` (object, required): Database connection configuration
  - `provider` (enum: "mysql", required): Database provider
  - `url` (string, required): Connection URL (environment variable)
- `generator` (object, required): Prisma Client generator
  - `provider` (string, default: "prisma-client-js"): Generator provider
  - `output` (string, optional): Output path
- `models` (array, required): Database models
  - Each model contains:
    - `name` (string, required): Model name
    - `fields` (array, required): Model fields
      - `name` (string, required): Field name
      - `type` (string, required): Field type
      - `attributes` (array, optional): Field attributes (@id, @unique, @default, etc.)
    - `relations` (array, optional): Model relations

**Validation Rules**:
- Model names must be PascalCase
- Field names must be camelCase
- Relations must be properly defined
- Primary keys must be defined

**State Transitions**:
- Created during project scaffolding
- Modified via Prisma migrations
- Migrated to database via Prisma Migrate

### Error Response

**Entity**: `ErrorResponse`

**Purpose**: Standardized error response format.

**Fields**:
- `error` (object, required): Error object
  - `code` (string, required): Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
  - `message` (string, required): Human-readable error message
  - `details` (object, optional): Additional error details
  - `timestamp` (string, required): ISO 8601 timestamp
  - `requestId` (string, required): Correlation ID for request tracing

**Validation Rules**:
- `code` must be a valid error code (uppercase, underscores)
- `message` must not expose sensitive information
- `timestamp` must be valid ISO 8601 format
- `requestId` must be a valid UUID or correlation ID

**State Transitions**: None (response format)

### Log Entry

**Entity**: `LogEntry`

**Purpose**: Structured log entry with correlation ID.

**Fields**:
- `level` (enum: "trace" | "debug" | "info" | "warn" | "error" | "fatal", required): Log level
- `time` (number, required): Unix timestamp in milliseconds
- `msg` (string, required): Log message
- `requestId` (string, optional): Correlation ID
- `method` (string, optional): HTTP method
- `url` (string, optional): Request URL
- `statusCode` (number, optional): HTTP status code
- `responseTime` (number, optional): Response time in milliseconds
- `err` (object, optional): Error object (if error log)
- `context` (object, optional): Additional context

**Validation Rules**:
- `level` must be a valid log level
- `time` must be a valid timestamp
- `msg` must be a non-empty string

**State Transitions**: Created on log events

## Relationships

### Framework Configuration → API Routes
- One-to-many: One configuration manages many routes
- Routes inherit configuration settings (base path, versioning)

### API Routes → API Specification
- Many-to-one: Many routes contribute to one OpenAPI specification
- Routes generate OpenAPI paths and operations

### Database Schema → Database Models
- One-to-many: One schema contains many models
- Models can have relations to other models

### Request → Log Entry
- One-to-many: One request can generate multiple log entries
- Log entries share the same correlation ID (requestId)

## Validation Rules Summary

### Framework Configuration
- Project name: alphanumeric, hyphens, underscores only
- Version: semantic versioning format (x.y.z)
- Port: 1-65535
- Database URL: valid connection string format

### Route Definitions
- Path: must start with "/"
- Path parameters: must use ":param" format
- HTTP methods: must be valid REST methods
- Schemas: must be valid JSON Schema

### API Specification
- Must conform to OpenAPI 3.0 specification
- All references must be resolvable
- Security schemes must be properly defined

### Database Schema
- Model names: PascalCase
- Field names: camelCase
- Relations: must be bidirectional and properly typed

## State Management

### Configuration State
- Loaded at application startup
- Validated on load
- Cached in memory
- Hot-reloadable in development mode

### Route State
- Registered at application startup
- Discovered from file system
- Cached in Fastify instance
- Can be reloaded in development mode

### Database State
- Managed by Prisma Migrate
- Version controlled via migration files
- Applied to database on deployment
- Rollback supported via migrations

## Notes

- All entities use TypeScript types for type safety
- Validation is performed using Zod schemas
- Database models use Prisma schema format
- API specifications use OpenAPI 3.0 format
- Error responses follow standardized format
- Log entries use Pino's structured logging format

