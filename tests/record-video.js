import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9225;
const DURATION_MS = 15000; // 15 seconds (max 20s)

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

async function recordVideo() {
  console.log('🎥 Starting 30 FPS Video Recording Session...');
  const browserProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--use-gl=angle',
    '--enable-webgl',
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

    // Initialize 30 FPS MediaRecorder in browser
    console.log('📹 Initializing 30 FPS MediaRecorder on Three.js Canvas...');
    await client.eval(`
      (() => {
        window.__recordedChunks = [];
        window.__videoDone = false;
        const canvas = document.querySelector('canvas');
        const stream = canvas.captureStream(30);

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 6000000 // 6 Mbps high quality 30 FPS
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            window.__recordedChunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(window.__recordedChunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            window.__videoBase64 = reader.result.split(',')[1];
            window.__videoDone = true;
          };
          reader.readAsDataURL(blob);
        };

        window.__recorder = recorder;
        recorder.start(100);
        console.log('MediaRecorder started at 30 FPS with ' + mimeType);
      })()
    `);

    console.log('🎮 Executing choreographed 15s gameplay action...');
    const startTime = Date.now();

    // Timeline of actions
    // 0.8s: Hop up
    await delay(800);
    await client.eval(`window.__tode.player.startJump('up')`);

    // 1.8s: Hop right
    await delay(1000);
    await client.eval(`window.__tode.player.startJump('right')`);

    // 2.8s: Aim and shoot tongue at nearby bug
    await delay(1000);
    await client.eval(`
      (() => {
        const p = window.__tode.player;
        p.setFacingDirection(15, 25);
        window.__tode.tongue.shoot(p, [], [], { x: p.group.position.x + 35, y: p.group.position.y + 45 });
      })()
    `);

    // 4.2s: Swallow bug & trigger Ember Evolution
    await delay(1400);
    await client.eval(`
      (() => {
        window.__tode.giveBug('ember');
        window.__tode.evolve('ember', 2);
      })()
    `);

    // 5.8s: Spawn enemies (Gnomes + Wasps)
    await delay(1600);
    await client.eval(`
      (() => {
        window.__tode.spawn('gnome', 2);
        window.__tode.spawn('wasp', 1);
      })()
    `);

    // 7.2s: Aim and spit Inferno projectile
    await delay(1400);
    await client.eval(`
      (() => {
        const p = window.__tode.player;
        p.setFacingDirection(40, 20);
        window.__tode.giveBug('ember');
        const ev = new KeyboardEvent('keydown', { code: 'KeyR' });
        window.dispatchEvent(ev);
      })()
    `);

    // 8.8s: Ground Shockwave Stomp
    await delay(1600);
    await client.eval(`
      (() => {
        window.__tode.player.triggerShockwave([], null, null);
      })()
    `);

    // 10.5s: Transition to Boss Arena & spawn Lawn Mower King
    await delay(1700);
    await client.eval(`
      (() => {
        window.__tode.setPhase('BOSS_ARENA');
        window.__tode.spawn('boss', 1);
      })()
    `);

    // 12.2s: Tode evasive hop
    await delay(1700);
    await client.eval(`window.__tode.player.startJump('down')`);

    // 13.5s: Tode second evasive hop
    await delay(1300);
    await client.eval(`window.__tode.player.startJump('left')`);

    // Wait until full 15s elapsed
    const remaining = DURATION_MS - (Date.now() - startTime);
    if (remaining > 0) await delay(remaining);

    console.log('⏹️ Stopping MediaRecorder...');
    await client.eval(`window.__recorder.stop()`);

    // Wait for base64 encoding to complete
    let done = false;
    for (let i = 0; i < 40; i++) {
      await delay(200);
      done = await client.eval(`window.__videoDone`);
      if (done) break;
    }

    if (!done) throw new Error('Video encoding timed out');

    const base64Data = await client.eval(`window.__videoBase64`);
    const buffer = Buffer.from(base64Data, 'base64');

    const webmPath = 'C:\\Users\\nilay\\WebstormProjects\\Build a Game with an AI Coding Agent\\game\\tode-gameplay.webm';
    fs.writeFileSync(webmPath, buffer);
    const webmStats = fs.statSync(webmPath);
    console.log(`✅ WebM Video generated at: ${webmPath} (${(webmStats.size / (1024 * 1024)).toFixed(2)} MB, 30 FPS, 15s)`);

    // Attempt MP4 conversion if ffmpeg is available
    const mp4Path = 'C:\\Users\\nilay\\WebstormProjects\\Build a Game with an AI Coding Agent\\game\\tode-gameplay.mp4';
    try {
      console.log('🎞️ Transcoding to MP4 (H.264) via ffmpeg...');
      execSync(`ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -b:v 4000k "${mp4Path}"`, { stdio: 'inherit' });
      const mp4Stats = fs.statSync(mp4Path);
      console.log(`🎉 MP4 Video generated at: ${mp4Path} (${(mp4Stats.size / (1024 * 1024)).toFixed(2)} MB, 30 FPS, 15s)`);
    } catch (e) {
      console.warn('ffmpeg conversion note:', e.message);
    }

    // Copy to artifact directory
    const artifactWebm = 'C:\\Users\\nilay\\.gemini\\antigravity\\brain\\5268569d-0738-43b9-9e39-945172ba249a\\tode-gameplay.webm';
    fs.copyFileSync(webmPath, artifactWebm);
    if (fs.existsSync(mp4Path)) {
      const artifactMp4 = 'C:\\Users\\nilay\\.gemini\\antigravity\\brain\\5268569d-0738-43b9-9e39-945172ba249a\\tode-gameplay.mp4';
      fs.copyFileSync(mp4Path, artifactMp4);
    }

  } finally {
    browserProc.kill();
  }
}

recordVideo().catch((e) => {
  console.error('Error recording video:', e);
  process.exit(1);
});
