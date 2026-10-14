# Product Requirements Document (PRD)
## Feature: Two-Factor Authentication (2FA) for Tenant Login

### Overview
To enhance security for our Enterprise customers (e.g. CICOD SaaS), we are introducing mandatory Two-Factor Authentication (2FA) for all tenant administrator accounts. Users will receive a 6-digit OTP via Email upon entering their correct password.

### User Roles
- **Tenant Admin**: Can log in, but will be prompted for 2FA.
- **Standard User**: Can log in without 2FA (for now).

### Requirements
1. The system must support Email-based OTP delivery.
2. The OTP should expire after 5 minutes.
3. Users get a maximum of 3 attempts to enter the OTP before the account is temporarily locked for 15 minutes.
4. The 2FA screen should have a "Resend Code" button, which can only be clicked once every 60 seconds.

### Technical Constraints
- Must integrate with the existing Next.js frontend login flow.
- Backend OTP generation should use crypto-secure random generation.
