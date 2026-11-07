# antigravity-warp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Warp Compatible](https://img.shields.io/badge/Warp-Terminal-00C7B7.svg)](https://warp.dev)
[![Antigravity](https://img.shields.io/badge/Agent-Antigravity-4285F4.svg)](https://github.com/Clevers-Dev/antigravity-warp)

Native **[Warp Terminal](https://warp.dev)** integration plugin for **Antigravity** (Google Antigravity / Gemini CLI).

Provides real-time visual status, animated spinners, dynamic tab titles, agent protocol synchronization, and native desktop/in-app notifications when Antigravity completes tasks or requires user attention.

---

## ✨ Features

- ⏳ **Dynamic Tab Titles**: Displays current state in the Warp tab bar:
  - Working: `⏳ [Antigravity] Pensando...`
  - Tool execution: `⚡ [Antigravity] run_command...`
  - Completed: `✅ [Antigravity] Listo`
- 🚀 **Warp CLI Agent Protocol (`warp://cli-agent`)**: Sends native `prompt_submit`, `tool_complete`, and `stop` signals so Warp recognizes Antigravity in its agent workflows and tab spinners.
- 🔔 **Native Desktop & In-App Notifications**: Emits OSC 777 and OSC 9 escape sequences so you receive immediate desktop alerts when Antigravity finishes, even if you are working in another window.
- 🛡️ **Zero Dependencies & Clean Architecture**: Pure Node.js script (~80 lines). Direct console output buffer communication (`CONOUT$` on Windows / `/dev/tty` on Unix/macOS) prevents any pollution of Antigravity's JSON hook stream.

---

## 📦 Installation

### Option 1: Global Installation (Recommended)

Clone or copy the plugin into your global Antigravity configuration directory:

```bash
# On Windows (PowerShell)
git clone https://github.com/Clevers-Dev/antigravity-warp.git "$env:USERPROFILE\.gemini\config\plugins\antigravity-warp"

# On macOS / Linux
git clone https://github.com/Clevers-Dev/antigravity-warp.git ~/.gemini/config/plugins/antigravity-warp
```

Then enable the plugin in your `~/.gemini/config/config.json`:

```json
{
  "plugins": {
    "antigravity-warp": {
      "enabled": true
    }
  }
}
```

### Option 2: Project-Level Installation

If you want the integration active only within a specific project repository:

```bash
git clone https://github.com/Clevers-Dev/antigravity-warp.git .agents/plugins/antigravity-warp
```

---

## 🔍 How It Works

Antigravity features a native **Lifecycle Hooks** system configured via `hooks.json`. This plugin hooks into:

1. **`PreInvocation`**: Fires immediately when you submit a prompt. Updates the tab title and notifies Warp that the agent is actively working.
2. **`PostToolUse`**: Fires after each tool or command execution, keeping the tab title updated with the current tool in progress.
3. **`Stop`**: Fires when Antigravity finishes its turn and becomes idle, updating the tab icon to ready (`✅`) and triggering Warp's native desktop notification.

---

## 📄 License

MIT © [Clevers Dev](https://github.com/Clevers-Dev) / Leo Araya Svensson
