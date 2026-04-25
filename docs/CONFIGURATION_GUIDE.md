# Kharon Platform - Configuration Guide

## Overview

This document provides detailed instructions for configuring the Kharon Platform in dual mode with Google Sheets as the primary backend and PostgreSQL as the mirror. It covers all necessary environment variables and configuration options.

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
# General Configuration
KHARON_MODE=production
NODE_ENV=production

# Store Backend (Dual Mode with Google Sheets Primary)
STORE_BACKEND=dual

# Session Configuration
SESSION_KEYS=your-very-long-and-secure-session-key-change-me-immediately
SESSION_COOKIE_NAME=kharon_session
SESSION_TTL_SECONDS=28800

# Super Admin Configuration
SUPER_ADMIN_EMAILS=admin@example.com,your-email@example.com

# Google Authentication Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback

# Google Sheets Configuration (Primary Backend)
KHARON_RAILS_MODE=production
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_DATA\n-----END PRIVATE KEY-----\n"

# PostgreSQL Configuration (Mirror Backend)
POSTGRES_URL=postgresql://username:password@localhost:5432/kharon_platform_mirror
POSTGRES_DIRECT_URL=postgresql://username:password@localhost:5432/kharon_platform_mirror
POSTGRES_SCHEMA=public
POSTGRES_SSL_MODE=require
POSTGRES_APPLICATION_NAME=kharon-api

# Email Configuration
GMAIL_SENDER_ADDRESS=your-noreply-address@your-domain.com

# Cloudflare Access (Optional)
CF_ACCESS_AUD=your_cloudflare_access_audience
CF_ACCESS_JWKS_URL=https://your-domain.cloudflareaccess.com/cdn-cgi/access/certs
CF_ACCESS_ISSUER=https://your-domain.cloudflareaccess.com
CF_ACCESS_JWKS_JSON={}
CF_ACCESS_ENABLED=false

# Logging
LOG_LEVEL=info
```

### Dual Mode Specific Configuration

For dual mode operation, these are the key variables:

```env
# Set to dual to enable dual backend operation
STORE_BACKEND=dual

# Primary backend (what users interact with primarily)
# In your case, keep as 'sheets' to maintain Google Sheets as primary
DUAL_PRIMARY_BACKEND=sheets

# Secondary backend (mirror)
DUAL_SECONDARY_BACKEND=postgres

# Consistency check interval (in seconds) - how often to check for consistency
DUAL_CONSISTENCY_CHECK_INTERVAL=300

# Log level for dual mode operations
DUAL_LOG_LEVEL=info

# Whether to fail operations if mirror fails (false = primary continues anyway)
DUAL_FAIL_ON_MIRROR_ERROR=false
```

## Google Sheets Setup

### Setting Up Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API and Google Drive API
4. Go to "Credentials" and create a new service account
5. Download the JSON key file
6. Extract the `client_email` and `private_key` from the JSON file

### Sharing Your Spreadsheet

1. Create your Google Sheet in Google Drive
2. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
3. Share the spreadsheet with your service account email
4. Give the service account "Editor" permissions

## PostgreSQL Setup

### Creating the Database

If you haven't already created a PostgreSQL database:

```sql
-- Create the database
CREATE DATABASE kharon_platform_mirror;

-- Create a user
CREATE USER kharon_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kharon_platform_mirror TO kharon_user;

-- Connect to the database
\c kharon_platform_mirror;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### PostgreSQL Connection String Format

The PostgreSQL connection string follows this format:

```
postgresql://username:password@host:port/database_name
```

For local development:
```
postgresql://kharon_user:your_password@localhost:5432/kharon_platform_mirror
```

For remote hosting (like AWS RDS, Heroku, etc.), use the connection string provided by your hosting service.

## Application Configuration

### API Configuration

The API application uses the environment variables to configure the dual mode operation:

```typescript
// In apps/api/src/config.ts (simplified)
export function createRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  // ... other config ...
  
  const storeBackend = parseStoreBackend(env, mode); // This will be "dual"
  
  const config: RuntimeConfig = {
    // ... other properties ...
    storeBackend, // "dual"
    postgres: {
      connectionString: envFirst(env, ["POSTGRES_URL", "DATABASE_URL"]),
      directUrl: envFirst(env, ["POSTGRES_DIRECT_URL"]),
      schema: envFirst(env, ["POSTGRES_SCHEMA"]) || "public",
      sslMode: parsePostgresSslMode(env),
      applicationName: envFirst(env, ["POSTGRES_APPLICATION_NAME"]) || "kharon-api"
    }
  };
  
  return config;
}
```

