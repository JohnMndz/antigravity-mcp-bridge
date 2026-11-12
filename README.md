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

## ⚙️ Configuration & Dynamic Model Selection

The bridge provides two tools:
- `ask_gemini_antigravity`: Executes queries using your Antigravity session.
- `list_antigravity_models`: Queries `agy models` in real time so Claude Code always sees the latest models available in your Antigravity account without hardcoding model IDs.

**Cost & Quota Optimization Strategy:**
- By default, `ask_gemini_antigravity` uses a lightweight Flash model (`gemini-3.8-flash-medium` or `AGY_MODEL` env var) optimized for huge context ingestion (logs, repositories) with minimal quota impact.
- When Claude needs deep architectural reasoning or critical second opinions, it can call `list_antigravity_models` and dynamically escalate to a flagship model (e.g., Gemini 4 Hydrogen/Argon).

---

## 🤖 Teaching Claude Code to Use It Automatically

Add the following directive to your global `~/.claude/CLAUDE.md`:

```markdown
## Colaboración y Delegación con Gemini en Antigravity (`ask_gemini_antigravity`)
Usa proactivamente las herramientas MCP de Antigravity para apoyarte en las fortalezas clave de Gemini (ejecutados en Antigravity con tu suscripción local):

1. **Contexto masivo y repositorios**: Ante tareas con archivos grandes (>300 líneas), múltiples archivos, volcados de logs extensos o búsquedas globales, no satures tu ventana de contexto; delega la lectura e inspección a Gemini.
2. **Segunda opinión y revisión crítica**: Antes de cambios arquitectónicos sensibles, refactorizaciones complejas o cuando quieras verificar casos borde, concurrencia o posibles riesgos de seguridad, consulta a Gemini como un revisor par.
3. **Generación de pruebas exhaustivas**: Para diseñar matrices completas de tests unitarios, mocks complejos y casos extremos.
4. **Ecosistemas Google y tecnologías modernas**: Ante dudas o implementaciones en Go, Android, Kotlin, Firebase, Google Cloud, APIs de Gemini, Dart/Flutter y TypeScript.
5. **Selección dinámica de modelo y cuidado de cuota**:
   - Por defecto omite el parámetro `model` para usar el modelo **Flash** rápido y de bajo consumo de cuota (ideal para el 85% de tareas de lectura masiva y resúmenes).
   - Solo si la tarea requiere razonamiento arquitectónico muy complejo o validación crítica, consulta `list_antigravity_models` para ver qué modelos flagship están disponibles en ese momento y especifica el más adecuado.
```

---

## 📄 License

MIT © [JohnMndz](https://github.com/JohnMndz)
