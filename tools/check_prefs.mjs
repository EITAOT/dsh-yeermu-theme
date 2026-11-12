// Offline self-check for the shipped preset (`assets/preset.json`).
// Read-only: the preset is a build input, so this script never writes or deletes it.
// Usage: node check_prefs.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PKG = path.resolve(import.meta.dirname, '..');
const PRESET = path.join(PKG, 'assets', 'preset.json');
const ALLOWED = ['surface', 'video', 'veil', 'status', 'frame', 'scene', 'splash', 'splashSound', 'persona', 'personaWork'];
// Keep the persona round trip away from the real setting: point the state file at a temp path
// before the host half is imported (it reads the seam at module load).
const STATE = path.join(os.tmpdir(), 'yeermu-check-' + process.pid + '.json');
process.env.YEERMU_PERSONA_STATE = STATE;
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

// ---- persona: a system-prompt section, not a workspace file ----
const persona = mod.personaState();
check('persona state reports the systemPrompt mode', persona.mode === 'systemPrompt', persona.mode);
// The default is ~/.dsh/yeermu-theme/persona.json; this run overrides it with a temp file, so the
// invariant worth asserting is the one that matters: switch state never lands inside the package.
check(
  'persona state is never written inside the package',
  !persona.path.startsWith(PKG) && !/node_modules/.test(persona.path),
  persona.path,
);
check('persona prompt is empty while the switch is off', mod.personaPrompt() === '', String(mod.personaPrompt().length));

const body = mod.personaBody(false);
check('persona body carries the card', body.includes('角色扮演') && body.length > 1000, body.length + ' chars');
const workBody = mod.personaBody(true);
check('work roleplay switches the task-voice rule', workBody.includes('全程使用曳尔沐的口吻'));

// Stand-in for the host context: only the systemPrompt injection matters here.
let captured = null;
const fakeCtx = {
  inject: (deps, callback) => {
    if (deps.includes('systemPrompt')) {
      callback({
        systemPrompt: {
          getSectionOrder: () => 100,
          section: (section) => {
            captured = section;
          },
        },
      });
    }
  },
  logger: { warn: () => {} },
};
mod.apply(fakeCtx);
check('apply registers a systemPrompt section', captured !== null && typeof captured === 'object');
if (captured) {
  check('section name is stable', captured.name === 'yeermu:persona', String(captured.name));
  check('section sits right after the persona prefix', captured.order === 101, String(captured.order));
  check('section keeps the prose literal', captured.interpolate === false);
  check('section text is re-read per assembly', typeof captured.text === 'function');
  check('section text is empty while the switch is off', captured.text() === '');
}

// ---- round trip: switching on really puts the card into the prompt ----
fs.writeFileSync(STATE, JSON.stringify({ enabled: true, workRoleplay: false }, null, 2));
const enabledState = mod.personaState();
check('state file is read back', enabledState.enabled === true && enabledState.exists === true, enabledState.path);
const enabledText = mod.personaPrompt();
check('enabled prompt carries the card', enabledText.length > 1000 && enabledText.includes('角色扮演'), enabledText.length + ' chars');
check('registered section now renders the card', captured && captured.text().length === enabledText.length);

fs.writeFileSync(STATE, JSON.stringify({ enabled: true, workRoleplay: true }, null, 2));
check('work roleplay reaches the prompt', mod.personaPrompt().includes('全程使用曳尔沐的口吻'));

fs.writeFileSync(STATE, '{ not json');
check('a corrupt state file means off', mod.personaPrompt() === '' && mod.personaState().enabled === false);

fs.rmSync(STATE, { force: true });
check('a missing state file means off', mod.personaPrompt() === '' && mod.personaState().exists === false);

process.exit(failed === 0 ? 0 : 1);
