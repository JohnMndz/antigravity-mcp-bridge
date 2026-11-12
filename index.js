#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

function resolveAgyPath() {
  if (process.env.AGY_PATH && fs.existsSync(process.env.AGY_PATH)) {
    return process.env.AGY_PATH;
  }
  const ext = process.platform === "win32" ? ".exe" : "";
  const standardHomeAgy = path.join(os.homedir(), ".gemini", "bin", `agy${ext}`);
  if (fs.existsSync(standardHomeAgy)) {
    return standardHomeAgy;
  }
  return `agy${ext}`;
}

const AGY_EXECUTABLE = resolveAgyPath();
const DEFAULT_MODEL = process.env.AGY_MODEL || "gemini-3.8-flash-medium";

const server = new Server(
  {
    name: "antigravity-gemini-bridge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_gemini_antigravity",
        description:
          "CONSULTOR Y CO-PILOTO GEMINI (ANTIGRAVITY): Invoca a los modelos de Gemini en Antigravity de forma proactiva y automática para aprovechar sus fortalezas principales: " +
          "1) Contexto masivo (>1M de tokens): análisis de repositorios enteros, volcados de logs extensos, múltiples archivos pesados (>300 líneas) o documentación técnica densa sin saturar la ventana de Claude ni gastar tokens de Anthropic. " +
          "2) Segunda opinión técnica y revisión crítica: validación de decisiones arquitectónicas, revisión de código, búsqueda de vulnerabilidades o problemas sutiles de concurrencia y casos borde. " +
          "3) Generación exhaustiva de matrices de pruebas: creación de suites completas de tests unitarios, datos de prueba complejos y escenarios extremos. " +
          "4) Ecosistemas Google y tecnologías modernas: asesoramiento experto en Go, Android, Kotlin, Firebase, Google Cloud, Gemini API, Dart/Flutter y TypeScript. " +
          "5) Diagnóstico rápido de errores: análisis de trazas de fallo y depuración veloz usando Gemini 3.8 Flash o Gemini 4.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Pregunta, instrucción, tarea de análisis o solicitud de segunda opinión para Gemini.",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description:
                "Rutas de archivos o carpetas que Gemini debe inspeccionar o procesar directamente.",
            },
            working_directory: {
              type: "string",
              description:
                "Ruta del proyecto o directorio de trabajo relevante como contexto base (opcional).",
            },
            model: {
              type: "string",
              description:
                "Modelo a utilizar: 'gemini-3.8-flash-medium' (por defecto, ultra rápido y 1M+ contexto), 'gemini-3.8-flash-high' (razonamiento rápido profundo), o 'gemini-4-argon-high' (máximo razonamiento para arquitectura compleja).",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "ask_gemini_antigravity") {
    throw new Error(`Herramienta no encontrada: ${request.params.name}`);
  }

  const { prompt, files, working_directory, model } = request.params.arguments || {};

  if (!prompt || typeof prompt !== "string") {
    return {
      isError: true,
      content: [{ type: "text", text: "El parámetro 'prompt' es obligatorio." }],
    };
  }

  const selectedModel = model || DEFAULT_MODEL;

  let finalPrompt = prompt;
  if (Array.isArray(files) && files.length > 0) {
    const fileList = files.map((f) => `- ${f}`).join("\n");
    finalPrompt = `Archivos o rutas para inspeccionar:\n${fileList}\n\nInstrucción / Consulta:\n${prompt}`;
  }

  const args = [
    "-p",
    finalPrompt,
    "--model",
    selectedModel,
    "--output-format",
    "text",
    "--dangerously-skip-permissions",
  ];

  if (working_directory && typeof working_directory === "string") {
    args.push("--add-dir", working_directory);
  }

  process.stderr.write(`[antigravity-bridge] Ejecutando consulta con modelo: ${selectedModel}...\n`);

  try {
    const result = await runAgyCommand(AGY_EXECUTABLE, args, working_directory);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (err) {
    process.stderr.write(`[antigravity-bridge] Error: ${err.message}\n`);
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error ejecutando Antigravity Gemini: ${err.message}`,
        },
      ],
    };
  }
});

function runAgyCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      windowsHide: true,
    });

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (data) => {
      stdoutData += data.toString("utf8");
    });

    child.stderr.on("data", (data) => {
      stderrData += data.toString("utf8");
      process.stderr.write(data);
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Tiempo de espera agotado (timeout de 10 minutos) en Antigravity."));
    }, 10 * 60 * 1000);

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdoutData.trim());
      } else {
        reject(
          new Error(
            `El proceso agy terminó con código de salida ${code}.\nSalida de error: ${stderrData.trim() || stdoutData.trim()}`
          )
        );
      }
    });
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[antigravity-bridge] Servidor MCP conectado (modo multifunción Gemini).\n");
}

main().catch((err) => {
  process.stderr.write(`[antigravity-bridge] Error fatal: ${err.stack || err}\n`);
  process.exit(1);
});
