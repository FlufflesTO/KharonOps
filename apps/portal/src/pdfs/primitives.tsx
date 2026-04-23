import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { styles, COLORS, SERVICE_PROVIDER } from './styles';
import { ChecklistItem, DocumentPayload, ChecklistStatus } from './types';

export const formatDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${String(day).padStart(2, '0')} ${months[(month || 1) - 1]} ${year}`;
};

export const formatLongDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[(month || 1) - 1]} ${year}`;
};

export const yesNo = (value: boolean): string => (value ? 'YES' : 'NO');

export const extractSignatureUrl = (value: string): string | null => {
  const markdownMatch = value.match(/\((https?:\/\/[^)]+)\)/);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }
  const directMatch = value.match(/https?:\/\/\S+/);
  return directMatch?.[0] ?? null;
};

export const getFailedItems = (items: ChecklistItem[]): ChecklistItem[] => items.filter((item) => item.status === 'fail');

export const getChecklistInputValue = (item: ChecklistItem): string => {
  if (item.value) return item.value;
  if (item.status === 'fail') return 'See defect register';
  return '—';
};

export const getRoomIntegrityStatus = (items: ChecklistItem[]): string => {
  const integrityItem = items.find((item) => /integrity/i.test(item.label));
  if (!integrityItem) return 'NOT STATED';
  if (integrityItem.status === 'pass') return 'VALID';
  if (integrityItem.status === 'na') return 'N/A';
  return 'NOT VALID';
};

export const certificateRef = (jobId: string, suffix: string): string => `${jobId}-${suffix}`;

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

export type InfoItem = { label: string; value: string };

