import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, SERVICE_PROVIDER } from './styles';
import { DocumentPayload } from './types';
import { 
  TechnicianSignaturePanel, ClientSignaturePanel, 
  formatLongDate, yesNo, certificateRef, CertificateStatusCard 
} from './primitives';

export const FireCertificatePDF = ({ data }: { data: DocumentPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.certificateOuter}>
        <View style={styles.certificateInner}>
          <View>
            <Text style={styles.certificateIssuer}>
              {SERVICE_PROVIDER.name.toUpperCase()} | COMPLIANCE DIVISION
            </Text>
            <Text style={styles.certificateTitle}>
              CERTIFICATE OF CONFORMANCE - SANS 10139
            </Text>

            <View style={styles.certificateRefRow}>
              <View style={styles.certificateRefBox}>
                <Text style={styles.infoLabel}>Certificate Reference</Text>
                <Text style={styles.infoValue}>{certificateRef(data.jobMeta.jobId, 'FD-COC')}</Text>
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
              This certifies that the Fire Detection system at {data.client.name} / {data.client.address} has been
              inspected and tested on {formatLongDate(data.jobMeta.date)}. The system serving {data.system.areaServed},
              including panel {data.system.panelDetails}, was attended under job reference {data.jobMeta.jobId}.
            </Text>

            <Text style={styles.certificateDeclaration}>
              I declare the work was carried out in accordance with SANS 10139.
            </Text>

            <View style={styles.certificateStatusGrid}>
              <CertificateStatusCard label="Client" value={data.client.name} />
              <CertificateStatusCard label="Responsible Person" value={data.client.contactPerson} />
              <CertificateStatusCard label="Technician" value={data.technician.name} />
              <CertificateStatusCard label="SAQCC Registration" value={data.technician.saqccId} />
              <CertificateStatusCard label="Compliance Scope" value={data.jobMeta.workType} />
              <CertificateStatusCard
                label="System Handover Status"
                value={`Reinstated: ${yesNo(data.handover.fireReinstated)}`}
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
