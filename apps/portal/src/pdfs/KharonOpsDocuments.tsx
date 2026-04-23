import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- TYPES ---
export interface DocumentPayload {
  jobId: string;
  clientName: string;
  siteAddress: string;
  technicianName: string;
  serviceDate: string;
  status: string;
  notes: string;
  items: Array<{ description: string; status: "Pass" | "Fail" | "N/A" }>;
  defects: Array<{ description: string; severity: "Low" | "Medium" | "High" }>;
  signatures: {
    client?: string;
    technician?: string;
  };
}

// --- STYLES ---
const KHARON_COLORS = {
  primary: '#7C3AED', // Kharon Purple
  background: '#1A1A1A',
  surface: '#2D2D2D',
  text: '#FFFFFF',
  muted: '#A3A3A3',
  border: '#404040',
  success: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  lightBg: '#F9FAFB',
  lightText: '#111827',
  lightBorder: '#E5E7EB',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: KHARON_COLORS.lightText,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: KHARON_COLORS.primary,
    paddingBottom: 15,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KHARON_COLORS.primary,
  },
  docTitle: {
    fontSize: 16,
    color: KHARON_COLORS.muted,
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: KHARON_COLORS.lightBorder,
    borderRadius: 4,
  },
  metaCell: {
    width: '50%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: KHARON_COLORS.lightBorder,
  },
  metaLabel: {
    fontSize: 9,
    color: KHARON_COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: KHARON_COLORS.lightBg,
    padding: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: KHARON_COLORS.primary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: KHARON_COLORS.lightBorder,
    paddingVertical: 6,
  },
  tableColDesc: { width: '80%', fontSize: 10 },
  tableColStatus: { width: '20%', fontSize: 10, textAlign: 'right', fontWeight: 'bold' },
  statusPass: { color: KHARON_COLORS.success },
  statusFail: { color: KHARON_COLORS.critical },
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: KHARON_COLORS.lightBorder,
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 10,
    color: KHARON_COLORS.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: KHARON_COLORS.muted,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: KHARON_COLORS.lightBorder,
    paddingTop: 10,
  }
});

// --- SHARED COMPONENTS ---
const DocumentHeader = ({ title, jobId }: { title: string, jobId: string }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.brandTitle}>KHARON OPERATIONS</Text>
      <Text style={styles.docTitle}>{title}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 10, color: KHARON_COLORS.muted }}>JOB ID</Text>
      <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{jobId}</Text>
    </View>
  </View>
);

const MetaGrid = ({ data }: { data: DocumentPayload }) => (
  <View style={styles.metaGrid}>
    <View style={styles.metaCell}><Text style={styles.metaLabel}>Client</Text><Text style={styles.metaValue}>{data.clientName}</Text></View>
    <View style={styles.metaCell}><Text style={styles.metaLabel}>Date</Text><Text style={styles.metaValue}>{data.serviceDate}</Text></View>
    <View style={styles.metaCell}><Text style={styles.metaLabel}>Site Address</Text><Text style={styles.metaValue}>{data.siteAddress}</Text></View>
    <View style={styles.metaCell}><Text style={styles.metaLabel}>Technician</Text><Text style={styles.metaValue}>{data.technicianName}</Text></View>
  </View>
);

