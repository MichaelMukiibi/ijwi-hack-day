# Ijwi

**A conversational retinal-screening assistant for community health workers, powered by Gemma 4 and FastDRS.**

Built for **Hacktoberfest Hack Day Kigali Ã— Build54, ALX & GDG Rwanda**, October 31, 2026.

**First prize target: Best Use of Gemma 4 â€” Google DeepMind / Google.**

## The problem

A retinal-screening prediction alone does not provide a complete case handoff. Health workers also need to collect context, understand what information is missing, and prepare a clear explanation for specialist review.

## What we are building

Ijwi connects a fundus-image screening result with a persistent conversation. A health worker uploads an image, supplies case history, asks questions, and receives a draft summary linked to supporting reference passages.

FastDRS supplies the specialized screening prediction. Gemma 4 asks follow-up questions, requests evidence through tools, and explains the available findings in the context of the case.

## Why Gemma 4 matters

Gemma is the conversational core of the product. It chooses evidence searches, uses returned case and screening information, and drafts a cited explanation. The demo will make those tool interactions visible so judges can inspect how model output connects to actual application behavior.

The application combines a vision classifier with a language model. We will not describe Gemma as directly interpreting retinal images unless that capability is actually implemented and demonstrated.

## Intended demo

1. Open a synthetic demo case and upload a fundus image.
2. Run FastDRS and inspect the screening prediction.
3. Ask Gemma about the case and answer a follow-up question.
4. Watch Gemma retrieve reference evidence and inspect a citation.
5. Generate a draft summary for specialist review.

Live, cached, and sample outputs will be clearly distinguished.

## Technology and sponsor contributions

- **Gemma 4:** hosted model for conversation and tool-call generation.
- **FastDRS:** Michael Mukiibiâ€™s retinal-screening toolkit, running in a Docker inference service.
- **Cloudflare Workers, D1, Vectorize, and R2:** application orchestration, structured storage, evidence retrieval, and private objects.
- **Adaption:** planned preparation and augmentation of intake/tool-use examples, with held-out evaluation cases. The allocated data-work budget is 650 credits.

We will show Adaptionâ€™s contribution through actual dataset artifacts and evaluation comparisons rather than assume augmentation improves results.

## Current status and evidence

**React + TypeScript frontend and backend connection implemented locally.** The landing page retains its design. TanStack Query fetches labeled sample workspace content from a separate application API. Live Gemma conversations, FastDRS inference, retrieval, and deployment are not connected yet.

Public demo, demonstration video, measured latency, evaluation results, and implementation evidence will be added after they exist. English is the initial language; French and Kinyarwanda remain planned and require evaluation.

This is a research demonstration for screening support and specialist review. It does not provide an autonomous diagnosis or replace an ophthalmologist.

## Credits

Created by **Michael Kirinnya Mukiibi**. Built on [FastDRS](https://github.com/MichaelMukiibi/diabetic-retinopathy-screening).

Event: Build54 Africa Foundation, ALX Rwanda, GDG Rwanda, and Major League Hacking. First prize category sponsor: Google DeepMind / Google. Planned platform contributions: Adaption and Cloudflare.

Rift Research sponsorship is identified in the supplied project handoff; final public acknowledgment wording is pending confirmation.
