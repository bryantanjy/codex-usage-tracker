const { spawn } = require("node:child_process");
const readline = require("node:readline");

const codex = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
  shell: true,
});

const reader = readline.createInterface({
  input: codex.stdout,
});

function send(message) {
  codex.stdin.write(JSON.stringify(message) + "\n");
}

reader.on("line", (line) => {
  try {
    const message = JSON.parse(line);

    if (message.id === 1) {
      console.log("\nAccount:");
      console.dir(message.result, { depth: null });

      send({
        method: "account/rateLimits/read",
        id: 2,
      });

      send({
        method: "account/usage/read",
        id: 3,
      });
    }

    if (message.id === 2) {
      console.log("\nRate limits:");
      console.dir(message.result, { depth: null });
    }

    if (message.id === 3) {
      console.log("\nToken usage:");
      console.dir(message.result, { depth: null });

      codex.kill();
      process.exit(0);
    }

    if (message.error) {
      console.error("\nCodex error:");
      console.dir(message.error, { depth: null });
    }
  } catch (error) {
    console.error("Could not read response:", error.message);
  }
});

codex.on("error", (error) => {
  console.error("Failed to start Codex:", error.message);
});

send({
  method: "initialize",
  id: 0,
  params: {
    clientInfo: {
      name: "codex_usage_tracker",
      title: "Codex Usage Tracker",
      version: "1.0.0",
    },
  },
});

send({
  method: "initialized",
  params: {},
});

send({
  method: "account/read",
  id: 1,
  params: {
    refreshToken: false,
  },
});