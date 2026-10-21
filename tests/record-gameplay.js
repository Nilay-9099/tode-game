import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import pkg from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = pkg;

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9224;
const WIDTH = 640;
const HEIGHT = 360;
const FPS = 10;
const DURATION_SEC = 12;
const TOTAL_FRAMES = FPS * DURATION_SEC;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = (await import('ws')).default || (await import('ws'));
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        if (parsed.id && this.callbacks.has(parsed.id)) {
          const { res, rej } = this.callbacks.get(parsed.id);
          this.callbacks.delete(parsed.id);
          if (parsed.error) rej(parsed.error);
          else res(parsed.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.id++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  }
}

async function record() {
  console.log('🎬 Starting Gameplay Recording Session...');
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,720',
    'about:blank'
  ]);

  try {
    await delay(1500);
    const targets = await fetchJson(`http://localhost:${PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('🌐 Loading game at http://localhost:5173/?debug=1 ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?debug=1' });
    await delay(3000);

    // Setup recorder in page
    await client.eval(`
      (() => {
        window.__recordedFrames = [];
        const canvas = document.querySelector('canvas');
        const off = document.createElement('canvas');
        off.width = ${WIDTH};
        off.height = ${HEIGHT};
        const ctx = off.getContext('2d');
        window.__captureCanvas = () => {
          ctx.drawImage(canvas, 0, 0, ${WIDTH}, ${HEIGHT});
          const img = ctx.getImageData(0, 0, ${WIDTH}, ${HEIGHT});
          return Array.from(img.data);
        };
      })()
    `);

    console.log('🎥 Recording choreographing action sequence...');
    const gif = GIFEncoder();

    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      const t = frame / FPS;

      // Choreographed gameplay inputs
      if (frame === 5) {
        // Hop 1
        await client.eval(`window.__tode.player.startJump('up')`);
      } else if (frame === 10) {
        // Hop 2
        await client.eval(`window.__tode.player.startJump('right')`);
      } else if (frame === 16) {
        // Aim and shoot tongue at bug
        await client.eval(`
          (() => {
            const p = window.__tode.player;
            p.setFacingDirection(10, 20);
            window.__tode.tongue.shoot(p, [], [], { x: p.group.position.x + 30, y: p.group.position.y + 40 });
          })()
        `);
      } else if (frame === 28) {
        // Eat bug and evolve to Ember Stage 2
        await client.eval(`
          (() => {
            window.__tode.giveBug('ember');
            window.__tode.evolve('ember', 2);
          })()
        `);
      } else if (frame === 40) {
        // Spawn Gnomes and Wasps
        await client.eval(`
          (() => {
            window.__tode.spawn('gnome', 2);
            window.__tode.spawn('wasp', 1);
          })()
        `);
      } else if (frame === 52) {
        // Spit fireball projectile
        await client.eval(`
          (() => {
            const p = window.__tode.player;
            p.setFacingDirection(30, 20);
            window.__tode.giveBug('ember');
            const fusion = { id: 'ember+ember', name: 'Inferno Spit', element: 'fire', colorHex: 0xff3b30, projectile: { speed: 320, size: 4.5, damage: 3.5 } };
            // Trigger spit
            const ev = new KeyboardEvent('keydown', { code: 'KeyR' });
            window.dispatchEvent(ev);
          })()
        `);
      } else if (frame === 68) {
        // Trigger Ground Shockwave Stomp
        await client.eval(`
          (() => {
            window.__tode.player.triggerShockwave([], null, null);
          })()
        `);
      } else if (frame === 84) {
        // Transition to Boss Arena & spawn Lawn Mower King
        await client.eval(`
          (() => {
            window.__tode.setPhase('BOSS_ARENA');
            window.__tode.spawn('boss', 1);
          })()
        `);
      } else if (frame === 98) {
        // Tode hops defensively away from boss
        await client.eval(`window.__tode.player.startJump('down')`);
      } else if (frame === 106) {
        await client.eval(`window.__tode.player.startJump('left')`);
      }

      // Capture frame
      const rawData = await client.eval(`window.__captureCanvas()`);
      if (rawData && rawData.length === WIDTH * HEIGHT * 4) {
        const u8 = new Uint8Array(rawData);
        const palette = quantize(u8, 128);
        const index = applyPalette(u8, palette);
        gif.writeFrame(index, WIDTH, HEIGHT, { palette, delay: 100 });
      }

      if (frame % 15 === 0) {
        console.log(`⏱️ Recorded frame ${frame} / ${TOTAL_FRAMES} (${(t).toFixed(1)}s)`);
      }

      await delay(100);
    }

    gif.finish();
    const gifBytes = gif.bytes();
    const outputPath = 'C:\\Users\\nilay\\WebstormProjects\\Build a Game with an AI Coding Agent\\game\\tode-gameplay.gif';
    fs.writeFileSync(outputPath, Buffer.from(gifBytes));
    const stats = fs.statSync(outputPath);
    const mb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`🎉 Gameplay GIF successfully generated at: ${outputPath} (${mb} MB, ${DURATION_SEC}s, ${FPS} fps)`);

    // Copy to artifact directory so user can preview directly
    const artifactPath = 'C:\\Users\\nilay\\.gemini\\antigravity\\brain\\5268569d-0738-43b9-9e39-945172ba249a\\tode-gameplay.gif';
    fs.copyFileSync(outputPath, artifactPath);
    console.log(`📂 Copied to artifact dir: ${artifactPath}`);

  } finally {
    browserProc.kill();
  }
}

record().catch((e) => {
  console.error('Recording failed:', e);
  process.exit(1);
});
