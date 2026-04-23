/**
 * KharonOps Document Payloads
 * Project Kharon - PDF Generation Engine
 */

export type ChecklistStatus = 'pass' | 'fail' | 'na';

export type ChecklistItem = {
  label: string;
  status: ChecklistStatus;
  value?: string;
  defect?: string;
  action?: string;
};

export type DocumentPayload = {
  jobMeta: {
    jobId: string;
    correlationId: string;
    date: string;
    timeIn: string;
    timeOut: string;
    workType: string;
  };
  client: {
    name: string;
    address: string;
    contactPerson: string;
  };
  system: {
    type: string;
    areaServed: string;
    panelDetails: string;
  };
  technician: {
    name: string;
    saqccId: string;
    competenceLevel: string;
    signatureUrl: string;
  };
  execution: {
    safetyCleared: boolean;
    isolations: string;
    materialsUsed: string;
    generalNotes: string;
  };
  fireData: {
    standard: string;
    checklist: ChecklistItem[];
  };
  gasData: {
    standard: string;
    agent: string;
    concentration: string;
    volume: string;
    cylinders: string;
    checklist: ChecklistItem[];
  };
  handover: {
    fireReinstated: boolean;
    gasActuatorsReconnected: boolean;
    logbooksUpdated: boolean;
    nextDueDate: string;
  };
};
