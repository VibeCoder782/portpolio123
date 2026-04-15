import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      {
        name: "local-api-chat",
        configureServer(server) {
          server.middlewares.use(
            "/api/chat",
            async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method !== "POST") {
                res.statusCode = 405;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Method Not Allowed" }));
                return;
              }

              const apiKey = env.GROQ_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error:
                      "GROQ_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
                  })
                );
                return;
              }

              let body = "";
              req.on("data", (chunk: Buffer) => {
                body += chunk.toString();
              });

              req.on("end", async () => {
                try {
                  const { system, messages, max_tokens = 1000 } =
                    JSON.parse(body);

                  const groqMessages = [
                    ...(system
                      ? [{ role: "system", content: system }]
                      : []),
                    ...messages.map(
                      (m: { role: string; content: string }) => ({
                        role: m.role,
                        content: m.content,
                      })
                    ),
                  ];

                  const response = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                      },
                      body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: groqMessages,
                        max_tokens,
                      }),
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    res.statusCode = response.status;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: data }));
                    return;
                  }

                  const text =
                    data.choices?.[0]?.message?.content ??
                    "응답을 가져오지 못했습니다.";
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({ content: [{ type: "text", text }] })
                  );
                } catch (err) {
                  console.error("[local-api] error:", err);
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Internal server error" }));
                }
              });
            }
          );
        },
      },
    ],
  };
});
