// Environment configuration for Kharon Platform
export interface AppConfig {
  // Application mode
  mode: 'development' | 'staging' | 'production';
  
  // Google-related configurations
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  
  // Database configurations
  database: {
    connectionString: string;
    poolSize: number;
  };
  
  // API configurations
  api: {
    port: number;
    corsOrigins: string[];
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  
  // Authentication configurations
  auth: {
    sessionTtlSeconds: number;
    sessionKeys: string[];
    sessionCookieName: string;
    superAdminEmails: string[];
  };
  
  // Cloudflare configurations
  cloudflare: {
    accountId: string;
    apiToken: string;
    zoneId?: string;
  };
  
  // Document generation configurations
  documents: {
    storagePath: string;
    templatePath: string;
  };
  
  // Logging configurations
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}

// Default configuration values
const defaultConfig: AppConfig = {
  mode: 'development',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
  },
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/kharon_platform_dev',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10)
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  auth: {
    sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10), // 24 hours
    sessionKeys: process.env.SESSION_KEYS?.split(',') || ['default-session-key'],
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'kharon_session',
    superAdminEmails: process.env.SUPER_ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID
  },
  documents: {
    storagePath: process.env.DOCUMENTS_STORAGE_PATH || './storage/documents',
    templatePath: process.env.DOCUMENTS_TEMPLATE_PATH || './templates'
  },
  logging: {
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    format: (process.env.LOG_FORMAT as 'json' | 'text') || 'json'
  }
};

// Validate configuration
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  
  if (!config.google.clientId) {
    errors.push('GOOGLE_CLIENT_ID is required');
  }
  
  if (!config.database.connectionString) {
    errors.push('DATABASE_URL is required');
  }
  
  if (config.auth.sessionKeys.length === 0) {
    errors.push('At least one SESSION_KEYS value is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
  }
}

// Get configuration with validation
export function getConfig(): AppConfig {
  const config = { ...defaultConfig };
  validateConfig(config);
  return config;
}

export default defaultConfig;