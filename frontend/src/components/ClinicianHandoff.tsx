import { useState } from 'react';
import type { ReportDraft, ReviewStatus } from '../lib/handoffDemo';
import { handoffCase, initialReport, reportSections } from '../lib/handoffDemo';

const statusLabels: Record<ReviewStatus, string> = {
  awaiting_review: 'Awaiting review',
  in_review: 'In review',
  changes_required: 'Changes required',
  approved: 'Approved by reviewer',
};

const draftSections = reportSections.filter(section => section.provenance === 'draft');
const clinicianSections = reportSections.filter(section => section.provenance === 'clinician');

function sameReport(left: ReportDraft, right: ReportDraft) {
  return reportSections.every(section => left[section.key] === right[section.key]);
}

export function ClinicianHandoff() {
  const [report, setReport] = useState<ReportDraft>({ ...initialReport });
  const [savedReport, setSavedReport] = useState<ReportDraft | null>(null);
  const [status, setStatus] = useState<ReviewStatus>('awaiting_review');
  const [activity, setActivity] = useState<{ action: string; time: string }[]>([]);
  const [feedback, setFeedback] = useState('');
  const hasUnsavedChanges = savedReport
    ? !sameReport(report, savedReport)
    : !sameReport(report, initialReport);
  const canApprove = savedReport !== null && !hasUnsavedChanges;

  function recordActivity(action: string) {
    setActivity(entries => [{ action, time: new Date().toLocaleString() }, ...entries]);
  }

  function updateReport(key: keyof ReportDraft, value: string) {
    setReport(current => ({ ...current, [key]: value }));
    setFeedback('');
  }

  function saveDraft() {
    setSavedReport({ ...report });
    recordActivity('Draft saved in this demo session');
    setFeedback('Draft saved in memory for this demo session.');
  }

  function changeStatus(next: ReviewStatus, action: string) {
    setStatus(next);
    recordActivity(action);
    setFeedback(`${statusLabels[next]} — demo status updated.`);
  }

  function resetDemo() {
    const confirmed = window.confirm('Reset the synthetic case, report edits, review status, and in-memory activity?');
    if (!confirmed) return;
    setReport({ ...initialReport });
    setSavedReport(null);
    setStatus('awaiting_review');
    setActivity([]);
    setFeedback('Synthetic demo restored. No report data was stored.');
  }

  return (
    <section id="handoff" className="handoff-section" aria-labelledby="handoff-heading">
      <div className="handoff-heading wrap">
        <p className="eyebrow">04 / CLINICIAN HANDOFF</p>
        <h2 id="handoff-heading">A clear draft.<br /><em>A careful review.</em></h2>
        <p>Review a synthetic case, check where each detail came from, and edit a structured report. No patient record or clinical service is connected.</p>
      </div>

      <div className="handoff-content wrap">
        <div className="handoff-top-grid">
          <section className="handoff-card case-overview" aria-labelledby="case-overview-heading">
            <div className="handoff-card-heading">
              <div>
                <p className="handoff-kicker">SYNTHETIC CASE</p>
                <h3 id="case-overview-heading">Case overview</h3>
              </div>
              <span className="case-id">{handoffCase.caseId}</span>
            </div>
            <dl className="case-facts">
              <div><dt>Patient context</dt><dd>{handoffCase.patientContext}</dd></div>
              <div><dt>Relevant history</dt><dd>{handoffCase.relevantHistory}</dd></div>
              <div><dt>Patient-reported symptoms</dt><dd>{handoffCase.reportedSymptoms}</dd></div>
              <div><dt>Health-worker observations</dt><dd>{handoffCase.healthWorkerObservations}</dd></div>
              <div><dt>Fundus image</dt><dd>{handoffCase.imageAvailability}</dd></div>
              <div><dt>Handoff date</dt><dd>{handoffCase.handoffDate ?? 'Not available in this fixture.'}</dd></div>
            </dl>
          </section>

          <section className="handoff-card screening-card" aria-labelledby="screening-heading">
            <p className="handoff-kicker">SCREENING SERVICE OUTPUT</p>
            <h3 id="screening-heading">No screening result</h3>
            <p><strong>Source:</strong> {handoffCase.screening.provider}</p>
            <p><strong>Service state:</strong> {handoffCase.screening.status}</p>
            <p className="screening-empty">{handoffCase.screening.result ?? 'No sample or live result is available for this case.'}</p>
          </section>
        </div>

        <div className="provenance-grid" aria-label="Case information by source">
          <article className="provenance-card">
            <span className="provenance-label">PATIENT REPORTED</span>
            <p>{handoffCase.reportedSymptoms}</p>
          </article>
          <article className="provenance-card">
            <span className="provenance-label">HEALTH-WORKER OBSERVED / ENTERED</span>
            <p>{handoffCase.healthWorkerObservations}</p>
          </article>
          <article className="provenance-card screening-provenance">
            <span className="provenance-label">SCREENING SERVICE</span>
            <p>{handoffCase.screening.provider} result unavailable; service not connected.</p>
          </article>
          <article className="provenance-card ai-provenance">
            <span className="provenance-label">AI-GENERATED DRAFT</span>
            <p>Illustrative placeholder only. No live AI generated this draft.</p>
          </article>
        </div>

        <div className="handoff-review-grid">
          <section className="handoff-card" aria-labelledby="missing-heading">
            <p className="handoff-kicker">REVIEW PROMPTS</p>
            <h3 id="missing-heading">Information to check</h3>
            <ul className="review-prompts">
              <li>Retinal image is not attached.</li>
              <li>Screening result is unavailable.</li>
              <li>Patient-reported symptoms were not supplied.</li>
              <li>Health-worker examination observations were not entered.</li>
              <li>No supporting evidence is attached to report statements.</li>
            </ul>
          </section>
          <section className="handoff-card evidence-card" aria-labelledby="evidence-heading">
            <p className="handoff-kicker">SUPPORTING REFERENCES</p>
            <h3 id="evidence-heading">Evidence</h3>
            <div className="evidence-empty">
              <span aria-hidden="true">≋</span>
              <p>No supporting evidence is attached to this case yet.</p>
              <small>Live evidence retrieval is not connected. No sources or citations are fabricated.</small>
            </div>
          </section>
        </div>

        <section className="report-card" aria-labelledby="report-heading">
          <div className="report-heading">
            <div>
              <p className="handoff-kicker">EDITABLE REPORT · SYNTHETIC DEMO</p>
              <h3 id="report-heading">Report composer</h3>
            </div>
            <span className={`review-status status-${status}`} role="status">{statusLabels[status]}</span>
          </div>

          <div className="report-provenance-note">
            <strong>AI draft · illustrative placeholder</strong>
            <span>Not generated by a live model. Edit each field against verified case information.</span>
          </div>
          <div className="report-fields">
            {draftSections.map(section => (
              <label className="report-field" key={section.key}>
                <span>{section.label}<span className="field-source">AI draft · reviewer editable</span></span>
                <textarea
                  value={report[section.key]}
                  onChange={event => updateReport(section.key, event.target.value)}
                  placeholder={section.placeholder}
                  rows={section.key === 'referralReason' ? 3 : 2}
                  disabled={status === 'approved'}
                />
              </label>
            ))}
          </div>

          <div className="clinician-entry-heading">
            <div>
              <p className="handoff-kicker">CLINICIAN-ENTERED</p>
              <h4>Assessment and review notes</h4>
            </div>
            <span>{status === 'approved' ? 'Report explicitly approved in demo' : 'Unconfirmed until explicit approval'}</span>
          </div>
          <div className="report-fields clinician-fields">
            {clinicianSections.map(section => (
              <label className="report-field" key={section.key}>
                <span>{section.label}<span className="field-source">Clinician-entered · not prefilled</span></span>
                <textarea
                  value={report[section.key]}
                  onChange={event => updateReport(section.key, event.target.value)}
                  placeholder={section.placeholder}
                  rows={2}
                  disabled={status === 'approved'}
                />
              </label>
            ))}
          </div>

          <div className="confirmed-findings" aria-live="polite">
            <p className="handoff-kicker">CLINICIAN-CONFIRMED</p>
            <p>{status === 'approved'
              ? 'The report was explicitly approved in this demo. Reviewer identity and signature are not recorded.'
              : 'No clinician-confirmed findings. A draft or saved report is not an approval.'}</p>
          </div>

          <div className="report-actions">
            <div className="report-primary-actions">
              <button className="button" type="button" onClick={saveDraft} disabled={status === 'approved'}>Save draft</button>
              <button className="report-button" type="button" onClick={() => window.print()}>Print report</button>
              <button className="report-button reset-button" type="button" onClick={resetDemo}>Reset demo</button>
            </div>
            <div className="review-actions" aria-label="Review status actions">
              {status === 'awaiting_review' && (
                <button className="report-button" type="button" onClick={() => changeStatus('in_review', 'Review started')}>Start review</button>
              )}
              {status === 'in_review' && (
                <button className="report-button" type="button" onClick={() => changeStatus('changes_required', 'Changes requested')}>Request changes</button>
              )}
              {(status === 'in_review' || status === 'changes_required') && (
                <button className="button approve-button" type="button" onClick={() => changeStatus('approved', 'Report explicitly approved')} disabled={!canApprove}>Approve report</button>
              )}
              {status === 'approved' && (
                <button className="report-button" type="button" onClick={() => changeStatus('in_review', 'Review reopened')}>Reopen review</button>
              )}
              {(status === 'in_review' || status === 'changes_required') && !canApprove && (
                <span className="approval-hint">Save the current draft before approval.</span>
              )}
            </div>
          </div>
          <p className="demo-persistence-note">Demo only: edits and activity stay in page memory and clear on reload. Do not enter real patient information.</p>
          <p className="handoff-feedback" role="status" aria-live="polite">{feedback}</p>
        </section>

        <section className="activity-card handoff-card" aria-labelledby="activity-heading">
          <div className="handoff-card-heading">
            <div>
              <p className="handoff-kicker">IN-MEMORY DEMO HISTORY</p>
              <h3 id="activity-heading">Review activity</h3>
            </div>
            <span className="activity-note">Not a secure or permanent audit log</span>
          </div>
          {activity.length === 0
            ? <p className="activity-empty">No review actions recorded in this session.</p>
            : <ol className="activity-list">{activity.map((entry, index) => (
              <li key={`${entry.time}-${index}`}><span>{entry.action}</span><time>{entry.time}</time></li>
            ))}</ol>}
        </section>
      </div>

      <article className="handoff-printable" aria-label="Printable synthetic handoff report">
        <p className="print-brand">ijwi.</p>
        <p className="handoff-kicker">SYNTHETIC DEMONSTRATION · NOT A MEDICAL RECORD</p>
        <h1>Clinician handoff report</h1>
        <p><strong>Case ID:</strong> {handoffCase.caseId}</p>
        <p><strong>Review status:</strong> {statusLabels[status]}</p>
        <p><strong>Patient context:</strong> {handoffCase.patientContext}</p>
        <p><strong>Handoff date:</strong> {handoffCase.handoffDate ?? 'Not available in fixture.'}</p>
        <h2>Case information and provenance</h2>
        <p><strong>Patient reported:</strong> {handoffCase.reportedSymptoms}</p>
        <p><strong>Health-worker observed / entered:</strong> {handoffCase.healthWorkerObservations}</p>
        <p><strong>Screening service:</strong> {handoffCase.screening.provider}; {handoffCase.screening.result ?? 'result unavailable; service not connected.'}</p>
        <p><strong>Evidence:</strong> No supporting evidence attached. Live retrieval is not connected.</p>
        <h2>AI draft · illustrative placeholder, not generated by a live model</h2>
        {draftSections.map(section => <section key={section.key}><h3>{section.label}</h3><p>{report[section.key] || 'Not entered.'}</p></section>)}
        <h2>Clinician-entered</h2>
        {clinicianSections.map(section => <section key={section.key}><h3>{section.label}</h3><p>{report[section.key] || 'Not entered.'}</p></section>)}
        <p className="print-safety-note">Research demonstration only. No autonomous diagnosis, treatment recommendation, reviewer identity, or signature is recorded.</p>
      </article>
    </section>
  );
}
