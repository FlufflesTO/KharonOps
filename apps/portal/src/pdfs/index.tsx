import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { DocumentPayload } from './types';
import { JobcardPDF } from './JobcardPDF';
import { FireServiceReportPDF } from './FireServiceReportPDF';
import { FireCertificatePDF } from './FireCertificatePDF';
import { GasServiceReportPDF } from './GasServiceReportPDF';
import { GasCertificatePDF } from './GasCertificatePDF';

export * from './types';
export * from './JobcardPDF';
export * from './FireServiceReportPDF';
export * from './FireCertificatePDF';
export * from './GasServiceReportPDF';
export * from './GasCertificatePDF';

/**
 * Compliance Documents Collection
 * Returns blobs for all 5 documents in a single typed generation pipeline.
 */
export async function renderAllCompliancePdfs(payload: DocumentPayload) {
  const results = await Promise.all([
    pdf(<JobcardPDF data={payload} />).toBlob(),
    pdf(<FireServiceReportPDF data={payload} />).toBlob(),
    pdf(<FireCertificatePDF data={payload} />).toBlob(),
    pdf(<GasServiceReportPDF data={payload} />).toBlob(),
    pdf(<GasCertificatePDF data={payload} />).toBlob(),
  ]);

  return {
    jobcard: results[0],
    fireReport: results[1],
    fireCert: results[2],
    gasReport: results[3],
    gasCert: results[4],
  };
}
