import { z } from 'zod';

// User-related validators
export const UserValidator = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['client', 'technician', 'dispatcher', 'finance', 'admin', 'super_admin']),
  display_name: z.string().min(1, 'Display name is required'),
  client_id: z.string().optional(),
  technician_id: z.string().optional(),
  active: z.boolean().default(true),
});

export const CreateUserValidator = UserValidator.omit({ 
  user_id: true, 
  active: true 
}).extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateUserValidator = UserValidator.partial();

// Client-related validators
export const AddressValidator = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
});

export const ClientValidator = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Client name is required'),
  contact_person: z.string().min(1, 'Contact person is required'),
  contact_email: z.string().email('Invalid email format'),
  contact_phone: z.string().min(1, 'Phone number is required'),
  billing_address: AddressValidator,
  vat_number: z.string().optional(),
  account_status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export const CreateClientValidator = ClientValidator.omit({ 
  client_id: true,
  account_status: true,
}).extend({
  account_status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const UpdateClientValidator = ClientValidator.partial();

// Site-related validators
export const SiteValidator = z.object({
  site_id: z.string().min(1, 'Site ID is required'),
  client_id: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Site name is required'),
  address: AddressValidator,
  contact_person: z.string().min(1, 'Contact person is required'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  access_instructions: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const CreateSiteValidator = SiteValidator.omit({ site_id: true });

export const UpdateSiteValidator = SiteValidator.partial();

// Job-related validators
export const JobStatusValidator = z.enum([
  'draft', 
  'scheduled', 
  'assigned', 
  'in_progress', 
  'pending_review', 
  'completed', 
  'cancelled',
  'overdue'
]);

export const JobTypeValidator = z.enum([
  'fire_detection',
  'gas_suppression',
  'security_systems',
  'maintenance'
]);

export const JobValidator = z.object({
  job_id: z.string().min(1, 'Job ID is required'),
  client_id: z.string().min(1, 'Client ID is required'),
  site_id: z.string().min(1, 'Site ID is required'),
  job_type: JobTypeValidator,
  status: JobStatusValidator,
  technician_id: z.string().min(1, 'Technician ID is required'),
  scheduled_date: z.coerce.date().optional(),
  due_date: z.coerce.date(),
  description: z.string().min(1, 'Description is required'),
  equipment_list: z.array(z.string()).default([]),
  special_requirements: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required'),
  completed_date: z.coerce.date().optional(),
  notes: z.array(z.object({
    note_id: z.string().min(1, 'Note ID is required'),
    job_id: z.string().min(1, 'Job ID is required'),
    author_user_id: z.string().min(1, 'Author ID is required'),
    content: z.string().min(1, 'Content is required'),
    visibility: z.enum(['internal', 'client_visible']).default('internal'),
    created_at: z.coerce.date(),
  })).default([]),
  row_version: z.number().int().nonnegative().default(1),
});

export const CreateJobValidator = JobValidator.omit({ 
  job_id: true,
  status: true,
  notes: true,
  row_version: true,
  completed_date: true,
}).extend({
  status: JobStatusValidator.optional().default('draft'),
  notes: z.array(z.object({
    note_id: z.string().min(1, 'Note ID is required'),
    job_id: z.string().min(1, 'Job ID is required'),
    author_user_id: z.string().min(1, 'Author ID is required'),
    content: z.string().min(1, 'Content is required'),
    visibility: z.enum(['internal', 'client_visible']).default('internal'),
    created_at: z.coerce.date(),
  })).optional(),
});

export const UpdateJobValidator = JobValidator.partial();

// Asset-related validators
export const AssetValidator = z.object({
  asset_id: z.string().min(1, 'Asset ID is required'),
  site_id: z.string().min(1, 'Site ID is required'),
  name: z.string().min(1, 'Asset name is required'),
  serial_number: z.string().optional(),
  installation_date: z.coerce.date(),
  last_service_date: z.coerce.date().optional(),
  next_service_due: z.coerce.date(),
  specifications: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'inactive', 'decommissioned']).default('active'),
});

export const CreateAssetValidator = AssetValidator.omit({ asset_id: true });

export const UpdateAssetValidator = AssetValidator.partial();

// Job note validator
export const JobNoteValidator = z.object({
  note_id: z.string().min(1, 'Note ID is required'),
  job_id: z.string().min(1, 'Job ID is required'),
  author_user_id: z.string().min(1, 'Author ID is required'),
  content: z.string().min(1, 'Content is required'),
  visibility: z.enum(['internal', 'client_visible']).default('internal'),
});

export const CreateJobNoteValidator = JobNoteValidator.omit({ note_id: true }).extend({
  created_at: z.coerce.date().optional(),
});

// Document-related validators
export const JobDocumentValidator = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
  job_id: z.string().min(1, 'Job ID is required'),
  document_type: z.enum(['report', 'certificate', 'photo', 'other']),
  filename: z.string().min(1, 'Filename is required'),
  storage_path: z.string().min(1, 'Storage path is required'),
  uploaded_by: z.string().min(1, 'Uploaded by is required'),
  published: z.boolean().default(false),
});

export const CreateJobDocumentValidator = JobDocumentValidator.omit({ document_id: true }).extend({
  published: z.boolean().optional(),
});

// Certificate-related validators
export const CertificateValidator = z.object({
  certificate_id: z.string().min(1, 'Certificate ID is required'),
  job_id: z.string().min(1, 'Job ID is required'),
  certificate_type: z.enum(['fire', 'gas', 'security']),
  certificate_number: z.string().min(1, 'Certificate number is required'),
  issue_date: z.coerce.date(),
  valid_from: z.coerce.date(),
  valid_until: z.coerce.date(),
  issued_by: z.string().min(1, 'Issued by is required'),
  qr_code_data: z.string().optional(),
  status: z.enum(['valid', 'expired', 'revoked']).default('valid'),
});

export const CreateCertificateValidator = CertificateValidator.omit({ 
  certificate_id: true, 
  status: true 
}).extend({
  status: z.enum(['valid', 'expired', 'revoked']).optional(),
});

// Schedule-related validators
export const ScheduleEntryValidator = z.object({
  schedule_id: z.string().min(1, 'Schedule ID is required'),
  job_id: z.string().optional(),
  technician_id: z.string().min(1, 'Technician ID is required'),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  event_type: z.enum(['job', 'availability', 'leave']).default('job'),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled']).default('scheduled'),
});

export const CreateScheduleValidator = ScheduleEntryValidator.omit({ schedule_id: true });

export const UpdateScheduleValidator = z.object({
  start_time: z.coerce.date().optional(),
  end_time: z.coerce.date().optional(),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled']).optional(),
});

// Authentication validators
export const LoginValidator = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'), // Will be validated properly in implementation
});

