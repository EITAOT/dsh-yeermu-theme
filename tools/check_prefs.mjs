// Offline self-check for the shipped preset (`assets/preset.json`).
// Read-only: the preset is a build input, so this script never writes or deletes it.
// Usage: node check_prefs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PKG = path.resolve(import.meta.dirname, '..');
const PRESET = path.join(PKG, 'assets', 'preset.json');
const ALLOWED = ['surface', 'video', 'veil', 'status', 'frame', 'scene', 'splash', 'splashSound', 'persona', 'personaWork'];
const mod = await import(pathToFileURL(path.join(PKG, 'index.js')).href);

let failed = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (detail === undefined ? '' : '  ' + detail));
  if (!ok) failed += 1;
};

check('exports include prefsState', typeof mod.prefsState === 'function', Object.keys(mod).sort().join(', '));
check('preset file exists', fs.existsSync(PRESET), PRESET);

const raw = fs.readFileSync(PRESET);
check('preset has no BOM', !raw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), raw.length + ' bytes');

const state = mod.prefsState();
check('prefsState parses it', state.ok === true && !!state.data, state.error || '');
const look = state.data && state.data.look;
check('preset has a look object', !!look);
if (look) {
  const unknown = Object.keys(look).filter((key) => !ALLOWED.includes(key));
  check('no unknown look keys', unknown.length === 0, unknown.join(', ') || 'ok');
  check('surface in 0..100', Number.isInteger(look.surface) && look.surface >= 0 && look.surface <= 100, String(look.surface));
  check('video in 0..100', Number.isInteger(look.video) && look.video >= 0 && look.video <= 100, String(look.video));
  check('scene in 1..4', Number.isInteger(look.scene) && look.scene >= 1 && look.scene <= 4, String(look.scene));
  // The persona switches are ordinary preset fields (the card ships with the plugin), so only the
  // type is asserted: they must be real booleans, not truthy strings.
  check('persona is a boolean', typeof look.persona === 'boolean', String(look.persona));
  check('personaWork is a boolean', typeof look.personaWork === 'boolean', String(look.personaWork));
}
const face = Number(state.data && state.data.face);
check('face in 0..3', Number.isInteger(face) && face >= 0 && face <= 3, String(face));

// ---- persona target: must follow the session workspace, never the plugin's own directory ----
const fakeCtx = (root) => ({
  get: (name) => (name === 'sandboxPolicy' ? { resolve: () => ({ workspaceRoot: root }) } : undefined),
});

const dev = mod.personaState().path;
check('dev fallback is the plugin parent', dev.endsWith('default-workspace\\AGENTS.local.md'), dev);

mod.resolvePersonaTarget(fakeCtx('C:\\fake\\workspace'));
const resolved = mod.personaState().path;
check('follows sandboxPolicy.workspaceRoot', resolved === 'C:\\fake\\workspace\\AGENTS.local.md', resolved);

mod.resolvePersonaTarget(fakeCtx('C:\\app\\resources\\node_modules\\@local\\yeermu-theme'));
const refused = mod.personaState().path;
check('refuses a node_modules target', refused === resolved, refused);

mod.resolvePersonaTarget({});
check('no service keeps the last good path', mod.personaState().path === resolved);

mod.resolvePersonaTarget(fakeCtx(''));
check('empty root is ignored', mod.personaState().path === resolved);

process.exit(failed === 0 ? 0 : 1);
