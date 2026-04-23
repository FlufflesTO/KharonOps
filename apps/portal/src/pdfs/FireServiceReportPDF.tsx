import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, SERVICE_PROVIDER } from './styles';
import { DocumentPayload } from './types';
import { 
  Section, InfoGrid, ChecklistTable, DefectsRegister, 
  TechnicianSignaturePanel, ReportFooter, ReportHeader, 
  getFailedItems, formatLongDate, yesNo 
} from './primitives';

export const FireServiceReportPDF = ({ data }: { data: DocumentPayload }) => {
  const failedItems = getFailedItems(data.fireData.checklist);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader title="SANS 10139 SERVICE REPORT" data={data} />

        <Section title="CLIENT & SYSTEM META">
          <InfoGrid
            items={[
              { label: 'Client Name', value: data.client.name },
              { label: 'Responsible Person', value: data.client.contactPerson },
              { label: 'Site Address', value: data.client.address },
              { label: 'Area Served', value: data.system.areaServed },
              { label: 'Panel Details', value: data.system.panelDetails },
              { label: 'System Type', value: data.system.type },
              { label: 'Applicable Standard', value: data.fireData.standard },
              { label: 'Service Provider', value: SERVICE_PROVIDER.name },
              { label: 'Technician', value: data.technician.name },
              { label: 'Competence Level', value: data.technician.competenceLevel },
              { label: 'SAQCC Registration', value: data.technician.saqccId },
              { label: 'Service Regime', value: '6-Monthly service / annual full device coverage' },
            ]}
            columns={2}
          />
        </Section>

        <Section title="CHECKLIST RECORD">
          <ChecklistTable items={data.fireData.checklist} />
        </Section>

        <ReportFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <ReportHeader title="SANS 10139 SERVICE REPORT" data={data} />

        <Section title="DEFECTS & REMEDIALS">
          <DefectsRegister
            items={failedItems}
            emptyText="No failed checklist items were recorded during this inspection."
          />
        </Section>

        <Section title="HANDOVER CONFIRMATIONS">
          <InfoGrid
            items={[
              { label: 'Fire System Reinstated', value: yesNo(data.handover.fireReinstated) },
              { label: 'Logbooks Updated', value: yesNo(data.handover.logbooksUpdated) },
              { label: 'Next Service Due', value: data.handover.nextDueDate },
              { label: 'System Status at Handover', value: 'Returned to normal monitored service' },
            ]}
            columns={2}
          />
          <View style={styles.noteBox}>
            <Text style={styles.bodyText}>Fire System Reinstated: {yesNo(data.handover.fireReinstated)}</Text>
            <Text style={styles.bodyText}>Logbooks Updated: {yesNo(data.handover.logbooksUpdated)}</Text>
          </View>
        </Section>

        <Section title="SIGNATURES & ACCOUNTABILITY">
          <View style={styles.signatureRow}>
            <TechnicianSignaturePanel data={data} />
            <View style={styles.signaturePanel}>
              <Text style={styles.signaturePanelTitle}>CLIENT / RESPONSIBLE PERSON</Text>
              <Text style={styles.signatureMeta}>{data.client.name}</Text>
              <Text style={styles.signatureMeta}>Client Name: {data.client.contactPerson}</Text>
              <Text style={styles.signatureMeta}>Service Date: {formatLongDate(data.jobMeta.date)}</Text>
              <View style={styles.clientSignLine} />
              <Text style={styles.clientSignHint}>Name / Signature / Date</Text>
            </View>
          </View>
        </Section>

        <ReportFooter />
      </Page>
    </Document>
  );
};
