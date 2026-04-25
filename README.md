# Kharon Platform - Next Generation

Welcome to the next-generation rebuild of the Kharon Platform, a comprehensive operational management system for fire detection, gas suppression, and security systems services.

## Overview

The Kharon Platform is designed to streamline operations for Kharon's clients by connecting administrative staff, dispatchers, field technicians, and clients in a unified workflow that ensures compliance, accountability, and operational efficiency.

This repository represents a complete rebuild of the existing system, following a clean architecture approach with enhanced security, scalability, and maintainability.

## Architecture

The platform follows a monorepo structure with clear separation of concerns:

```
kharon-platform/
├── apps/
│   ├── web/                 # Public marketing website (Next.js)
│   ├── portal/              # Operations portal (Next.js)
│   └── api/                 # API layer (Cloudflare Workers with Hono)
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── config/              # Configuration management
│   ├── validators/          # Zod validation schemas
│   ├── auth/                # Authentication and RBAC utilities
│   ├── ui/                  # Shared UI components
│   ├── data/                # Data access layer (PostgreSQL)
│   ├── integrations/        # External service integrations
│   └── documents/           # Document generation services
├── docs/
│   ├── audit/              # Audit documentation
│   └── product/            # Product definition
├── tests/                  # Test suite
└── scripts/                # Build and utility scripts
```

## Features

### Core Architecture
- **Clean Architecture**: Clear separation of concerns with domain, application, interface, and infrastructure layers
- **Type Safety**: Comprehensive TypeScript typing across all components
- **Validation**: Zod schemas for all data validation
- **Modularity**: Reusable packages for common functionality

### Security
- **Enhanced RBAC**: Granular permissions for different operations based on role
- **Server-Side Validation**: All operations validated server-side
- **Session Management**: Secure JWT-based session handling
- **Audit Logging**: Comprehensive logging for all operations

### Data Management
- **PostgreSQL**: Robust data storage with ACID compliance
- **Migration Ready**: Designed to replace Google Sheets backend
- **Concurrency Control**: Row versioning to handle concurrent updates
- **Data Integrity**: Foreign key constraints and validation

### Integration
- **Google Workspace**: Calendar, Sheets, and authentication
- **Cloudflare Services**: Workers, Pages, and KV storage
- **Document Generation**: PDF generation for reports and certificates
- **Email Services**: Notification and communication

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Offline Support**: Field technician workflow with offline capability
- **Role-Based UI**: Customized interfaces for each user role
- **Accessibility**: WCAG-compliant components

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/your-org/kharon-platform.git
cd kharon-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development servers
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev --workspace=@kharon-platform/web
npm run dev --workspace=@kharon-platform/portal
npm run dev --workspace=@kharon-platform/api
```

### Environment Configuration

Key environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kharon_platform_dev"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"

# Session management
SESSION_KEYS="session-key-1,session-key-2"
SESSION_TTL_SECONDS=86400
SUPER_ADMIN_EMAILS="admin@example.com,another-admin@example.com"

# Cloudflare
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
```

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Key Components

### RBAC System
The Role-Based Access Control system supports six distinct roles:
- Client
- Technician
- Dispatcher
- Finance
- Admin
- Super Admin

Each role has granular permissions for different operations based on security requirements.

### Data Layer
The PostgreSQL-based data layer provides:
- ACID-compliant transactions
- Row-level locking for concurrency
- Comprehensive data validation
- Audit trails for all operations

### Document Generation
The document service supports:
- Job card generation
- Service report creation
- Certificate generation
- Customizable templates
- PDF export

### Integration Layer
Handles external service integrations:
- Google Workspace (Calendar, Sheets, Auth)
- Cloudflare KV for caching
- Email notification services
- Third-party APIs

## Roadmap

### Phase 1: Foundation (Complete)
- [x] Audit existing system
- [x] Define architecture
- [x] Create monorepo structure
- [x] Implement shared packages

### Phase 2: Core Features (In Progress)
- [x] Data access layer
- [x] Integration services
- [x] Document generation
- [ ] API layer integration
- [ ] Authentication flow
- [ ] Basic job workflow

### Phase 3: Advanced Features
- [ ] Complete scheduling system
- [ ] Financial management
- [ ] Advanced reporting
- [ ] Mobile optimization

### Phase 4: Production
- [ ] Security audit
- [ ] Performance optimization
- [ ] Monitoring and logging
- [ ] Deployment pipeline

## Contributing

We welcome contributions to the Kharon Platform. Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or open an issue in the repository.