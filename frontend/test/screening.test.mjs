import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createServer } from "vite";
let vite, api, ScreenPage;
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  api = await vite.ssrLoadModule("/src/screening/api.ts");
  ScreenPage = (await vite.ssrLoadModule("/src/screening/ScreenPage.tsx"))
    .default;
});
after(async () => {
  await vite?.close();
});
test("screen workspace has upload input and no fabricated initial prediction", () => {
  const html = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(ScreenPage),
    ),
  );
  assert.match(html, /type="file"/);
  assert.match(html, /image\/jpeg,image\/png/);
  assert.match(html, /No sample prediction/);
  assert(!html.includes("Model score:"));
  assert.match(html, /href="\/#chat"/);
});
test("screen upload uses a separate multipart endpoint without browser credentials", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/screen");
      assert.equal(options.method, "POST");
      assert(options.body instanceof FormData);
      assert.equal(options.body.get("file").name, "fundus.png");
      assert.equal(options.headers, undefined);
      return Response.json({
        result: {
          scope: "research-screening",
          class_id: 0,
          class_name: "No DR",
          score: 0.6,
          scores: [1, 2, 3, 4, 5],
          model: {},
          image: {},
        },
        screeningToken: "signed-result",
      });
    };
    assert.equal(
      (
        await api.uploadScreening(
          new File(["bytes"], "fundus.png", { type: "image/png" }),
        )
      ).screeningToken,
      "signed-result",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("screen conversation sends signed context to its own endpoint", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/screen/chat");
      assert.equal(JSON.parse(options.body).screeningToken, "signed-result");
      return Response.json({
        reply: "For review",
        provider: "cloudflare",
        model: "gemma",
        fallback: false,
        requestId: "request",
      });
    };
    assert.equal(
      (
        await api.screeningChat(
          [{ role: "user", content: "Explain" }],
          "signed-result",
        )
      ).reply,
      "For review",
    );
  } finally {
    globalThis.fetch = original;
  }
});
