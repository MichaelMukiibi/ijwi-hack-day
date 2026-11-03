export type ReviewStatus = 'awaiting_review' | 'in_review' | 'changes_required' | 'approved';

export interface ReportDraft {
  referralReason: string;
  relevantHistory: string;
  reportedSymptoms: string;
  examinationFindings: string;
  screeningResult: string;
  supportingEvidence: string;
  clinicalAssessment: string;
  recommendedNextSteps: string;
  followUpPlan: string;
  reviewerNotes: string;
}

export const handoffCase = {
  caseId: 'DEMO-IJWI-001',
  patientContext: 'Synthetic demonstration case. No real person is represented.',
  relevantHistory: 'Not supplied in this synthetic fixture.',
  reportedSymptoms: 'Not supplied in this synthetic fixture.',
  healthWorkerObservations: 'No examination observations were supplied in this fixture.',
  imageAvailability: 'No retinal image is attached.',
  screening: {
    provider: 'FastDRS',
    status: 'Not connected',
    result: null as string | null,
  },
  handoffDate: null as string | null,
} as const;

export const initialReport: ReportDraft = {
  referralReason: 'Draft pending source case details. No referral reason was supplied in this synthetic fixture.',
  relevantHistory: 'No relevant history was supplied in this synthetic fixture.',
  reportedSymptoms: 'No patient-reported symptoms were supplied in this synthetic fixture.',
  examinationFindings: 'No health-worker examination findings were supplied in this synthetic fixture.',
  screeningResult: 'Unavailable. FastDRS is not connected to this demonstration.',
  supportingEvidence: 'No supporting evidence is attached. Live evidence retrieval is not connected.',
  clinicalAssessment: '',
  recommendedNextSteps: '',
  followUpPlan: '',
  reviewerNotes: '',
};

export const reportSections: {
  key: keyof ReportDraft;
  label: string;
  provenance: 'draft' | 'clinician';
  placeholder: string;
}[] = [
  { key: 'referralReason', label: 'Reason for referral', provenance: 'draft', placeholder: 'Enter the referral reason from the source case.' },
  { key: 'relevantHistory', label: 'Relevant history', provenance: 'draft', placeholder: 'Enter supplied history, or state that it was not supplied.' },
  { key: 'reportedSymptoms', label: 'Patient-reported symptoms', provenance: 'draft', placeholder: 'Enter symptoms reported by the patient.' },
  { key: 'examinationFindings', label: 'Examination findings', provenance: 'draft', placeholder: 'Enter health-worker observations; do not infer findings.' },
  { key: 'screeningResult', label: 'Screening result', provenance: 'draft', placeholder: 'Enter an actual screening result and its source.' },
  { key: 'supportingEvidence', label: 'Supporting evidence', provenance: 'draft', placeholder: 'Add verified references, or state that none are attached.' },
  { key: 'clinicalAssessment', label: 'Clinical assessment', provenance: 'clinician', placeholder: 'Clinician-entered assessment; leave blank until assessed.' },
  { key: 'recommendedNextSteps', label: 'Recommended next steps', provenance: 'clinician', placeholder: 'Clinician-entered next steps; leave blank until decided.' },
  { key: 'followUpPlan', label: 'Follow-up plan', provenance: 'clinician', placeholder: 'Clinician-entered follow-up plan.' },
  { key: 'reviewerNotes', label: 'Reviewer notes', provenance: 'clinician', placeholder: 'Add notes for this synthetic demo review.' },
];
