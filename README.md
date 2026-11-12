# Antigravity MCP Bridge

Bridge Model Context Protocol (MCP) server connecting **Claude Code** to **Google Antigravity (Gemini)** using your local Antigravity session, CLI (`agy`), and subscription quota.

---

## 🎯 What is this?

When using Claude Code, heavy tasks like ingesting massive log dumps, analyzing entire repositories, or inspecting multiple large files (>300 lines) can rapidly consume Claude's context window and Anthropic API tokens.

**Antigravity MCP Bridge** enables Claude Code to delegate these tasks to **Gemini 3.8 Flash** or **Gemini 4** running via Google Antigravity.

### Key Benefits:
- **Massive Context (1M+ Tokens)**: Offload large codebases, documentation, or log dumps.
- **Zero Additional API Costs**: Uses your active Google Antigravity plan/session via `agy` CLI instead of Google AI Studio or Anthropic tokens.
- **Specialized Consultation**: Use Gemini for second opinions, deep code reviews, unit test matrix generation, and Google ecosystem technologies (Go, Android/Kotlin, Flutter, Firebase, Google Cloud).
- **Proactive / Autonomous**: Configurable so Claude Code automatically delegates heavy workloads without manual intervention.

---

## 🚀 Installation & Setup

### 1. Requirements
- Node.js (v18+)
- [Google Antigravity](https://antigravity.google) with the `agy` CLI installed and authenticated.
- [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) (`npm i -g @anthropic-ai/claude-code`).

### 2. Clone and install dependencies

```bash
git clone https://github.com/JohnMndz/antigravity-mcp-bridge.git
cd antigravity-mcp-bridge
npm install
```

### 3. Register in Claude Code

Run the following command to register the MCP server globally for your user:

```bash
claude mcp add --scope user antigravity node /path/to/antigravity-mcp-bridge/index.js
```

*(On Windows, use `node C:\Users\<Username>\antigravity-mcp-bridge\index.js`)*

Verify the connection:
```bash
claude mcp list
```
You should see:
```text
antigravity: node .../index.js - √ Connected
```

---

## ⚙️ Configuration & Model Selection

The server defaults to **`gemini-3.8-flash-medium`** for maximum speed and 1M+ token context.

You can customize the model by setting the `AGY_MODEL` environment variable or by specifying the `model` argument in the tool call:
- `gemini-3.8-flash-medium` (Default: Ultra-fast, 1M+ context)
- `gemini-3.8-flash-high` (High reasoning, fast execution)
- `gemini-4-argon-high` (Deep architecture reasoning & edge-case analysis)

---

## 🤖 Teaching Claude Code to Use It Automatically

Add the following directive to your global `~/.claude/CLAUDE.md`:

```markdown
## Colaboración y Delegación con Gemini en Antigravity (`ask_gemini_antigravity`)
Usa proactivamente la herramienta MCP `ask_gemini_antigravity` para apoyarte en las fortalezas clave de los modelos de Gemini (ejecutados en Antigravity con tu suscripción local):

1. **Contexto masivo y repositorios**: Ante tareas con archivos grandes (>300 líneas), múltiples archivos, volcados de logs extensos o búsquedas globales, no satures tu ventana de contexto; delega la lectura e inspección a Gemini.
2. **Segunda opinión y revisión crítica**: Antes de cambios arquitectónicos sensibles, refactorizaciones complejas o cuando quieras verificar casos borde, concurrencia o posibles riesgos de seguridad, consulta a Gemini como un revisor par.
3. **Generación de pruebas exhaustivas**: Para diseñar matrices completas de tests unitarios, mocks complejos y casos extremos.
4. **Ecosistemas Google y tecnologías modernas**: Ante dudas o implementaciones en Go, Android, Kotlin, Firebase, Google Cloud, APIs de Gemini, Dart/Flutter y TypeScript.
5. **Elección de modelo**: Por defecto usará `gemini-3.8-flash-medium` (rápido y con 1M+ contexto). Para razonamiento arquitectónico profundo puedes especificar `model: "gemini-4-argon-high"`.
```

---

## 📄 License

MIT © [JohnMndz](https://github.com/JohnMndz)
