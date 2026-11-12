/**
 * Host half of the Yermu theme.
 *
 * Two things live here, both only possible on the host side:
 *   1. a `webserver/index-inject` contribution (one stylesheet + one inline script that mounts
 *      the looping video backdrop on `document.body`), and
 *   2. an HTTP route that streams the clip with Range support, so the browser can start
 *      playing before the whole file has arrived.
 *
 * The bottom layer of the page cannot be reached from a slot: every slot renders inside the
 * app root, above the columns. A backdrop has to be a `position:fixed; z-index:-1` first child
 * of `body`, which is exactly what the injected script inserts.
 *
 * Portability: the clip ships inside this package (`assets/background.mp4`), so the bundle is
 * self-contained — copy the folder to another machine and nothing else is needed.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_FILE = path.join(PACKAGE_ROOT, 'assets', 'background.mp4');
const VIDEO_ROUTE = '/yeermu-theme/background.mp4';
/* Scene 1 keeps the original route; extra clips get their own exact routes. */
const SCENES = [
  [VIDEO_ROUTE, VIDEO_FILE],
  ['/yeermu-theme/background-2.mp4', path.join(PACKAGE_ROOT, 'assets', 'background-2.mp4')],
  ['/yeermu-theme/background-3.mp4', path.join(PACKAGE_ROOT, 'assets', 'background-3.mp4')],
  ['/yeermu-theme/background-4.mp4', path.join(PACKAGE_ROOT, 'assets', 'background-4.mp4')],
  /* Boot animation: same streaming path, own route. */
  ['/yeermu-theme/boot.mp4', path.join(PACKAGE_ROOT, 'assets', 'boot.mp4')],
];
/* Optional pixel face: whichever of these exists under `assets/` is served at one extensionless route. */
const FONT_ROUTE = '/yeermu-theme/pixel-font';
const FONT_CANDIDATES = [
  ['pixel.woff2', 'font/woff2'],
  ['pixel.woff', 'font/woff'],
  ['pixel.ttf', 'font/ttf'],
  ['pixel.otf', 'font/otf'],
];
const NAME = 'dsh-yeermu-theme';

/*
 * Data for the two tiles beside the dock card. Neither can be read from the page: the renderer
 * has no Node access, so the host samples here and the client only polls two exact routes.
 */
const METRICS_ROUTE = '/yeermu-theme/metrics';
const WEATHER_ROUTE = '/yeermu-theme/weather';
/*
 * Persona: the character card ships as `assets/persona.md` and is contributed to the **system
 * prompt** for every session — any workspace, no file written anywhere.
 *
 * This replaced a workspace-file design that wrote `AGENTS.local.md` next to a guessed workspace
 * root. That guess was wrong on a desktop install: `sandboxPolicy.resolve({})` has no session to
 * ask inside `apply()`, so it fell back to the host process cwd (the profile directory). The card
 * landed in a place no session reads, and the switch looked broken. A prompt contribution has
 * none of those failure modes: it is attached per assembly, so it works in every workspace and a
 * toggle takes effect on the very next message.
 */
const PERSONA_ROUTE = '/yeermu-theme/persona';
/* Opens the card in the OS editor so the owner can edit it without leaving the app. */
const CARD_ROUTE = '/yeermu-theme/open-card';
const PERSONA_SOURCE = path.join(PACKAGE_ROOT, 'assets', 'persona.md');
/* Section name in the system prompt registry; stable, so a reload replaces rather than duplicates. */
const PERSONA_SECTION = 'yeermu:persona';
/* Sit immediately after the deployment persona prefix: this is a persona, not a runtime fact. */
const PERSONA_ORDER_BASE = 'DEPLOYMENT_PERSONA_PREFIX';
/*
 * Where the two switches live. Deliberately outside the package and outside every profile:
 * a marketplace install keeps its files under `node_modules`, where a write is lost on upgrade and
 * a profile directory is not ours to fill. `DSH_HOME` wins when the host sets it.
 *
 * `YEERMU_PERSONA_STATE` is a test seam only: `tools/check_prefs.mjs` points it at a temp file so
 * the enable/disable round trip can run without touching the real setting.
 */
