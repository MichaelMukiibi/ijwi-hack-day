import { useState } from 'react';
import type { DoctorReport, DoctorReviewRecord, DoctorReviewStatus } from '../lib/doctorDemo';
import { createDoctorReviewRecord, doctorCases, doctorReportFields, sameDoctorReport } from '../lib/doctorDemo';
import { printReport } from '../lib/print';

const statusLabels: Record<DoctorReviewStatus, string> = {
  awaiting_review: 'Awaiting review',
  in_review: 'In review',
  changes_required: 'Changes required',
  approved: 'Approved by reviewer',
};

function createInitialReviews(): Record<string, DoctorReviewRecord> {
  return Object.fromEntries(doctorCases.map(caseItem => [caseItem.caseId, createDoctorReviewRecord()]));
}

export function DoctorReportWorkspace() {
  const [activeCaseId, setActiveCaseId] = useState(doctorCases[0].caseId);
  const [reviews, setReviews] = useState<Record<string, DoctorReviewRecord>>(createInitialReviews);
  const [feedback, setFeedback] = useState('');
  const activeCase = doctorCases.find(caseItem => caseItem.caseId === activeCaseId) ?? doctorCases[0];
  const review = reviews[activeCase.caseId];
  const hasUnsavedChanges = review.savedDraft === null
    ? doctorReportFields.some(field => review.draft[field.key] !== '')
    : !sameDoctorReport(review.draft, review.savedDraft);
  const canApprove = review.savedDraft !== null && !hasUnsavedChanges;

  function updateReview(update: (current: DoctorReviewRecord) => DoctorReviewRecord) {
    setReviews(current => ({ ...current, [activeCase.caseId]: update(current[activeCase.caseId]) }));
  }

  function recordActivity(record: DoctorReviewRecord, action: string): DoctorReviewRecord {
    return {
      ...record,
      activity: [{ action, time: new Date().toLocaleString() }, ...record.activity],
    };
  }

  function updateField(key: keyof DoctorReport, value: string) {
    updateReview(current => ({ ...current, draft: { ...current.draft, [key]: value } }));
    setFeedback('');
  }

  function saveDraft() {
    updateReview(current => recordActivity({ ...current, savedDraft: { ...current.draft } }, 'Report draft saved in this demo session'));
    setFeedback('Report draft saved in memory for this demo session.');
  }

  function changeStatus(status: DoctorReviewStatus, action: string) {
    updateReview(current => recordActivity({ ...current, status }, action));
    setFeedback(`${statusLabels[status]} — demo review status updated.`);
  }

  function resetCase() {
    const confirmed = window.confirm(`Reset ${activeCase.caseId}'s report draft, status, and review history?`);
    if (!confirmed) return;
    updateReview(() => createDoctorReviewRecord());
    setFeedback('Synthetic report reset. No report data was stored.');
  }

  function resetAll() {
    const confirmed = window.confirm('Reset all synthetic report drafts, review statuses, and in-memory activity?');
    if (!confirmed) return;
    setReviews(createInitialReviews());
    setFeedback('Synthetic reports reset. No report data was stored.');
  }

  return (
    <section id="doctor-workspace" className="doctor-workspace-section" aria-labelledby="doctor-workspace-heading">
      <header className="doctor-workspace-heading wrap">
        <p className="eyebrow">05 / DOCTOR’S REPORT WORKSPACE</p>
        <h2 id="doctor-workspace-heading">Review the case.<br /><em>Author the report.</em></h2>
        <p>A clinician’s workspace for incoming retinal-screening handoffs. This demo queue contains synthetic case stubs only.</p>
      </header>

      <div className="doctor-workspace-layout wrap">
        <aside className="doctor-queue" aria-labelledby="doctor-queue-heading">
          <div className="doctor-panel-heading">
            <div>
              <p className="doctor-kicker">INCOMING</p>
              <h3 id="doctor-queue-heading">Case queue</h3>
            </div>
            <span className="demo-tag">DEMO</span>
          </div>
          <p className="doctor-queue-note">Synthetic workflow examples · no patient records connected</p>
          <div className="doctor-case-list">
            {doctorCases.map(caseItem => {
              const caseReview = reviews[caseItem.caseId];
              return (
                <button
                  type="button"
                  className="doctor-case-option"
                  key={caseItem.caseId}
                  aria-pressed={caseItem.caseId === activeCase.caseId}
                  onClick={() => { setActiveCaseId(caseItem.caseId); setFeedback(''); }}
                >
                  <span className="doctor-case-option-top">
                    <strong>{caseItem.caseId}</strong>
                    <span className={`doctor-status-dot status-dot-${caseReview.status}`} aria-hidden="true" />
                  </span>
                  <span className="doctor-case-option-bottom">{statusLabels[caseReview.status]}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="doctor-text-button" onClick={resetAll}>Reset all demo cases</button>
        </aside>

        <div className="doctor-case-details">
          <section className="doctor-panel" aria-labelledby="doctor-case-heading">
            <div className="doctor-panel-heading">
              <div>
                <p className="doctor-kicker">SYNTHETIC CASE · {activeCase.source.replace('_', ' ').toUpperCase()}</p>
                <h3 id="doctor-case-heading">{activeCase.caseId}</h3>
              </div>
              <span className={`doctor-review-status doctor-status-${review.status}`} role="status">{statusLabels[review.status]}</span>
            </div>
            <dl className="doctor-case-facts">
              <div><dt>Patient information</dt><dd>{activeCase.patientInformation}</dd></div>
              <div><dt>Health-worker observations</dt><dd>{activeCase.healthWorkerObservations}</dd></div>
              <div><dt>Retinal image</dt><dd>{activeCase.imageAvailability}</dd></div>
            </dl>
          </section>

          <section className="doctor-panel doctor-screening" aria-labelledby="doctor-screening-heading">
            <div className="doctor-panel-heading">
              <div>
                <p className="doctor-kicker">SCREENING SERVICE OUTPUT</p>
                <h3 id="doctor-screening-heading">Screening history</h3>
              </div>
              <span className="demo-tag">NOT CONNECTED</span>
            </div>
            <p><strong>Source:</strong> {activeCase.screeningProvider}</p>
            {activeCase.screeningHistory.length
              ? <ul>{activeCase.screeningHistory.map(item => <li key={item}>{item}</li>)}</ul>
              : <p className="doctor-empty-state">No completed screening runs are attached. No result or screening history is available in this demo.</p>}
          </section>

          <div className="doctor-source-grid">
            <section className="doctor-source-panel" aria-labelledby="doctor-ai-heading">
              <p className="doctor-kicker">GEMMA · CASE EXPLANATION</p>
              <h3 id="doctor-ai-heading">AI draft explanation</h3>
              <p>{activeCase.aiDraft ?? 'No case-linked AI draft is available. The Gemma chat is separate and does not receive this case.'}</p>
              <span className="source-status">UNAVAILABLE FOR THIS CASE</span>
            </section>
            <section className="doctor-source-panel" aria-labelledby="doctor-evidence-heading">
              <p className="doctor-kicker">SUPPORTING REFERENCES</p>
              <h3 id="doctor-evidence-heading">Evidence</h3>
              {activeCase.evidence.length
                ? <ul>{activeCase.evidence.map(item => <li key={item}>{item}</li>)}</ul>
                : <p>No evidence is attached. Retrieval is not connected.</p>}
              <span className="source-status">NO SOURCES ATTACHED</span>
            </section>
          </div>

          <section className="doctor-panel doctor-missing" aria-labelledby="doctor-missing-heading">
            <p className="doctor-kicker">REVIEW PROMPTS · NOT DIAGNOSES</p>
            <h3 id="doctor-missing-heading">Information to verify</h3>
            <ul>{activeCase.missingInformation.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>

        <div className="doctor-report-column">
          <section className="doctor-report-editor doctor-panel" aria-labelledby="doctor-report-heading">
            <div className="doctor-panel-heading">
              <div>
                <p className="doctor-kicker">CLINICIAN-AUTHORED · SYNTHETIC DEMO</p>
                <h3 id="doctor-report-heading">Clinical report</h3>
              </div>
              <span className={`doctor-review-status doctor-status-${review.status}`} role="status">{statusLabels[review.status]}</span>
            </div>
            <p className="doctor-editor-note">Fields start empty. This editor does not generate findings, diagnoses, or recommendations.</p>

            <div className="doctor-report-fields">
              {doctorReportFields.map(field => (
                <label className="doctor-report-field" key={field.key}>
                  <span>{field.label}<small>{field.description}</small></span>
                  <textarea
                    value={review.draft[field.key]}
                    onChange={event => updateField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows}
                    disabled={review.status === 'approved'}
                  />
                </label>
              ))}
            </div>

            <details className="doctor-report-preview">
              <summary>Review report before approval</summary>
              <p className="doctor-preview-provenance">Clinician-authored draft · not approved</p>
              {doctorReportFields.map(field => (
                <section key={field.key}>
                  <h4>{field.label}</h4>
                  <p>{review.draft[field.key] || 'Not entered.'}</p>
                </section>
              ))}
            </details>

            <div className="doctor-report-actions">
              <button type="button" className="button doctor-action-primary" onClick={saveDraft} disabled={review.status === 'approved'}>Save report draft</button>
              <button type="button" className="doctor-action-secondary" onClick={() => printReport('doctor')}>Print report</button>
              <button type="button" className="doctor-action-secondary" onClick={resetCase}>Reset case</button>
            </div>

            <div className="doctor-review-actions" aria-label="Report review actions">
              {review.status === 'awaiting_review' && (
                <button type="button" className="doctor-action-secondary" onClick={() => changeStatus('in_review', 'Review started')}>Start review</button>
              )}
              {review.status === 'in_review' && (
                <button type="button" className="doctor-action-secondary" onClick={() => changeStatus('changes_required', 'Report returned for changes')}>Return for changes</button>
              )}
              {(review.status === 'in_review' || review.status === 'changes_required') && (
                <button type="button" className="button doctor-action-primary" onClick={() => changeStatus('approved', 'Report explicitly approved')} disabled={!canApprove}>Approve report</button>
              )}
              {review.status === 'changes_required' && (
                <button type="button" className="doctor-action-secondary" onClick={() => changeStatus('in_review', 'Report review resumed')}>Resume review</button>
              )}
              {review.status === 'approved' && (
                <button type="button" className="doctor-action-secondary" onClick={() => changeStatus('in_review', 'Approved report reopened')}>Reopen review</button>
              )}
              {(review.status === 'in_review' || review.status === 'changes_required') && !canApprove && (
                <span className="doctor-approval-hint">Save the current report before approval.</span>
              )}
            </div>
            <p className="doctor-feedback" role="status" aria-live="polite">{feedback}</p>
            <p className="doctor-safety-note">Synthetic demonstration only. No patient data, secure storage, reviewer identity, or permanent audit history. Clinical decisions remain with a qualified reviewer.</p>
          </section>

          <section className="doctor-panel doctor-activity" aria-labelledby="doctor-activity-heading">
            <div className="doctor-panel-heading">
              <div>
                <p className="doctor-kicker">IN-MEMORY DEMO HISTORY</p>
                <h3 id="doctor-activity-heading">Review activity</h3>
              </div>
              <span className="activity-note">Not an audit log</span>
            </div>
            {review.activity.length
              ? <ol>{review.activity.map((item, index) => <li key={`${item.time}-${index}`}><span>{item.action}</span><time>{item.time}</time></li>)}</ol>
              : <p className="doctor-empty-state">No actions recorded for this case in this session.</p>}
          </section>
        </div>
      </div>

      <article className="doctor-report-printable" aria-label="Printable synthetic clinical report">
        <p className="doctor-print-brand">ijwi.</p>
        <p>SYNTHETIC DEMONSTRATION · NOT A MEDICAL RECORD</p>
        <h1>Clinical report</h1>
        <p><strong>Case ID:</strong> {activeCase.caseId}</p>
        <p><strong>Review status:</strong> {statusLabels[review.status]}</p>
        <p><strong>Patient information:</strong> {activeCase.patientInformation}</p>
        <p><strong>Health-worker observations:</strong> {activeCase.healthWorkerObservations}</p>
        <p><strong>Screening result:</strong> No result attached; {activeCase.screeningProvider} is not connected.</p>
        <p><strong>AI draft:</strong> {activeCase.aiDraft ?? 'No case-linked AI explanation is available.'}</p>
        <p><strong>Evidence:</strong> {activeCase.evidence.length ? activeCase.evidence.join('; ') : 'No sources attached; retrieval is not connected.'}</p>
        {doctorReportFields.map(field => <section key={field.key}><h2>{field.label}</h2><p>{review.draft[field.key] || 'Not entered.'}</p></section>)}
        <p className="doctor-print-safety">Synthetic demonstration only. No autonomous diagnosis or treatment recommendation. Reviewer identity and signature are not recorded.</p>
      </article>
    </section>
  );
}