### Store Factory Configuration

The store factory uses the configuration to create the appropriate store:

```typescript
// In apps/api/src/store/factory.ts (relevant parts)
export function createWorkbookStore(config: RuntimeConfig): WorkbookStore {
  switch (config.storeBackend) {
    case "dual":
      return createDualWorkbookStore({
        config: {
          // Primary backend depends on mode - local for dev, sheets for prod
          primaryBackend: config.mode === "production" ? "sheets" : "local",
          mirrorBackend: "postgres"
        },
        createBackendStore: (backend) => createBackendStore(backend, config)
      });
    // ... other cases ...
  }
}
```

## Docker Configuration (Optional)

If using Docker, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: kharon_postgres
    environment:
      POSTGRES_DB: kharon_platform_mirror
      POSTGRES_USER: kharon_user
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    build: ./apps/api
    container_name: kharon_api
    ports:
      - "8787:8787"
    environment:
      # Use the host.docker.internal to reach the postgres container from the api
      POSTGRES_URL: postgresql://kharon_user:your_secure_password@host.docker.internal:5432/kharon_platform_mirror
      # Other environment variables go here
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

## Testing Your Configuration

### Verification Steps

1. **Check Google Sheets Access**:
   - Verify your service account can read/write to the spreadsheet
   - Test with a simple script that accesses the sheet

2. **Check PostgreSQL Connection**:
   - Test connecting to your PostgreSQL instance
   - Verify the database exists and has proper permissions

3. **Run the Application**:
   - Start your application with the dual mode configuration
   - Perform operations and monitor logs for both backends

4. **Monitor Logs**:
   - Look for successful operations on both backends
   - Check for consistency between systems

### Sample Test Script

Create a simple test to verify configuration:

```javascript
// test-config.js
require('dotenv').config();

// Check if required variables are set
const requiredVars = [
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_CLIENT_ID',
  'POSTGRES_URL',
  'STORE_BACKEND'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('✓ All required environment variables are set');

// Verify store backend is dual
if (process.env.STORE_BACKEND !== 'dual') {
  console.warn('⚠ Store backend is not set to "dual"');
} else {
  console.log('✓ Store backend configured for dual mode');
}

// Verify primary backend is sheets
if (process.env.DUAL_PRIMARY_BACKEND !== 'sheets') {
  console.warn('⚠ Primary backend is not set to "sheets"');
} else {
  console.log('✓ Primary backend configured as Google Sheets');
}

console.log('Configuration verification complete');
```

## Troubleshooting Common Issues

### Issue: Google Sheets Authentication Failure
- **Symptom**: Operations fail on the sheets backend
- **Cause**: Incorrect service account credentials or permissions
- **Solution**: Verify the service account email and private key, ensure the spreadsheet is shared with the service account

### Issue: PostgreSQL Connection Failure
- **Symptom**: Mirror operations fail but primary operations continue
- **Cause**: Incorrect connection string or PostgreSQL not running
- **Solution**: Verify the PostgreSQL connection string and ensure PostgreSQL is running and accessible

### Issue: Data Inconsistencies
- **Symptom**: Logs show differences between backends
- **Cause**: Differences in data representation between systems
- **Solution**: Check data transformation logic and ensure both backends handle data consistently

## Security Considerations

### Protecting Credentials
- Store environment variables securely
- Never commit credentials to version control
- Use environment-specific configurations
- Rotate credentials periodically

### Database Security
- Use strong passwords for PostgreSQL
- Configure SSL/TLS for database connections
- Restrict database access to necessary IPs only
- Regularly update PostgreSQL to latest security patches

## Conclusion

This configuration guide provides all necessary steps to set up the Kharon Platform in dual mode with Google Sheets as the primary backend. The configuration maintains all current functionality while providing redundancy and preparing for future migration to PostgreSQL as the primary backend.

Remember to thoroughly test the configuration before deploying to production, and monitor logs regularly to ensure both backends are operating correctly.