const PERSONA_STATE_FILE =
  process.env.YEERMU_PERSONA_STATE ||
  path.join(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), 'yeermu-theme', 'persona.json');
const PERSONA_STATE_DIR = path.dirname(PERSONA_STATE_FILE);
/*
 * Default look. The shipped value is baked into `client.js` by `.build-yeermu/build.py` from
 * `assets/preset.json`, because a marketplace install is a read-only package: nothing may be read
 * from disk at runtime, and nothing may be written there either. This route is only the author's
 * recorder — it lets the running app rewrite `assets/preset.json` in a development checkout.
 */
const PREF_ROUTE = '/yeermu-theme/preset';
const PREF_FILE = path.join(PACKAGE_ROOT, 'assets', 'preset.json');
const PREF_LIMIT = 64 * 1024;
/*
 * The weather tile's place. The label is set dressing — it never follows the system location or
 * the IP — while the numbers come from one fixed coordinate, so every machine reads the same.
 */
const WEATHER_PLACE = { label: '海特洛', latitude: 34.7466, longitude: 113.6254 };
const WEATHER_TTL = 10 * 60 * 1000;
const SAMPLE_INTERVAL = 5000;
const GPU_INTERVAL = 5000;

/** Nothing is required: `webServer` arrives late through `ctx.inject`, so `apply` stays synchronous. */
export const inject = [];

/**
 * Parse one `Range` header against a known resource size.
 * @param {string | undefined} header raw header value.
 * @param {number} size total bytes.
 * @returns {{start: number, end: number} | null | 'unsatisfiable'} closed interval, full body, or 416.
 */
function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(String(header).trim());
  if (!match) return null;
  const rawStart = match[1] ?? '';
  const rawEnd = match[2] ?? '';
  if (rawStart === '' && rawEnd === '') return null;
  let start;
  let end;
  if (rawStart === '') {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || size <= 0) return 'unsatisfiable';
  if (start > end || start >= size) return 'unsatisfiable';
  return { start, end: Math.min(end, size - 1) };
}

/**
 * Stream the clip, honouring Range and caching validators so the element can seek and loop.
 * @param {import('node:http').IncomingMessage} req request.
 * @param {import('node:http').ServerResponse} res response.
 */
function serveVideo(req, res, file = VIDEO_FILE) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('background.mp4 is missing from the package assets');
    return;
  }
  const size = stat.size;
  const etag = '"' + size.toString(16) + '-' + Math.round(stat.mtimeMs).toString(16) + '"';
  const base = {
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    ETag: etag,
  };

  if (String(req.headers['if-none-match'] ?? '') === etag) {
    res.writeHead(304, base);
    res.end();
    return;
  }

  const range = parseRange(req.headers.range, size);
  if (range === 'unsatisfiable') {
    res.writeHead(416, { ...base, 'Content-Range': 'bytes */' + size });
    res.end();
    return;
  }

  if (range === null) {
    res.writeHead(200, { ...base, 'Content-Length': size });
    if (String(req.method ?? 'GET').toUpperCase() === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
    return;
  }

  res.writeHead(206, {
    ...base,
    'Content-Length': range.end - range.start + 1,
    'Content-Range': 'bytes ' + range.start + '-' + range.end + '/' + size,
  });
  if (String(req.method ?? 'GET').toUpperCase() === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(file, { start: range.start, end: range.end }).pipe(res);
}

/* ------------------------------------------------------------------ *
 * System monitor + weather: the two pieces of data the page cannot read
 * ------------------------------------------------------------------ */

/** One pass over the per-core counters; differencing two calls yields utilisation. */
function cpuTimes() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    const times = cpu.times;
    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  return { idle, total };
}

