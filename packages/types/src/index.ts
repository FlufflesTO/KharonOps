// Role definitions
export type Role = 
  | 'client'
  | 'technician'
  | 'dispatcher'
  | 'finance'
  | 'admin'
  | 'super_admin';

// User-related types
export interface User {
  user_id: string;
  email: string;
  role: Role;
  display_name: string;
  client_id: string;
  technician_id: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Session user (simplified for API responses)
export interface SessionUser {
  user_id: string;
  email: string;
  role: Role;
  display_name: string;
  client_id: string;
  technician_id: string;
}

// Client-related types
export interface Client {
  client_id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  billing_address: Address;
  vat_number?: string;
  account_status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
}

// Site-related types
export interface Site {
  site_id: string;
  client_id: string;
  name: string;
  address: Address;
  contact_person: string;
  contact_phone: string;
  access_instructions: string;
  risk_level: 'low' | 'medium' | 'high';
  created_at: Date;
  updated_at: Date;
}

// Job-related types
export type JobStatus = 
  | 'draft'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export type JobType = 
  | 'fire_detection'
  | 'gas_suppression'
  | 'security_systems'
  | 'maintenance';

export interface Job {
  job_id: string;
  client_id: string;
  site_id: string;
  job_type: JobType;
  status: JobStatus;
  technician_id: string;
  scheduled_date?: Date;
  due_date: Date;
  description: string;
  equipment_list: string[];
  special_requirements?: string;
  created_by: string;
  completed_date?: Date;
  notes: JobNote[];
  row_version: number;
  created_at: Date;
  updated_at: Date;
}

export interface JobSummary {
  job_id: string;
  client_id: string;
  site_id: string;
  job_type: JobType;
  status: JobStatus;
  technician_id: string;
  scheduled_date?: Date;
  due_date: Date;
  description: string;
  created_at: Date;
}

export interface JobDetail extends Job {
  client: Client;
  site: Site;
  technician: Pick<User, 'user_id' | 'display_name'>;
}

export interface JobNote {
  note_id: string;
  job_id: string;
  author_user_id: string;
  content: string;
  visibility: 'internal' | 'client_visible';
  created_at: Date;
}

// Asset-related types
export interface Asset {
  asset_id: string;
  site_id: string;
  name: string;
  serial_number?: string;
  installation_date: Date;
  last_service_date?: Date;
  next_service_due: Date;
  specifications: Record<string, any>;
  status: 'active' | 'inactive' | 'decommissioned';
  created_at: Date;
  updated_at: Date;
}

// Document-related types
export interface JobDocument {
  document_id: string;
  job_id: string;
  document_type: 'report' | 'certificate' | 'photo' | 'other';
  filename: string;
  storage_path: string;
  uploaded_by: string;
  published: boolean;
  created_at: Date;
}

// Certificate-related types
export interface Certificate {
  certificate_id: string;
  job_id: string;
  certificate_type: 'fire' | 'gas' | 'security';
  certificate_number: string;
  issue_date: Date;
  valid_from: Date;
  valid_until: Date;
  issued_by: string;
  qr_code_data: string;
  status: 'valid' | 'expired' | 'revoked';
  created_at: Date;
  updated_at: Date;
}

// Schedule-related types
export interface ScheduleEntry {
  schedule_id: string;
  job_id?: string;
  technician_id: string;
  start_time: Date;
  end_time: Date;
  event_type: 'job' | 'availability' | 'leave';
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  correlationId: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  correlationId: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}