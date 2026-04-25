import { google, calendar_v3 } from 'googleapis';
import { getConfig } from '@kharon-platform/config';
import { Job, ScheduleEntry } from '@kharon-platform/types';

/**
 * Google Workspace Integration Service for the Kharon Platform
 */
export class GoogleIntegrationService {
  private config = getConfig();
  private calendar: calendar_v3.Calendar;

  constructor() {
    // Initialize Google Calendar API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Create a calendar event for a scheduled job
   */
  async createCalendarEvent(scheduleEntry: ScheduleEntry): Promise<string | null> {
    try {
      const event: calendar_v3.Schema$Event = {
        summary: `Job ${scheduleEntry.job_id} - ${scheduleEntry.event_type}`,
        description: `Scheduled job for technician ${scheduleEntry.technician_id}`,
        start: {
          dateTime: scheduleEntry.start_time.toISOString(),
          timeZone: 'Africa/Johannesburg', // Set to your timezone
        },
        end: {
          dateTime: scheduleEntry.end_time.toISOString(),
          timeZone: 'Africa/Johannesburg', // Set to your timezone
        },
        attendees: [
          // Add technician email when available
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return response.data.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(eventId: string, scheduleEntry: ScheduleEntry): Promise<boolean> {
    try {
      const event: calendar_v3.Schema$Event = {
        summary: `Job ${scheduleEntry.job_id} - ${scheduleEntry.event_type}`,
        description: `Scheduled job for technician ${scheduleEntry.technician_id}`,
        start: {
          dateTime: scheduleEntry.start_time.toISOString(),
          timeZone: 'Africa/Johannesburg',
        },
        end: {
          dateTime: scheduleEntry.end_time.toISOString(),
          timeZone: 'Africa/Johannesburg',
        },
      };

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Get events for a specific date range
   */
  async getEventsInRange(startDateTime: Date, endDateTime: Date): Promise<calendar_v3.Schema$Event[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  /**
   * Helper method to convert a Job to a ScheduleEntry
   */
  jobToScheduleEntry(job: Job, technicianEmail: string): ScheduleEntry {
    return {
      schedule_id: `sched_${Date.now()}`,
      job_id: job.job_id,
      technician_id: technicianEmail,
      start_time: job.scheduled_date ? new Date(job.scheduled_date) : new Date(job.due_date),
      end_time: new Date(new Date(job.scheduled_date ? job.scheduled_date : job.due_date).getTime() + 2 * 60 * 60 * 1000), // 2 hours default duration
      event_type: 'job',
      status: 'scheduled',
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(to: string, subject: string, message: string): Promise<boolean> {
    // This would normally integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log this as a placeholder
    
    console.log(`Notification email would be sent to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    // In a real implementation, this would use an email service
    return true;
  }

  /**
   * Upload document to Google Drive
   */
  async uploadToDrive(content: string, fileName: string, mimeType: string, folderId?: string): Promise<string | null> {
    try {
      const drive = google.drive({ version: 'v3' });
      
      const media = {
        mimeType,
        body: content,
      };

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
        },
        media,
        fields: 'id',
      });

      return response.data.id;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      return null;
    }
  }

  /**
   * Share file on Google Drive
   */
  async shareDriveFile(fileId: string, emailAddress: string, role: 'reader' | 'writer' = 'reader'): Promise<boolean> {
    try {
      const drive = google.drive({ version: 'v3' });
      
      await drive.permissions.create({
        fileId,
        requestBody: {
          role,
          type: 'user',
          emailAddress,
        },
        fields: 'id',
      });

      return true;
    } catch (error) {
      console.error('Error sharing Google Drive file:', error);
      return false;
    }
  }
}

/**
 * Cloudflare Integration Service
 */
export class CloudflareIntegrationService {
  private config = getConfig();
  private accountId: string;
  private apiToken: string;

  constructor() {
    this.accountId = this.config.cloudflare.accountId;
    this.apiToken = this.config.cloudflare.apiToken;
  }

  /**
   * Store key-value pair in Cloudflare KV
   */
  async putKV(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.accountId || !this.apiToken) {
        console.error('Cloudflare credentials not configured');
        return false;
      }

      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.config.cloudflare.zoneId}/values/${key}`;
      
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: ttl ? JSON.stringify({ value, ttl }) : value
      };

      const response = await fetch(url, options);
      return response.ok;
    } catch (error) {
      console.error('Error storing in Cloudflare KV:', error);
      return false;
    }
  }

  /**
   * Get value from Cloudflare KV
   */
  async getKV(key: string): Promise<string | null> {
    try {
      if (!this.accountId || !this.apiToken) {
        console.error('Cloudflare credentials not configured');
        return null;
      }

      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.config.cloudflare.zoneId}/values/${key}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error('Error retrieving from Cloudflare KV:', error);
      return null;
    }
  }

  /**
   * Delete key from Cloudflare KV
   */
  async deleteKV(key: string): Promise<boolean> {
    try {
      if (!this.accountId || !this.apiToken) {
        console.error('Cloudflare credentials not configured');
        return false;
      }

      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.config.cloudflare.zoneId}/values/${key}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting from Cloudflare KV:', error);
      return false;
    }
  }
}

/**
 * Export integration services
 */
export default {
  GoogleIntegrationService,
  CloudflareIntegrationService
};