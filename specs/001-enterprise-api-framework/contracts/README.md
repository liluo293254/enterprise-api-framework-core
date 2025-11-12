# API Contracts

This directory contains OpenAPI/Swagger specifications for APIs built with the Enterprise API Framework.

## Structure

- `openapi-template.yaml`: Template OpenAPI 3.0 specification with example endpoints
- `README.md`: This file

## Usage

1. Copy `openapi-template.yaml` to your API project
2. Customize the specification with your actual API endpoints
3. The framework will automatically generate Swagger documentation from this specification
4. Use the specification to generate TypeScript types and validation schemas

## OpenAPI Specification Format

All API contracts must follow OpenAPI 3.0 specification format. The framework uses these specifications to:

- Generate automatic API documentation (Swagger UI)
- Validate request/response schemas
- Generate TypeScript types
- Provide API testing utilities

## Example Endpoints

The template includes example endpoints for:
- Health check (`/health`)
- User management (`/users`, `/users/{id}`)

Replace these with your actual API endpoints.

## Schema Definitions

Common schemas are defined in the `components/schemas` section:
- `HealthResponse`: Health check response format
- `User`: User entity schema
- `CreateUserRequest`: User creation request schema
- `UpdateUserRequest`: User update request schema
- `ErrorResponse`: Standardized error response format

## Security

The template includes JWT Bearer token authentication. Customize the security schemes based on your authentication requirements.

