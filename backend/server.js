const express = require("express");
const cors = require("cors");
const { spawn } = require("node:child_process");
const readline = require("node:readline");

const app = express();

app.use(cors());
app.use(express.json());

function getCodexUsage() {
  return new Promise((resolve, reject) => {
    const codex = spawn("codex", ["app-server"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    const reader = readline.createInterface({
      input: codex.stdout,
    });

    let rateLimits = null;
    let tokenUsage = null;

    const timeout = setTimeout(() => {
      codex.kill();
      reject(new Error("Codex request timed out"));
    }, 15000);

    function send(message) {
      codex.stdin.write(JSON.stringify(message) + "\n");
    }

    function finishIfReady() {
      if (!rateLimits || !tokenUsage) return;

      clearTimeout(timeout);
      codex.kill();

      const codexLimit = rateLimits.rateLimits;

      resolve({
        planType: codexLimit.planType,

        fiveHour: {
          usedPercent: codexLimit.primary?.usedPercent ?? 0,
          resetsAt: codexLimit.primary?.resetsAt ?? null,
        },

        weekly: {
          usedPercent: codexLimit.secondary?.usedPercent ?? 0,
          resetsAt: codexLimit.secondary?.resetsAt ?? null,
        },

        credits: codexLimit.credits,

        freeReset:
          rateLimits.rateLimitResetCredits?.availableCount ?? 0,

        summary: tokenUsage.summary,
        dailyUsage: tokenUsage.dailyUsageBuckets,
      });
    }

    reader.on("line", (line) => {
      try {
        const message = JSON.parse(line);

        if (message.id === 1) {
          rateLimits = message.result;
          finishIfReady();
        }

        if (message.id === 2) {
          tokenUsage = message.result;
          finishIfReady();
        }

        if (message.error) {
          clearTimeout(timeout);
          codex.kill();
          reject(new Error(message.error.message || "Codex error"));
        }
      } catch {
        // Ignore non-JSON output.
      }
    });

    codex.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    send({
      method: "initialize",
      id: 0,
      params: {
        clientInfo: {
          name: "codex_usage_mobile",
          title: "Codex Usage Mobile",
          version: "1.0.0",
        },
      },
    });

    send({
      method: "initialized",
      params: {},
    });

    send({
      method: "account/rateLimits/read",
      id: 1,
    });

    send({
      method: "account/usage/read",
      id: 2,
    });
  });
}

app.get("/usage", async (_req, res) => {
  try {
    const usage = await getCodexUsage();
    res.json(usage);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve Codex usage",
      details: error.message,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Usage server running on http://0.0.0.0:3001");
});