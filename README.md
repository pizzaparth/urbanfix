# Smart Digital Complaint Management and Public Transparency System

This repository contains the full source code and documentation for the Smart Digital Complaint Management project.

## Project Structure
- **/mobile**: React Native / Expo application (Frontend). See [mobile/README.md](./mobile/README.md) for run instructions.
- **/backend**: Express.js REST API server. See [backend/README.md](./backend/README.md) for details.
- **/docs**: Documentation and presentation materials.
  - **docs/presentation/svg**: Contains all SVGs generated for the 10-slide presentation, covering system architecture, app UI mockups, workflows, and key features (e.g. swiping for Yes/No, OTP verification).
- **presentation_content.md**: The 10-slide presentation outline incorporating 2-3 SVGs per slide as per project requirements.

## Presentation & SVG Assets
All presentation slides include at least 2-3 SVGs showcasing the architecture, text labels, and UI workflows (including key features like swiping for yes/no). These assets are available in the `docs/presentation/svg` directory.

To generate the presentation PDF, refer to the outline in `presentation_content.md` and insert the generated SVGs.

## Dummy Credentials (development only)

Seed the accounts from `backend/` (never run against production; `seed:roles` refuses when `NODE_ENV=production`):

```
node seedAdmin.js        # original admin
npm run seed:roles       # one account per role, idempotent
```

| Role | Email | Password |
|------|-------|----------|
| Admin (original) | `admin@complaintsystem.gov` | `admin_password_123` |
| Admin | `admin@example.com` | `Passw0rd!123` |
| Supervisor | `supervisor@example.com` | `Passw0rd!123` |
| Field worker (Ward 1) | `field1@example.com` | `Passw0rd!123` |
| Field worker (Ward 2) | `field2@example.com` | `Passw0rd!123` |
| Researcher (aggregate only) | `researcher@example.com` | `Passw0rd!123` |
| Researcher (anonymised records) | `researcher-records@example.com` | `Passw0rd!123` |
| Citizen | self-register in the app | OTP sent by email (see backend console/email config) |

Citizens have no seeded account: register in the app and verify with the emailed OTP.
