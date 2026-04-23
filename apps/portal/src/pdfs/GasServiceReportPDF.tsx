import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './styles';
import type { DocumentPayload } from './types';
import { 
  Section, InfoGrid, ChecklistTable, DefectsRegister, 
  TechnicianSignaturePanel, ReportFooter, ReportHeader, 
  getFailedItems, yesNo, getRoomIntegrityStatus 
} from './primitives';

export const GasServiceReportPDF = ({ data }: { data: DocumentPayload }) => {
  const failedItems = getFailedItems(data.gasData.checklist);
  const roomIntegrityStatus = getRoomIntegrityStatus(data.gasData.checklist);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader title="SANS 14520 SERVICE REPORT" data={data} />

        <Section title="GAS SYSTEM SPECIFICATIONS">
          <InfoGrid
            items={[
              { label: 'Applicable Standard', value: data.gasData.standard },
              { label: 'Agent', value: data.gasData.agent },
              { label: 'Design Concentration', value: data.gasData.concentration },
              { label: 'Protected Volume', value: data.gasData.volume },
              { label: 'Cylinder Configuration', value: data.gasData.cylinders },
              { label: 'Area Served', value: data.system.areaServed },
              { label: 'Panel Details', value: data.system.panelDetails },
              { label: 'Testing Isolation', value: data.execution.isolations },
            ]}
            columns={2}
          />
        </Section>

        <Section title="CHECKLIST RECORD">
          <ChecklistTable items={data.gasData.checklist} />
        </Section>

        <ReportFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <ReportHeader title="SANS 14520 SERVICE REPORT" data={data} />

        <Section title="DEFECTS & REMEDIALS">
          <DefectsRegister
            items={failedItems}
            emptyText="No gas suppression defects or impairments were recorded during this inspection."
          />
        </Section>

        <Section title="HANDOVER CONFIRMATIONS">
          <InfoGrid
            items={[
              {
                label: 'Gas Actuators Reconnected',
                value: yesNo(data.handover.gasActuatorsReconnected),
              },
              { label: 'Room Integrity Status', value: roomIntegrityStatus },
              { label: 'Logbooks Updated', value: yesNo(data.handover.logbooksUpdated) },
              { label: 'Next Service Due', value: data.handover.nextDueDate },
              { label: 'Detection Interface Reference', value: '3-Monthly check regime' },
              { label: 'Mechanical Service Reference', value: '6-Monthly service regime' },
            ]}
            columns={2}
          />
          <View style={styles.noteBox}>
            <Text style={styles.bodyText}>
              Gas Actuators Reconnected: {yesNo(data.handover.gasActuatorsReconnected)}
            </Text>
            <Text style={styles.bodyText}>Room Integrity Status: {roomIntegrityStatus}</Text>
          </View>
        </Section>

        <Section title="SIGNATURES & ACCOUNTABILITY">
          <View style={styles.signatureRow}>
            <TechnicianSignaturePanel data={data} />
            <View style={styles.signaturePanel}>
              <Text style={styles.signaturePanelTitle}>CLIENT / RESPONSIBLE PERSON</Text>
              <Text style={styles.signatureMeta}>{data.client.name}</Text>
              <Text style={styles.signatureMeta}>Client Name: {data.client.contactPerson}</Text>
              <Text style={styles.signatureMeta}>Protected Enclosure: {data.system.areaServed}</Text>
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