export const InfoGrid = ({
  items,
  columns = 2,
}: {
  items: InfoItem[];
  columns?: 2 | 3 | 4;
}) => {
  const cellStyle =
    columns === 4 ? styles.infoCellQuarter : columns === 3 ? styles.infoCellThird : styles.infoCellHalf;

  return (
    <View style={styles.infoGrid}>
      {items.map((item, idx) => (
        <View key={`${item.label}-${idx}`} style={cellStyle}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text style={styles.infoValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

export const StatusCell = ({ active, tone }: { active: boolean; tone: ChecklistStatus }) => {
  const toneStyle =
    tone === 'pass' ? styles.statusCellPass : tone === 'fail' ? styles.statusCellFail : styles.statusCellNa;

  return (
    <View style={[styles.statusCell, active && toneStyle]}>
      <Text style={styles.statusCellText}>{active ? 'X' : ''}</Text>
    </View>
  );
};

export const ChecklistTable = ({ items }: { items: ChecklistItem[] }) => (
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      <View style={styles.colTask}>
        <Text style={styles.headerCellText}>TASK</Text>
      </View>
      <View style={styles.colStatus}>
        <Text style={styles.headerCellText}>PASS</Text>
      </View>
      <View style={styles.colStatus}>
        <Text style={styles.headerCellText}>FAIL</Text>
      </View>
      <View style={styles.colStatus}>
        <Text style={styles.headerCellText}>N/A</Text>
      </View>
      <View style={styles.colValue}>
        <Text style={styles.headerCellText}>INPUT VALUE</Text>
      </View>
    </View>

    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      const isAlt = index % 2 === 1;

      return (
        <View
          key={`${item.label}-${index}`}
          style={[
            styles.tableRow,
            isAlt && styles.tableRowAlt,
            isLast && styles.tableLastRow,
          ]}
        >
          <View style={styles.colTask}>
            <Text style={styles.taskText}>{item.label}</Text>
          </View>
          <View style={styles.colStatus}>
            <StatusCell active={item.status === 'pass'} tone="pass" />
          </View>
          <View style={styles.colStatus}>
            <StatusCell active={item.status === 'fail'} tone="fail" />
          </View>
          <View style={styles.colStatus}>
            <StatusCell active={item.status === 'na'} tone="na" />
          </View>
          <View style={styles.colValue}>
            <Text style={styles.taskText}>{getChecklistInputValue(item)}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

export const DefectsRegister = ({
  items,
  emptyText,
}: {
  items: ChecklistItem[];
  emptyText: string;
}) => {
  if (items.length === 0) {
    return (
      <View style={styles.noteBox}>
        <Text style={styles.bodyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.defectCard}>
          <Text style={styles.defectHeading}>{item.label}</Text>
          <Text style={styles.defectLine}>
            <Text style={styles.emphasisText}>Defect:</Text> {item.defect || 'None recorded.'}
          </Text>
          <Text style={styles.defectLine}>
            <Text style={styles.emphasisText}>Remedial Action:</Text> {item.action || 'No remedial action recorded.'}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const SignatureImage = ({ url }: { url: string | null }) => (
  <View style={styles.signatureImageWrap}>
    {url ? (
      <Image src={url} style={styles.signatureImage} />
    ) : (
      <View style={styles.signaturePlaceholder}>
        <Text style={styles.signaturePlaceholderText}>Signature on file</Text>
      </View>
    )}
  </View>
);

export const TechnicianSignaturePanel = ({
  data,
}: {
  data: DocumentPayload;
}) => {
  const signatureUrl = extractSignatureUrl(data.technician.signatureUrl);

  return (
    <View style={styles.signaturePanel}>
      <Text style={styles.signaturePanelTitle}>TECHNICIAN SIGN-OFF</Text>
      <SignatureImage url={signatureUrl} />
      <Text style={styles.signatureMeta}>{data.technician.name}</Text>
      <Text style={styles.signatureMeta}>SAQCC ID: {data.technician.saqccId}</Text>
      <Text style={styles.signatureMeta}>{data.technician.competenceLevel}</Text>
    </View>
  );
};

export const ClientSignaturePanel = ({
  data,
  title = 'CLIENT ACKNOWLEDGEMENT',
}: {
  data: DocumentPayload;
  title?: string;
}) => (
  <View style={styles.signaturePanel}>
    <Text style={styles.signaturePanelTitle}>{title}</Text>
    <Text style={styles.signatureMeta}>{data.client.name}</Text>
    <Text style={styles.signatureMeta}>Responsible Person: {data.client.contactPerson}</Text>
    <View style={styles.clientSignLine} />
    <Text style={styles.clientSignHint}>Name / Signature / Date</Text>
  </View>
);

export const ReportFooter = () => (
  <Text
    style={styles.pageNumber}
    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    fixed
  />
);

export const ReportHeader = ({
  title,
  data,
}: {
  title: string;
  data: DocumentPayload;
}) => (
  <>
    <View style={styles.headerBand}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            {SERVICE_PROVIDER.name} | {SERVICE_PROVIDER.descriptor}
          </Text>
        </View>
        <View style={styles.headerMetaBlock}>
          <Text style={styles.headerMetaText}>JOB ID: {data.jobMeta.jobId}</Text>
          <Text style={styles.headerMetaText}>DATE: {formatDate(data.jobMeta.date)}</Text>
          <Text style={styles.headerMetaText}>REF: {data.jobMeta.correlationId}</Text>
        </View>
      </View>
    </View>

    <View style={styles.reportTopMeta}>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>CLIENT</Text>
        <Text style={styles.microValue}>{data.client.name}</Text>
      </View>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>AREA SERVED</Text>
        <Text style={styles.microValue}>{data.system.areaServed}</Text>
      </View>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>WORK TYPE</Text>
        <Text style={styles.microValue}>{data.jobMeta.workType}</Text>
      </View>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>PANEL / SYSTEM</Text>
        <Text style={styles.microValue}>{data.system.panelDetails}</Text>
      </View>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>TECHNICIAN</Text>
        <Text style={styles.microValue}>{data.technician.name}</Text>
      </View>
      <View style={styles.reportTopMetaItem}>
        <Text style={styles.microLabel}>TIME IN / OUT</Text>
        <Text style={styles.microValue}>
          {data.jobMeta.timeIn} - {data.jobMeta.timeOut}
        </Text>
      </View>
    </View>
  </>
);

export const CertificateStatusCard = ({ label, value }: InfoItem) => (
  <View style={styles.certificateStatusCard}>
    <View style={styles.certificateStatusInner}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);
