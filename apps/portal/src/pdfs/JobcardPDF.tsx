import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, SERVICE_PROVIDER } from './styles';
import type { DocumentPayload } from './types';
import { Section, InfoGrid, yesNo, formatDate, TechnicianSignaturePanel, ClientSignaturePanel } from './primitives';

export const JobcardPDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A5" style={styles.pageA5}>
      <View style={styles.headerBand}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { fontSize: 12 }]}>FIELD JOBCARD</Text>
            <Text style={styles.headerSubtitle}>{SERVICE_PROVIDER.name}</Text>
          </View>
          <View style={styles.headerMetaBlock}>
            <Text style={styles.headerMetaText}>JOB ID: {data.jobMeta.jobId}</Text>
            <Text style={styles.headerMetaText}>DATE: {formatDate(data.jobMeta.date)}</Text>
            <Text style={styles.headerMetaText}>
              {data.jobMeta.timeIn} - {data.jobMeta.timeOut}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reportTopMeta}>
        <View style={styles.a5TopMetaItem}>
          <Text style={styles.microLabel}>CLIENT</Text>
          <Text style={styles.microValue}>{data.client.name}</Text>
        </View>
        <View style={styles.a5TopMetaItem}>
          <Text style={styles.microLabel}>CONTACT</Text>
          <Text style={styles.microValue}>{data.client.contactPerson}</Text>
        </View>
        <View style={styles.a5TopMetaItem}>
          <Text style={styles.microLabel}>SYSTEM TYPE</Text>
          <Text style={styles.microValue}>{data.system.type}</Text>
        </View>
        <View style={styles.a5TopMetaItem}>
          <Text style={styles.microLabel}>WORK TYPE</Text>
          <Text style={styles.microValue}>{data.jobMeta.workType}</Text>
        </View>
        <View style={[styles.a5TopMetaItem, { width: '100%' }]}>
          <Text style={styles.microLabel}>SITE ADDRESS</Text>
          <Text style={styles.microValue}>{data.client.address}</Text>
        </View>
      </View>

      <Section title="SAFETY / ISOLATIONS">
        <InfoGrid
          items={[
            { label: 'SAFETY CLEARED', value: yesNo(data.execution.safetyCleared) },
            { label: 'TECHNICIAN', value: `${data.technician.name} | ${data.technician.saqccId}` },
          ]}
          columns={2}
        />
        <View style={styles.noteBox}>
          <Text style={styles.bodyText}>
            <Text style={styles.emphasisText}>Isolation Record:</Text> {data.execution.isolations}
          </Text>
        </View>
      </Section>

      <Section title="WORK SUMMARY">
        <View style={styles.spacer}>
          <Text style={styles.bodyText}>
            <Text style={styles.emphasisText}>Materials Used:</Text> {data.execution.materialsUsed}
          </Text>
        </View>
        <View style={styles.noteBox}>
          <Text style={styles.bodyText}>
            <Text style={styles.emphasisText}>General Notes:</Text> {data.execution.generalNotes}
          </Text>
        </View>
      </Section>

      <Section title="SIGN-OFFS">
        <View style={styles.signatureRow}>
          <TechnicianSignaturePanel data={data} />
          <ClientSignaturePanel data={data} title="CLIENT SIGN-OFF" />
        </View>
      </Section>
    </Page>
  </Document>
);
