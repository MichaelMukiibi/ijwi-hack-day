import { test } from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../src/handler.js";
import { signContext, verifyContext } from "../src/screening.js";
import { SYSTEM_PROMPT } from "../src/prompt.js";
const secret = "test-only-context-secret-of-at-least-32-characters";
const fixture = {
  prediction_id: "12345678-1234-1234-1234-123456789abc",
  class_id: 2,
  class_name: "Moderate",
  score: 0.6,
  scores: ["No DR", "Mild", "Moderate", "Severe", "Proliferative"].map(
    (class_name, class_id) => ({
      class_id,
      class_name,
      score: class_id === 2 ? 0.6 : 0.1,
    }),
  ),
  model: {
    name: "mobilenet_v2",
    version: "v0.1.1",
    sha256: "a".repeat(64),
    library_version: "0.1.15",
    image_size: 224,
    use_ben_graham: false,
  },
  image: { width: 512, height: 512, sha256: "b".repeat(64) },
  latency_ms: 20,
  created_at: "2026-10-31T12:00:00Z",
  scope: "research-screening",
};
const env = {
  FASTDRS_API_URL: "https://inference.example",
  FASTDRS_API_TOKEN: "service-secret",
  SCREENING_CONTEXT_SECRET: secret,
};
function upload() {
  const form = new FormData();
  form.set(
    "file",
    new Blob(["test-image-bytes"], { type: "image/png" }),
    "fundus.png",
  );
  return new Request("https://ijwi.example/api/screen", {
    method: "POST",
    body: form,
  });
}
const messages = [{ role: "user", content: "Explain this prediction." }];
test("screening is optional and existing chatbot keeps its original prompt", async () => {
  assert.deepEqual(
    await (
      await handleRequest(new Request("https://ijwi.example/api/screen/health"))
    ).json(),
    { configured: false, ready: false },
  );
  let prompt;
  const response = await handleRequest(
    new Request("https://ijwi.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }),
    {
      AI: {
        run: async (model, input) => {
          prompt = input.messages[0].content;
          return { response: "Existing chat works." };
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(prompt, SYSTEM_PROMPT);
  assert.equal((await handleRequest(upload())).status, 503);
});
test("upload proxies to inference with server token and returns signed context", async () => {
  const response = await handleRequest(upload(), env, {
    fetcher: async (url, options) => {
      assert.equal(url, "https://inference.example/v1/screen");
      assert.equal(options.headers.Authorization, "Bearer service-secret");
      assert.match(options.headers["Content-Type"], /multipart\/form-data/);
      return Response.json(fixture);
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.class_name, "Moderate");
  assert.deepEqual(
    await verifyContext(body.screeningToken, secret),
    body.result,
  );
  assert(!JSON.stringify(body).includes("service-secret"));
});
test("screen conversation receives verified result, ignores unsigned context, and uses a separate prompt", async () => {
  const token = await signContext(fixture, secret);
  let prompt;
  const response = await handleRequest(
    new Request("https://ijwi.example/api/screen/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        screeningToken: token,
        result: { class_name: "No DR" },
      }),
    }),
    {
      ...env,
      AI: {
        run: async (model, input) => {
          prompt = input.messages[0].content;
          return { response: "This is a model prediction for review." };
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.match(prompt, /Server-verified screening data/);
  assert.match(prompt, /"class_name":"Moderate"/);
  assert(!prompt.includes("No image, FastDRS prediction"));
  assert.equal((await response.json()).predictionId, fixture.prediction_id);
});
test("tampered and expired contexts never reach Gemma", async () => {
  const token = await signContext(fixture, secret);
  const tampered = (token[0] === "a" ? "b" : "a") + token.slice(1);
  await assert.rejects(
    verifyContext(tampered, secret),
    (error) => error.status === 400,
  );
  const now = Date.now;
  try {
    Date.now = () => now() + 3601000;
    await assert.rejects(
      verifyContext(token, secret),
      (error) => error.status === 400,
    );
  } finally {
    Date.now = now;
  }
  let calls = 0;
  const response = await handleRequest(
    new Request("https://ijwi.example/api/screen/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, screeningToken: tampered }),
    }),
    {
      ...env,
      AI: {
        run: async () => {
          calls++;
        },
      },
    },
  );
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});
test("invalid scores are not signed and upstream secret bodies are not exposed", async () => {
  const invalid = await handleRequest(upload(), env, {
    fetcher: async () => Response.json({ ...fixture, score: 0.9 }),
  });
  assert.equal(invalid.status, 502);
  assert(!(await invalid.json()).screeningToken);
  const failed = await handleRequest(upload(), env, {
    fetcher: async () =>
      Response.json({ detail: "service-secret" }, { status: 401 }),
  });
  assert.equal(failed.status, 503);
  assert(!JSON.stringify(await failed.json()).includes("service-secret"));
});
test("upload limits and configured service transport are enforced", async () => {
  const huge = upload();
  huge.headers.set("Content-Length", String(6 * 1024 * 1024));
  assert.equal((await handleRequest(huge, env)).status, 413);
  assert.equal(
    (
      await handleRequest(upload(), {
        ...env,
        FASTDRS_API_URL: "http://public.example",
      })
    ).status,
    503,
  );
});
