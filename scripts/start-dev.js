#!/usr/bin/env node
// start-dev.js
// Picks an available port from a list and launches Vite on that port.
import net from 'node:net';
import { spawn } from 'node:child_process';

const defaultPorts = [process.env.VITE_PORT ? parseInt(process.env.VITE_PORT, 10) : 5173, 5174, 5175, 5176, 5177];
const timeout = 250; // ms

async function isViteRunning(port) {
    // Try probing the server root and the Vite client path to determine if Vite is serving on this port
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`http://127.0.0.1:${port}/`, { signal: controller.signal, redirect: 'manual' });
        clearTimeout(id);
        if (res && res.status < 500) {
            const text = await res.text();
            if (/src=\"\/@vite\/client|vite/i.test(text)) return true;
        }
    } catch (e) {
        // ignore
    }

    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`http://127.0.0.1:${port}/@vite/client`, { signal: controller.signal, redirect: 'manual' });
        clearTimeout(id);
        if (res && res.status === 200) return true;
    } catch (e) {
        // ignore
    }

    return false;
}

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            server.close();
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        // Listen on all interfaces to better detect ports occupied on non-loopback addresses
        server.listen({ port, host: '0.0.0.0' });
        setTimeout(() => {
            try { server.close(); } catch (e) {}
            resolve(false);
        }, timeout);
    });
}

