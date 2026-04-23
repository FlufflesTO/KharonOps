import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, SERVICE_PROVIDER } from './styles';
import { DocumentPayload } from './types';
import { 
  TechnicianSignaturePanel, ClientSignaturePanel, 
  formatLongDate, yesNo, certificateRef, CertificateStatusCard,
  getRoomIntegrityStatus
} from './primitives';

export const GasCertificatePDF = ({ data }: { data: DocumentPayload }) => {
  const roomIntegrityStatus = getRoomIntegrityStatus(data.gasData.checklist);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.certificateOuter}>
          <View style={styles.certificateInner}>
            <View>
              <Text style={styles.certificateIssuer}>
                {SERVICE_PROVIDER.name.toUpperCase()} | COMPLIANCE DIVISION
              </Text>
              <Text style={styles.certificateTitle}>
                CERTIFICATE OF CONFORMANCE - SANS 14520
              </Text>

              <View style={styles.certificateRefRow}>
                <View style={styles.certificateRefBox}>
                  <Text style={styles.infoLabel}>Certificate Reference</Text>
                  <Text style={styles.infoValue}>{certificateRef(data.jobMeta.jobId, 'GS-COC')}</Text>
                </View>
                <View style={styles.certificateRefBox}>
                  <Text style={styles.infoLabel}>Issue Date</Text>
                  <Text style={styles.infoValue}>{formatLongDate(data.jobMeta.date)}</Text>
                </View>
              </View>

              <View style={styles.certificateBanner}>
                <Text style={styles.certificateBannerText}>
                  NEXT SERVICE DUE: {data.handover.nextDueDate}
                </Text>
              </View>

              <Text style={styles.certificateParagraph}>
                This certifies that the gaseous fire suppression system protecting {data.system.areaServed} at{' '}
                {data.client.name} / {data.client.address}, utilizing {data.gasData.agent} agent at a design
                concentration of {data.gasData.concentration} for an enclosure volume of {data.gasData.volume}, has
                been inspected and tested on {formatLongDate(data.jobMeta.date)}.
              </Text>

              <Text style={styles.certificateDeclaration}>
                I declare the work was carried out in accordance with SANS 14520.
              </Text>

              <View style={styles.certificateStatusGrid}>
                <CertificateStatusCard label="Client" value={data.client.name} />
                <CertificateStatusCard label="Protected Enclosure" value={data.system.areaServed} />
                <CertificateStatusCard label="Agent" value={data.gasData.agent} />
                <CertificateStatusCard label="Cylinder Details" value={data.gasData.cylinders} />
                <CertificateStatusCard label="Room Integrity Status" value={roomIntegrityStatus} />
                <CertificateStatusCard
                  label="Reinstatement Status"
                  value={`Actuators Reconnected: ${yesNo(data.handover.gasActuatorsReconnected)}`}
                />
              </View>
            </View>

            <View>
              <View style={styles.signatureRow}>
                <TechnicianSignaturePanel data={data} />
                <ClientSignaturePanel data={data} title="CLIENT ACKNOWLEDGEMENT" />
              </View>

              <Text style={styles.certificateHash}>
                Cryptographic Validation Hash: {data.jobMeta.correlationId}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
