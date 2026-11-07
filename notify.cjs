const fs = require('fs');
const path = require('path');

async function main() {
  // 1. Leer stdin de forma asincrona y no bloqueante (maximo 150ms si el pipe queda abierto)
  const readStdin = new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
    setTimeout(() => resolve(data), 150);
  });

  let inputData = {};
  try {
    const raw = await readStdin;
    if (raw && raw.trim()) {
      inputData = JSON.parse(raw);
    }
  } catch {
    // Si no es JSON valido, continuamos silenciosamente con objeto vacio
  }

  const eventType = process.argv[2] || 'pre_invocation';
  const cwd = (inputData.workspacePaths && inputData.workspacePaths[0]) || process.cwd();
  const project = path.basename(cwd);
  const sessionId = inputData.conversationId || 'antigravity-session';
  const query = (inputData.lastUserInput || '').trim();

  // 2. Helper para emitir secuencias de escape directamente a la consola
  // En Windows, escribir a //./CONOUT$ evita contaminar el stdout que Antigravity parsea.
  // En Unix/macOS, escribir a /dev/tty cumple la misma funcion.
  function emitToTerminal(seq) {
    const devices = ['//./CONOUT$', '/dev/tty'];
    for (const dev of devices) {
      try {
        const fd = fs.openSync(dev, 'w');
        fs.writeSync(fd, seq);
        fs.closeSync(fd);
        return;
      } catch {
        // Intentar el siguiente dispositivo
      }
    }
  }

  // 3. Manejar eventos segun el ciclo de vida de Antigravity
  try {
    if (eventType === 'pre_invocation') {
      // Tab title en Warp: indicador de trabajo activo
      emitToTerminal('\x1b]0;⏳ [Antigravity] Pensando...\x07');

      // Barra de progreso nativa en la pestaña (OSC 9;4 estado 1: indeterminado / spinner)
      emitToTerminal('\x1b]9;4;1;0\x07');

      // Warp CLI Agent Protocol
      const payload = {
        v: 1,
        agent: 'antigravity',
        event: 'prompt_submit',
        session_id: sessionId,
        cwd: cwd,
        project: project,
        query: query.slice(0, 200)
      };
      emitToTerminal(`\x1b]777;notify;warp://cli-agent;${JSON.stringify(payload)}\x07`);

    } else if (eventType === 'post_tool') {
      const toolName = (inputData.toolCall && inputData.toolCall.name) || 'herramienta';
      emitToTerminal(`\x1b]0;⚡ [Antigravity] ${toolName}...\x07`);

      // Mantener progreso activo
      emitToTerminal('\x1b]9;4;1;0\x07');

      const payload = {
        v: 1,
        agent: 'antigravity',
        event: 'tool_complete',
        session_id: sessionId,
        tool_name: toolName
      };
      emitToTerminal(`\x1b]777;notify;warp://cli-agent;${JSON.stringify(payload)}\x07`);

    } else if (eventType === 'stop') {
      // Tab title en Warp: indicador de completado
      emitToTerminal('\x1b]0;✅ [Antigravity] Listo\x07');

      // Limpiar barra de progreso en la pestaña (OSC 9;4 estado 0: limpiar)
      emitToTerminal('\x1b]9;4;0;0\x07');

      // Warp CLI Agent Protocol
      const payload = {
        v: 1,
        agent: 'antigravity',
        event: 'stop',
        session_id: sessionId,
        cwd: cwd,
        project: project,
        query: query.slice(0, 200),
        response: 'Listo'
      };
      emitToTerminal(`\x1b]777;notify;warp://cli-agent;${JSON.stringify(payload)}\x07`);

      // Notificacion nativa UNICA en Warp (OSC 777)
      const summary = query ? query.slice(0, 80) : 'Listo para avanzar';
      emitToTerminal(`\x1b]777;notify;Antigravity;${summary}\x07`);

      // Chime / campana de terminal
      emitToTerminal('\x07');
    }
  } catch {
    // Ignorar errores al emitir a la terminal para asegurar no bloquear el agente
  }

  // 4. Salida requerida por el contrato de Lifecycle Hooks de Antigravity:
  // Siempre debe devolver un objeto JSON valido en stdout y salir con codigo 0.
  process.stdout.write(JSON.stringify({}) + '\n');
  process.exit(0);
}

main().catch(() => {
  process.stdout.write(JSON.stringify({}) + '\n');
  process.exit(0);
});
