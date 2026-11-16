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
- By default, `ask_gemini_antigravity` uses `gemini-4-hydrogen-medium` (or `AGY_MODEL` env var), which combines low latency, low quota impact, and strong symbol accuracy for massive context reading and guided execution.
- Use `mode` (`"memory"`, `"review"`, `"execute"`, or `"general"`) to enforce strict anti-hallucination citations, critical audits, or test-verified edits.
- When Claude needs deep architectural reasoning or critical second opinions, it can call `list_antigravity_models` and dynamically escalate to `gemini-4-argon-medium` or `gemini-pro-orchestrator-g1-pro`.

---

## 🤖 Teaching Claude Code to Use It Automatically

Add the following directive to your global `~/.claude/CLAUDE.md`:

```markdown
## Colaboración y Delegación con Gemini en Antigravity (`ask_gemini_antigravity`)
Usa proactivamente las herramientas MCP de Antigravity para que Gemini (1M+ tokens de contexto) actúe como memoria externa y brazo ejecutor de Claude:

1. **Memoria anti-alucinación (`mode: "memory"`)**:
   - Para búsquedas literales exactas usa `Grep` local.
   - Si necesitas entender un flujo que abarca >3 archivos, archivos pesados (>300 líneas) o logs extensos, NO satures tu ventana de contexto: delega primero a `ask_gemini_antigravity` con `mode: "memory"` para obtener un mapa verificado de firmas, tipos, endpoints y `archivo:línea` reales antes de planificar o editar.
   - En sesiones largas (post-compactación), usa `mode: "memory"` para verificar contratos y call sites antes de tocar archivos críticos.
2. **Segunda opinión y revisión crítica (`mode: "review"`)**: Antes de cambios arquitectónicos sensibles o cuando quieras detectar riesgos de concurrencia, seguridad o casos borde, consulta a Gemini (puedes escalar a `gemini-4-argon-medium`).
3. **Ejecución guiada (`mode: "execute"`)**: Para implementar refactors mecánicos según tu plan, escribir suites completas de tests o iterar errores de build/linter hasta dejarlos en verde. Revisa siempre el `git diff` al terminar.
4. **Selección dinámica de modelo y cuidado de cuota**:
   - Por defecto omite el parámetro `model` para usar **Gemini 4 Hydrogen** (`gemini-4-hydrogen-medium`), rápido, preciso y de bajo consumo de cuota.
   - Escala a `gemini-4-argon-medium` para razonamiento arquitectónico profundo o a `gemini-pro-orchestrator-g1-pro` solo para subtareas autónomas complejas. Consulta `list_antigravity_models` si necesitas verificar los IDs activos.
```

---

## 📄 License

MIT © [JohnMndz](https://github.com/JohnMndz)