const NotesSection = ({ notes }: { notes: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Operational Notes</Text>
    <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{notes || 'No notes provided.'}</Text>
  </View>
);

const Checklist = ({ items }: { items: DocumentPayload['items'] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Checklist & Verifications</Text>
    {items.length === 0 ? <Text style={{ fontSize: 10 }}>No items recorded.</Text> : items.map((item, idx) => (
      <View key={idx} style={styles.tableRow}>
        <Text style={styles.tableColDesc}>{item.description}</Text>
        <Text style={[styles.tableColStatus, item.status === 'Pass' ? styles.statusPass : item.status === 'Fail' ? styles.statusFail : {}]}>
          {item.status}
        </Text>
      </View>
    ))}
  </View>
);

const DefectsRegister = ({ defects }: { defects: DocumentPayload['defects'] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Defects Register</Text>
    {defects.length === 0 ? <Text style={{ fontSize: 10 }}>No defects reported.</Text> : defects.map((defect, idx) => (
      <View key={idx} style={styles.tableRow}>
        <Text style={styles.tableColDesc}>{defect.description}</Text>
        <Text style={[styles.tableColStatus, { color: defect.severity === 'High' ? KHARON_COLORS.critical : KHARON_COLORS.warning }]}>
          {defect.severity}
        </Text>
      </View>
    ))}
  </View>
);

const Signatures = ({ data }: { data: DocumentPayload }) => (
  <View style={styles.signatureBlock}>
    <View style={styles.signatureBox}>
      <Text style={styles.signatureLabel}>Technician Signature: {data.technicianName}</Text>
      {data.signatures?.technician && <Text style={{ fontSize: 10, marginTop: 10 }}>[Signed Digitally]</Text>}
    </View>
    <View style={styles.signatureBox}>
      <Text style={styles.signatureLabel}>Client Signature</Text>
      {data.signatures?.client && <Text style={{ fontSize: 10, marginTop: 10 }}>[Signed Digitally]</Text>}
    </View>
  </View>
);

const Footer = ({ type }: { type: string }) => (
  <View style={styles.footer} fixed>
    <Text>Generated via KharonOps Servare Platform • Document Type: {type} • Page 1 of 1</Text>
  </View>
);

// --- 5 INDEPENDENT DOCUMENTS ---

export const JobcardPDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DocumentHeader title="JOBCARD" jobId={data.jobId} />
      <MetaGrid data={data} />
      <NotesSection notes={data.notes} />
      <Checklist items={data.items} />
      <Signatures data={data} />
      <Footer type="Internal Jobcard" />
    </Page>
  </Document>
);

export const FireServiceReportPDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DocumentHeader title="FIRE SERVICE REPORT" jobId={data.jobId} />
      <MetaGrid data={data} />
      <Checklist items={data.items} />
      <DefectsRegister defects={data.defects} />
      <NotesSection notes={data.notes} />
      <Signatures data={data} />
      <Footer type="SANS 1475 Fire Service Report" />
    </Page>
  </Document>
);

export const FireCertificatePDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DocumentHeader title="CERTIFICATE OF COMPLIANCE (FIRE)" jobId={data.jobId} />
      <MetaGrid data={data} />
      <View style={styles.section}>
        <Text style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'justify', marginBottom: 20 }}>
          This certifies that the fire protection equipment at the specified site address has been serviced 
          and maintained in accordance with the relevant SANS standards. 
          The installations are deemed compliant and in operational condition as of the service date.
        </Text>
      </View>
      <Signatures data={data} />
      <Footer type="SANS Fire Compliance Certificate" />
    </Page>
  </Document>
);

export const GasServiceReportPDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DocumentHeader title="GAS SERVICE REPORT" jobId={data.jobId} />
      <MetaGrid data={data} />
      <Checklist items={data.items} />
      <DefectsRegister defects={data.defects} />
      <NotesSection notes={data.notes} />
      <Signatures data={data} />
      <Footer type="Gas Installation Service Report" />
    </Page>
  </Document>
);

export const GasCertificatePDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DocumentHeader title="CERTIFICATE OF CONFORMITY (GAS)" jobId={data.jobId} />
      <MetaGrid data={data} />
      <View style={styles.section}>
        <Text style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'justify', marginBottom: 20 }}>
          This Certificate of Conformity is issued in terms of the Pressure Equipment Regulations. 
          It confirms that the gas installation at the provided site address conforms to safety standards 
          and has been tested to be leak-free and compliant.
        </Text>
      </View>
      <Signatures data={data} />
      <Footer type="Gas Compliance Certificate (COC)" />
    </Page>
  </Document>
);
