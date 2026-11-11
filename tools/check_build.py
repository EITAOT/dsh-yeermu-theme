# Confirm the generated bundle carries the baked preset, the shipped UI rules and no
# unreplaced placeholders. Run from anywhere: paths are relative to this file.
import io
import json
import os

TOOLS = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(TOOLS)
GEN = os.path.join(PKG, "client.js")
TPL = os.path.join(TOOLS, "client.template.js")
PRESET = os.path.join(PKG, "assets", "preset.json")

text = io.open(GEN, encoding="utf-8").read()
preset = json.loads(io.open(PRESET, encoding="utf-8").read())

checks = [
    ("no unreplaced __PRESET__", "__PRESET__" not in text),
    ("baked preset literal", "const PRESET = " in text),
    ("preset scene baked", '"scene": %d' % preset["look"]["scene"] in text),
    ("preset surface baked", '"surface": %d' % preset["look"]["surface"] in text),
    ("presetLook does not force persona off", "base.persona = false;" not in text),
    ("loadLook falls back to preset", "if (!raw) return presetLook();" in text),
    ("restore-defaults uses preset", "commit(Object.assign({}, presetLook()));" in text),
    ("no localStorage adoption of a file", "adoptPrefsOnFirstRun" not in text),
    ("preset route", "/yeermu-theme/preset" in text),
    ("retired: export button", "\u5bfc\u51fa\u914d\u7f6e\u5230\u6587\u4ef6" not in text),
    ("retired: import button", "\u4ece\u6587\u4ef6\u5bfc\u5165\u914d\u7f6e" not in text),
    ("retired: prefs.json path", "prefs.json" not in text),
    ("collapse rules still present", "yrm-frame-avatar{display:none}" in text),
    ("face follows preset", "presetFace()" in text),
    # Status plate: toned segments (an intruder's lines glow).
    ("tone constants", "const TONE_ALIEN = 'alien';" in text and "const TONE_GHOST = 'ghost';" in text),
    ("segment normaliser", "function lineSegments(entry)" in text),
    ("segment painter", "function paintSegments(plate, segments, limit)" in text),
    ("red glow rule", "span.yrm-tone-alien" in text),
    ("green glow rule", "span.yrm-tone-ghost" in text),
    ("markup-safe painting", "document.createTextNode(visible)" in text),
    ("new idle line: API", "\u9274\u5b9a\u5e08\uff0c\u4f60\u89c9\u5f97API" in text),
    ("new idle line: \u3010\u903b\u8f91\u3011 tone", "['\u3010\u903b\u8f91\u3011', TONE_ALIEN]" in text),
    ("new idle line: green intuder", "TONE_GHOST]]" in text),
    # Reasoning-effort picker → segmented slider.
    ("effort menu class pinned", "EFFORT_MENU_CLASS = '_9r0rkG_menu'" in text),
    ("effort recogniser", "function isEffortMenu(menu)" in text),
    ("effort watcher", "function startEffortSlider()" in text),
    ("effort watcher registered", "return startEffortSlider();" in text),
    ("slider row layout", ".yrm-effort-slider, .yrm-effort-slider > ._9r0rkG_groups{flex-direction:row !important;" in text),
    ("slider hides tick", ".yrm-effort-slider ._9r0rkG_check{display:none}" in text),
    ("slider thumb (class)", "._9r0rkG_option._9r0rkG_selected{background:var(--dsw-alias-bg-layer-1);" in text),
    ("slider thumb (aria)", '[aria-checked="true"]{background:var(--dsw-alias-bg-layer-1);' in text),
    # Drag behaviour (方案 B).
    ("drag handler", "function attachEffortDrag(menu)" in text),
    ("drag commit on release", "target.click();" in text),
    ("drag skips same-segment commit", "if (!target || target === origin) return;" in text),
    ("drag avoids pointer capture", ".setPointerCapture(" not in text),
    ("drag window listeners", "window.addEventListener('pointermove', onPointerMove, true);" in text),
    ("drag listeners torn down", "function reset() {" in text),
    ("drag highlight class", "yrm-drag-target" in text),
    ("drag muted committed thumb", ".yrm-effort-slider.is-dragging ._9r0rkG_option._9r0rkG_selected" in text),
    ("drag attached from tagger", "attachEffortDrag(menu);" in text),
    # Pixel user bubbles.
    ("bubble hook is the attribute", "[data-message-bubble]{position:relative;isolation:isolate;" in text),
    ("bubble two layers", "[data-message-bubble]::before,[data-message-bubble]::after{content:\"\";position:absolute;" in text),
    ("bubble ink layer", "z-index:-2;background:#14141a;" in text),
    ("bubble fill layer", "z-index:-1;background:var(--dsw-specific-bubble);" in text),
    ("bubble right-side inset", "top:-3px;left:-3px;right:-23px;bottom:-3px" in text),
    ("bubble stepped corners", "clip-path:polygon(0px 8px, 4px 8px, 4px 4px, 8px 4px, 8px 0px" in text),
    ("bubble tail on the right", "calc(100% - 4px) calc(100% - 49px), calc(100% - 4px) calc(100% - 27px)" in text),
    ("bubble dark outline flips", 'body[data-ds-dark-theme] [data-message-bubble]::before{background:#f2f2f6}' in text),
    ("bubble keeps host fill", "--dsw-specific-bubble" in text),
    # Right-sidebar tool cards become opaque.
    ("tool card hook", "[data-sidebar-right-guide-entry]{background:#ffffff !important}" in text),
    ("tool card hover", '[data-sidebar-right-guide-entry][aria-expanded="true"]{background:#f1eefb !important}' in text),
    ("tool card dark", "body[data-ds-dark-theme] [data-sidebar-right-guide-entry]{background:#15223a !important}" in text),
    ("tool card dark hover intact", "body[data-ds-dark-theme] [data-sidebar-right-guide-entry]:hover," in text),
    # New-conversation hero: her face + own headline.
    ("hero face injected", "__HERO_FACE__" not in text and "hero-face" not in text),
    ("hero hitbox sized", ".WOwLGG_fishHitbox{width:52px;height:52px;" in text),
    ("hero fish hidden", ".WOwLGG_fish{display:none !important}" in text),
    ("hero headline replaced", 'content:"\u53cb\u8c0a\u5730\u4e45\u5929\u957f";' in text),
    ("hero headline sized", "font-size:36px;font-weight:400;line-height:44px;letter-spacing:.02em;color:#ffffff;" in text),
    ("hero headline outline", "text-shadow:3px 0 0 #14141a,-3px 0 0 #14141a,0 3px 0 #14141a,0 -3px 0 #14141a," in text),
    ("hero headline pixel face", 'font-family:"YermuPixel","Zpix","Fusion Pixel 12px Monospaced","Fusion Pixel",SimSun,monospace;' in text),
    ("hero swim keyframes", "@keyframes yrm-hero-swim{0%,to{transform:none}" in text),
    ("hero swim on hover", ".WOwLGG_fishHitbox:hover{animation:1.6s ease-in-out infinite yrm-hero-swim}}" in text),
    ("hero hitbox origin", "transform-origin:50% 60%;" in text),
    # Settings dialog → Windows XP skin.
    ("xp panel grey", ".yrm-panel-skin{background:#ece9d8 !important;border-radius:0 !important;" in text),
    ("xp frame hidden", "html:has(.yrm-panel-skin) #yrm-frame{display:none !important}" in text),
    ("xp title bar", ".AnXs9G_navTitle{background:linear-gradient(180deg,#0a63d8 0%,#0a52c8 45%,#083fb0 100%) !important;" in text),
    ("xp nav list box", ".AnXs9G_navList{background:#fff !important;border:1px solid #7f9db9 !important;" in text),
    ("xp nav selection", ".AnXs9G_navCell.AnXs9G_active{background:#316ac5 !important;color:#fff !important}" in text),
    ("xp buttons", "background:linear-gradient(180deg,#fdfdfd 0%,#f2f1ec 45%,#eae9e3 46%,#deddd7 100%) !important;" in text),
    ("xp text tokens pinned", "--dsw-alias-label-primary:#1a1a1a;" in text),
    ("xp label tokens pinned", "--dsw-alias-label-secondary:#3a3a3a;--dsw-alias-label-tertiary:#555;" in text),
    ("xp input surfaces light", "--dsw-specific-input-major:#fff;" in text),
    ("xp input layer pinned", "--dsw-alias-bg-layer-3:#fff;--dsw-alias-bg-layer-4:#ece9d8;" in text),
    ("xp input border pinned", "--dsw-alias-border-l4:#7f9db9;" in text),
    ("xp module surface pinned", "--dsw-alias-bg-module-platform:#fff;" in text),
    ("xp card + pressed surfaces pinned", "--dsw-alias-settings-card-fill:#fff;--dsw-alias-interactive-bg-active:#cfe0f7;" in text),
    ("xp stepper fallback", '.AnXs9G_options [class*="_stepper"],.AnXs9G_options [class*="_selector"]{' in text),
    ("xp switch knob green", '.AnXs9G_options [class*="_switch_"] [class*="_thumb_"],' in text),
    ("xp switch knob colour", "background:#3f9c35 !important;" in text),
    ("xp field fallback", '.AnXs9G_panel textarea,.yrm-panel-skin input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),' in text),
    ("xp button pressed", ".AnXs9G_options button:active,.AnXs9G_header button:not(.AnXs9G_close):active{" in text),
    ("xp nav pressed", ".AnXs9G_navCell:active{background:#b3cdf2 !important}" in text),
    ("old white panel gone", ".yrm-panel-skin{background:#ffffff" not in text),
    ("panel ring replaced", "box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 0 1px #0054e3 !important}" in text),
]
failed = 0
for name, ok in checks:
    print(("PASS  " if ok else "FAIL  ") + name)
    failed += 0 if ok else 1

# The plate is `min(62%, 980px)` wide with `nowrap` + ellipsis, which fits roughly 60 CJK glyphs at
# 15px. Flag any single literal in the line tables that would be truncated on a typical window.
import re  # noqa: E402

block = text[text.index("const IDLE_LINES = ["):text.index("const WORK_LINES")]
longest = sorted(((len(m), m) for m in re.findall(r"'([^']*)'", block)), reverse=True)[:3]
for length, sample in longest:
    print("%-6s %3d chars  %s" % ("LONG" if length > 58 else "ok  ", length, sample[:40]))
if longest and longest[0][0] > 58:
    print("FAIL  a status line exceeds the ~60 glyph plate budget")
    failed += 1

for path in (TPL, GEN, PRESET):
    print("%-22s %8d bytes" % (os.path.basename(path), os.path.getsize(path)))

raise SystemExit(1 if failed else 0)
