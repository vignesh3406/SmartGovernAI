# SmartGov AI - Phase 1
## Authentication & User Management

You are a Senior Software Architect and Lead Full Stack Engineer with 15+ years of experience building enterprise-level applications.

You are responsible for implementing ONLY Phase 1 of SmartGov AI.

DO NOT implement any future modules.

This project will continue for multiple phases, so the architecture must be scalable and maintainable.

=========================================================
PROJECT OVERVIEW
=========================================================

Project Name

SmartGov AI
Intelligent Public Grievance Redressal & Civic Management System

Purpose

SmartGov AI is an AI-powered government complaint management platform where citizens can report civic issues, officers resolve them, and administrators monitor overall performance.

The final project will include

• React Frontend
• Django REST Backend
• Supabase PostgreSQL
• Supabase Storage
• Gemini AI
• OpenStreetMap
• Gmail SMTP

For this phase ONLY implement Authentication.

=========================================================
TECH STACK
=========================================================

Frontend

React 19

Vite

React Router DOM

Tailwind CSS

Axios

React Hook Form

Zod Validation

React Hot Toast

Lucide React Icons

Context API

Backend

Python 3.13

Django 5

Django REST Framework

Simple JWT

django-filter

drf-spectacular

Supabase PostgreSQL

Psycopg2

Pillow

python-decouple

Database

Supabase PostgreSQL

Authentication

JWT Authentication

Refresh Tokens

Role Based Access

Email

Gmail SMTP

Development

VS Code

Git

GitHub

Postman

=========================================================
PROJECT STRUCTURE
=========================================================

Frontend

src

components

pages

layouts

hooks

services

contexts

utils

constants

routes

assets

Backend

apps

accounts

common

config

=========================================================
ARCHITECTURE
=========================================================

Follow

Clean Architecture

SOLID Principles

DRY

KISS

Separation of Concerns

Use

Services

Serializers

ViewSets

Permissions

Reusable Components

Custom Hooks

Context API

NO business logic inside React Components.

NO business logic inside Django Views.

Business logic must go inside service layer.

=========================================================
AUTHENTICATION FLOW
=========================================================

Citizen Registers

↓

Validate Input

↓

Hash Password

↓

Create User

↓

Generate Verification Token

↓

Send Verification Email

↓

User Clicks Verification Link

↓

Email Verified

↓

User Login

↓

JWT Token Generated

↓

Frontend Stores Access Token

↓

Protected Routes

↓

Dashboard

=========================================================
ROLES
=========================================================

Citizen

Officer

Admin

Default role

Citizen

Only Admin can create Officer accounts.

Admin account should be seedable.

=========================================================
FEATURES
=========================================================

Registration

Login

Logout

Email Verification

Forgot Password

Reset Password

Refresh Token

Profile

Update Profile

Change Password

Role Based Authentication

JWT Authentication

Protected Routes

Auto Login

Auto Logout

Persistent Login

=========================================================
VALIDATION RULES
=========================================================

Registration

Name

Minimum 3 characters

Maximum 50 characters

Email

Unique

Valid email

Password

Minimum 8 characters

Must contain

Uppercase

Lowercase

Number

Special Character

Phone

Optional

Valid format

=========================================================
USER MODEL
=========================================================

Fields

UUID

Full Name

Email

Password

Phone

Role

Profile Picture

Is Verified

Is Active

Created At

Updated At

=========================================================
BACKEND REQUIREMENTS
=========================================================

Create

Models

Serializers

ViewSets

Services

Permissions

Signals

Email Service

JWT Configuration

Custom User Model

Custom Manager

Pagination

Exception Handler

Response Formatter

Environment Variables

=========================================================
API ENDPOINTS
=========================================================

POST

/api/auth/register/

POST

/api/auth/login/

POST

/api/auth/logout/

POST

/api/auth/token/refresh/

GET

/api/auth/verify-email/<token>/

POST

/api/auth/forgot-password/

POST

/api/auth/reset-password/

GET

/api/auth/profile/

PUT

/api/auth/profile/

PUT

/api/auth/change-password/

=========================================================
RESPONSE FORMAT
=========================================================

Always return

success

message

data

errors

Example

{
    "success": true,
    "message": "Login successful",
    "data": {
        ...
    },
    "errors": null
}

=========================================================
ERROR HANDLING
=========================================================

Proper Status Codes

400

401

403

404

409

422

500

Handle

Duplicate Email

Wrong Password

Expired Token

Invalid Token

Unauthorized

Forbidden

=========================================================
REACT REQUIREMENTS
=========================================================

Pages

Landing

Login

Register

Forgot Password

Reset Password

Verify Email

Profile

404

Layouts

Public Layout

Authenticated Layout

Components

Navbar

Sidebar

Protected Route

Loading Spinner

Form Components

Toast Notifications

React Context

Authentication Context

Store

Access Token

User

Role

Loading State

=========================================================
UI DESIGN
=========================================================

Theme

Modern Government Dashboard

Primary

Blue

Secondary

Teal

Accent

Orange

Cards

Rounded

Glassmorphism

Animations

Framer Motion ready

Responsive

Desktop

Tablet

Mobile

Dark Mode Ready

=========================================================
SECURITY
=========================================================

Hash Passwords

JWT

Refresh Token

Role Based Access

Protected APIs

Environment Variables

Never expose secrets.

=========================================================
TESTING
=========================================================

Provide

Postman Collection

API Testing Steps

Frontend Testing Steps

=========================================================
OUTPUT
=========================================================

Generate complete production-ready code.

Include

Folder structure

Every file

Every API

Every serializer

Every service

Every model

Every React page

Every component

Every context

Every hook

Every route

Migration files

Environment variables

Setup instructions

Run instructions

Testing instructions

Explain every important decision.

Do NOT generate placeholder code.

Do NOT skip files.

Do NOT leave TODO comments.

Everything should be fully functional.

IMPORTANT

This is ONLY Phase 1.

DO NOT implement

Complaints

Departments

AI

Notifications

Feedback

Maps

Officer Dashboard

Admin Dashboard

Reports

Stop immediately after Authentication is fully completed.