export const GoogleLoginValidator = z.object({
  id_token: z.string().min(1, 'ID token is required'),
});

// API request validators
export const PaginationValidator = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Export types
export type {
  z.infer<typeof UserValidator> as User,
  z.infer<typeof CreateUserValidator> as CreateUser,
  z.infer<typeof UpdateUserValidator> as UpdateUser,
  z.infer<typeof ClientValidator> as Client,
  z.infer<typeof CreateClientValidator> as CreateClient,
  z.infer<typeof UpdateClientValidator> as UpdateClient,
  z.infer<typeof SiteValidator> as Site,
  z.infer<typeof CreateSiteValidator> as CreateSite,
  z.infer<typeof UpdateSiteValidator> as UpdateSite,
  z.infer<typeof JobValidator> as Job,
  z.infer<typeof CreateJobValidator> as CreateJob,
  z.infer<typeof UpdateJobValidator> as UpdateJob,
  z.infer<typeof AssetValidator> as Asset,
  z.infer<typeof CreateAssetValidator> as CreateAsset,
  z.infer<typeof UpdateAssetValidator> as UpdateAsset,
  z.infer<typeof JobNoteValidator> as JobNote,
  z.infer<typeof CreateJobNoteValidator> as CreateJobNote,
  z.infer<typeof JobDocumentValidator> as JobDocument,
  z.infer<typeof CreateJobDocumentValidator> as CreateJobDocument,
  z.infer<typeof CertificateValidator> as Certificate,
  z.infer<typeof CreateCertificateValidator> as CreateCertificate,
  z.infer<typeof ScheduleEntryValidator> as ScheduleEntry,
  z.infer<typeof CreateScheduleValidator> as CreateSchedule,
  z.infer<typeof UpdateScheduleValidator> as UpdateSchedule,
  z.infer<typeof LoginValidator> as LoginData,
  z.infer<typeof GoogleLoginValidator> as GoogleLoginData,
  z.infer<typeof PaginationValidator> as PaginationParams,
};