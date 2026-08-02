# SmartGov AI
## Phase 0.2 – Infrastructure Configuration

You are continuing the SmartGov AI project.

The project foundation has already been completed.

⚠️ IMPORTANT

Do NOT recreate the project.

Do NOT modify the existing architecture.

Do NOT change folder structure.

Do NOT implement Authentication.

Do NOT implement Complaint Management.

Only configure and verify all external services and infrastructure.

=========================================================
OBJECTIVE
=========================================================

Prepare every external service required by the project so future modules can directly consume them.

No business logic.

Only configuration, reusable helpers, testing, and documentation.

=========================================================
SERVICES TO CONFIGURE
=========================================================

1. Supabase PostgreSQL

Configure database connection.

Read credentials from .env.

Test successful connection.

Implement reusable database configuration.

Do not create business models.

=========================================================

2. Supabase Storage Bucket

Configure Supabase Storage SDK.

Create reusable StorageService.

Support

• Upload Image

• Delete Image

• Get Public URL

• File Validation

Do NOT upload complaint images yet.

Only prepare reusable functions.

=========================================================

3. Django REST Framework

Configure

Default Authentication

Pagination

Filtering

Renderers

Parsers

Permissions

Exception Handling

Response Format

=========================================================

4. JWT Authentication Configuration

Configure

Simple JWT

Access Token Lifetime

Refresh Token Lifetime

Token Rotation

JWT Settings

No login APIs.

=========================================================

5. Swagger API Documentation

Configure drf-spectacular.

Expose

/api/schema/

/api/docs/

Configure project metadata.

=========================================================

6. Axios

Configure

Base URL

Request Interceptor

Response Interceptor

401 Handler

Error Handler

Timeout

=========================================================

7. Gmail SMTP

Configure

SMTP Settings

Reusable EmailService

HTML Email Templates Folder

Email Logging

Do NOT send emails.

=========================================================

8. Google Gemini

Configure

Gemini Client

Environment Variables

Reusable AIService

Prompt Builder

Retry Logic

Timeout

Error Handling

Do NOT generate AI responses.

=========================================================

9. Maps

Configure

Leaflet

OpenStreetMap

Nominatim

Reusable Map Component

Reusable Geolocation Utility

No complaint markers.

=========================================================

10. Logging

Configure

Application Logs

API Logs

Error Logs

Console Logs

Separate log files.

=========================================================

11. Global Error Handling

Create

Custom Exceptions

API Exception Handler

Validation Errors

404

500

Permission Errors

=========================================================

12. Environment Variables

Verify

Backend

SECRET_KEY

DEBUG

DATABASE_URL

SUPABASE_URL

SUPABASE_KEY

SUPABASE_BUCKET

GEMINI_API_KEY

EMAIL_HOST

EMAIL_PORT

EMAIL_HOST_USER

EMAIL_HOST_PASSWORD

JWT_SECRET

Frontend

VITE_API_URL

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

Validate missing variables.

=========================================================

13. Health Check APIs

Create

GET /api/health/

Response

{
    "status":"ok",
    "database":"connected",
    "storage":"connected",
    "gemini":"configured",
    "smtp":"configured"
}

This endpoint is ONLY for infrastructure testing.

=========================================================

14. Documentation

Generate

Environment Setup Guide

Supabase Setup Guide

Gemini Setup Guide

SMTP Setup Guide

Health Check Guide

=========================================================

15. Testing

Verify

✓ Django starts

✓ React starts

✓ PostgreSQL connects

✓ Storage connects

✓ Swagger loads

✓ JWT configured

✓ Axios configured

✓ SMTP configured

✓ Gemini configured

✓ Maps configured

=========================================================

OUTPUT

Provide

Updated Folder Structure

Files Created

Files Modified

Configuration Summary

Testing Instructions

Do NOT implement Authentication.

Do NOT create Users.

Do NOT create Complaints.

Do NOT create Business Models.

Stop after infrastructure is fully configured.