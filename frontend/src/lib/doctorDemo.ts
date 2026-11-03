export type DoctorReviewStatus = 'awaiting_review' | 'in_review' | 'changes_required' | 'approved';

export interface DoctorReport {
  caseSummary: string;
  clinicalObservations: string;
  assessment: string;
  recommendations: string;
  followUp: string;
  reviewerNotes: string;
}

export interface DoctorCase {
  caseId: string;
  source: 'synthetic_demo';
  patientInformation: string;
  healthWorkerObservations: string;
  imageAvailability: string;
  screeningProvider: string;
  screeningHistory: readonly string[];
  aiDraft: string | null;
  evidence: readonly string[];
  missingInformation: readonly string[];
}

export interface DoctorActivity {
  action: string;
  time: string;
}

export interface DoctorReviewRecord {
  draft: DoctorReport;
  savedDraft: DoctorReport | null;
  status: DoctorReviewStatus;
  activity: DoctorActivity[];
}

export const doctorCases: DoctorCase[] = [
  {
    caseId: 'DEMO-SCR-104',
    source: 'synthetic_demo',
    patientInformation: 'No patient information is included in this synthetic queue item.',
    healthWorkerObservations: 'No health-worker submission is attached.',
    imageAvailability: 'No retinal image is attached.',
    screeningProvider: 'FastDRS',
    screeningHistory: [],
    aiDraft: null,
    evidence: [],
    missingInformation: [
      'Patient and case information are not supplied.',
      'Health-worker observations are not attached.',
      'Retinal image is not attached.',
      'No completed FastDRS screening run is available.',
      'No case-linked Gemma draft explanation is available.',
      'No supporting evidence is attached.',
    ],
  },
  {
    caseId: 'DEMO-SCR-105',
    source: 'synthetic_demo',
    patientInformation: 'No patient information is included in this synthetic queue item.',
    healthWorkerObservations: 'No health-worker submission is attached.',
    imageAvailability: 'No retinal image is attached.',
    screeningProvider: 'FastDRS',
    screeningHistory: [],
    aiDraft: null,
    evidence: [],
    missingInformation: [
      'Patient and case information are not supplied.',
      'Health-worker observations are not attached.',
      'Retinal image is not attached.',
      'No completed FastDRS screening run is available.',
      'No case-linked Gemma draft explanation is available.',
      'No supporting evidence is attached.',
    ],
  },
];

export const doctorReportFields: {
  key: keyof DoctorReport;
  label: string;
  description: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: 'caseSummary',
    label: 'Case summary',
    description: 'Clinician-authored; use only information available in the case.',
    placeholder: 'Summarize supplied case information. State when details are unavailable.',
    rows: 3,
  },
  {
    key: 'clinicalObservations',
    label: 'Clinical observations',
    description: 'Clinician-entered; keep separate from health-worker observations.',
    placeholder: 'Enter your observations, or leave blank until assessed.',
    rows: 3,
  },
  {
    key: 'assessment',
    label: 'Clinical assessment',
    description: 'Clinician-entered; no assessment is prefilled.',
    placeholder: 'Enter your assessment, or leave blank until assessed.',
    rows: 3,
  },
  {
    key: 'recommendations',
    label: 'Recommendations',
    description: 'Clinician-entered; no treatment or triage is generated.',
    placeholder: 'Enter recommendations after your review.',
    rows: 2,
  },
  {
    key: 'followUp',
    label: 'Follow-up plan',
    description: 'Clinician-entered.',
    placeholder: 'Enter a follow-up plan after your review.',
    rows: 2,
  },
  {
    key: 'reviewerNotes',
    label: 'Reviewer notes',
    description: 'For this synthetic demonstration only.',
    placeholder: 'Add notes for this report review.',
    rows: 2,
  },
];

export function createDoctorReviewRecord(): DoctorReviewRecord {
  return {
    draft: {
      caseSummary: '',
      clinicalObservations: '',
      assessment: '',
      recommendations: '',
      followUp: '',
      reviewerNotes: '',
    },
    savedDraft: null,
    status: 'awaiting_review',
    activity: [],
  };
}

export function sameDoctorReport(left: DoctorReport, right: DoctorReport): boolean {
  return doctorReportFields.every(field => left[field.key] === right[field.key]);
}
