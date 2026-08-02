# SmartGov AI
## Phase 1.1 – User Management Foundation

The project foundation and infrastructure have already been completed.

DO NOT recreate the project.

DO NOT modify existing architecture.

Implement ONLY the User Management Foundation.

This phase should prepare the authentication system but should NOT implement login or registration yet.

=========================================================
OBJECTIVE
=========================================================

Create the complete user management architecture that future authentication features will use.

This includes:

• Custom User Model

• Roles

• Permissions

• Base Authentication Structure

• Profile Model

• Admin Configuration

No login APIs.

No registration APIs.

No JWT endpoints.

=========================================================
DATABASE
=========================================================

Use Supabase PostgreSQL.

Implement models only.

=========================================================
MODELS
=========================================================

Create

Role

Fields

- UUID
- Role Name
- Description
- Created At
- Updated At

---------------------------------------------------------

Create Custom User

Fields

- UUID
- Full Name
- Email (Unique)
- Phone
- Password
- Role (Foreign Key)
- Profile Image
- Is Verified
- Is Active
- Last Login
- Created At
- Updated At

Use AbstractBaseUser.

Create Custom User Manager.

Email should be username.

---------------------------------------------------------

Create UserProfile

Fields

- User
- Address
- City
- State
- Country
- Pincode
- Bio
- Created At
- Updated At

=========================================================
PERMISSIONS
=========================================================

Prepare reusable permissions.

Citizen Permission

Officer Permission

Admin Permission

Authenticated Permission

=========================================================
SERIALIZERS
=========================================================

Create serializers only.

No business logic.

=========================================================
SERVICES
=========================================================

Create Authentication Service.

Methods

- create_user()

- create_officer()

- create_admin()

- hash_password()

- validate_password()

Only structure.

=========================================================
ADMIN PANEL
=========================================================

Configure Django Admin.

Custom User Admin.

Role Admin.

Profile Admin.

=========================================================
REACT
=========================================================

Create authentication folder structure only.

pages/auth/

components/auth/

hooks/auth/

services/auth/

No UI implementation.

=========================================================
ROUTES
=========================================================

Prepare route placeholders

/login

/register

/verify-email

/forgot-password

/reset-password

/profile

=========================================================
VALIDATION
=========================================================

Prepare validation schemas.

Name

Email

Phone

Password

=========================================================
OUTPUT
=========================================================

Generate

Models

Managers

Admin Configuration

Permissions

Serializers

Services

Folder Structure

Migration Files

No Authentication APIs.

No Login.

No Registration.

No Email Verification.

Stop after User Management Foundation is complete.