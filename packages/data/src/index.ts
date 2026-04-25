import { Pool, PoolClient } from 'pg';
import { 
  User, 
  Client, 
  Site, 
  Job, 
  JobStatus, 
  JobType, 
  JobNote, 
  Asset, 
  JobDocument, 
  Certificate, 
  ScheduleEntry 
} from '@kharon-platform/types';
import { getConfig } from '@kharon-platform/config';

/**
 * PostgreSQL-based data access layer for the Kharon Platform
 */
export class KharonDataLayer {
  private pool: Pool;
  
  constructor(connectionString?: string) {
    const config = getConfig();
    const connStr = connectionString || config.database.connectionString;
    
    this.pool = new Pool({
      connectionString: connStr,
      max: config.database.poolSize
    });
  }
  
  /**
   * Initialize the database schema
   */
  async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          client_id VARCHAR(255),
          technician_id VARCHAR(255),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create clients table
      await client.query(`
        CREATE TABLE IF NOT EXISTS clients (
          client_id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(50) NOT NULL,
          billing_address JSONB NOT NULL,
          vat_number VARCHAR(100),
          account_status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create sites table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sites (
          site_id VARCHAR(255) PRIMARY KEY,
          client_id VARCHAR(255) REFERENCES clients(client_id),
          name VARCHAR(255) NOT NULL,
          address JSONB NOT NULL,
          contact_person VARCHAR(255),
          contact_phone VARCHAR(50),
          access_instructions TEXT,
          risk_level VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          job_id VARCHAR(255) PRIMARY KEY,
          client_id VARCHAR(255) REFERENCES clients(client_id),
          site_id VARCHAR(255) REFERENCES sites(site_id),
          job_type VARCHAR(50) NOT NULL,
          status VARCHAR(30) NOT NULL,
          technician_id VARCHAR(255) REFERENCES users(user_id),
          scheduled_date TIMESTAMP,
          due_date TIMESTAMP NOT NULL,
          description TEXT NOT NULL,
          equipment_list TEXT[],
          special_requirements TEXT,
          created_by VARCHAR(255) REFERENCES users(user_id),
          completed_date TIMESTAMP,
          row_version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create job_notes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_notes (
          note_id VARCHAR(255) PRIMARY KEY,
          job_id VARCHAR(255) REFERENCES jobs(job_id) ON DELETE CASCADE,
          author_user_id VARCHAR(255) REFERENCES users(user_id),
          content TEXT NOT NULL,
          visibility VARCHAR(20) DEFAULT 'internal',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create assets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS assets (
          asset_id VARCHAR(255) PRIMARY KEY,
          site_id VARCHAR(255) REFERENCES sites(site_id),
          name VARCHAR(255) NOT NULL,
          serial_number VARCHAR(255),
          installation_date DATE NOT NULL,
          last_service_date DATE,
          next_service_due DATE NOT NULL,
          specifications JSONB,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create job_documents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_documents (
          document_id VARCHAR(255) PRIMARY KEY,
          job_id VARCHAR(255) REFERENCES jobs(job_id) ON DELETE CASCADE,
          document_type VARCHAR(50) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          storage_path VARCHAR(512) NOT NULL,
          uploaded_by VARCHAR(255) REFERENCES users(user_id),
          published BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create certificates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS certificates (
          certificate_id VARCHAR(255) PRIMARY KEY,
          job_id VARCHAR(255) REFERENCES jobs(job_id) ON DELETE CASCADE,
          certificate_type VARCHAR(50) NOT NULL,
          certificate_number VARCHAR(100) UNIQUE NOT NULL,
          issue_date DATE NOT NULL,
          valid_from DATE NOT NULL,
          valid_until DATE NOT NULL,
          issued_by VARCHAR(255) REFERENCES users(user_id),
          qr_code_data TEXT,
          status VARCHAR(20) DEFAULT 'valid',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create schedule table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schedule (
          schedule_id VARCHAR(255) PRIMARY KEY,
          job_id VARCHAR(255) REFERENCES jobs(job_id),
          technician_id VARCHAR(255) REFERENCES users(user_id),
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          event_type VARCHAR(20) DEFAULT 'job',
          status VARCHAR(20) DEFAULT 'scheduled',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_site_id ON jobs(site_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_technician_id ON jobs(technician_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON job_notes(job_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_assets_site_id ON assets(site_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_schedule_technician_id ON schedule(technician_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_schedule_job_id ON schedule(job_id)');
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
  
  /**
   * User management methods
   */
  async createUser(userData: Omit<User, 'user_id' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO users 
         (user_id, email, role, display_name, client_id, technician_id, active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `user_${Date.now()}`, // Generate a unique ID
          userData.email,
          userData.role,
          userData.display_name,
          userData.client_id,
          userData.technician_id,
          userData.active
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getUserById(userId: string): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Client management methods
   */
  async createClient(clientData: Omit<Client, 'client_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO clients 
         (client_id, name, contact_person, contact_email, contact_phone, billing_address, vat_number, account_status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `client_${Date.now()}`,
          clientData.name,
          clientData.contact_person,
          clientData.contact_email,
          clientData.contact_phone,
          JSON.stringify(clientData.billing_address),
          clientData.vat_number,
          clientData.account_status
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getClientById(clientId: string): Promise<Client | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM clients WHERE client_id = $1', [clientId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Site management methods
   */
  async createSite(siteData: Omit<Site, 'site_id' | 'created_at' | 'updated_at'>): Promise<Site> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO sites 
         (site_id, client_id, name, address, contact_person, contact_phone, access_instructions, risk_level, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `site_${Date.now()}`,
          siteData.client_id,
          siteData.name,
          JSON.stringify(siteData.address),
          siteData.contact_person,
          siteData.contact_phone,
          siteData.access_instructions,
          siteData.risk_level
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getSiteById(siteId: string): Promise<Site | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM sites WHERE site_id = $1', [siteId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Job management methods
   */
  async createJob(jobData: Omit<Job, 'job_id' | 'created_at' | 'updated_at' | 'notes' | 'row_version'>): Promise<Job> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO jobs 
         (job_id, client_id, site_id, job_type, status, technician_id, scheduled_date, due_date, description, equipment_list, special_requirements, created_by, completed_date, row_version, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `job_${Date.now()}`,
          jobData.client_id,
          jobData.site_id,
          jobData.job_type,
          jobData.status,
          jobData.technician_id,
          jobData.scheduled_date,
          jobData.due_date,
          jobData.description,
          jobData.equipment_list,
          jobData.special_requirements,
          jobData.created_by,
          jobData.completed_date
        ]
      );
      
      // Add empty notes array to the returned job object
      return {
        ...result.rows[0],
        notes: [] // Notes will be fetched separately if needed
      };
    } finally {
      client.release();
    }
  }
  
  async getJobById(jobId: string): Promise<Job | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
      const job = result.rows[0];
      
      if (!job) return null;
      
      // Fetch associated notes
      const notesResult = await client.query(
        'SELECT * FROM job_notes WHERE job_id = $1 ORDER BY created_at DESC', 
        [jobId]
      );
      
      return {
        ...job,
        notes: notesResult.rows
      };
    } finally {
      client.release();
    }
  }
  
  async updateJobStatus(jobId: string, status: JobStatus, userId: string): Promise<Job | null> {
    const client = await this.pool.connect();
    
    try {
      // First increment the row_version to handle concurrent updates
      const result = await client.query(
        `UPDATE jobs 
         SET status = $1, updated_at = CURRENT_TIMESTAMP, row_version = row_version + 1 
         WHERE job_id = $2 
         RETURNING *`,
        [status, jobId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Add the notes to the job object
      const notesResult = await client.query(
        'SELECT * FROM job_notes WHERE job_id = $3 ORDER BY created_at DESC', 
        [jobId]
      );
      
      return {
        ...result.rows[0],
        notes: notesResult.rows
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Job note methods
   */
  async addJobNote(noteData: Omit<JobNote, 'note_id' | 'created_at'>): Promise<JobNote> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO job_notes 
         (note_id, job_id, author_user_id, content, visibility, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `note_${Date.now()}`,
          noteData.job_id,
          noteData.author_user_id,
          noteData.content,
          noteData.visibility
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Asset management methods
   */
  async createAsset(assetData: Omit<Asset, 'asset_id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO assets 
         (asset_id, site_id, name, serial_number, installation_date, last_service_date, next_service_due, specifications, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `asset_${Date.now()}`,
          assetData.site_id,
          assetData.name,
          assetData.serial_number,
          assetData.installation_date,
          assetData.last_service_date,
          assetData.next_service_due,
          assetData.specifications ? JSON.stringify(assetData.specifications) : null,
          assetData.status
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getAssetsBySite(siteId: string): Promise<Asset[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM assets WHERE site_id = $1 ORDER BY name', 
        [siteId]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Document management methods
   */
  async createJobDocument(documentData: Omit<JobDocument, 'document_id' | 'created_at'>): Promise<JobDocument> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO job_documents 
         (document_id, job_id, document_type, filename, storage_path, uploaded_by, published, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `doc_${Date.now()}`,
          documentData.job_id,
          documentData.document_type,
          documentData.filename,
          documentData.storage_path,
          documentData.uploaded_by,
          documentData.published
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getDocumentsByJob(jobId: string): Promise<JobDocument[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM job_documents WHERE job_id = $1 ORDER BY created_at DESC', 
        [jobId]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * Certificate management methods
   */
  async createCertificate(certificateData: Omit<Certificate, 'certificate_id' | 'created_at' | 'updated_at'>): Promise<Certificate> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO certificates 
         (certificate_id, job_id, certificate_type, certificate_number, issue_date, valid_from, valid_until, issued_by, qr_code_data, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `cert_${Date.now()}`,
          certificateData.job_id,
          certificateData.certificate_type,
          certificateData.certificate_number,
          certificateData.issue_date,
          certificateData.valid_from,
          certificateData.valid_until,
          certificateData.issued_by,
          certificateData.qr_code_data,
          certificateData.status
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM certificates WHERE certificate_id = $1', [certificateId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Schedule management methods
   */
  async createSchedule(scheduleData: Omit<ScheduleEntry, 'schedule_id' | 'created_at' | 'updated_at'>): Promise<ScheduleEntry> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO schedule 
         (schedule_id, job_id, technician_id, start_time, end_time, event_type, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          `sched_${Date.now()}`,
          scheduleData.job_id,
          scheduleData.technician_id,
          scheduleData.start_time,
          scheduleData.end_time,
          scheduleData.event_type,
          scheduleData.status
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getSchedulesByTechnician(technicianId: string, startDate: Date, endDate: Date): Promise<ScheduleEntry[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM schedule 
         WHERE technician_id = $1 
         AND start_time >= $2 AND end_time <= $3
         ORDER BY start_time`, 
        [technicianId, startDate, endDate]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  /**
   * General methods
   */
  async getAllJobs(): Promise<Omit<Job, 'notes'>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM jobs ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async getJobsByStatus(status: JobStatus): Promise<Omit<Job, 'notes'>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM jobs WHERE status = $1 ORDER BY created_at DESC', [status]);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async getJobsByClientId(clientId: string): Promise<Omit<Job, 'notes'>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM jobs WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// Export the main class
export default KharonDataLayer;