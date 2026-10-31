import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadScreening } from "./api";
import { ScreenConversation } from "./ScreenConversation";
import "./screen.css";
export default function ScreenPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const mutation = useMutation({
    mutationFn: (image: File) => {
      controller.current = new AbortController();
      return uploadScreening(image, controller.current.signal);
    },
    retry: false,
  });
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    mutation.reset();
    setFileError("");
    setFile(null);
    if (!chosen) return;
    if (!["image/jpeg", "image/png"].includes(chosen.type)) {
      setFileError("Choose a JPEG or PNG fundus photograph.");
      return;
    }
    if (chosen.size > 5 * 1024 * 1024 || chosen.size === 0) {
      setFileError("Choose an image between 1 byte and 5 MiB.");
      return;
    }
    setFile(chosen);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (file && !mutation.isPending) mutation.mutate(file);
  }
  const result = mutation.data?.result;
  return (
    <>
      <a className="skip" href="#screen-main">
        Skip to screening
      </a>
      <header className="header wrap">
        <a className="brand" href="/">
          ijwi<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Screening navigation">
          <a href="/">Home</a>
          <a href="/#chat">General conversation ↗</a>
        </nav>
        <span className="sample-badge">RESEARCH SCREENING</span>
      </header>
      <main className="screen-main wrap" id="screen-main">
        <div className="screen-intro">
          <p className="eyebrow">A CLOSER LOOK / FASTDRS</p>
          <h1>
            A screening result.
            <br />
            <em>A clearer conversation.</em>
          </h1>
          <p>
            Upload a fundus photograph, inspect the model prediction, and
            discuss that result with Ijwi. This workspace is separate from the
            general chatbot.
          </p>
          <div className="screen-notice">
            Research demonstration only. Requires a fundus photograph, not an
            ordinary photo of an eye. The model does not verify image
            suitability or make a clinical diagnosis.
          </div>
        </div>
        <div className="screen-grid">
          <section className="screen-card">
            <p className="eyebrow">01 / UPLOAD A FUNDUS IMAGE</p>
            <h2>Start with the photograph.</h2>
            <form onSubmit={submit}>
              <label className="screen-upload" htmlFor="fundus-file">
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected fundus photograph for screening"
                  />
                ) : (
                  <span className="screen-upload-symbol" aria-hidden="true">
                    ◎
                  </span>
                )}
                <strong>
                  {file ? file.name : "Choose a fundus photograph"}
                </strong>
                <span>JPEG or PNG · up to 5 MiB · one image</span>
                <input
                  id="fundus-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={choose}
                  disabled={mutation.isPending}
                />
              </label>
              {fileError && (
                <p className="screen-error" role="alert">
                  {fileError}
                </p>
              )}
              <p className="screen-muted">
                Processed by the FastDRS service on DigitalOcean. The app does
                not persist uploaded images or results. Please use an authorized
                demonstration image without identifiers.
              </p>
              <div className="screen-upload-actions">
                <button
                  className="button"
                  disabled={!file || mutation.isPending}
                >
                  {mutation.isPending ? "Screening image…" : "Run screening ↗"}
                </button>
                {mutation.isPending && (
                  <button
                    className="screen-link-button"
                    type="button"
                    onClick={() => controller.current?.abort()}
                  >
                    Stop waiting
                  </button>
                )}
              </div>
            </form>
            {mutation.isPending && (
              <p className="screen-muted" role="status">
                The CPU model is processing this image. It may take a moment.
              </p>
            )}
            {mutation.isError && (
              <div className="screen-error" role="alert">
                {mutation.error.name === "AbortError"
                  ? "Request cancelled. An in-flight prediction may still finish; retry shortly."
                  : mutation.error.message}
              </div>
            )}
          </section>
          <section
            className="screen-card"
            aria-live="polite"
            aria-labelledby="screen-result-heading"
          >
            <p className="eyebrow">02 / MODEL OUTPUT</p>
            <h2 id="screen-result-heading">
              {result
                ? "Your screening prediction."
                : "A result with its context."}
            </h2>
            {result ? (
              <>
                <div className="screen-prediction">
                  <span>Predicted DR class</span>
                  <strong>{result.class_name}</strong>
                  <p>Model score: {(result.score * 100).toFixed(1)}%</p>
                </div>
                <p className="screen-muted">
                  This is an uncalibrated model score, not a validated
                  probability of disease. Image suitability and clinical urgency
                  have not been assessed.
                </p>
                <div className="screen-scores">
                  {result.scores.map((row) => (
                    <div key={row.class_id} className="screen-score-row">
                      <span>{row.class_name}</span>
                      <div className="screen-score-track" aria-hidden="true">
                        <i style={{ width: `${row.score * 100}%` }} />
                      </div>
                      <strong>{(row.score * 100).toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
                <dl className="screen-provenance">
                  <div>
                    <dt>Model</dt>
                    <dd>
                      {result.model.name} / {result.model.version}
                    </dd>
                  </div>
                  <div>
                    <dt>FastDRS</dt>
                    <dd>{result.model.library_version}</dd>
                  </div>
                  <div>
                    <dt>Image</dt>
                    <dd>
                      {result.image.width} × {result.image.height}
                    </dd>
                  </div>
                  <div>
                    <dt>Inference</dt>
                    <dd>{result.latency_ms.toFixed(0)} ms</dd>
                  </div>
                </dl>
                <details className="screen-details">
                  <summary>Result provenance</summary>
                  <p>Prediction: {result.prediction_id}</p>
                  <p>Model SHA-256: {result.model.sha256}</p>
                  <p>Image SHA-256: {result.image.sha256}</p>
                  <p>Created: {new Date(result.created_at).toLocaleString()}</p>
                </details>
              </>
            ) : (
              <div className="screen-empty">
                <span aria-hidden="true">↗</span>
                <p>
                  Run screening to see the predicted class, all five model
                  scores, and model provenance.
                </p>
                <p>No sample prediction is substituted if inference fails.</p>
              </div>
            )}
          </section>
        </div>
        {mutation.data && (
          <ScreenConversation
            key={mutation.data.result.prediction_id}
            screeningToken={mutation.data.screeningToken}
          />
        )}
      </main>
      <footer className="footer wrap">
        <a className="brand" href="/">
          ijwi.
        </a>
        <p>FastDRS · Gemma 4 · Build54 Hacktoberfest 2026</p>
        <span>Research prototype · For specialist review</span>
      </footer>
    </>
  );
}
