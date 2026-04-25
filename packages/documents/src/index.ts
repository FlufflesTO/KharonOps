import { Job, Certificate, JobDocument, Client, Site } from '@kharon-platform/types';
import { getConfig } from '@kharon-platform/config';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

/**
 * Document generation service for the Kharon Platform
 */
export class DocumentService {
  private config = getConfig();
  private templateDir: string;

  constructor() {
    this.templateDir = this.config.documents.templatePath;
  }

  /**
   * Generate a job card document
   */
  async generateJobCard(job: Job, client: Client, site: Site): Promise<Buffer> {
    // Read the job card template
    const templatePath = path.join(this.templateDir, 'job-card.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    // Prepare the data for the template
    const data = {
      job: {
        id: job.job_id,
        type: job.job_type,
        status: job.status,
        description: job.description,
        scheduledDate: job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled',
        dueDate: new Date(job.due_date).toLocaleDateString(),
        specialRequirements: job.special_requirements || 'None',
      },
      client: {
        name: client.name,
        contactPerson: client.contact_person,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
      },
      site: {
        name: site.name,
        address: `${site.address.street}, ${site.address.city}, ${site.address.province}, ${site.address.postal_code}`,
        contactPerson: site.contact_person,
        contactPhone: site.contact_phone,
        accessInstructions: site.access_instructions || 'Standard access',
      },
      technician: {
        id: job.technician_id,
      },
      createdDate: new Date().toLocaleDateString(),
    };

    // Render the HTML
    const html = template(data);

    // Convert to PDF
    return this.htmlToPdf(html);
  }

  /**
   * Generate a service report document
   */
  async generateServiceReport(job: Job, client: Client, site: Site): Promise<Buffer> {
    // Read the service report template
    const templatePath = path.join(this.templateDir, 'service-report.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    // Prepare the data for the template
    const data = {
      job: {
        id: job.job_id,
        type: job.job_type,
        status: job.status,
        description: job.description,
        scheduledDate: job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled',
        completedDate: job.completed_date ? new Date(job.completed_date).toLocaleDateString() : 'Not completed',
        specialRequirements: job.special_requirements || 'None',
        equipmentList: job.equipment_list.join(', '),
      },
      client: {
        name: client.name,
        contactPerson: client.contact_person,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
      },
      site: {
        name: site.name,
        address: `${site.address.street}, ${site.address.city}, ${site.address.province}, ${site.address.postal_code}`,
        contactPerson: site.contact_person,
        contactPhone: site.contact_phone,
      },
      technician: {
        id: job.technician_id,
      },
      notes: job.notes.map(note => ({
        content: note.content,
        author: note.author_user_id,
        date: new Date(note.created_at).toLocaleDateString(),
      })),
      reportDate: new Date().toLocaleDateString(),
    };

    // Render the HTML
    const html = template(data);

    // Convert to PDF
    return this.htmlToPdf(html);
  }

  /**
   * Generate a certificate document
   */
  async generateCertificate(certificate: Certificate, job: Job, client: Client): Promise<Buffer> {
    // Read the certificate template
    const templatePath = path.join(this.templateDir, 'certificate.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    // Prepare the data for the template
    const data = {
      certificate: {
        id: certificate.certificate_id,
        type: certificate.certificate_type,
        number: certificate.certificate_number,
        issueDate: new Date(certificate.issue_date).toLocaleDateString(),
        validFrom: new Date(certificate.valid_from).toLocaleDateString(),
        validUntil: new Date(certificate.valid_until).toLocaleDateString(),
        status: certificate.status,
      },
      job: {
        id: job.job_id,
        type: job.job_type,
        description: job.description,
      },
      client: {
        name: client.name,
        contactPerson: client.contact_person,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
      },
      issuedBy: certificate.issued_by,
      issuedDate: new Date(certificate.issue_date).toLocaleDateString(),
      qrCodeData: certificate.qr_code_data || 'N/A',
    };

    // Render the HTML
    const html = template(data);

    // Convert to PDF
    return this.htmlToPdf(html);
  }

  /**
   * Convert HTML to PDF
   */
  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set the HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Generate the PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      return pdf;
    } finally {
      await browser.close();
    }
  }

  /**
   * Save document to storage
   */
  async saveDocument(document: Buffer, fileName: string): Promise<string> {
    const storagePath = this.config.documents.storagePath;
    const filePath = path.join(storagePath, fileName);
    
    // Ensure the storage directory exists
    await fs.mkdir(storagePath, { recursive: true });
    
    // Write the document
    await fs.writeFile(filePath, document);
    
    return filePath;
  }

  /**
   * Create a document record
   */
  createDocumentRecord(jobId: string, documentType: string, fileName: string, uploadedBy: string): Omit<JobDocument, 'document_id' | 'created_at'> {
    return {
      job_id: jobId,
      document_type: documentType as 'report' | 'certificate' | 'photo' | 'other',
      filename: fileName,
      storage_path: `${this.config.documents.storagePath}/${fileName}`,
      uploaded_by: uploadedBy,
      published: false, // Initially unpublished
    };
  }
}

/**
 * Template management service
 */
export class TemplateService {
  private config = getConfig();
  private templateDir: string;

