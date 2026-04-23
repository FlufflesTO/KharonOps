import React from "react";
import type { DocumentPayload } from "../pdfs/types";

export async function renderComplianceDocument(args: {
  documentType: "jobcard" | "service_report" | "certificate";
  isGas: boolean;
  payload: DocumentPayload;
}): Promise<Blob> {
  const [{ pdf }, Documents] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../pdfs")
  ]);

  const docElement =
    args.documentType === "jobcard"
      ? React.createElement(Documents.JobcardPDF, { data: args.payload })
      : args.documentType === "service_report"
        ? args.isGas
          ? React.createElement(Documents.GasServiceReportPDF, { data: args.payload })
          : React.createElement(Documents.FireServiceReportPDF, { data: args.payload })
        : args.isGas
          ? React.createElement(Documents.GasCertificatePDF, { data: args.payload })
          : React.createElement(Documents.FireCertificatePDF, { data: args.payload });

  return pdf(docElement as any).toBlob();
}
