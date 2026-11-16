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
const DEFAULT_MODEL = process.env.AGY_MODEL || "gemini-4-hydrogen-medium";

const MODE_INSTRUCTIONS = {
  general: "",
  memory:
    "MODO MEMORIA Y VERIFICACIÓN (SOLO LECTURA): Responde ÚNICAMENTE con hechos observados directamente en los archivos reales. " +
    "Cita siempre ruta exacta y número de línea (ej. `archivo:línea`), firmas exactas, tipos, endpoints y variables de entorno reales. " +
    "Si algo no existe o no puedes verificarlo en disco, dilo explícitamente. No inventes ni propongas cambios de código salvo que se pida.",
  review:
    "MODO REVISIÓN CRÍTICA: Evalúa arquitectura, concurrencia, seguridad, manejo de errores y casos borde basándote exclusivamente en el código real. " +
    "Cita archivo y línea en cada hallazgo.",
  execute:
    "MODO EJECUCIÓN GUIADA: Implementa exactamente la tarea solicitada dentro del directorio de trabajo, ejecuta las pruebas/linter/build correspondientes " +
    "y devuelve un resumen conciso con: 1) lista exacta de archivos modificados o creados, y 2) resultado real de los comandos ejecutados.",
};

const server = new Server(
  {
    name: "antigravity-gemini-bridge",
    version: "1.3.0",
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
        name: "list_antigravity_models",
        description:
          "Obtiene en tiempo real la lista de modelos de IA disponibles en el CLI local de Antigravity. Úsala cuando necesites saber qué modelos de Gemini (u otros) están activos antes de escalar a un modelo de razonamiento superior.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "ask_gemini_antigravity",
        description:
          "MEMORIA EXTERNA, REVISOR Y EJECUTOR GEMINI (ANTIGRAVITY): Invoca a Gemini en Antigravity para aprovechar su contexto masivo (>1M tokens) y cuota local: " +
          "1) Memoria anti-alucinación (mode: 'memory'): antes de planificar o editar cuando necesites analizar >3 archivos o >300 líneas, delega la lectura a Gemini para obtener un mapa exacto de contratos, firmas, tipos y call sites sin saturar tu ventana de contexto. " +
          "2) Segunda opinión técnica (mode: 'review'): validación arquitectónica, concurrencia, seguridad y casos borde. " +
          "3) Ejecución guiada (mode: 'execute'): implementar refactors acotados, generar y correr suites de tests o corregir errores de build/linter en working_directory. " +
          "4) Ecosistemas Google y trazas largas: Go, Android/Kotlin, Firebase, Google Cloud, Gemini API, Flutter, TypeScript y volcados de logs.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Pregunta, instrucción, tarea de análisis o solicitud de segunda opinión para Gemini.",
            },
            mode: {
              type: "string",
              enum: ["general", "memory", "review", "execute"],
              description:
                "Modo de operación (opcional, default 'general'). Usa 'memory' para extraer contratos/firmas/hechos verificados sin alucinar; 'review' para auditoría crítica; 'execute' para aplicar cambios y correr tests en working_directory.",
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
                "ID del modelo a utilizar (opcional). Por defecto usa 'gemini-4-hydrogen-medium' (rápido, preciso y bajo consumo de cuota; ideal para 'memory' y 'execute'). Para revisión profunda usa 'gemini-4-argon-medium', y para tareas autónomas complejas 'gemini-pro-orchestrator-g1-pro'. Consulta 'list_antigravity_models' si necesitas ver todos los IDs activos.",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "list_antigravity_models") {
    process.stderr.write("[antigravity-bridge] Consultando modelos disponibles en Antigravity...\n");
    try {
      const output = await runAgyCommand(AGY_EXECUTABLE, ["models"]);
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al listar modelos de Antigravity: ${err.message}`,
          },
        ],
      };
    }
  }

  if (request.params.name === "ask_gemini_antigravity") {
    const { prompt, mode, files, working_directory, model } = request.params.arguments || {};

    if (!prompt || typeof prompt !== "string") {
      return {
        isError: true,
        content: [{ type: "text", text: "El parámetro 'prompt' es obligatorio." }],
      };
    }

    const selectedModel = model || DEFAULT_MODEL;
    const selectedMode = mode && MODE_INSTRUCTIONS[mode] !== undefined ? mode : "general";
    const modePrefix = MODE_INSTRUCTIONS[selectedMode];

    let finalPrompt = prompt;
    if (Array.isArray(files) && files.length > 0) {
      const fileList = files.map((f) => `- ${f}`).join("\n");
      finalPrompt = `Archivos o rutas para inspeccionar:\n${fileList}\n\nInstrucción / Consulta:\n${prompt}`;
    }
    if (modePrefix) {
      finalPrompt = `${modePrefix}\n\n${finalPrompt}`;
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

    process.stderr.write(
      `[antigravity-bridge] Ejecutando consulta (modo: ${selectedMode}, modelo: ${selectedModel})...\n`
    );

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
  }

  throw new Error(`Herramienta no encontrada: ${request.params.name}`);
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
  process.stderr.write("[antigravity-bridge] Servidor MCP conectado (descubrimiento dinámico de modelos).\n");
}

main().catch((err) => {
  process.stderr.write(`[antigravity-bridge] Error fatal: ${err.stack || err}\n`);
  process.exit(1);
});