  constructor() {
    this.templateDir = this.config.documents.templatePath;
  }

  /**
   * Initialize default templates
   */
  async initializeTemplates(): Promise<void> {
    // Ensure template directory exists
    await fs.mkdir(this.templateDir, { recursive: true });

    // Job card template
    const jobCardTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Job Card</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; background-color: #f0f0f0; padding: 5px; }
    .details { margin-left: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .signature-area { margin-top: 50px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Job Card</h1>
    <p>Generated on {{createdDate}}</p>
  </div>

  <div class="section">
    <div class="section-title">Job Information</div>
    <div class="details">
      <p><strong>Job ID:</strong> {{job.id}}</p>
      <p><strong>Type:</strong> {{job.type}}</p>
      <p><strong>Status:</strong> {{job.status}}</p>
      <p><strong>Description:</strong> {{job.description}}</p>
      <p><strong>Scheduled Date:</strong> {{job.scheduledDate}}</p>
      <p><strong>Due Date:</strong> {{job.dueDate}}</p>
      <p><strong>Special Requirements:</strong> {{job.specialRequirements}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client Information</div>
    <div class="details">
      <p><strong>Name:</strong> {{client.name}}</p>
      <p><strong>Contact Person:</strong> {{client.contactPerson}}</p>
      <p><strong>Email:</strong> {{client.contactEmail}}</p>
      <p><strong>Phone:</strong> {{client.contactPhone}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Site Information</div>
    <div class="details">
      <p><strong>Name:</strong> {{site.name}}</p>
      <p><strong>Address:</strong> {{site.address}}</p>
      <p><strong>Contact Person:</strong> {{site.contactPerson}}</p>
      <p><strong>Phone:</strong> {{site.contactPhone}}</p>
      <p><strong>Access Instructions:</strong> {{site.accessInstructions}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Assigned Technician</div>
    <div class="details">
      <p><strong>ID:</strong> {{technician.id}}</p>
    </div>
  </div>

  <div class="signature-area">
    <table>
      <tr>
        <th>Technician Signature</th>
        <th>Client Signature</th>
        <th>Date</th>
      </tr>
      <tr>
        <td style="height: 60px;"></td>
        <td></td>
        <td>{{createdDate}}</td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

    // Service report template
    const serviceReportTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; background-color: #f0f0f0; padding: 5px; }
    .details { margin-left: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .notes-section { margin-top: 20px; }
    .signature-area { margin-top: 50px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Service Report</h1>
    <p>Generated on {{reportDate}}</p>
  </div>

  <div class="section">
    <div class="section-title">Job Information</div>
    <div class="details">
      <p><strong>Job ID:</strong> {{job.id}}</p>
      <p><strong>Type:</strong> {{job.type}}</p>
      <p><strong>Status:</strong> {{job.status}}</p>
      <p><strong>Description:</strong> {{job.description}}</p>
      <p><strong>Scheduled Date:</strong> {{job.scheduledDate}}</p>
      <p><strong>Completed Date:</strong> {{job.completedDate}}</p>
      <p><strong>Equipment List:</strong> {{job.equipmentList}}</p>
      <p><strong>Special Requirements:</strong> {{job.specialRequirements}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client Information</div>
    <div class="details">
      <p><strong>Name:</strong> {{client.name}}</p>
      <p><strong>Contact Person:</strong> {{client.contactPerson}}</p>
      <p><strong>Email:</strong> {{client.contactEmail}}</p>
      <p><strong>Phone:</strong> {{client.contactPhone}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Site Information</div>
    <div class="details">
      <p><strong>Name:</strong> {{site.name}}</p>
      <p><strong>Address:</strong> {{site.address}}</p>
      <p><strong>Contact Person:</strong> {{site.contactPerson}}</p>
      <p><strong>Phone:</strong> {{site.contactPhone}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Assigned Technician</div>
    <div class="details">
      <p><strong>ID:</strong> {{technician.id}}</p>
    </div>
  </div>

  {{#if notes}}
  <div class="notes-section">
    <div class="section-title">Notes</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Author</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {{#each notes}}
        <tr>
          <td>{{date}}</td>
          <td>{{author}}</td>
          <td>{{content}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <div class="signature-area">
    <table>
      <tr>
        <th>Technician Signature</th>
        <th>Client Signature</th>
        <th>Date</th>
      </tr>
      <tr>
        <td style="height: 60px;"></td>
        <td></td>
        <td>{{reportDate}}</td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

    // Certificate template
    const certificateTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate</title>
  <style>
    body { 
      font-family: Georgia, serif; 
      margin: 0; 
      padding: 40px; 
      background: #f9f9f9;
    }
    .certificate-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 20px solid #4a6fa5;
      padding: 40px;
      text-align: center;
      position: relative;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .certificate-header {
      margin-bottom: 30px;
    }
    .certificate-title {
      font-size: 2.5em;
      color: #2c3e50;
      margin: 20px 0;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .certificate-subtitle {
      font-size: 1.2em;
      color: #7f8c8d;
      margin-bottom: 40px;
    }
    .certificate-body {
      margin: 30px 0;
      font-size: 1.1em;
      line-height: 1.8;
      color: #34495e;
    }
    .certificate-details {
      text-align: left;
      max-width: 500px;
      margin: 30px auto;
      padding: 15px;
      border: 1px dashed #bdc3c7;
    }
    .detail-row {
      display: flex;
      margin: 8px 0;
    }
    .detail-label {
      font-weight: bold;
      width: 150px;
      min-width: 150px;
    }
    .detail-value {
      flex: 1;
      text-align: left;
    }
    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    .signature-box {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      width: 100%;
    }
    .certificate-footer {
      margin-top: 40px;
      font-size: 0.9em;
      color: #7f8c8d;
    }
    .qr-code {
      margin: 20px auto;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate-header">
      <div class="certificate-title">Certificate of Compliance</div>
      <div class="certificate-subtitle">Issued by Kharon Platform</div>
    </div>

    <div class="certificate-body">
      <p>This is to certify that</p>
      <p><strong>{{client.name}}</strong></p>
      <p>has successfully completed the required {{certificate.type}} system inspection and maintenance as per the job requirements.</p>
    </div>

    <div class="certificate-details">
      <div class="detail-row">
        <div class="detail-label">Certificate ID:</div>
        <div class="detail-value">{{certificate.id}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Certificate Number:</div>
        <div class="detail-value">{{certificate.number}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Type:</div>
        <div class="detail-value">{{certificate.type}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Issue Date:</div>
        <div class="detail-value">{{issuedDate}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Valid From:</div>
        <div class="detail-value">{{certificate.validFrom}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Valid Until:</div>
        <div class="detail-value">{{certificate.validUntil}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Job ID:</div>
        <div class="detail-value">{{job.id}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Job Type:</div>
        <div class="detail-value">{{job.type}}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Status:</div>
        <div class="detail-value">{{certificate.status}}</div>
      </div>
    </div>

    <div class="qr-code">
      <p>Verification Code: {{qrCodeData}}</p>
      <p>Scan to verify certificate authenticity</p>
    </div>

    <div class="signature-area">
      <div class="signature-box">
        <p>Authorized Signatory</p>
        <div class="signature-line"></div>
        <p>{{issuedBy}}</p>
      </div>
      <div class="signature-box">
        <p>Date</p>
        <div class="signature-line"></div>
        <p>{{issuedDate}}</p>
      </div>
    </div>

    <div class="certificate-footer">
      <p>This certificate is valid only with the original signature and official seal.</p>
      <p>For verification, contact Kharon Platform at info@kharon-platform.com</p>
    </div>
  </div>
</body>
</html>
`;

    // Write the templates to files
    await fs.writeFile(path.join(this.templateDir, 'job-card.hbs'), jobCardTemplate);
    await fs.writeFile(path.join(this.templateDir, 'service-report.hbs'), serviceReportTemplate);
    await fs.writeFile(path.join(this.templateDir, 'certificate.hbs'), certificateTemplate);
  }
}

export default {
  DocumentService,
  TemplateService
};