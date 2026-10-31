# Ijwi — UI design

Status: proposed first deliverable; application implementation has not started.

## Product and primary user

A community health worker creates a retinal-screening case, uploads a fundus image, and discusses the available findings with a Gemma 4 assistant. The outcome is a cited draft summary for specialist review. The interface must distinguish a screening prediction from a clinical diagnosis.

The first deliverable targets Best Use of Gemma 4 at Build54 Hacktoberfest Hack Day Kigali. Gemma is central to the conversation, evidence retrieval, and explanation.

## Main experience

1. Start a demo case with synthetic history; avoid asking for patient names or contact details.
2. Upload a fundus photograph or choose an attributed demo image.
3. Run FastDRS screening and show its actual result and model version.
4. Converse with Gemma about the case. Gemma can ask for missing information and retrieve evidence.
5. Generate a cited draft review summary. A reviewer can edit it and mark it reviewed; this status is a workflow label, not clinical certification.

## Layout

Desktop uses a compact header, case panel on the left, and conversation on the right. The case panel contains the image, supplied history, screening result, and report action. The conversation contains messages, tool activity, source citations, and a persistent composer.

Mobile uses a single column with Case, Conversation, and Summary tabs. Preserve the composer above the keyboard and retain case state when switching tabs. The main action is always explicit: Upload image, Run screening, Send, or Generate summary.

Header: project name, short research-prototype label, and New demo case. Footer: FastDRS and Build54 attribution; additional sponsor acknowledgments must reflect confirmed relationships.

## Visual direction

Use a calm, readable clinical-workspace style: warm off-white background, white cards, dark navy text, teal actions, and restrained amber status accents. Reserve red for failures or a source-backed alert requiring attention. Never communicate severity through color alone.

Use a system sans-serif, 16px minimum body text, generous line spacing, an 8px spacing scale, and clear card headings. Conversation text must remain readable on narrow screens. Avoid decorative charts and unsupported confidence gauges.

## Components and behavior

### Case and upload

Accept supported image formats with a stated size limit once implementation limits are chosen. Show preview, filename, upload progress, replace/remove controls, and validation errors. Label the upload as a fundus photograph: an ordinary phone-camera eye photograph is not interchangeable with a fundus image.

Keep history fields short and structured, with an optional free-text note. Display unknown fields as unknown, never inferred patient facts.

### Screening result

Show predicted class, model identifier/version, completion time, and source image. If probabilities are available, describe them as model scores rather than a validated probability of disease. Do not claim image-quality assessment unless an implemented, evaluated quality check supports it. Failed inference produces an error and retry action, never a fabricated prediction.

### Conversation and tools

Show streaming or loading feedback according to the supported API. Display meaningful tool events such as “Searching reference sources” and “Screening completed”; allow expanding structured inputs/results without exposing secrets or internal model reasoning.

Evidence references open a source panel with passage, title, source URL, and available revision/date. Clearly distinguish patient facts, FastDRS predictions, and retrieved reference information.

### Summary

Include supplied history, screening result, missing information, evidence citations, and a draft explanation. Any proposed next step must cite its supporting reference and remain subject to qualified review. Record edits and review status separately from the model-generated draft.

### Languages

Start with English. French and Kinyarwanda are planned options gated on language evaluation and review. Retain source citations across translations. Speech is optional later work: only offer a language when an appropriate voice is actually available; do not substitute another language’s voice silently.

## Required states

- Empty case and suggested first message.
- Uploading, screening in progress, and inference unavailable.
- Gemma unavailable, malformed response, and tool timeout.
- No supporting evidence found: say evidence is insufficient and preserve the case.
- Interrupted conversation: show retry without duplicating a saved message.
- Live, cached, and sample/demo outputs: visibly label their origin and timestamp.
- Draft summary and reviewed summary.

## Accessibility and acceptance

Keyboard navigation, visible focus, programmatic field labels, accessible status announcements, and adequate contrast are required. Tool updates must not steal focus. Touch targets should be at least 44px.

The first demo is complete when a user can upload an image, receive real FastDRS output, have a persistent Gemma conversation, inspect a retrieved citation, and save a draft summary on both desktop and mobile. Performance is measured during implementation; no latency claim is established yet.
