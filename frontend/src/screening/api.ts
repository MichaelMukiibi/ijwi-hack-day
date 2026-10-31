import type { ChatMessage, ChatReply } from "../lib/api";
export const CLASS_NAMES = [
  "No DR",
  "Mild",
  "Moderate",
  "Severe",
  "Proliferative",
] as const;
export interface ScreeningResult {
  prediction_id: string;
  class_id: number;
  class_name: string;
  score: number;
  scores: { class_id: number; class_name: string; score: number }[];
  model: {
    name: string;
    version: string;
    sha256: string;
    library_version: string;
    image_size: number;
    use_ben_graham: boolean;
  };
  image: { width: number; height: number; sha256: string };
  latency_ms: number;
  created_at: string;
  scope: "research-screening";
}
export interface ScreeningResponse {
  result: ScreeningResult;
  screeningToken: string;
}
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const record = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null;
async function readResponse(response: Response): Promise<unknown> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The screening API returned an unreadable response.");
  }
  if (!response.ok)
    throw new Error(
      record(data) && typeof data.error === "string"
        ? data.error
        : `Screening request failed (${response.status}).`,
    );
  return data;
}
export async function uploadScreening(
  file: File,
  signal?: AbortSignal,
): Promise<ScreeningResponse> {
  const form = new FormData();
  form.set("file", file);
  const data = await readResponse(
    await fetch(`${base}/api/screen`, {
      method: "POST",
      body: form,
      signal: AbortSignal.any([
        signal ?? new AbortController().signal,
        AbortSignal.timeout(70_000),
      ]),
    }),
  );
  if (
    !record(data) ||
    typeof data.screeningToken !== "string" ||
    !record(data.result) ||
    data.result.scope !== "research-screening" ||
    !Array.isArray(data.result.scores) ||
    data.result.scores.length !== 5 ||
    !Number.isInteger(data.result.class_id) ||
    typeof data.result.score !== "number" ||
    typeof data.result.class_name !== "string" ||
    !record(data.result.model) ||
    !record(data.result.image)
  )
    throw new Error("Unexpected screening response.");
  return data as unknown as ScreeningResponse;
}
export async function screeningChat(
  messages: ChatMessage[],
  screeningToken: string,
  signal?: AbortSignal,
): Promise<ChatReply> {
  const data = await readResponse(
    await fetch(`${base}/api/screen/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, screeningToken }),
      signal: AbortSignal.any([
        signal ?? new AbortController().signal,
        AbortSignal.timeout(65_000),
      ]),
    }),
  );
  if (
    !record(data) ||
    typeof data.reply !== "string" ||
    !["cloudflare", "google"].includes(String(data.provider)) ||
    typeof data.model !== "string"
  )
    throw new Error("Unexpected screening conversation response.");
  return data as unknown as ChatReply;
}