/** System memory in MiB plus a rounded percentage. */
function memorySnapshot() {
  const total = os.totalmem();
  const used = total - os.freemem();
  return {
    usedMb: Math.round(used / 1048576),
    totalMb: Math.round(total / 1048576),
    percent: total > 0 ? Math.round((used / total) * 100) : null,
  };
}

/** `nvidia-smi --format=csv,noheader,nounits` prints `util, used MiB, total MiB`. */
function parseGpu(output) {
  const line = String(output).split(/\r?\n/u).find((row) => row.trim() !== '');
  if (!line) return null;
  const [usage, used, total] = line.split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(usage)) return null;
  return {
    percent: Math.max(0, Math.min(100, Math.round(usage))),
    usedMb: Number.isFinite(used) ? Math.round(used) : null,
    totalMb: Number.isFinite(total) ? Math.round(total) : null,
  };
}

/**
 * GPU probe. Only NVIDIA exposes utilisation this cheaply; integrated or AMD graphics resolve to
 * `null` and the tile simply shows `--`. The call is short (~40-80ms) but still a subprocess, so
 * the sampler only runs it once every `GPU_INTERVAL` and backs off for a minute after a failure.
 * @returns {Promise<{percent:number,usedMb:number|null,totalMb:number|null}|null>}
 */
function probeGpu() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    let child;
    try {
      child = spawn(
        'nvidia-smi',
        ['--query-gpu=utilization.gpu,memory.used,memory.total', '--format=csv,noheader,nounits'],
        { windowsHide: true, timeout: 2500 },
      );
    } catch {
      finish(null);
      return;
    }
    let output = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', () => finish(null));
    child.on('close', () => finish(parseGpu(output)));
  });
}

/**
 * Background sampler for the monitor tile: CPU needs two readings to become a percentage and GPU
 * needs a subprocess, so both are computed here and the route only serves the latest snapshot.
 */
function createSampler() {
  let previous = cpuTimes();
  let gpu = null;
  let gpuAt = 0;
  let gpuBusy = false;
  let gpuDownAt = 0;
  const snapshot = { at: 0, cpu: null, mem: memorySnapshot(), gpu: null };

  function tick() {
    const current = cpuTimes();
    const idle = current.idle - previous.idle;
    const total = current.total - previous.total;
    previous = current;
    snapshot.cpu = total > 0 ? Math.max(0, Math.min(100, Math.round(100 - (idle / total) * 100))) : null;
    snapshot.mem = memorySnapshot();
    snapshot.at = Date.now();

    if (gpuBusy) return;
    if (Date.now() - gpuAt < GPU_INTERVAL) return;
    if (gpuDownAt !== 0 && Date.now() - gpuDownAt < 60000) return;
    gpuBusy = true;
    probeGpu().then((result) => {
      gpuBusy = false;
      gpuAt = Date.now();
      if (result) {
        gpu = result;
        gpuDownAt = 0;
      } else {
        gpu = null;
        gpuDownAt = Date.now();
      }
      snapshot.gpu = gpu;
    });
  }

  tick();
  const timer = setInterval(tick, SAMPLE_INTERVAL);
  timer.unref?.();

  return {
    read() {
      return snapshot;
    },
    dispose() {
      clearInterval(timer);
    },
  };
}

/** Cache shared by the weather route: last good reading, its age and the last failure. */
const weatherState = { at: 0, data: null, error: null, pending: null };

