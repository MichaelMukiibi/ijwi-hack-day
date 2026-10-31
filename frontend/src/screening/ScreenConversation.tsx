import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { AssistantMessage } from "../components/AssistantMessage";
import type { ChatMessage, ChatReply } from "../lib/api";
import { screeningChat } from "./api";
type Message = ChatMessage & { metadata?: ChatReply };
export function ScreenConversation({
  screeningToken,
}: {
  screeningToken: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mutation = useMutation({
    mutationFn: (history: ChatMessage[]) => {
      controller.current = new AbortController();
      return screeningChat(history, screeningToken, controller.current.signal);
    },
    retry: false,
    onSuccess: (reply, history) => {
      setMessages((previous) => [
        ...previous,
        history[history.length - 1],
        { role: "assistant", content: reply.reply, metadata: reply },
      ]);
      input.current?.focus();
    },
  });
  useEffect(() => () => controller.current?.abort(), []);
  const send = (text: string) => {
    if (!text.trim() || mutation.isPending || messages.length >= 24) return;
    mutation.mutate([
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content: text.trim() },
    ]);
    setDraft("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };
  const pending =
    mutation.isPending || mutation.isError
      ? mutation.variables?.at(-1)
      : undefined;
  return (
    <section
      className="screen-card screen-conversation"
      aria-labelledby="result-chat-heading"
    >
      <div className="screen-card-heading">
        <div>
          <p className="eyebrow">03 / UNDERSTAND THE RESULT</p>
          <h2 id="result-chat-heading">Talk through this screening.</h2>
        </div>
        <span className="screen-context-tag">Result attached</span>
      </div>
      <p className="screen-muted">
        Gemma receives the verified prediction and model scores, not your image.
        Clinical decisions require professional review.
      </p>
      <div
        className="screen-chat-log"
        role="log"
        aria-label="Conversation about this screening"
        aria-live="polite"
      >
        {!messages.length && !pending && (
          <button
            className="screen-suggestion"
            onClick={() =>
              send(
                "Explain this screening prediction in plain language and help me prepare a specialist handoff.",
              )
            }
            disabled={mutation.isPending}
          >
            Explain this result <span aria-hidden="true">↗</span>
          </button>
        )}
        {messages.map((message, index) => (
          <div className={`live-message ${message.role}`} key={index}>
            <p className="chat-label">
              {message.role === "user" ? "YOU" : "IJWI · GEMMA 4"}
            </p>
            <div className="chat-bubble">
              {message.role === "assistant" ? (
                <AssistantMessage content={message.content} />
              ) : (
                message.content
              )}
            </div>
            {message.metadata && (
              <p className="reply-source">
                {message.metadata.provider === "google"
                  ? "Google API · fallback"
                  : "Cloudflare Workers AI"}
              </p>
            )}
          </div>
        ))}
        {pending && (
          <div className="live-message user">
            <p className="chat-label">YOU</p>
            <div className="chat-bubble">{pending.content}</div>
          </div>
        )}
        {mutation.isPending && (
          <p role="status" className="chat-progress">
            Gemma is reading the screening context…
          </p>
        )}
      </div>
      {mutation.isError && (
        <div className="chat-error" role="alert">
          <p>
            {mutation.error.name === "AbortError"
              ? "Response stopped. Retry when you are ready."
              : mutation.error.message}
          </p>
          <button
            onClick={() =>
              mutation.variables && mutation.mutate(mutation.variables)
            }
          >
            Retry message
          </button>
        </div>
      )}
      <form className="chat-composer" onSubmit={submit}>
        <label htmlFor="screen-message" className="sr-only">
          Question about this screening
        </label>
        <textarea
          ref={input}
          id="screen-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          maxLength={4000}
          disabled={mutation.isPending || messages.length >= 24}
          placeholder="Ask about the attached prediction…"
        />
        <div className="composer-actions">
          <span>
            {messages.length >= 24
              ? "Conversation limit reached. Run a new screening to continue."
              : "Context expires after one hour."}
          </span>
          {mutation.isPending ? (
            <button
              className="button"
              type="button"
              onClick={() => controller.current?.abort()}
            >
              Stop
            </button>
          ) : (
            <button
              className="button"
              disabled={!draft.trim() || messages.length >= 24}
            >
              Send message ↗
            </button>
          )}
        </div>
      </form>
      <p className="chat-footnote">
        Use synthetic case history. Do not enter patient identifiers.
        Conversation is in memory only. Google receives the text and screening
        context if Cloudflare fallback is needed.
      </p>
    </section>
  );
}