(async function main() {
    try {
        // If user passed --port on CLI, prefer it
        const cliPortArg = process.argv.find((a) => a.startsWith('--port='));
        let candidatePorts = [...defaultPorts];
        if (cliPortArg) {
            const p = parseInt(cliPortArg.split('=')[1], 10);
            if (!Number.isNaN(p)) candidatePorts.unshift(p);
        }

        let chosen = null;
        let chosenIsExisting = false;
        for (const p of candidatePorts) {
            if (!p || Number.isNaN(p)) continue;
            const ok = await checkPort(p);
            if (ok) {
                // Port free
                chosen = p; break;
            } else {
                // Port in use — check if it's Vite already running. If so, we reuse it.
                try {
                    const viteHere = await isViteRunning(p);
                    if (viteHere) {
                        chosen = p;
                        chosenIsExisting = true;
                        break;
                    }
                } catch (e) {
                    // ignore probe failures and continue to next port
                }
            }
        }

        if (!chosen) {
            console.error('No available ports found in ' + candidatePorts.join(', '));
            process.exit(1);
        }

        if (chosenIsExisting) {
            console.log(`Vite is already running on port ${chosen}. Will not start a new dev server.`);
            // Exit successfully; don't spawn a second Vite process on another port.
            process.exit(0);
        }

        console.log(`Trying to start Vite on port ${chosen}...`);
        process.env.PORT = String(chosen);
        process.env.VITE_PORT = String(chosen);

        // Try to start vite and detect immediate failure; if it fails quickly, try next port
        const tryStart = (port) => new Promise((resolve, reject) => {
            const child = spawn('npx', ['vite', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
            let exited = false;
            let finished = false;
            let stderr = '';
            let sawReady = false;
            let errorType = null; // e.g., 'port-in-use', 'permission', etc.

            const attachPipesAndRelay = () => {
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
                const relay = (sig) => child.kill(sig);
                process.on('SIGINT', relay);
                process.on('SIGTERM', relay);
            };

            const checkReady = (chunk) => {
                const s = chunk.toString();
                // Look for Vite's "Local: http..." or "ready in 123ms"
                if (/Local:\s*http/i.test(s) || /ready in \d+ms/i.test(s)) {
                    sawReady = true;
                    if (!finished) {
                        finished = true;
                        clearTimeout(fallbackTimeout);
                        attachPipesAndRelay();
                        resolve({ success: true, code: null, stderr: null, child });
                    }
                }
            };

            child.stdout.on('data', (d) => checkReady(d));
            child.stderr.on('data', (d) => {
                const chunk = d.toString();
                stderr += chunk;
                // Detect common immediate failure reasons
                if (/EADDRINUSE|address already in use|listen EADDRINUSE|EACCES|permission denied/i.test(chunk)) {
                    errorType = 'port-in-use';
                }
                if (/error when starting dev server/i.test(chunk)) {
                    errorType = 'devserver-error';
                }
                checkReady(d);
            });

            child.on('exit', (code) => {
                exited = true;
                if (!finished) {
                    finished = true;
                    clearTimeout(fallbackTimeout);
                    resolve({ success: code === 0, code, stderr, errorType });
                }
            });

            // Fallback: if we don't see the ready line but the process is still running after 5s,
            // assume it's started and attach logs so the user can see Vite output.
            const fallbackTimeout = setTimeout(() => {
                if (!finished && !exited) {
                    finished = true;
                    attachPipesAndRelay();
                    resolve({ success: true, code: null, stderr: null, child });
                }
            }, 5000);
        });

        const result = await tryStart(chosen);
        console.log('tryStart result:', { success: result.success, code: result.code, stderr: result.stderr && result.stderr.split('\n')[0], errorType: result.errorType });

        // If starting failed due to port-in-use, check if it's actually Vite and avoid fallback attempts
        if (!result.success && result.errorType === 'port-in-use') {
            const viteHere = await isViteRunning(chosen);
            if (viteHere) {
                console.log(`Vite already running on port ${chosen}; will not start a new server.`);
                process.exit(0);
            }
            console.error(`Port ${chosen} appears to be in use (EADDRINUSE or permission denied). Will not try other ports.`);
            process.exit(1);
        }

        if (result.success) {
            if (result.child) {
                // Server started successfully and child is running. If it exits quickly with an error,
                // try the next ports (handles cases where checkPort gave a false positive).
                const chosenPort = chosen;
                const graceMs = 3000;
                const startedAt = Date.now();
                result.child.on('exit', async (code) => {
                    const elapsed = Date.now() - startedAt;
                    if (code !== 0 && elapsed < graceMs) {
                        // If it failed quickly, first check if Vite is already running on this port
                        const viteHere = await isViteRunning(chosenPort);
                        if (viteHere) {
                            console.log(`Vite appears to be running on port ${chosenPort}; exiting.`);
                            process.exit(0);
                        }

                        console.log(`Vite failed on port ${chosenPort} after ${elapsed}ms with code ${code}; trying other ports...`);
                        // Try remaining ports
                        for (const p of candidatePorts) {
                            if (p === chosenPort) continue;
                            console.log(`Trying fallback port ${p}...`);
                            process.env.PORT = String(p);
                            process.env.VITE_PORT = String(p);
                            const r = await tryStart(p);
                            if (r.success) {
                                if (r.child) {
                                    r.child.on('exit', (c) => process.exit(c ?? 0));
                                    return;
                                } else {
                                    process.exit(0);
                                }
                            }
                        }
                        console.error('All candidate ports failed to start Vite after fallback attempts. Last stderr:', result.stderr);
                        process.exit(1);
                    }
                    process.exit(code ?? 0);
                });
                return;
            } else {
                // Child exited with code 0 quickly (rare), just exit
                process.exit(0);
            }
        }

        // If we reach here, starting on chosen port failed. Try remaining ports sequentially
        for (const p of candidatePorts) {
            if (p === chosen) continue;
            console.log(`Port ${chosen} failed: ${result.stderr ? result.stderr.split('\n')[0] : 'failed'} — trying port ${p}`);
            process.env.PORT = String(p);
            process.env.VITE_PORT = String(p);
            const r = await tryStart(p);
            if (r.success) {
                if (r.child) {
                    r.child.on('exit', (code) => process.exit(code ?? 0));
                    return;
                } else {
                    process.exit(0);
                }
            }
        }

        console.error('All candidate ports failed to start Vite. Last stderr:', result.stderr);
        process.exit(1);

    } catch (err) {
        console.error('Failed to start dev server:', err);
        process.exit(1);
    }
})();