/** One forecast pull, cached for `WEATHER_TTL`; failures keep the previous reading. */
function refreshWeather() {
  if (weatherState.pending) return weatherState.pending;
  weatherState.pending = (async () => {
    try {
      const query = new URLSearchParams({
        latitude: String(WEATHER_PLACE.latitude),
        longitude: String(WEATHER_PLACE.longitude),
        current: 'temperature_2m,weather_code,relative_humidity_2m',
        daily: 'temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '1',
      });
      const response = await fetch('https://api.open-meteo.com/v1/forecast?' + query.toString(), {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const json = await response.json();
      const current = json?.current ?? {};
      const daily = json?.daily ?? {};
      const temperature = Number(current.temperature_2m);
      if (!Number.isFinite(temperature)) throw new Error('no temperature in payload');
      const humidity = Number(current.relative_humidity_2m);
      const high = Number(daily.temperature_2m_max?.[0]);
      const low = Number(daily.temperature_2m_min?.[0]);
      weatherState.data = {
        city: WEATHER_PLACE.label,
        temperature: Math.round(temperature),
        code: Number(current.weather_code) || 0,
        humidity: Number.isFinite(humidity) ? Math.round(humidity) : null,
        high: Number.isFinite(high) ? Math.round(high) : null,
        low: Number.isFinite(low) ? Math.round(low) : null,
      };
      weatherState.at = Date.now();
      weatherState.error = null;
    } catch (error) {
      weatherState.error = String((error && error.message) || error);
    } finally {
      weatherState.pending = null;
    }
  })();
  return weatherState.pending;
}

/* ------------------------------------------------------------------ *
 * Persona: the 曳尔沐 character card, materialised as workspace instructions
 * ------------------------------------------------------------------ */

/**
 * The card itself, shipped with the package. Missing file simply means "no card".
 *
 * Cached by mtime: the text is read on every prompt assembly, and a 44 KB file should not be
 * re-read for each model step. Editing the card in place is still picked up without a restart.
 */
let cardCache = { mtime: -1, text: '' };
function personaCard() {
  try {
    const mtime = fs.statSync(PERSONA_SOURCE).mtimeMs;
    if (cardCache.mtime !== mtime) {
      cardCache = { mtime, text: fs.readFileSync(PERSONA_SOURCE, 'utf8').trim() };
    }
    return cardCache.text;
  } catch {
    return '';
  }
}

/**
 * Render the prompt text. `workRoleplay` decides whether the persona may colour tool/code output
 * as well, or only the prose aimed at the user.
 * @param {boolean} workRoleplay allow the in-character voice during task work.
 * @returns {string} markdown body, or '' when the card is missing.
 */
function personaBody(workRoleplay) {
  const card = personaCard();
  if (card === '') return '';
  const boundary = [
    '## 输出边界',
    '',
    '- **任务优先是硬约束**：一旦进入正经任务（改代码、排查问题、查资料、执行命令、写文档、做决定），立刻收住闲谈与玩梗，全程正常工作。角色语气只允许留在面向用户的短句里，不许岔开话题、不许展开闲聊、不许用梗替代结论。任务结束、回到放松对话时再放开。',
    ...(workRoleplay
      ? [
          '- 全程使用曳尔沐的口吻，包括工作过程中的说明、进度汇报和总结。',
          '- 但代码、命令、diff、文件内容、日志、提交信息本身必须是准确、可执行的原样内容，语气不允许渗进这些载体。',
        ]
      : [
          '- 只有面向用户的自然语言（解释、建议、总结、闲聊）使用曳尔沐的语气。',
          '- 代码、命令、工具输出、文件内容、日志、提交信息一律保持专业、中立、简洁：不用语气词、波浪号或角色口吻。',
        ]),
    '- 准确性、完整性和安全性永远优先于风格；角色扮演不得影响技术判断。',
  ];
  return ['# 角色扮演：曳尔沐（Elyms）', '', card, '', ...boundary, ''].join('\n');
}

/**
 * Hand the card to the desktop's text editor. The path is fixed (never user input), so this is
 * just a convenience: Notepad on Windows, `open` on macOS, `xdg-open` elsewhere.
 * @returns {boolean} whether a process could be started.
 */
function openInEditor(target) {
  try {
    if (process.platform === 'win32') {
      spawn('notepad.exe', [target], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [target], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [target], { detached: true, stdio: 'ignore' }).unref();
    }
    return true;
  } catch {
    return false;
  }
}

/** Read the two stored switches. A missing or corrupt file means "off", never a throw. */
function personaRead() {
  try {
    const data = JSON.parse(fs.readFileSync(PERSONA_STATE_FILE, 'utf8'));
    return { enabled: data.enabled === true, workRoleplay: data.workRoleplay === true };
  } catch {
    return { enabled: false, workRoleplay: false };
  }
}

/**
 * Persist the two switches. Called from the 316651 shortcut and from Settings; a write failure is
 * reported to that caller as a 500 rather than swallowed, because the switch would otherwise lie.
 */
function personaWrite(enabled, workRoleplay) {
  fs.mkdirSync(PERSONA_STATE_DIR, { recursive: true });
  fs.writeFileSync(PERSONA_STATE_FILE, JSON.stringify({ enabled, workRoleplay }, null, 2) + '\n', 'utf8');
}

/** Current state, as reported to the client and to `check_prefs.mjs`. */
function personaState() {
  const state = personaRead();
  return {
    enabled: state.enabled,
    workRoleplay: state.workRoleplay,
    mode: 'systemPrompt',
    path: PERSONA_STATE_FILE,
    card: PERSONA_SOURCE,
    exists: fs.existsSync(PERSONA_STATE_FILE),
  };
}

/** The system-prompt text for this moment: '' while the switch is off, so the section drops out. */
function personaPrompt() {
  const state = personaRead();
  if (!state.enabled) return '';
  return personaBody(state.workRoleplay);
}

/**
 * One-shot probe with the same code paths the routes use. Exported so a plain
 * `node -e "import('.../index.js').then(m => m.sampleSystem())"` can verify the host half
 * without restarting DSH.
 */
export { personaBody, personaPrompt, personaState };

/* ------------------------------------------------------------------ *
 * Preset: `assets/preset.json`, the author's look, baked in at build time
 * ------------------------------------------------------------------ */

/**
 * The preset source on disk, or a reason why it is not readable. A corrupt file reports
 * `ok: false` instead of throwing, so the settings page can say so and still offer to overwrite it.
 * @returns {{ok: boolean, path: string, exists: boolean, data?: object|null, error?: string}}
 */
function prefsState() {
  if (!fs.existsSync(PREF_FILE)) return { ok: true, path: PREF_FILE, exists: false, data: null };
  try {
    const data = JSON.parse(fs.readFileSync(PREF_FILE, 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, path: PREF_FILE, exists: true, error: 'preset.json 不是 JSON 对象' };
    }
    return { ok: true, path: PREF_FILE, exists: true, data };
  } catch (error) {
    return { ok: false, path: PREF_FILE, exists: true, error: String(error && error.message ? error.message : error) };
  }
}

/**
 * Write the file as plain UTF-8 with no BOM — the same rule as every other file this package
 * generates (a BOM would break the client's `JSON.parse`).
 * @param {object} data payload from the client.
 */
function writePrefs(data) {
  fs.writeFileSync(PREF_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export { prefsState };

export async function sampleSystem() {
  const first = cpuTimes();
  await new Promise((resolve) => {
    setTimeout(resolve, 600);
  });
  const second = cpuTimes();
  const total = second.total - first.total;
  const idle = second.idle - first.idle;
  const gpu = await probeGpu();
  return {
    cpu: total > 0 ? Math.max(0, Math.min(100, Math.round(100 - (idle / total) * 100))) : null,
    mem: memorySnapshot(),
    gpu,
    weather: await (async () => {
      await refreshWeather();
      return weatherState.data ?? { error: weatherState.error };
    })(),
  };
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx plugin context.
 */
export function apply(ctx) {
  /*
   * Persona: contribute the card as a system-prompt section. `text` is a function, so it is read
   * at every assembly — flipping the switch changes the next message, with no restart and no file
   * in any workspace. `interpolate: false` keeps the card's prose literal (no `{{variable}}` pass).
   */
  ctx.inject(['systemPrompt'], (scope) => {
    try {
      const prompt = scope.systemPrompt;
      if (!prompt || typeof prompt.section !== 'function') return;
      const base = typeof prompt.getSectionOrder === 'function' ? prompt.getSectionOrder(PERSONA_ORDER_BASE) : NaN;
      prompt.section({
        name: PERSONA_SECTION,
        order: Number.isFinite(base) ? base + 1 : 0,
        interpolate: false,
        text: () => personaPrompt(),
      });
    } catch (error) {
      try {
        ctx.logger?.warn?.(`[${NAME}] persona section failed: ${String(error)}`);
      } catch {
        /* ignore */
      }
    }
  });
  /*
   * No `webserver/index-inject` contribution here on purpose.
   *
   * This bundle used to push a style row and a script row at host startup. The desktop shell runs
   * those rows through one shared interpreter, and a thrown row can abort the rows queued behind
   * it — which would silently take out another plugin's injected widget (the whale balance widget
   * is mounted the same way). Since the backdrop is mounted from the Client half now, those rows
   * were dead weight with a blast radius.
   */

  /* The backdrop route is optional infrastructure: wait for it instead of blocking apply. */
  ctx.inject(['webServer'], (child) => {
    child.effect(() => {
      /** One route per scene, so the client only has to swap the <video> source. */
      const sceneDisposers = SCENES.map(([route, file]) =>
        child.webServer.register({
          kind: 'exact',
          path: route,
          handler: (req, res) => {
            try {
              serveVideo(req, res, file);
            } catch (error) {
              try {
                ctx.logger?.warn?.(`[${NAME}] video route failed: ${String(error)}`);
              } catch {
                /* ignore */
              }
              if (!res.headersSent) res.writeHead(500);
              res.end();
            }
          },
        }),
      );
      const disposeFont = child.webServer.register({
        kind: 'exact',
        path: FONT_ROUTE,
        handler: (req, res) => {
          const found = FONT_CANDIDATES.map(([name, type]) => {
            const file = path.join(PACKAGE_ROOT, 'assets', name);
            return fs.existsSync(file) ? { file, type } : null;
          }).find(Boolean);
          if (!found) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('no pixel font in assets/');
            return;
          }
          try {
            const data = fs.readFileSync(found.file);
            res.writeHead(200, {
              'Content-Type': found.type,
              'Content-Length': data.length,
              'Cache-Control': 'public, max-age=86400',
            });
            res.end(data);
          } catch {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('pixel font unreadable');
          }
        },
      });
      /*
       * System monitor: the sampler owns the timer, so it starts with the effect and stops with
       * it. The route itself is dumb — it serialises the newest snapshot.
       */
      const sampler = createSampler();
      const disposeMetrics = child.webServer.register({
        kind: 'exact',
        path: METRICS_ROUTE,
        handler: (req, res) => {
          const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
          try {
            const body = JSON.stringify(sampler.read());
            res.writeHead(200, headers);
            res.end(body);
          } catch (error) {
            res.writeHead(500, headers);
            res.end(JSON.stringify({ error: String(error) }));
          }
        },
      });
      /*
       * Weather: serve the cache, refresh in the background once it is stale. The very first call
       * waits for one pull so the tile never starts out empty.
       */
      const disposeWeather = child.webServer.register({
        kind: 'exact',
        path: WEATHER_ROUTE,
        handler: async (req, res) => {
          const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
          try {
            if (!weatherState.data) await refreshWeather();
            const stale = !weatherState.at || Date.now() - weatherState.at > WEATHER_TTL;
            const data = weatherState.data;
            const body = data
              ? { ok: true, ...data, updatedAt: weatherState.at }
              : { ok: false, error: weatherState.error || 'unavailable' };
            res.writeHead(200, headers);
            res.end(JSON.stringify(body));
            if (stale) refreshWeather();
          } catch (error) {
            if (!res.headersSent) res.writeHead(500, headers);
            res.end(JSON.stringify({ ok: false, error: String(error) }));
          }
        },
      });
      /*
       * Persona switch. GET reports the stored state; POST stores it. Nothing is written into any
       * workspace: the card reaches the model as a system-prompt section, so the switch applies to
       * every session and cannot collide with a user-written `AGENTS.local.md`.
       */
      const disposePersona = child.webServer.register({
        kind: 'exact',
        path: PERSONA_ROUTE,
        handler: (req, res) => {
          const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
          const method = String(req.method ?? 'GET').toUpperCase();
          if (method === 'GET') {
            res.writeHead(200, headers);
            res.end(JSON.stringify(personaState()));
            return;
          }
          if (method !== 'POST') {
            res.writeHead(405, headers);
            res.end('{}');
            return;
          }
          let body = '';
          req.setEncoding('utf8');
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 20000) req.destroy();
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              personaWrite(payload.enabled === true, payload.workRoleplay === true);
              res.writeHead(200, headers);
              res.end(JSON.stringify({ ok: true, ...personaState() }));
            } catch (error) {
              res.writeHead(500, headers);
              res.end(JSON.stringify({ ok: false, error: String(error) }));
            }
          });
        },
      });
      /* Open the editable card (and stop) — a second route keeps the persona sync path pure. */
      const disposeOpenCard = child.webServer.register({
        kind: 'exact',
        path: CARD_ROUTE,
        handler: (req, res) => {
          const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
          if (String(req.method ?? 'GET').toUpperCase() !== 'POST') {
            res.writeHead(405, headers);
            res.end('{}');
            return;
          }
          const opened = openInEditor(PERSONA_SOURCE);
          res.writeHead(opened ? 200 : 500, headers);
          res.end(JSON.stringify({ ok: opened, path: PERSONA_SOURCE }));
        },
      });
      /*
       * Preset recorder (author tool). GET reports the source file; POST rewrites it from the
       * client's current look; DELETE removes it. The client never reads this route at boot — the
       * shipped preset is compiled into `client.js`. On a published install the package directory
       * is read-only, so a POST here fails with 500 by design.
       */
      const disposePrefs = child.webServer.register({
        kind: 'exact',
        path: PREF_ROUTE,
        handler: (req, res) => {
          const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
          const method = String(req.method ?? 'GET').toUpperCase();
          if (method === 'GET') {
            res.writeHead(200, headers);
            res.end(JSON.stringify(prefsState()));
            return;
          }
          if (method === 'DELETE') {
            try {
              if (fs.existsSync(PREF_FILE)) fs.unlinkSync(PREF_FILE);
              res.writeHead(200, headers);
              res.end(JSON.stringify({ ok: true, removed: true, path: PREF_FILE }));
            } catch (error) {
              res.writeHead(500, headers);
              res.end(JSON.stringify({ ok: false, error: String(error) }));
            }
            return;
          }
          if (method !== 'POST') {
            res.writeHead(405, headers);
            res.end('{}');
            return;
          }
          let body = '';
          req.setEncoding('utf8');
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > PREF_LIMIT) req.destroy();
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                res.writeHead(400, headers);
                res.end(JSON.stringify({ ok: false, error: '需要 JSON 对象' }));
                return;
              }
              writePrefs(payload);
              res.writeHead(200, headers);
              res.end(JSON.stringify({ ok: true, path: PREF_FILE, exists: true }));
            } catch (error) {
              res.writeHead(500, headers);
              res.end(JSON.stringify({ ok: false, error: String(error) }));
            }
          });
        },
      });
      return () => {
        for (const disposeScene of sceneDisposers) disposeScene();
        disposeFont();
        disposeMetrics();
        disposeWeather();
        disposePersona();
        disposeOpenCard();
        disposePrefs();
        sampler.dispose();
      };
    });
  });
}

