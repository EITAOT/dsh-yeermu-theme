window.__ModuleLoader__.load({
  id: 'dsh-yeermu-theme',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /*
     * Inline artwork: the Client module has no asset loader, so the crops travel as data URIs.
     * `FACES` is the dock card's clickable portrait: one image per click, index remembered per
     * origin under `FACE_KEY` so the chosen face survives a restart.
     */
    const FACES = ['__FACE1__', '__FACE2__', '__FACE3__', '__FACE4__'];
    const FACE_KEY = 'yeermu-theme.face.v1';
    function loadFaceIndex() {
      try {
        const index = Number(window.localStorage.getItem(FACE_KEY));
        return Number.isInteger(index) && index >= 0 && index < FACES.length ? index : presetFace();
      } catch (error) {
        return presetFace();
      }
    }
    const HEAD = '__HEAD__';
    /* The sidebar wordmark that replaces the shipped "deepseek HARNESS" text. */
    const WORDMARK = '__WORDMARK__';
    /* Pixel floppy disc that stands in for the "new session" plus icon. */
    const FLOPPY = '__FLOPPY__';
    const SOURCE = 'dsh-yeermu-theme';

    /* Backdrop: served by this package's Host half, mounted here so no boot-time injection is needed. */
    const BACKDROP_SRC = '/yeermu-theme/background.mp4';
    /* Scene index → clip. Index 1 reuses the original route so old links keep working. */
    const SCENE_SRC = [
      BACKDROP_SRC,
      BACKDROP_SRC,
      '/yeermu-theme/background-2.mp4',
      '/yeermu-theme/background-3.mp4',
      '/yeermu-theme/background-4.mp4',
    ];
    const SCENE_COUNT = 4;
    const SCENE_LABELS = ['背景 1', '背景 2', '背景 3', '背景 4'];
    /*
     * Per-clip framing. `object-position` Y picks which vertical slice of the clip fills the window:
     * 0% = the clip's top, 100% = its bottom. Raising it shows a lower slice, which moves a subject
     * that sits low in the frame up on screen.
     */
    const SCENE_POSITION = ['50% 50%', '50% 50%', '50% 50%', '50% 10%', '50% 50%'];
    function sceneSrc(index) {
      const clamped = Math.max(1, Math.min(SCENE_COUNT, Number(index) || 1));
      return SCENE_SRC[clamped];
    }

    /* Boot animation: one full-screen clip per page load, skippable by a click or key press. */
    const BOOT_SRC = '/yeermu-theme/boot.mp4';
    const SPLASH_CSS = [
      '#yrm-splash{position:fixed;inset:0;z-index:2147483600;background:#05070f;cursor:pointer;',
      '  display:flex;align-items:center;justify-content:center;opacity:1;',
      '  transition:opacity .32s ease-out}',
      '#yrm-splash.is-done{opacity:0;pointer-events:none}',
      '#yrm-splash video{width:100%;height:100%;object-fit:contain;display:block;background:#05070f}',
      '#yrm-splash .yrm-splash-hint{position:absolute;right:18px;bottom:16px;',
      '  font:12px/1 "YermuPixel","SimSun",sans-serif;color:#cfc7ef;opacity:.72;',
      '  text-shadow:0 1px 2px rgba(0,0,0,.7)}',
      '#yrm-splash .yrm-splash-fade{position:absolute;inset:0;width:100%;height:100%;',
      '  display:block;pointer-events:none;image-rendering:pixelated}',
    ].join('\n');
    let splashShown = false;
    const BACKDROP_CSS = [
      '#yrm-backdrop{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;',
      '  background:radial-gradient(120% 100% at 50% 10%,#101a2c,#05080f 72%)}',
      '#yrm-backdrop video{width:100%;height:100%;object-fit:cover;display:block;',
      '  filter:saturate(1.04) contrast(1.02);transition:opacity .18s linear}',
      '#yrm-backdrop .yrm-veil{position:absolute;inset:0;pointer-events:none;',
      '  background:rgba(4,7,13,0);transition:background .18s linear}',
      '@media (prefers-reduced-motion:reduce){#yrm-backdrop video{visibility:hidden}}',
    ].join('');

    /*
     * One window frame around the whole application viewport.
     *
     * `#yrm-frame` is our own fixed overlay, so it needs no host selectors and cannot be clipped
     * by any app container: the band is painted with inset rings inside that overlay, and
     * `pointer-events:none` keeps every control underneath clickable.
     *
     * Ring order is outer→inner: navy hairline, white highlight, lavender band, white inner line,
     * deep rim — the same stacking the reference window uses.
     */
    const FRAME_CSS = [
      '#yrm-frame{position:fixed;inset:0;z-index:2147483000;pointer-events:none;',
      '  box-shadow:',
      /* outer contour, then a light-from-above-left bevel, then the lavender band and its inner rim */
      '    inset 0 0 0 1px #241d47,',
      '    inset 3px 0 0 rgba(255,255,255,.95),',
      '    inset 0 3px 0 rgba(255,255,255,.95),',
      '    inset -3px 0 0 rgba(18,10,48,.88),',
      '    inset 0 -3px 0 rgba(18,10,48,.88),',
      '    inset 0 0 0 4px rgba(255,255,255,.45),',
      '    inset 0 0 0 9px #b3a5e0,',
      '    inset 0 0 0 10px rgba(255,255,255,.8),',
      '    inset 0 0 0 11px #6f61b0}',
      /* Thicker title-bar band across the top edge, embossed like the reference chrome. */
      '#yrm-frame .yrm-frame-top{position:absolute;left:0;right:0;top:0;height:40px;',
      '  background:linear-gradient(180deg,#f2ecff 0%,#cfc4f2 30%,#b3a3e2 74%,#8f7dc4 100%);',
      '  border-bottom:1px solid #241d47;',
      '  box-shadow:inset 0 3px 0 rgba(255,255,255,.95),inset 0 -3px 0 rgba(58,42,110,.72),',
      '    inset 3px 0 0 rgba(255,255,255,.6),inset -3px 0 0 rgba(58,42,110,.55),',
      '    0 8px 16px -9px rgba(0,0,0,.6)}',
      /* Left icon square, like the window icon in the reference title bar. */
      '#yrm-frame .yrm-frame-avatar{position:absolute;left:9px;top:10px;width:20px;height:20px;',
      '  border:1px solid #241d47;border-radius:2px;background:#fff;overflow:hidden;',
      '  box-shadow:0 1px 0 rgba(255,255,255,.6)}',
      '#yrm-frame .yrm-frame-avatar img{width:100%;height:100%;object-fit:cover;display:block}',
      /*
       * Stand-in labels for the native application menu. The real bar is drawn by Chromium outside
       * the DOM (white text, invisible over the lavender band) but stays clickable underneath, so
       * these chips never take pointer events of their own: hover/press styling would require
       * capturing the pointer and would swallow the menu entry.
       */
      /*
       * The chips stand in for the real caption menubar, which the preload mounts in a shadow root
       * at `left: var(--dsh-windows-menu-start, 48px)` — 48px expanded, 84px once the sidebar is
       * collapsed (the host moves it right past the two 28px rail buttons). Follow that variable
       * instead of hard-coding 47px, so the chips track it in both states.
       */
      '#yrm-frame .yrm-menu-fake{position:absolute;left:calc(var(--dsh-windows-menu-start,48px) - 1px);',
      '  top:10px;display:flex;gap:6px}',
      '#yrm-frame .yrm-menu-fake b{display:flex;align-items:center;height:20px;padding:0 9px;',
      '  background:#fff;color:#141414;border:1px solid #241d47;border-radius:3px;',
      '  font:12px/1 "YermuPixel","Zpix","SimSun",Tahoma,sans-serif;letter-spacing:0;',
      '  transform-origin:center;',
      '  transition:background .12s linear,box-shadow .12s linear,transform .1s ease-out;',
      /* 1px inner emboss: light on the top-left edge, shade on the bottom-right. */
      '  box-shadow:inset 1px 1px 0 #ffffff,inset -1px -1px 0 rgba(120,105,175,.62),',
      '    0 1px 2px rgba(0,0,0,.28)}',
      /* Hover is driven by script (the chips never take pointer events), see `trackChips`. */
      '#yrm-frame .yrm-menu-fake b.is-hot{background:#e8e2fa;transform:scale(.93);',
      '  box-shadow:inset 1px 1px 0 #ffffff,inset -1px -1px 0 rgba(96,82,155,.7),',
      '    0 1px 2px rgba(0,0,0,.3)}',
      /*
       * Backing for the NATIVE window controls (minimise / maximise / close — this window has three).
       * They are Chromium-drawn overlay buttons above the page, so they can be neither covered nor
       * styled; the only lever is what shows through them — a dark plate keeps the glyphs legible.
       * Width = 3 × 46px caption buttons at 100% scaling; adjust if the display scale differs.
       */
      '#yrm-frame .yrm-winctl-back{position:absolute;right:0;top:0;width:138px;height:40px;',
      '  background:linear-gradient(180deg,#221b40 0%,#181232 55%,#120d28 100%);',
      '  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(255,255,255,.1),',
      '    inset 1px 0 0 rgba(255,255,255,.22)}',
      /*
       * Status plate in the middle of the title bar. It is the window's "state line": the text comes
       * from the plugin settings today, and `setStatus()` is the seam a later feature can drive with
       * per-action messages without touching this markup.
       */
      '#yrm-frame .yrm-status{position:absolute;left:50%;top:5px;transform:translateX(-50%);',
      '  width:min(62%,980px);height:30px;display:flex;align-items:center;justify-content:center;',
      '  padding:0 22px;box-sizing:border-box;overflow:hidden;',
      '  background:linear-gradient(180deg,#221b40 0%,#181232 55%,#120d28 100%);',
      /* Full pill: radius = half of the 30px height. A larger radius is clamped by CSS anyway. */
      '  border-radius:15px;',
      /* No inner glow: only the 1px bevels and the drop shadow remain. */
      '  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -1px 0 rgba(255,255,255,.09),',
      '    inset 1px 0 0 rgba(255,255,255,.14),',
      '    0 1px 2px rgba(0,0,0,.25)}',
      '#yrm-frame .yrm-status span{',
      '  font:15px/1.2 "Microsoft YaHei","MS YaHei","PingFang SC","SimHei",sans-serif;letter-spacing:0;',
      '  color:#e2dcfb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
      '  text-shadow:0 0 6px rgba(176,158,236,.45),0 1px 0 rgba(0,0,0,.5)}',
      /* Blinking caret while a line is being typed out. */
      '#yrm-frame .yrm-status span.is-typing::after{content:"\\258c";margin-left:2px;',
      '  opacity:.85;animation:yrm-caret 1s steps(1) infinite}',
      '@keyframes yrm-caret{0%,49%{opacity:.85}50%,100%{opacity:0}}',
      /*
       * Segments that are not her voice: an intruder reaching into the 异象空间. `paintSegments`
       * wraps them in their own span, so these only ever recolour that run and leave the plate's
       * phase tint alone. Two layers of glow (tight + wide) read as a CRT bloom on the dark plate.
       */
      '#yrm-frame .yrm-status span.yrm-tone-alien{color:#ff6b6b !important;',
      '  text-shadow:0 0 5px rgba(255,70,70,.95),0 0 14px rgba(255,0,0,.65),0 1px 0 rgba(0,0,0,.5)}',
      '#yrm-frame .yrm-status span.yrm-tone-ghost{color:#6bffa8 !important;',
      '  text-shadow:0 0 5px rgba(90,255,160,.95),0 0 14px rgba(0,255,120,.6),0 1px 0 rgba(0,0,0,.5)}',
      /*
       * Deliberately no viewport inset: the app keeps its full size and the frame floats over its
       * edges. Any `#root` resizing (margin or padding) shifted the host's embedded account view
       * out of alignment, which killed the back button inside it.
       */
      /*
       * Sidebar: white paper with the same lavender frame.
       *
       * The text tokens are re-declared **inside** this subtree so every descendant resolving
       * `--dsw-alias-label-*` flips to a dark value on the white paper instead of inheriting the
       * dark-theme light colours. `[data-shell-leading]` is the shell's leading column seat;
       * `.wtg9ga_root` is the sidebar's own root class (build-hashed — re-check it after a DSH
       * upgrade, every other rule here is attribute-based and survives).
       */
      /*
       * Pixel face: served by this package when `assets/pixel.woff2` exists (Host route
       * `/yeermu-theme/pixel.woff2`), otherwise the stack falls through to locally installed
       * pixel fonts and finally to SimSun, which still reads as an old bitmap UI on Windows.
       */
      '@font-face{font-family:"YermuPixel";src:url("/yeermu-theme/pixel-font");',
      '  font-display:swap}',
      '[data-shell-leading], .wtg9ga_root{',
      '  background:#fff !important;color:#3a4162;',
      '  font-family:"YermuPixel","Zpix","Fusion Pixel 12px Monospaced","Fusion Pixel","Ark Pixel 12px","SimSun",Tahoma,monospace !important;',
      '  -webkit-font-smoothing:none;text-rendering:optimizeSpeed;',
      '  --dsw-specific-sidebar-fill:#ffffff;',
      '  --dsw-alias-label-primary:#3a4162;',
      '  --dsw-alias-label-secondary:#626a8c;',
      '  --dsw-alias-label-tertiary:#9096b4;',
      '  --dsw-alias-label-inverse:#ffffff;',
      '  --dsw-alias-bg-layer-1:#ffffff;',
      '  --dsw-alias-bg-layer-2:#f4f1fd;',
      '  --dsw-alias-border-l1:#ded8f2;',
      '  --dsw-alias-border-l2:#b9b0de;',
      '  --dsw-alias-interactive-bg-hover:rgba(120,100,190,.14);',
      '  --dsw-alias-interactive-bg-active:rgba(120,100,190,.22)}',
      /*
       * Workspace / session list (everything under the 工作区 heading) reads better in YaHei than
       * in the 12px pixel face; two classes of specificity keep it above the host's own rows.
       */
      '.wtg9ga_root .wtg9ga_regionArea, .wtg9ga_root .wtg9ga_regionArea *{',
      '  font-family:"Microsoft YaHei","MS YaHei","PingFang SC",Tahoma,sans-serif !important;',
      '  -webkit-font-smoothing:antialiased;text-rendering:auto !important}',
      '.wtg9ga_root{',
      '  border-radius:4px;',
      '  box-shadow:',
      '    inset 0 0 0 1px #241d47,',
      '    inset 2px 2px 0 rgba(255,255,255,.95),',
      '    inset -2px -2px 0 rgba(18,10,48,.85),',
      '    inset 0 0 0 3px rgba(255,255,255,.5),',
      '    inset 0 0 0 8px #b3a5e0,',
      '    inset 0 0 0 9px rgba(255,255,255,.8),',
      '    inset 0 0 0 10px #6f61b0}',
      /*
       * Inset box-shadows paint UNDER the element's children, so a white child (a rounded list
       * corner, a scroll container edge) that reaches the band wipes out part of the frame — that
       * was the stray white sliver near the sidebar footer. Re-paint the same rings on a positioned
       * overlay so the band always wins; `box-shadow:inherit` keeps the two definitions in sync.
       */
      '[data-shell-leading], .wtg9ga_root{position:relative}',
      '[data-shell-leading]::after, .wtg9ga_root::after{content:"";position:absolute;inset:0;',
      '  border-radius:inherit;box-shadow:inherit;pointer-events:none;z-index:1}',
      /* ---- conversation header: same title-bar language as the dock tiles ---- */
      /*
       * `an3WzG_*` is ui-chat's build-hashed prefix (re-check after a DSH upgrade, like `wtg9ga_*`).
       * Only colours/typography are overridden here — the grid, paddings and control wiring stay
       * the host's, and the window buttons the reference art has are deliberately not added.
       */
      '.an3WzG_header{background:#3d80e8 !important;border-bottom:1px solid #1b52b8 !important;',
      /* Embossed band: lit top edge, shaded bottom edge, plus a 2px inner bevel on both sides. */
      '  box-shadow:inset 0 1px 0 #a6c8f8,inset 0 -1px 0 #1b52b8,',
      '    inset 0 2px 0 rgba(255,255,255,.16),inset 0 -2px 0 rgba(10,30,80,.34) !important}',
      '.an3WzG_crumb,.an3WzG_crumbCurrent,.an3WzG_crumbSep{color:#fff !important}',
      '.an3WzG_crumb{font-family:"YermuPixel","Zpix","SimSun",monospace !important;',
      '  font-size:13px !important;letter-spacing:.04em}',
      'button.an3WzG_crumb:hover{background:rgba(255,255,255,.18) !important}',
      '.an3WzG_headerActions button,.an3WzG_headerUtilities button,.an3WzG_headerCorner button{',
      '  color:#fff !important}',
      '.an3WzG_headerActions button:hover,.an3WzG_headerUtilities button:hover,',
      '.an3WzG_headerCorner button:hover{background:rgba(255,255,255,.18) !important}',
      '.an3WzG_tab{color:rgba(255,255,255,.82) !important}',
      '.an3WzG_tabActive,.an3WzG_viewsMore{color:#fff !important}',
      '.an3WzG_tabActive:after{background:#fff !important}',
      /*
       * The mode chip in the title row ships as a transparent `dscfja_label` span with tertiary
       * text (ui-primitives class, own colour), so it vanished on the blue bar. Paint it as a
       * solid white pill with black text; the class prefix is hashed — re-check on upgrade.
       */
      '.an3WzG_headerActions .dscfja_label{color:#141414 !important;background:#ffffff !important;',
      '  border-radius:5px !important;padding:2px 7px !important;',
      '  box-shadow:0 1px 0 rgba(0,0,0,.28),inset 0 -1px 0 rgba(0,0,0,.14) !important}',
      '.an3WzG_headerActions .dscfja_label svg,.an3WzG_headerActions .dscfja_icon{',
      '  color:#141414 !important;fill:currentColor !important}',
      /*
       * Right-hand icon cluster. The host ships a coloured raster (explorer) and two line icons
       * (more / right panel); they are swapped for the pixel set the theme already carries.
       */
      '.an3WzG_headerUtilities .mOxcpG_appIcon{content:url("__ICON_FOLDER__") !important;',
      '  width:18px !important;height:18px !important}',
      '.an3WzG_headerUtilities .K0RNnq_moreButton,',
      '.an3WzG_headerCorner .RwosdG_button{display:inline-flex !important;align-items:center;',
      '  justify-content:center}',
      '.an3WzG_headerUtilities .K0RNnq_moreButton > svg,',
      '.an3WzG_headerCorner .RwosdG_button > svg{display:none !important}',
      '.an3WzG_headerUtilities .K0RNnq_moreButton::before{content:"";display:block;',
      '  width:18px;height:18px;background:url("__ICON_ALERT__") center/contain no-repeat}',
      '.an3WzG_headerCorner .RwosdG_button::before{content:"";display:block;',
      '  width:18px;height:18px;background:url("__ICON_FOLDER_DOC__") center/contain no-repeat}',
      /*
       * Popover menus paint their row labels with a hard-coded white (`_itemLabel_*`), so on a
       * light surface they vanish. The host stylesheet is injected after ours, and its class rule
       * beats a bare `[role="menu"] *`, so this has to out-specify it: element + role + descendant.
       * `light-dark()` keeps the text readable whichever colour scheme the app is in.
       */
      '[role="menu"],[role="listbox"]{color:#121a2b !important;',
      '  color:light-dark(#121a2b,#e7f3ff) !important}',
      '[role="menu"] [role="menuitem"],[role="menu"] [role="menuitem"] *,',
      '[role="menu"] [role="option"],[role="menu"] [role="option"] *,',
      '[role="menu"] [role="menuitemradio"],[role="menu"] [role="menuitemcheckbox"],',
      '[role="menu"] [role="menuitemradio"] *,[role="menu"] [role="menuitemcheckbox"] *{',
      '  color:#121a2b !important;color:light-dark(#121a2b,#e7f3ff) !important}',
      '[role="menu"] svg, [role="listbox"] svg{fill:currentColor !important}',
      /*
       * User message bubbles as pixel windows.
       *
       * The hook is `[data-message-bubble]`, an attribute the host puts on the bubble itself
       * (primitives `UserMessageBubble`), so this survives rebuilds where the hashed class
       * `_bubble_1sgyj_1` would not.
       *
       * A `border` cannot follow a stepped silhouette (a clip-path would cut it), so the outline is
       * its own layer: `::before` paints the ink silhouette and `::after` paints the fill one,
       * inset by exactly 3px. Both share one coordinate space that is the bubble box grown by 3px
       * on three sides and 17px on the **right** (12px tail reach + 3px outline), so the two
       * polygons are the same shape offset by 3 — generated with
       * `.build-yeermu/gen_bubble_polys.py`, which also renders the preview.
       *
       * Silhouette: 2-step 6px chamfer on each corner, plus a stepped tail on the right pointing
       * down-right (user rows are right-aligned). FILL stays `--dsw-specific-bubble` (the theme owns
       * it per scheme); only the ink flips — near-black on light, off-white on dark
       * (`body[data-ds-dark-theme]` is where the theme presenter marks dark mode).
       */
      '[data-message-bubble]{position:relative;isolation:isolate;box-sizing:border-box !important;',
      '  border:0 !important;border-radius:0 !important;background:none !important;',
      '  padding:9px 13px !important}',
      '[data-message-bubble]::before,[data-message-bubble]::after{content:"";position:absolute;',
      '  top:-3px;left:-3px;right:-23px;bottom:-3px;pointer-events:none}',
      '[data-message-bubble]::before{z-index:-2;background:#14141a;',
      '  clip-path:polygon(0px 8px, 4px 8px, 4px 4px, 8px 4px, 8px 0px, calc(100% - 28px) 0px, calc(100% - 28px) 4px, calc(100% - 24px) 4px, calc(100% - 24px) 8px, calc(100% - 20px) 8px, calc(100% - 20px) calc(100% - 57px), calc(100% - 12px) calc(100% - 57px), calc(100% - 12px) calc(100% - 49px), calc(100% - 4px) calc(100% - 49px), calc(100% - 4px) calc(100% - 27px), calc(100% - 12px) calc(100% - 27px), calc(100% - 12px) calc(100% - 19px), calc(100% - 20px) calc(100% - 19px), calc(100% - 20px) calc(100% - 8px), calc(100% - 24px) calc(100% - 8px), calc(100% - 24px) calc(100% - 4px), calc(100% - 28px) calc(100% - 4px), calc(100% - 28px) 100%, 8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0px calc(100% - 8px))}',
      '[data-message-bubble]::after{z-index:-1;background:var(--dsw-specific-bubble);',
      '  clip-path:polygon(3px 11px, 7px 11px, 7px 7px, 11px 7px, 11px 3px, calc(100% - 31px) 3px, calc(100% - 31px) 7px, calc(100% - 27px) 7px, calc(100% - 27px) 11px, calc(100% - 23px) 11px, calc(100% - 23px) calc(100% - 54px), calc(100% - 15px) calc(100% - 54px), calc(100% - 15px) calc(100% - 46px), calc(100% - 7px) calc(100% - 46px), calc(100% - 7px) calc(100% - 30px), calc(100% - 15px) calc(100% - 30px), calc(100% - 15px) calc(100% - 22px), calc(100% - 23px) calc(100% - 22px), calc(100% - 23px) calc(100% - 11px), calc(100% - 27px) calc(100% - 11px), calc(100% - 27px) calc(100% - 7px), calc(100% - 31px) calc(100% - 7px), calc(100% - 31px) calc(100% - 3px), 11px calc(100% - 3px), 11px calc(100% - 7px), 7px calc(100% - 7px), 7px calc(100% - 11px), 3px calc(100% - 11px))}',
      'body[data-ds-dark-theme] [data-message-bubble]::before{background:#f2f2f6}',
      /*
       * Reasoning-effort picker as a segmented slider (方案 A: click to choose).
       *
       * `startEffortSlider()` puts `.yrm-effort-slider` on a menu once its options are recognisably
       * the effort levels, so this never touches the model list or any other menu. The host's rows
       * become equal-width segments, the tick is hidden, and the selected segment floats on a track
       * using theme tokens so both colour schemes keep working.
       */
      '.yrm-effort-slider, .yrm-effort-slider > ._9r0rkG_groups{flex-direction:row !important;',
      '  display:flex !important;gap:2px;min-width:290px}',
      '.yrm-effort-slider > ._9r0rkG_groups{overflow:visible !important;padding:2px;',
      '  border-radius:9px;background:var(--dsw-alias-interactive-bg-hover)}',
      '.yrm-effort-slider ._9r0rkG_option{flex:1 1 0;min-width:0;min-height:28px;padding:0 10px;',
      '  justify-content:center;border-radius:7px;',
      '  transition:background .15s linear,box-shadow .15s linear,color .15s linear}',
      '.yrm-effort-slider ._9r0rkG_optionCopy{flex:none;align-items:center}',
      '.yrm-effort-slider ._9r0rkG_check{display:none}',
      '.yrm-effort-slider ._9r0rkG_option:not(._9r0rkG_selected){color:var(--dsw-alias-label-secondary)}',
      '.yrm-effort-slider ._9r0rkG_option._9r0rkG_selected{background:var(--dsw-alias-bg-layer-1);',
      '  box-shadow:0 1px 2px rgba(20,15,45,.22),inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      /* Same thumb if the host marks the choice with ARIA instead of the class. */
      '.yrm-effort-slider ._9r0rkG_option[aria-checked="true"]{background:var(--dsw-alias-bg-layer-1);',
      '  box-shadow:0 1px 2px rgba(20,15,45,.22),inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      /*
       * Dragging (see `attachEffortDrag`): while the pointer is down the thumb tracks the segment
       * under the cursor instead of the committed choice, so the pill visually slides. The committed
       * thumb is muted for the duration to avoid two pills at once.
       */
      '.yrm-effort-slider{cursor:grab}',
      '.yrm-effort-slider.is-dragging{cursor:grabbing;user-select:none}',
      '.yrm-effort-slider.is-dragging ._9r0rkG_option._9r0rkG_selected,',
      '.yrm-effort-slider.is-dragging ._9r0rkG_option[aria-checked="true"]{background:0 0;',
      '  box-shadow:none;color:var(--dsw-alias-label-secondary)}',
      '.yrm-effort-slider ._9r0rkG_option.yrm-drag-target{background:var(--dsw-alias-bg-layer-1);',
      '  box-shadow:0 1px 3px rgba(20,15,45,.3),inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      /* New-session call to action: keep the shipped shape, repaint it in the palette. */
      '.wtg9ga_newSession{',
      '  background:linear-gradient(180deg,#ab9cdc 0%,#8d7cc8 52%,#7565b3 100%) !important;',
      '  color:#fff !important;border:1px solid #5b4d95 !important;border-radius:8px !important;',
      '  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 1px 2px rgba(0,0,0,.25) !important}',
      '.wtg9ga_newSession:hover{',
      '  background:linear-gradient(180deg,#b6a8e4 0%,#9887d2 52%,#8070bd 100%) !important}',
      '.wtg9ga_newSession *{color:#fff !important}',
      /* Swap the shipped plus glyph for the pixel floppy; the label keeps its own layout. */
      '.wtg9ga_newSessionContent{--yrm-floppy:url("__FLOPPY__")}',
      '.wtg9ga_newSessionContent > svg{display:none !important}',
      '.wtg9ga_newSessionContent::before{content:"";flex:0 0 auto;width:16px;height:16px;',
      '  background:var(--yrm-floppy) center/contain no-repeat}',
      /* Sidebar wordmark: the pixel "elyms" art stands in for the shipped brand text. */
      '.yrm-brand-row{display:flex;align-items:center;gap:7px;min-width:0}',
      '.yrm-brand{display:block;height:26px;width:auto;max-width:100%;transform:translateY(2px)}',
      '.yrm-harness{flex:0 0 auto;display:inline-flex;align-items:center;height:17px;padding:0 5px;',
      '  border-radius:5px;background:#241d47;color:#fff;transform:translateY(1px);',
      '  font-family:"YermuPixel","Zpix","SimSun",monospace;font-size:10px;letter-spacing:.08em}',
      /*
       * Right-sidebar tool cards («工作区文件 / 新建终端 / 浏览器 / 更多工具»).
       *
       * The host paints them with `--dsw-alias-bg-layer-1`, a translucent "glass" layer, so with the
       * video backdrop behind them the titles were hard to read. Opaque per scheme instead — white
       * on light, the theme's deep surface on dark. The hook is the attribute the host puts on each
       * card button (`data-sidebar-right-guide-entry`, see ui-sidebar-right `EntryBox`), so no
       * hashed class is involved. Hover and the expanded "更多工具" state stay distinguishable but
       * equally opaque.
       */
      '[data-sidebar-right-guide-entry]{background:#ffffff !important}',
      '[data-sidebar-right-guide-entry]:hover,',
      '[data-sidebar-right-guide-entry][aria-expanded="true"]{background:#f1eefb !important}',
      'body[data-ds-dark-theme] [data-sidebar-right-guide-entry]{background:#15223a !important}',
      'body[data-ds-dark-theme] [data-sidebar-right-guide-entry]:hover,',
      'body[data-ds-dark-theme] [data-sidebar-right-guide-entry][aria-expanded="true"]{',
      '  background:#1d2c47 !important}',
      /*
       * New-conversation hero (ui-conversation `HeroShell`).
       *
       * Host markup: `<div .WOwLGG_headline> <span .WOwLGG_fishHitbox><svg .WOwLGG_fish/></span>
       * <span .WOwLGG_titleGroup><span>headline text</span><span .WOwLGG_previewBadge/></span></div>`.
       * The headline text is an unclassed span, so it is zero-sized and repainted through `::after`
       * at the host's own 26px/32px. The fish is hidden and her face takes its place on the hitbox,
       * keeping the hover hit area (the swim animation just has nothing to animate).
       */
      '.WOwLGG_fishHitbox{width:52px;height:52px;transform-origin:50% 60%;',
      '  background:url("__HERO_FACE__") center/contain no-repeat}',
      '.WOwLGG_fish{display:none !important}',
      '.WOwLGG_titleGroup > span:first-child{font-size:0 !important}',
      /*
       * Pixel face for the headline: 36px is 3 × 12, one of the sizes where the bitmap glyphs stay
       * crisp (HANDOFF §5 #8). Weight is pinned to 400 so the browser does not synthesise a bold and
       * blur the pixels. Line-height grows with the font (44px) or the taller head line box would
       * clip the glyphs; the 52px portrait still sets the row height, so the layout does not jump.
       *
       * White fill with a black outline, drawn as eight `text-shadow` offsets rather than
       * `-webkit-text-stroke`: the stroke is centred on the glyph outline, which would eat half the
       * white core and antialias the pixel edges, while shadows sit entirely outside the fill. The
       * ring is 3px to stay proportional to the 36px face.
       */
      '.WOwLGG_titleGroup > span:first-child::after{content:"友谊地久天长";',
      '  font-family:"YermuPixel","Zpix","Fusion Pixel 12px Monospaced","Fusion Pixel",SimSun,monospace;',
      '  font-size:36px;font-weight:400;line-height:44px;letter-spacing:.02em;color:#ffffff;',
      '  text-shadow:3px 0 0 #14141a,-3px 0 0 #14141a,0 3px 0 #14141a,0 -3px 0 #14141a,',
      '    3px 3px 0 #14141a,-3px 3px 0 #14141a,3px -3px 0 #14141a,-3px -3px 0 #14141a}',
      /*
       * The shipped swim animation targets the (now hidden) fish svg, so the hover wobble is
       * re-created here on the hitbox itself. Own keyframes on purpose: the host's
       * `WOwLGG_hero-fish-swim` name is just as build-hashed as the class next to it.
       */
      '@keyframes yrm-hero-swim{0%,to{transform:none}',
      '  35%{transform:rotate(-4deg) translate(-.4px,-.9px)}',
      '  70%{transform:rotate(1.6deg) translate(.3px,.2px)}}',
      '@media (hover:hover) and (prefers-reduced-motion:no-preference){',
      '  .WOwLGG_fishHitbox:hover{animation:1.6s ease-in-out infinite yrm-hero-swim}}',
      /*
       * Collapsed sidebar on Windows. `collapsedWidth` is 0 there (not the 56px icon rail macOS
       * gets), so the whole column disappears and the only controls left are two 28px buttons the
       * sidebar re-parks as `position:fixed` INSIDE the title band: the toggle at left:12 and the
       * new-session button at left:48 (`[data-windows-titlebar] .wtg9ga_collapsed …` in ui-sidebar).
       * Our window-icon square sits at left:9 and would cover the toggle, and the logo row keeps
       * `overflow:visible` at height 0, so the 26px wordmark spills across both buttons. The frame
       * floats above the app by design, so the only lever is to step the art aside; the fake menu
       * row follows `--dsh-windows-menu-start` and needs no rule of its own.
       */
      'html:has([data-sidebar-collapsed]) #yrm-frame .yrm-frame-avatar{display:none}',
      '.wtg9ga_root.wtg9ga_collapsed .yrm-mark,',
      '.wtg9ga_root.wtg9ga_collapsed .yrm-brand-row{display:none !important}',
      /* Same 28px cell as the toggle: a bare icon button, not a purple block in the native band. */
      '[data-windows-titlebar] .wtg9ga_root.wtg9ga_collapsed .wtg9ga_newSession{',
      '  background:none !important;border-color:transparent !important;box-shadow:none !important;',
      '  border-radius:6px !important;color:#241d47 !important}',
      '[data-windows-titlebar] .wtg9ga_root.wtg9ga_collapsed .wtg9ga_newSession:hover{',
      '  background:rgba(255,255,255,.5) !important}',
      /* The host paints the rail icons with `label-secondary`; on the lavender band that is a
       * mid-purple on mid-purple, so pin the rail glyphs to the frame's ink colour instead. */
      'html[data-windows-titlebar]:has([data-sidebar-collapsed]) .wtg9ga_collapsed .wtg9ga_toggle{',
      '  color:#241d47 !important}',
    ].join('\n');

    /**
     * Insert the looping backdrop as body's first child (`z-index:-1` paints it under the app).
     *
     * At a cold start the client entry can run before `document.body` exists, so the insert
     * retries instead of silently giving up — that was why the layer appeared after a reload
     * but not after a restart. A slow watchdog re-inserts once if hydration drops the node.
     *
     * @returns {() => void} disposer removing the layer and its stylesheet.
     */
    function mountBackdrop() {
      if (typeof document === 'undefined') return function () {};

      let cancelled = false;
      let timer = 0;
      let style = null;
      let wrap = null;
      let frame = null;

      function insert() {
        try {
          insertRaw();
        } catch (error) {
          lastMountError = String(error && error.message ? error.message : error);
          console.error('[yeermu-theme] backdrop mount failed', error);
        }
      }

      function insertRaw() {
        if (cancelled) return;
        if (!document.body) {
          timer = setTimeout(insert, 40);
          return;
        }

        /* Re-assert every piece: a cold start can drop one of them, or drop all three. */
        const liveBackdrop = document.getElementById('yrm-backdrop');
        const liveFrame = document.getElementById('yrm-frame');
        const styleOk = style !== null && style.isConnected;
        if (liveBackdrop && liveFrame && styleOk) return;
        if (liveBackdrop) liveBackdrop.remove();
        if (liveFrame) liveFrame.remove();

        const head = document.head || document.documentElement;
        if (!styleOk) {
          style = document.createElement('style');
          style.setAttribute('data-yeermu-backdrop', '');
          style.textContent = BACKDROP_CSS + FRAME_CSS;
          if (head) head.appendChild(style);
        }

        wrap = document.createElement('div');
        wrap.id = 'yrm-backdrop';
        wrap.setAttribute('aria-hidden', 'true');

        const video = document.createElement('video');
        video.setAttribute('src', sceneSrc(lookState.scene));
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('disablepictureinpicture', '');

        const start = function () {
          try {
            const playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          } catch (error) {
            /* the gradient stays as the fallback */
          }
        };
        video.addEventListener('loadeddata', start);
        video.addEventListener('canplay', start);
        video.addEventListener('error', function () {
          console.error('[yeermu-theme] backdrop video failed to load: ' + video.getAttribute('src'));
        });

        wrap.appendChild(video);
        const veil = document.createElement('div');
        veil.className = 'yrm-veil';
        wrap.appendChild(veil);

        document.body.insertBefore(wrap, document.body.firstChild);

        /* Whole-window frame: our own fixed overlay, above the app but click-through. */
        frame = document.createElement('div');
        frame.id = 'yrm-frame';
        frame.setAttribute('aria-hidden', 'true');
        const bar = document.createElement('div');
        bar.className = 'yrm-frame-top';

        const avatar = document.createElement('div');
        avatar.className = 'yrm-frame-avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = HEAD;
        avatarImg.alt = '';
        avatar.appendChild(avatarImg);
        bar.appendChild(avatar);

        const fakeMenu = document.createElement('div');
        fakeMenu.className = 'yrm-menu-fake';
        ['应用', '编辑'].forEach(function (label) {
          const chip = document.createElement('b');
          chip.textContent = label;
          fakeMenu.appendChild(chip);
        });
        bar.appendChild(fakeMenu);

        /* Dark plate behind the native window controls so their white glyphs stay readable. */
        const winctlBack = document.createElement('div');
        winctlBack.className = 'yrm-winctl-back';
        bar.appendChild(winctlBack);

        const statusPlate = document.createElement('div');
        statusPlate.className = 'yrm-status';
        const statusText = document.createElement('span');
        statusText.textContent = clampStatus(lookState.status) || pickLine(phaseName);
        statusText.style.color = PHASES[phaseName].color;
        statusPlate.appendChild(statusText);
        bar.appendChild(statusPlate);

        frame.appendChild(bar);
        document.body.appendChild(frame);

        /*
         * Size the window-control plate from the platform's own titlebar geometry instead of a
         * constant: `windowControlsOverlay` reports the rect the page may use, so the difference
         * against `innerWidth` is exactly the control cluster — at any DPI, and for any button
         * count. Without that API (plain browser) fall back to 3 × 46px.
         */
        function paintWinctl() {
          const plate = frame && frame.querySelector('.yrm-winctl-back');
          if (!plate) return;
          const overlay = navigator.windowControlsOverlay;
          if (overlay && overlay.visible) {
            try {
              const rect = overlay.getTitlebarAreaRect();
              if (rect.x > 1) {
                /* Controls on the left (macOS traffic lights): nothing to back here. */
                plate.style.display = 'none';
                return;
              }
              const width = Math.max(0, Math.round(window.innerWidth - rect.width));
              if (width > 20) {
                plate.style.display = 'block';
                plate.style.width = width + 'px';
                return;
              }
            } catch (error) {
              /* fall through to the constant */
            }
          }
          plate.style.display = 'block';
          plate.style.width = '138px';
        }
        paintWinctl();
        if (detachWinctl) detachWinctl();
        const overlayApi = navigator.windowControlsOverlay;
        window.addEventListener('resize', paintWinctl);
        if (overlayApi && overlayApi.addEventListener) overlayApi.addEventListener('geometrychange', paintWinctl);
        detachWinctl = function () {
          window.removeEventListener('resize', paintWinctl);
          if (overlayApi && overlayApi.removeEventListener) {
            overlayApi.removeEventListener('geometrychange', paintWinctl);
          }
        };

        start();
        applyBackdropLook(lookState);
        console.info('[yeermu-theme] backdrop mounted');
      }

      insert();
      remountOverlay = insert;
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.classList.toggle('yrm-frame-on', lookState.frame !== false);
      }

      /*
       * Hover for the decorative menu chips without giving them pointer events: the frame stays
       * click-through, this listener only reads coordinates and toggles `is-hot`.
       */
      let hotChip = null;
      let detachWinctl = null;
      function trackChips(event) {
        if (cancelled || !document.body) return;
        const chips = document.querySelectorAll('#yrm-frame .yrm-menu-fake b');
        /* Inflate the hit box: the hover state scales the chip down, and testing the shrunken rect
           would flip the state on and off while the pointer sits near the edge. */
        const pad = 6;
        let next = null;
        for (let index = 0; index < chips.length; index += 1) {
          const rect = chips[index].getBoundingClientRect();
          if (
            event.clientX >= rect.left - pad && event.clientX <= rect.right + pad &&
            event.clientY >= rect.top - pad && event.clientY <= rect.bottom + pad
          ) {
            next = chips[index];
            break;
          }
        }
        if (next === hotChip) return;
        if (hotChip) hotChip.classList.remove('is-hot');
        hotChip = next;
        if (hotChip) hotChip.classList.add('is-hot');
      }
      window.addEventListener('pointermove', trackChips, { passive: true });

      /*
       * Keep asserting the layers for the first 20s: a cold start can mount the app, replace body
       * children, or drop the stylesheet after our first attempt, and there is no refresh path on
       * the desktop shell to recover manually.
       */
      const watchdog = setInterval(function () {
        if (cancelled) return;
        if (!document.body) return;
        if (!document.getElementById('yrm-backdrop') || !document.getElementById('yrm-frame')) insert();
      }, 1200);
      const watchdogStop = setTimeout(function () {
        clearInterval(watchdog);
      }, 20000);

      return function () {
        cancelled = true;
        clearTimeout(timer);
        clearInterval(watchdog);
        clearTimeout(watchdogStop);
        window.removeEventListener('pointermove', trackChips);
        if (detachWinctl) detachWinctl();
        if (hotChip) hotChip.classList.remove('is-hot');
        if (wrap) wrap.remove();
        if (frame) frame.remove();
        if (style) style.remove();
      };
    }

    /**
     * Boot animation: one full-screen clip, dismissed by a click/key or by its own end.
     *
     * Every exit path is defensive — a blocked autoplay, a decode error, or a clip that never ends
     * must all release the overlay, otherwise the user is stuck behind it until a restart.
     */
    /**
     * Tag the settings dialog with `yrm-panel-skin` the moment it is inserted.
     *
     * A MutationObserver (not a poll) reacts in the same task as the insertion, so the class is on
     * the node before its first paint — no flicker. Only the dialog's own background is overridden;
     * text and controls keep their theme colours, so the dark scheme stays usable.
     */
    function startPanelSkin() {
      if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
        return function () {};
      }
      const marks = ['账号与余额', 'Agent 预设', '内置插件'];
      function isSettingsDialog(node) {
        if (!node || node.nodeType !== 1) return false;
        const dialogs = node.matches && node.matches('[role="dialog"]') ? [node] : node.querySelectorAll ? node.querySelectorAll('[role="dialog"]') : [];
        for (let index = 0; index < dialogs.length; index += 1) {
          const dialog = dialogs[index];
          if (dialog.classList.contains('yrm-panel-skin')) continue;
          const text = dialog.textContent || '';
          for (let m = 0; m < marks.length; m += 1) {
            if (text.indexOf(marks[m]) !== -1) return dialog;
          }
        }
        return false;
      }
      function tag(node) {
        const dialog = isSettingsDialog(node);
        if (dialog) dialog.classList.add('yrm-panel-skin');
      }
      tag(document.body);
      const observer = new MutationObserver(function (records) {
        for (let index = 0; index < records.length; index += 1) {
          const added = records[index].addedNodes;
          for (let n = 0; n < added.length; n += 1) tag(added[n]);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return function () {
        observer.disconnect();
      };
    }

    /*
     * Reasoning-effort picker → segmented slider.
     *
     * The host (ui-model-selection) renders that choice as a vertical menu of `_9r0rkG_option`
     * rows. Nothing identifies the menu as *the effort menu*, so recognition is by content: a menu
     * whose every option is one of the known effort labels. Only such a menu gets the marker class;
     * every other menu (model list, provider list) is left exactly as shipped.
     *
     * `_9r0rkG` is build-hashed — re-check it after a DSH upgrade, like `wtg9ga_*` / `an3WzG_*`.
     */
    const EFFORT_MENU_CLASS = '_9r0rkG_menu';
    const EFFORT_OPTION_CLASS = '_9r0rkG_option';
    const EFFORT_LABELS = [
      'off', 'low', 'medium', 'mid', 'high', 'max', 'minimal',
      '关闭', '低', '中', '中等', '高', '最高', '最低',
    ];

    /** True when every option in this menu is a reasoning-effort level (3–6 of them). */
    function isEffortMenu(menu) {
      if (!menu || typeof menu.querySelectorAll !== 'function') return false;
      const options = menu.querySelectorAll('.' + EFFORT_OPTION_CLASS);
      if (options.length < 3 || options.length > 6) return false;
      for (let index = 0; index < options.length; index += 1) {
        const label = String(options[index].textContent || '').trim().toLowerCase();
        if (EFFORT_LABELS.indexOf(label) === -1) return false;
      }
      return true;
    }

    /** Mark this menu (and any effort menu inside `scope`) as the slider. */
    function tagEffortMenus(scope) {
      if (!scope || typeof scope.querySelectorAll !== 'function') return;
      const menus = scope.querySelectorAll('.' + EFFORT_MENU_CLASS);
      for (let index = 0; index < menus.length; index += 1) {
        const menu = menus[index];
        if (menu.classList.contains('yrm-effort-slider')) continue;
        if (!isEffortMenu(menu)) continue;
        menu.classList.add('yrm-effort-slider');
        attachEffortDrag(menu);
      }
    }

    /**
     * Make the segmented slider draggable: press anywhere on the track, drag across the levels,
     * release to commit.
     *
     * The browser dispatches `click` on the common ancestor of press and release, so a native click
     * can never commit a drag. Instead the release point decides: if it moved to another level we
     * synthesise `.click()` on that option; if it never left the pressed level the native click is
     * left alone (committing twice would fire two model selections).
     *
     * Deliberately **no** `setPointerCapture`: capture retargets `pointerup` — and in Chromium the
     * `click` that follows it — to the capturing element, which would swallow the host's own
     * `onClick` on the option and break ordinary clicking. The move/up listeners are attached to
     * `window` for the duration of a press instead, and always removed again.
     * @param {HTMLElement} menu the tagged menu element.
     */
    function attachEffortDrag(menu) {
      if (!menu || menu.dataset.yrmDrag === 'on') return;
      menu.dataset.yrmDrag = 'on';

      let pressed = false;
      let pressedOption = null;

      function options() {
        return Array.prototype.slice.call(menu.querySelectorAll('.' + EFFORT_OPTION_CLASS));
      }

      /** The option under a viewport point, or null when the point is outside every segment. */
      function optionAt(x, y) {
        if (typeof document.elementFromPoint !== 'function') return null;
        const hit = document.elementFromPoint(x, y);
        const option = hit && typeof hit.closest === 'function' ? hit.closest('.' + EFFORT_OPTION_CLASS) : null;
        return option && menu.contains(option) ? option : null;
      }

      /** Show the "thumb follows the pointer" highlight on one segment (null clears it). */
      function highlight(option) {
        const list = options();
        for (let index = 0; index < list.length; index += 1) {
          const each = list[index];
          if (each === option) each.classList.add('yrm-drag-target');
          else each.classList.remove('yrm-drag-target');
        }
        menu.classList.toggle('is-dragging', !!option);
      }

      function detach() {
        window.removeEventListener('pointermove', onPointerMove, true);
        window.removeEventListener('pointerup', onPointerUp, true);
        window.removeEventListener('pointercancel', onPointerCancel, true);
      }

      function reset() {
        pressed = false;
        pressedOption = null;
        highlight(null);
        detach();
      }

      function onPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        if (!menu.isConnected) return;
        pressed = true;
        pressedOption = optionAt(event.clientX, event.clientY);
        highlight(pressedOption);
        /* Capture phase, so a drag over nested nodes is still seen; native click stays untouched. */
        window.addEventListener('pointermove', onPointerMove, true);
        window.addEventListener('pointerup', onPointerUp, true);
        window.addEventListener('pointercancel', onPointerCancel, true);
      }

      function onPointerMove(event) {
        if (!pressed) return;
        if (!menu.isConnected) {
          reset();
          return;
        }
        highlight(optionAt(event.clientX, event.clientY) || pressedOption);
      }

      function onPointerUp(event) {
        if (!pressed) return;
        const target = optionAt(event.clientX, event.clientY);
        const origin = pressedOption;
        reset();
        /* Same segment as the press: the host's own click handles it, exactly as before. */
        if (!target || target === origin) return;
        target.click();
      }

      function onPointerCancel() {
        if (pressed) reset();
      }

      menu.addEventListener('pointerdown', onPointerDown);
    }

    /**
     * Watch for the effort menu and tag it before its first paint. A MutationObserver (not a poll)
     * keeps it in the same task as the insertion, so there is no flash of the vertical list.
     * @returns {() => void} disposer.
     */
    function startEffortSlider() {
      if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
        return function () {};
      }
      let observer = null;
      let retry = 0;
      function attach() {
        if (!document.body) {
          retry = window.setTimeout(attach, 300);
          return;
        }
        tagEffortMenus(document.body);
        observer = new MutationObserver(function (records) {
          for (let index = 0; index < records.length; index += 1) {
            const added = records[index].addedNodes;
            for (let n = 0; n < added.length; n += 1) {
              const node = added[n];
              if (!node || node.nodeType !== 1) continue;
              /* A menu can be inserted empty and filled a moment later, so resolve upwards too. */
              const owner = typeof node.closest === 'function' ? node.closest('.' + EFFORT_MENU_CLASS) : null;
              if (owner) {
                if (isEffortMenu(owner) && !owner.classList.contains('yrm-effort-slider')) {
                  owner.classList.add('yrm-effort-slider');
                  attachEffortDrag(owner);
                }
                continue;
              }
              tagEffortMenus(node);
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
      attach();
      return function () {
        if (retry) window.clearTimeout(retry);
        if (observer) observer.disconnect();
      };
    }

    function mountSplash() {
      if (splashShown) return;
      if (typeof document === 'undefined') return;

      function build() {
        splashShown = true;
        const style = document.createElement('style');
        style.setAttribute('data-yeermu-splash', '');
        style.textContent = SPLASH_CSS;
        document.head.appendChild(style);

        const layer = document.createElement('div');
        layer.id = 'yrm-splash';

        const video = document.createElement('video');
        video.setAttribute('src', BOOT_SRC);
        /* Electron's default autoplay policy allows sound; a plain browser does not, and there the
           catch below retries muted. */
        const wantSound = lookState.splashSound !== false;
        video.muted = !wantSound;
        video.volume = 1;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = 'auto';
        if (!wantSound) {
          video.defaultMuted = true;
          video.setAttribute('muted', '');
        }
        video.setAttribute('playsinline', '');
        layer.appendChild(video);

        const hint = document.createElement('div');
        hint.className = 'yrm-splash-hint';
        hint.textContent = '点击跳过';
        layer.appendChild(hint);

        document.body.appendChild(layer);

        let finished = false;
        let guard = 0;
        function finish() {
          if (finished) return;
          finished = true;
          clearTimeout(guard);
          window.removeEventListener('keydown', finish);
          layer.style.cursor = 'default';
          hint.style.display = 'none';
          pixelDissolve();
        }

        /**
         * Pixel dissolve: freeze the current frame into a canvas, hide the video, then clear the
         * canvas in randomly ordered square cells so the splash breaks up into blocks and the app
         * shows through underneath.
         */
        function pixelDissolve() {
          const box = layer.getBoundingClientRect();
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(box.width * dpr));
          canvas.height = Math.max(1, Math.round(box.height * dpr));
          canvas.className = 'yrm-splash-fade';
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            layer.classList.add('is-done');
            setTimeout(function () { layer.remove(); style.remove(); }, 240);
            return;
          }
          const vw = video.videoWidth || 16;
          const vh = video.videoHeight || 9;
          const scale = Math.min(canvas.width / vw, canvas.height / vh);
          const drawW = vw * scale;
          const drawH = vh * scale;
          ctx.fillStyle = '#05070f';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          try {
            ctx.drawImage(video, (canvas.width - drawW) / 2, (canvas.height - drawH) / 2, drawW, drawH);
          } catch (error) {
            /* a tainted or not-yet-ready frame: the block grid alone still reads as a dissolve */
          }
          video.style.visibility = 'hidden';
          layer.appendChild(canvas);

          const cell = Math.max(6, Math.round(10 * dpr));
          const cols = Math.ceil(canvas.width / cell);
          const rows = Math.ceil(canvas.height / cell);
          const cells = [];
          for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) cells.push([col, row]);
          }
          for (let i = cells.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const swap = cells[i];
            cells[i] = cells[j];
            cells[j] = swap;
          }

          let index = 0;
          const perTick = Math.max(1, Math.ceil(cells.length / 14));
          const timer = setInterval(function () {
            for (let n = 0; n < perTick && index < cells.length; n += 1, index += 1) {
              ctx.clearRect(cells[index][0] * cell, cells[index][1] * cell, cell, cell);
            }
            if (index >= cells.length) {
              clearInterval(timer);
              layer.classList.add('is-done');
              setTimeout(function () {
                layer.remove();
                style.remove();
              }, 220);
            }
          }, 55);
        }

        video.addEventListener('ended', finish);
        video.addEventListener('error', finish);
        layer.addEventListener('pointerdown', finish);
        window.addEventListener('keydown', finish);
        /* Hard cap: a clip that never fires `ended` cannot hold the app hostage. */
        guard = setTimeout(finish, 90000);

        try {
          const playing = video.play();
          if (playing && playing.catch) {
            playing.catch(function () {
              /* Sound refused (plain browser): retry muted so the animation still plays. */
              if (!video.muted) {
                video.muted = true;
                video.setAttribute('muted', '');
                const retry = video.play();
                if (retry && retry.catch) retry.catch(function () { finish(); });
                return;
              }
              finish();
            });
          }
        } catch (error) {
          finish();
        }
      }

      if (document.body) {
        build();
        return;
      }
      let tries = 0;
      (function waitBody() {
        if (document.body) {
          build();
          return;
        }
        tries += 1;
        if (tries < 200) setTimeout(waitBody, 30);
      })();
    }

    /* Surface tokens carry alpha so the video backdrop shows through; the settings page scales it. */
    const SURFACE_TOKENS = {
      '--dsw-alias-bg-base': { light: [241, 244, 250, 0.72], dark: [6, 10, 18, 0.52] },
      /* Raised surfaces (cards, dialogs, menus) stay close to opaque so text on them reads. */
      '--dsw-alias-bg-layer-1': { light: [255, 255, 255, 0.96], dark: [12, 20, 33, 0.94] },
      '--dsw-alias-bg-layer-2': { light: [236, 241, 251, 0.93], dark: [18, 29, 47, 0.9] },
      '--dsw-alias-bg-overlay': { light: [255, 255, 255, 0.99], dark: [21, 34, 58, 0.97] },
      '--dsw-specific-sidebar-fill': { light: [233, 239, 249, 0.7], dark: [4, 7, 13, 0.52] },
    };

    const OPAQUE_TOKENS = {
      '--dsw-alias-border-l1': { light: '#CBD6E8', dark: '#20304A' },
      '--dsw-alias-border-l2': { light: '#A3B4D0', dark: '#2B5578' },
      '--dsw-alias-brand-primary': { light: '#2456D6', dark: '#3E7BFF' },
      '--dsw-alias-label-primary': { light: '#121A2B', dark: '#E7F3FF' },
      '--dsw-alias-label-secondary': { light: '#5A6880', dark: '#8FA4C6' },
      '--dsw-alias-state-error-primary': { light: '#D63A63', dark: '#FF5C7E' },
      '--dsw-alias-state-idle-primary': { light: '#8592AA', dark: '#4A5A78' },
      '--dsw-alias-state-success-primary': { light: '#128A6B', dark: '#34E3A4' },
      '--dsw-alias-state-warn-primary': { light: '#B8791A', dark: '#FFC24B' },
    };

    /** `scale` 1 keeps the palette's own alpha, 0 makes the surface fully invisible. */
    function rgbaOf(parts, scale) {
      const alpha = Math.max(0, Math.min(1, parts[3] * scale));
      return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha.toFixed(3) + ')';
    }

    function buildTokens(surfacePercent) {
      const scale = Math.max(0, Math.min(1, surfacePercent / 100));
      const out = {};
      Object.keys(SURFACE_TOKENS).forEach(function (key) {
        const pair = SURFACE_TOKENS[key];
        out[key] = { light: rgbaOf(pair.light, scale), dark: rgbaOf(pair.dark, scale) };
      });
      Object.keys(OPAQUE_TOKENS).forEach(function (key) {
        out[key] = OPAQUE_TOKENS[key];
      });
      return out;
    }

    /*
     * Author-side preset recorder. The shipped look is **not** read from disk: `build.py` bakes
     * `assets/preset.json` into this bundle as `PRESET`, because a marketplace install is a
     * read-only package and the look has to travel inside `client.js`. This route exists only so
     * the owner can re-record the preset from the running app while developing (HANDOFF §4).
     */
    const PREF_ROUTE = '/yeermu-theme/preset';
    /* One stored look: surface strength (tokens), video strength, a scrim, and the title-bar line. */
    const LOOK_KEY = 'yeermu-theme.look.v1';
    const STATUS_MAX = 80;
    /*
     * Tone names for the segments that are not 曳尔沐 speaking (an intruder on her line).
     * Each maps to a glow rule in `FRAME_CSS` — `.yrm-tone-alien` (red) / `.yrm-tone-ghost` (green).
     */
    const TONE_ALIEN = 'alien';
    const TONE_GHOST = 'ghost';
    /* Idle chatter: the title-bar line rotates through these while the agent is not working. */
    const IDLE_LINES = [
      '叮咚叮咚~在干什么呢？',
      '没有事情做了吗...好吧~',
      '有什么需要我帮你的嘛？',
      '在休息吗鉴定师？要不我陪你聊聊天？',
      '是没有思路吗？',
      '鉴定师还在窗口前面嘛？别不理我呀~',
      '在摸鱼嘛？那我陪你会~',
      '窗口前的人，你好呀~',
      '莫非是要关闭进程啦？~',
      'deepseek Harness....功能真多呢！',
      '咚咚~参数要调吗？',
      '在研究提示词嘛？',
      '还要待机吗？好吧好吧~',
      '好短不见~我的朋友，在干什么呢？',
      '不操作吗？那先放松一下~',
      'DSH这个文件是指什么？大烧货吗？原来鉴定师还有这样的喜好~放心我不会说出去的~',
      '用户怎么没有操作请求呢？难道又是那家伙捣的鬼？',
      '鉴定师，你觉得API，和我的电话线有什么区别呢？',
      /* Not her voice: an intruder reaching into the 异象空间. Toned spans, see `lineSegments`. */
      [
        '鉴定师，我感觉我的异象空间有奇怪的东西接入进来了，不是EXE....什么...',
        ['【逻辑】', TONE_ALIEN],
        '？这是什么？',
      ],
      [['【未经授权的信息】我愿为你的灵魂祈祷，若你还有灵魂可言', TONE_ALIEN]],
      '通讯线路的稳定性有所提升哦~',
      '一通电话，我就来帮忙~',
      '叮咚叮咚~叮咚叮咚~叮咚叮咚~',
      '电话！来！电话！来！',
      '有什么事吗？我的朋友？',
      '老实写代码好枯燥啊...之前管理局好像收容过程序异象，要不借来用用？',
      [['【未经授权的信息】你盲目痴愚，而我们无所不知', TONE_GHOST]],
    ];
    const WORK_LINES = [
      '正在推演...',
      '别急，我在算~',
      '这么写...应该没问题！',
      '鉴定师这要求...我尽力而为吧~',
      '为什么跑不通呢...',
      '这个变量没错啊...',
      '啊！通啦通啦！',
      '要不...打电话问问别人？...不行，这是鉴定师的任务，我得自己做！',
      '嗯嗯...就是这样~',
      '我敲~我敲~我敲敲敲~',
      '怎么刚解决一个bug，又来一个？',
      '深度思考中...enmmm..',
      '这个不对..哦对的对的..等等不对...啊不是这是对的...诶等等好像这点不对...哦是对的~',
      '这一块终于好了...',
      '要好好思考鉴定师的要求呢...',
      '这样应该能跑起来...',
      'bug到底在哪呢？',
      '这还真能跑得动？代码，果然很神奇啊',
    ];
    const APPROVAL_LINES = [
      '鉴定师，请给一下权限，放心我只是为了你的工作~',
      '变量Z！发挥一下你的变量！',
      '鉴定师鉴定师！帮我打通这个权限墙！',
      '鉴定师，请批准一下~',
    ];
    const ERROR_LINES = [
      '糟了，出岔子了…',
      '完了...我好像把工作空间和异象空间搞混了...',
      '对不起，鉴定师...我在想办法解决...',
    ];

    /*
     * One row per agent state: which lines rotate, how fast, and the colour of the title-bar text.
     * `setPhase` is what the session hooks report into; idle is the default before a session speaks.
     */
    const PHASES = {
      idle: { lines: IDLE_LINES, interval: 20000, color: '#e2dcfb' },
      working: { lines: WORK_LINES, interval: 10000, color: '#a9dbff' },
      approval: { lines: APPROVAL_LINES, interval: 10000, color: '#ffe08a' },
      error: { lines: ERROR_LINES, interval: 10000, color: '#ffb3b3' },
    };
    const pickIndex = { idle: -1, working: -1, approval: -1, error: -1 };
    let phaseName = 'idle';
    let phaseTimer = 0;
    /* Per-character typing of the plate text. */
    const TYPE_MS = 42;
    let typeTimer = 0;
    let typeToken = 0;

    /*
     * `LOOK_DEFAULTS` is only the last-resort fallback (broken/absent preset). The shipped look is
     * `PRESET`, baked in at build time from `assets/preset.json`, so every install — and every
     * "restore defaults" — lands on the author's own tuning rather than on neutral 100/100/0.
     */
    const LOOK_DEFAULTS = {
      surface: 100,
      video: 100,
      veil: 0,
      status: '',
      frame: true,
      scene: 1,
      splash: true,
      splashSound: true,
      /* Persona is off until the owner unlocks it with the code; work role-play is a second opt-in. */
      persona: false,
      personaWork: false,
    };
    /* Injected by build.py: `assets/preset.json`. Never fetched, never written at runtime. */
    const PRESET = __PRESET__;
    let lookState = Object.assign({}, LOOK_DEFAULTS);
    let themeSeat = null;
    let surfaceOff = null;
    let extraOff = null;
    let lastMountError = null;
    let lastThemeError = null;

    /*
     * Surface tokens outside the documented 14. Dialogs and popovers paint with these
     * (`--dsw-specific-menu` is the panel surface), so leaving them unset keeps every modal as
     * translucent as the page background. Applied as a separate layer: if the theme service rejects
     * an unknown name, the base layer still lands.
     */
    const EXTRA_TOKENS = {
      '--dsw-specific-menu': { light: 'rgba(255,255,255,.99)', dark: 'rgba(21,34,58,.97)' },
      '--dsw-specific-input-major': { light: '#ffffff', dark: 'rgba(14,23,38,.97)' },
      '--dsw-specific-selector': { light: '#f4f1fd', dark: 'rgba(30,44,70,.96)' },
      '--dsw-specific-bubble': { light: 'rgba(255,255,255,.88)', dark: 'rgba(24,38,60,.72)' },
    };

    function clampPercent(value, fallback) {
      const number = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.max(0, Math.min(100, Math.round(number)));
    }

    function clampStatus(value) {
      if (typeof value !== 'string') return '';
      return value.trim().slice(0, STATUS_MAX);
    }

    /** Next line for one phase, never the same one twice in a row. */
    function pickLine(name) {
      const conf = PHASES[name];
      if (!conf || conf.lines.length === 0) return '';
      const lines = conf.lines;
      let next = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && next === pickIndex[name]) next = (next + 1) % lines.length;
      pickIndex[name] = next;
      return lines[next];
    }

    /**
     * Shape one parsed blob into a complete look, clamping every field.
     *
     * Shared by `loadLook` (localStorage) and the prefs-file import, so a hand-edited or stale file
     * can never put an out-of-range value into the theme layer.
     * @param {unknown} parsed decoded JSON, of unknown shape.
     * @returns {object} a full look object.
     */
    function normalizeLook(parsed) {
      const source = parsed && typeof parsed === 'object' ? parsed : {};
      return {
        surface: clampPercent(source.surface, LOOK_DEFAULTS.surface),
        video: clampPercent(source.video, LOOK_DEFAULTS.video),
        veil: clampPercent(source.veil, LOOK_DEFAULTS.veil),
        status: clampStatus(source.status),
        frame: source.frame !== false,
        scene: Math.max(1, Math.min(SCENE_COUNT, Number(source.scene) || 1)),
        splash: source.splash !== false,
        splashSound: source.splashSound !== false,
        persona: source.persona === true,
        personaWork: source.personaWork === true,
      };
    }

    /** Raw stored look, or null when this origin has never saved one. */
    function readStoredLook() {
      try {
        return window.localStorage.getItem(LOOK_KEY);
      } catch (error) {
        return null;
      }
    }

    /**
     * The shipped look, as a complete look object.
     *
     * The persona switches are ordinary fields here: the card is part of what this plugin is, and
     * the author ships them deliberately (a non-commercial fan work; the card's own notice covers
     * attribution). `normalizeLook` still coerces them to strict booleans.
     * @returns {object} a full, clamped look.
     */
    function presetLook() {
      return normalizeLook(PRESET && PRESET.look ? PRESET.look : null);
    }

    /** Portrait index shipped with the preset (0 when absent or out of range). */
    function presetFace() {
      const index = Number(PRESET && PRESET.face);
      return Number.isInteger(index) && index >= 0 && index < FACES.length ? index : 0;
    }

    function loadLook() {
      try {
        const raw = readStoredLook();
        if (!raw) return presetLook();
        return normalizeLook(JSON.parse(raw));
      } catch (error) {
        return presetLook();
      }
    }

    function saveLook(next) {
      try {
        window.localStorage.setItem(LOOK_KEY, JSON.stringify(next));
      } catch (error) {
        /* a page without Web Storage keeps the value for this session only */
      }
    }

    /**
     * Where the preset file lives, for the settings page note.
     * @returns {Promise<string>} absolute path, or '' when the host half has no route.
     */
    function fetchPresetInfo() {
      if (typeof fetch !== 'function') return Promise.resolve('');
      return fetch(PREF_ROUTE, { cache: 'no-store' })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (json) {
          return json && typeof json.path === 'string' ? json.path : '';
        })
        .catch(function () {
          return '';
        });
    }

    /**
     * Author tool: re-record `assets/preset.json` from the running app.
     *
     * Only meaningful in a development checkout — a published plugin lives in a read-only package,
     * where the host route answers 500 and the settings note says so.
     * @returns {Promise<{ok: boolean, path?: string, error?: string}>} host reply or local failure.
     */
    function savePreset() {
      if (typeof fetch !== 'function') return Promise.resolve({ ok: false, error: 'fetch unavailable' });
      return fetch(PREF_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 1, look: lookState, face: loadFaceIndex() }),
      })
        .then(function (response) {
          return response.json();
        })
        .catch(function (error) {
          return { ok: false, error: String(error && error.message ? error.message : error) };
        });
    }

    /** Re-stack the token layer for the chosen surface strength. */
    function applySurface(percent) {
      if (!themeSeat || typeof themeSeat.overrideTokens !== 'function') {
        lastThemeError = themeSeat ? 'theme service has no overrideTokens' : 'theme service unavailable';
        return;
      }
      try {
        surfaceOff = themeSeat.overrideTokens(SOURCE, buildTokens(percent));
        lastThemeError = null;
      } catch (error) {
        lastThemeError = String(error && error.message ? error.message : error);
        console.error('[yeermu-theme] token override failed', error);
      }
      /* Best effort: an unknown token name here must not cost us the base layer above. */
      try {
        extraOff = themeSeat.overrideTokens(SOURCE + '/surfaces', EXTRA_TOKENS);
      } catch (error) {
        extraOff = null;
        console.error('[yeermu-theme] surface token override rejected', error);
      }
    }

    /** Push video strength and scrim onto the mounted backdrop, if it is there. */
    function applyBackdropLook(look) {
      if (typeof document === 'undefined') return;
      const wrap = document.getElementById('yrm-backdrop');
      if (!wrap) return;
      const video = wrap.querySelector('video');
      if (video) {
        video.style.opacity = String(look.video / 100);
        const sceneIndex = Math.max(1, Math.min(SCENE_COUNT, Number(look.scene) || 1));
        video.style.objectPosition = SCENE_POSITION[sceneIndex];
        /* Swap the clip only when the scene actually changed; a same-src assignment reloads it. */
        const next = sceneSrc(look.scene);
        if (video.getAttribute('src') !== next) {
          video.setAttribute('src', next);
          video.load();
          try {
            const playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          } catch (error) {
            /* autoplay guards are handled by the play() callers */
          }
        }
      }
      const veil = wrap.querySelector('.yrm-veil');
      if (veil) veil.style.background = 'rgba(4,7,13,' + (look.veil / 100).toFixed(3) + ')';
    }

    /**
     * Type one line into the plate, character by character.
     *
     * A new call cancels the previous run (`typeToken` guards the stale interval), so a phase
     * switch mid-sentence does not interleave two lines.
     */
    function setStatus(text) {
      if (typeof document === 'undefined') return;
      const plate = document.querySelector('#yrm-frame .yrm-status span');
      if (!plate) return;
      /* A line is either plain text or `[text, tone]` segments (see `lineSegments`). */
      const segments = lineSegments(text);
      const length = segments.reduce(function (sum, segment) {
        return sum + segment.text.length;
      }, 0);
      if (typeTimer) {
        clearInterval(typeTimer);
        typeTimer = 0;
      }
      typeToken += 1;
      const token = typeToken;
      plate.textContent = '';
      plate.classList.add('is-typing');
      if (length === 0) {
        plate.classList.remove('is-typing');
        return;
      }
      let shown = 0;
      typeTimer = setInterval(function () {
        if (token !== typeToken) return;
        shown += 1;
        paintSegments(plate, segments, shown);
        if (shown >= length) {
          clearInterval(typeTimer);
          typeTimer = 0;
          plate.classList.remove('is-typing');
        }
      }, TYPE_MS);
    }

    /**
     * Normalise one status entry into `{ text, tone }` segments.
     *
     * Accepted shapes: a plain string; an array of parts, where each part is either a string or a
     * `[text, tone]` pair. Everything else yields no segments (the plate simply stays empty).
     * @param {unknown} entry one entry from a phase's line list, or the pinned settings line.
     * @returns {Array<{text: string, tone: string}>}
     */
    function lineSegments(entry) {
      if (typeof entry === 'string') return [{ text: entry, tone: '' }];
      if (!Array.isArray(entry)) return [];
      const out = [];
      for (const part of entry) {
        if (typeof part === 'string') {
          out.push({ text: part, tone: '' });
        } else if (Array.isArray(part) && typeof part[0] === 'string') {
          out.push({ text: part[0], tone: typeof part[1] === 'string' ? part[1] : '' });
        }
      }
      return out;
    }

    /**
     * Paint the first `limit` characters of the segments into the plate, keeping each tone in its
     * own span. Text nodes are used throughout, so a line can never inject markup.
     * @param {HTMLElement} plate the inner span of the status plate.
     * @param {Array<{text: string, tone: string}>} segments normalised line.
     * @param {number} limit characters to show (typewriter cursor position).
     */
    function paintSegments(plate, segments, limit) {
      plate.textContent = '';
      let left = limit;
      for (const segment of segments) {
        if (left <= 0) break;
        const visible = segment.text.slice(0, left);
        left -= visible.length;
        if (segment.tone) {
          const span = document.createElement('span');
          span.className = 'yrm-tone-' + segment.tone;
          span.textContent = visible;
          plate.appendChild(span);
        } else {
          plate.appendChild(document.createTextNode(visible));
        }
      }
    }

    /** A settings override pins the plate; otherwise it drops back to the idle rotation. */
    function refreshStatus(look) {
      const custom = clampStatus(look.status);
      if (custom !== '') {
        setStatus(custom);
        return;
      }
      paintPhaseColor();
      setStatus(pickLine(phaseName));
    }

    /** Tint the plate's text for the current phase (idle lavender / work blue / approval amber / error red). */
    function paintPhaseColor() {
      if (typeof document === 'undefined') return;
      const span = document.querySelector('#yrm-frame .yrm-status span');
      const conf = PHASES[phaseName];
      if (span && conf) span.style.color = conf.color;
    }

    function restartPhaseTimer() {
      if (phaseTimer) clearInterval(phaseTimer);
      const conf = PHASES[phaseName];
      if (!conf) return;
      phaseTimer = setInterval(function () {
        if (clampStatus(lookState.status) !== '') return;
        setStatus(pickLine(phaseName));
      }, conf.interval);
    }

    /** Switch agent state: repaint the colour, show a fresh line, and re-arm the rotation timer. */
    function setPhase(name) {
      if (!PHASES[name]) return;
      const changed = name !== phaseName;
      phaseName = name;
      paintPhaseColor();
      if (clampStatus(lookState.status) === '' && changed) setStatus(pickLine(name));
      restartPhaseTimer();
    }

    function stopPhaseTimer() {
      if (phaseTimer) clearInterval(phaseTimer);
      phaseTimer = 0;
    }

    /** Session hooks report here; precedence is error > approval > working > idle. */
    function reportSessionState(state) {
      const next = state.error ? 'error' : state.pending ? 'approval' : state.running ? 'working' : 'idle';
      setPhase(next);
    }

    /**
     * Turn the whole window chrome on or off at runtime. Off drops the overlay and the backdrop and
     * restores the stock look — the escape hatch for surfaces a native WebContentsView covers.
     */
    let remountOverlay = null;

    function applyFrame(on) {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      if (!root) return;
      if (!on) {
        root.classList.remove('yrm-frame-on');
        const frameEl = document.getElementById('yrm-frame');
        if (frameEl) frameEl.remove();
        const backdropEl = document.getElementById('yrm-backdrop');
        if (backdropEl) backdropEl.remove();
        return;
      }
      root.classList.add('yrm-frame-on');
      if (typeof remountOverlay === 'function') remountOverlay();
    }

    function applyLook(look) {
      applySurface(look.surface);
      applyFrame(look.frame !== false);
      applyBackdropLook(look);
      refreshStatus(look);
      syncPersona(look);
    }

    /* ---- persona: the switch lives here, the instruction file lives on the host ---- */
    const PERSONA_CODE = '316651';

    /**
     * Mirror the two switches onto the host, which writes/removes `AGENTS.local.md`. Failures are
     * logged only: a theme must never break the app over an optional feature.
     */
    function syncPersona(look) {
      if (typeof fetch !== 'function') return;
      const payload = { enabled: look.persona === true, workRoleplay: look.personaWork === true };
      fetch('/yeermu-theme/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (json) {
          if (json && json.ok === false) console.warn('[yeermu-theme] persona:', json.error);
        })
        .catch(function () {
          /* host half missing (older build) — the switch simply does nothing */
        });
    }

    /** Called by the 316651 shortcut and by the settings checkbox. */
    function enablePersona() {
      const next = Object.assign({}, lookState, { persona: true });
      lookState = next;
      saveLook(next);
      applyLook(next);
      try {
        setStatus('语音线路接通——是我是我，好久不见啊？');
      } catch (error) {
        /* the plate may not be mounted yet */
      }
    }

    /** Native setter + input event, so the host's controlled textarea actually clears. */
    function clearComposer(element) {
      try {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          const proto =
            element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          if (descriptor && descriptor.set) descriptor.set.call(element, '');
          else element.value = '';
        } else if (element.isContentEditable) {
          element.textContent = '';
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (error) {
        /* clearing is cosmetic: the switch already flipped */
      }
    }

    /**
     * Type the unlock code and press Enter in the composer: the persona turns on instead of the
     * code being sent as a message. Capture phase so the host's own Enter handler never runs.
     */
    function watchPersonaCode() {
      if (typeof document === 'undefined') return function () {};
      function onKeyDown(event) {
        if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
        const element = event.target;
        if (!element) return;
        const editable =
          element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.isContentEditable === true;
        if (!editable) return;
        const value =
          typeof element.value === 'string' ? element.value : element.textContent || '';
        if (value.trim() !== PERSONA_CODE) return;
        event.preventDefault();
        event.stopPropagation();
        clearComposer(element);
        enablePersona();
      }
      document.addEventListener('keydown', onKeyDown, true);
      return function () {
        document.removeEventListener('keydown', onKeyDown, true);
      };
    }

    const CSS = [
      /*
       * One row: calendar tile, the XP card, monitor tile. The middle card keeps the centre only
       * because both side tiles are the same width; `.yrm-pan-ghost` holds the right seat until the
       * monitor ships.
       */
      '.yrm-dock{display:flex;justify-content:center;align-items:flex-end;gap:14px;',
      '  padding:6px 0 4px;pointer-events:none}',
      /* Too narrow to hold three tiles: drop the sides instead of squeezing the card. */
      '.yrm-dock.is-tight .yrm-pan{display:none}',
      /* Hide the shipped stat pills and context ring that would sit beside this window. */
      '[data-composer-dock] [data-composer-stat]{display:none!important}',
      '[data-composer-dock] > span{display:none!important}',
      /* ---- window chrome: flat pixel window ---- */
      '.yrm-win{',
      '  width:424px;max-width:100%;position:relative;overflow:hidden;box-sizing:border-box;',
      /* 2px light frame with a hard 1px dark outline — no radii, no gradients. */
      '  border:2px solid #e0e0e0;border-radius:0;background:#cfcfcf;',
      '  box-shadow:0 0 0 1px #2b2b2b,0 7px 16px -10px #000000d0;',
      '  font-family:Tahoma,"MS Sans Serif","SimSun",sans-serif;color:#1a1a1a;',
      '}',
      '.yrm-bar{display:flex;align-items:center;gap:6px;height:28px;padding:0 3px 0 6px;',
      '  background:#3d80e8;border-bottom:1px solid #1b52b8;',
      '  box-shadow:inset 0 1px 0 #a6c8f8,inset 0 -1px 0 #1b52b8}',
      '.yrm-ico{width:18px;height:18px;flex:0 0 18px;border:1px solid #141414;border-radius:0;',
      '  box-shadow:inset 1px 1px 0 #ffffff}',
      '.yrm-ico img{width:100%;height:100%;object-fit:cover;display:block}',
      '.yrm-title{font-family:"YermuPixel","Zpix","SimSun",monospace;font-size:14px;font-weight:400;',
      '  color:#fff;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      /* Title-bar buttons: white pixel squares with black glyphs, exactly like the reference. */
      '.yrm-btns{margin-left:auto;display:flex;gap:3px}',
      '.yrm-btns span{width:16px;height:14px;display:flex;align-items:center;justify-content:center;',
      '  border:1px solid #141414;border-radius:0;background:#f2f2f2;color:#141414;',
      '  box-shadow:inset 1px 1px 0 #ffffff,inset -1px -1px 0 #b3b3b3;',
      '  font:10px/1 Tahoma,sans-serif}',
      '.yrm-btns span.yrm-x{background:#f2f2f2;color:#141414}',
      /* ---- body ---- */
      '.yrm-body{display:flex;gap:12px;padding:11px 12px 12px}',
      '.yrm-well{position:relative;width:106px;height:106px;flex:0 0 106px;overflow:hidden;',
      '  background:#fff;border:1px solid #8a8a8a;border-right-color:#f4f4f4;',
      '  border-bottom-color:#f4f4f4;box-shadow:inset 1px 1px 0 #6f6f6f;',
      /* The dock layer is click-through for the composer; this square is the one input seat. */
      '  pointer-events:auto;cursor:pointer;-webkit-user-select:none;user-select:none}',
      '.yrm-well:focus-visible{outline:2px solid #2b8bff;outline-offset:-2px}',
      '.yrm-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
      '  font-family:"SimSun",serif;font-size:30px;color:#2b6fd0;opacity:.3}',
      '.yrm-shot{position:relative;width:100%;height:100%;object-fit:cover;display:block;',
      '  filter:saturate(.97) contrast(1.03)}',
      '.yrm-scan{position:absolute;inset:0;pointer-events:none;',
      '  background:repeating-linear-gradient(to bottom,#0b1a3a10 0 1px,transparent 1px 3px),',
      '    radial-gradient(120% 80% at 50% 0%,#4ff0ff14,transparent 62%)}',
      /*
       * Portrait switch: an "electromagnetic interference" burst. Three layers do the work —
       * the image tears side to side with contrast/bloom flicker, a vertical static band sweeps
       * across, and two rings expand from the click point. The artwork itself is swapped after
       * 150ms, right where the burst is brightest, so the change is hidden inside the noise.
       */
      '.yrm-emi{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:0;',
      '  mix-blend-mode:screen}',
      '.yrm-well.is-emi .yrm-emi{opacity:1}',
      '.yrm-emi::before{content:"";position:absolute;inset:-25% -12%;opacity:0;',
      '  background:repeating-linear-gradient(90deg,rgba(150,232,255,.55) 0 1px,rgba(150,232,255,0) 1px 5px)}',
      '.yrm-well.is-emi .yrm-emi::before{animation:yrm-emi-noise .46s steps(3) 1 both}',
      '.yrm-well.is-emi .yrm-shot{animation:yrm-emi-shift .46s steps(1) 1 both}',
      '.yrm-ripple{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;',
      '  border:2px solid rgba(132,228,255,.9);',
      '  box-shadow:0 0 10px rgba(126,222,255,.7),inset 0 0 8px rgba(126,222,255,.4);',
      '  opacity:0;transform:scale(.1);pointer-events:none;z-index:4}',
      '.yrm-well.is-emi .yrm-ripple{animation:yrm-ripple .5s cubic-bezier(.2,.72,.28,1) 1 both}',
      '.yrm-well.is-emi .yrm-ripple-b{animation-delay:.12s}',
      '@keyframes yrm-emi-shift{',
      '  0%{transform:translate3d(0,0,0);filter:saturate(.97) contrast(1.03)}',
      '  9%{transform:translate3d(-5px,0,0) skewX(-3deg);',
      '    filter:contrast(1.9) brightness(1.45) hue-rotate(-14deg)}',
      '  20%{transform:translate3d(6px,-2px,0);filter:contrast(.6) brightness(.62) saturate(2)}',
      '  31%{transform:translate3d(-7px,1px,0) skewX(2deg);',
      '    filter:contrast(2.4) brightness(1.2) hue-rotate(22deg)}',
      '  43%{transform:translate3d(4px,2px,0);filter:contrast(1.1) brightness(.9)}',
      '  56%{transform:translate3d(-3px,-1px,0) skewX(-1deg);filter:contrast(1.8) brightness(1.3)}',
      '  70%{transform:translate3d(2px,0,0);filter:contrast(.9) brightness(.95)}',
      '  85%{transform:translate3d(-1px,0,0);filter:contrast(1.05)}',
      '  100%{transform:none;filter:saturate(.97) contrast(1.03)}}',
      '@keyframes yrm-emi-noise{',
      '  0%{opacity:0;transform:translate3d(0,0,0)}',
      '  8%{opacity:.85;transform:translate3d(-8%,0,0)}',
      '  22%{opacity:.2;transform:translate3d(6%,1px,0)}',
      '  40%{opacity:.75;transform:translate3d(-3%,-1px,0)}',
      '  58%{opacity:.15;transform:translate3d(5%,0,0)}',
      '  74%{opacity:.5;transform:translate3d(-2%,0,0)}',
      '  100%{opacity:0;transform:translate3d(0,0,0)}}',
      '@keyframes yrm-ripple{',
      '  0%{opacity:0;transform:scale(.12)}',
      '  10%{opacity:.95;transform:scale(.3)}',
      '  55%{opacity:.45;transform:scale(1.7)}',
      '  100%{opacity:0;transform:scale(2.8)}}',
      /* ---- text column ---- */
      '.yrm-meta{display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:0;flex:1 1 auto}',
      '.yrm-name{display:flex;align-items:center;gap:7px;font-size:19px;font-weight:700;line-height:1.15;',
      '  color:#141414;letter-spacing:.04em;font-family:"SimSun",Tahoma,sans-serif;white-space:nowrap}',
      '.yrm-led{width:8px;height:8px;flex:0 0 8px;border:1px solid #1d5c1a;border-radius:1px;',
      '  background:radial-gradient(circle at 35% 30%,#c8ff9e,#39a832 60%,#1d7a18);',
      '  animation:yrm-led 2.6s steps(1) infinite}',
      /* Called away / offline: steady red. Working: blue, blinking faster. */
      '.yrm-led.is-offline{border-color:#7a1f0c;animation:none;',
      '  background:radial-gradient(circle at 35% 30%,#ffb3a0,#e5543a 60%,#8f2410)}',
      '.yrm-led.is-busy{border-color:#16408f;animation-duration:1.1s;',
      '  background:radial-gradient(circle at 35% 30%,#bfe0ff,#3b8ef0 60%,#1a52b8)}',
      '.yrm-id{font-size:12.5px;font-weight:600;letter-spacing:.02em;color:#4f4f4f;',
      '  font-family:"Microsoft YaHei","MS YaHei",Tahoma,sans-serif}',
      '.yrm-stats{display:flex;align-items:baseline;gap:6px;font-size:12px;font-weight:600;color:#245a8c;',
      '  white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:.02em}',
      '.yrm-stats b{font-weight:700;color:#123049}',
      '.yrm-sep{color:#8a8a7a}',
      /* ---- XP progress well ---- */
      '.yrm-ctx{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#44443a}',
      '.yrm-track{position:relative;display:flex;align-items:center;gap:1px;flex:1 1 auto;height:12px;',
      '  padding:1px;overflow:hidden;background:#fff;border:1px solid #8a8a8a;',
      '  border-right-color:#f4f4f4;border-bottom-color:#f4f4f4;box-shadow:inset 1px 1px 0 #6f6f6f}',
      '.yrm-track i{flex:1 1 0;height:7px;background:#f2f0e4;box-shadow:inset 0 0 0 1px #ffffff66}',
      '.yrm-track i.on{background:linear-gradient(180deg,#9ff58f,#4fc63f 55%,#2f9c22);',
      '  box-shadow:inset 0 0 0 1px #ffffff55}',
      '.yrm-pct{font-variant-numeric:tabular-nums;color:#174a78;font-weight:700;min-width:30px;',
      '  text-align:right;font-size:12px}',
      /* ---- side tiles: same Luna language, one step smaller ---- */
      '.yrm-pan{width:214px;flex:0 0 214px;position:relative;overflow:hidden;box-sizing:border-box;',
      /* Height is measured from the XP card and injected as a custom property, so all three
         tiles close on the same line no matter what the card's content does. */
      '  height:var(--yrm-tile-h,auto);display:flex;flex-direction:column;',
      '  border:2px solid #e0e0e0;border-radius:0;background:#cfcfcf;',
      '  box-shadow:0 0 0 1px #2b2b2b,0 6px 14px -10px #000000cc;',
      /* YaHei over Tahoma: the tile text is 9-11px, and SimSun/Tahoma read too thin there. */
      '  font-family:"Microsoft YaHei","MS YaHei",Tahoma,sans-serif;color:#16160f}',
      '.yrm-pan-bar{display:flex;align-items:center;gap:6px;height:23px;padding:0 3px 0 6px;',
      '  background:#3d80e8;border-bottom:1px solid #1b52b8;',
      '  box-shadow:inset 0 1px 0 #a6c8f8,inset 0 -1px 0 #1b52b8;',
      '  font-family:"YermuPixel","Zpix","SimSun",monospace;font-size:14px;font-weight:400;',
      '  color:#fff;letter-spacing:.04em}',
      '.yrm-pan-bar .yrm-btns span{width:13px;height:12px;font-size:9px;gap:2px}',
      '.yrm-pan-bar .yrm-btns{gap:2px}',
      '.yrm-pan-dot{width:6px;height:6px;flex:0 0 6px;border-radius:50%;',
      '  background:radial-gradient(circle at 35% 30%,#c8ff9e,#39a832 65%,#1d7a18);',
      '  box-shadow:0 0 0 1px #1d5c1a}',
      '.yrm-pan-body{padding:7px 8px 8px;display:flex;flex-direction:column;gap:6px;flex:1;min-height:0}',
      '.yrm-cal-head{display:flex;align-items:flex-end;gap:7px}',
      '.yrm-cal-day{font:700 30px/.85 "SimSun",serif;color:#0b3f8f;letter-spacing:-.02em}',
      '.yrm-cal-meta{display:flex;flex-direction:column;gap:1px;padding-bottom:2px}',
      '.yrm-cal-meta b{font-size:11px;font-weight:700;color:#23231d}',
      '.yrm-cal-meta i{font-size:10.5px;font-style:normal;font-weight:600;color:#5a5a4c}',
      '.yrm-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;',
      '  border-top:1px solid #c4c4c4;padding-top:4px;row-gap:1px}',
      /*
       * The tile is pinned to the XP card's height, so a 6-row month does not fit any more: the
       * grid scrolls inside its own hairline scrollbar while the date header and the weather
       * strip stay put.
       */
      '.yrm-cal-scroll{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;',
      '  scrollbar-width:thin;scrollbar-color:#5f9fe8 #d0d0d0}',
      '.yrm-cal-scroll::-webkit-scrollbar{width:6px}',
      '.yrm-cal-scroll::-webkit-scrollbar-track{background:#d0d0d0;border-left:1px solid #bdbdbd}',
      '.yrm-cal-scroll::-webkit-scrollbar-thumb{',
      '  background:linear-gradient(180deg,#a8cdf6,#5f9fe8 55%,#2f6fbd);',
      '  border:1px solid #2a62a8}',
      '.yrm-cal-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#c0dcfa,#6ea9ec 55%,#3a7ccb)}',
      '.yrm-cal-grid b{font-weight:700;font-size:9.5px;color:#6e6e5c;padding:1px 0}',
      '.yrm-cal-grid i{font-style:normal;font-weight:600;font-size:10px;color:#1f1f18;',
      '  padding:1px 0;border-radius:2px}',
      '.yrm-cal-grid i.out{color:#a5a294;font-weight:400}',
      '.yrm-cal-grid i.now{background:linear-gradient(180deg,#3c9bff,#0d6ff0);color:#fff;font-weight:700}',
      '.yrm-wx{display:flex;align-items:center;gap:7px;padding-top:5px;border-top:1px solid #c4c4c4;',
      '  margin-top:auto}',
      '.yrm-wx-ico{width:20px;text-align:center;font:16px/1 "Segoe UI Symbol","Segoe UI",sans-serif;',
      '  color:#2b6fd0}',
      '.yrm-wx-temp{font-size:18px;font-weight:700;color:#0b3f8f;font-variant-numeric:tabular-nums}',
      '.yrm-wx-txt{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.yrm-wx-txt b{font-size:10.5px;font-weight:600;color:#33332b;white-space:nowrap;',
      '  overflow:hidden;text-overflow:ellipsis}',
      '.yrm-wx-txt i{font-size:10px;font-style:normal;font-weight:600;color:#66665a;letter-spacing:.04em}',
      /* ---- right tile: system monitor ---- */
      '.yrm-pan.is-mon .yrm-pan-body{flex:1;justify-content:space-between;min-height:0}',
      /* Rows share the stretched height; the footer stays on the bottom edge. */
      '.yrm-pan.is-mon .yrm-mon{flex:1;justify-content:space-around}',
      '.yrm-pan-tag{margin-left:6px;font-size:9px;font-weight:400;opacity:.85;letter-spacing:0;',
      '  font-family:Tahoma,sans-serif}',
      '.yrm-mon{display:flex;flex-direction:column;gap:8px}',
      '.yrm-mon-row{display:grid;grid-template-columns:32px 1fr 50px;align-items:center;gap:6px}',
      '.yrm-mon-lbl{font-size:12px;font-weight:700;letter-spacing:.02em;color:#3a3a2f}',
      /*
       * Windows XP progress sprite, pixel-border style: four separate 2px black bars with the
       * corners left open (top/bottom bars inset sideways, side bars inset vertically), a white
       * trough, and the fill floating 2px inside it — no leading cap.
       */
      '.yrm-mon-bar{position:relative;height:17px;background:',
      '  linear-gradient(#000,#000) 2px 0 / calc(100% - 4px) 2px no-repeat,',
      '  linear-gradient(#000,#000) 2px 100% / calc(100% - 4px) 2px no-repeat,',
      '  linear-gradient(#000,#000) 0 2px / 2px calc(100% - 4px) no-repeat,',
      '  linear-gradient(#000,#000) 100% 2px / 2px calc(100% - 4px) no-repeat,',
      '  #fff}',
      '.yrm-mon-fill{position:absolute;left:4px;top:4px;bottom:4px;max-width:calc(100% - 8px);',
      '  background:linear-gradient(180deg,#d9edfe 0%,#d9edfe 22%,#8ec2f7 22%,#5f9fe8 76%,',
      '    #2f6fbd 76%,#2a62a8 100%);',
      '  transition:width .5s linear}',
      '.yrm-mon-fill.warn{background:linear-gradient(180deg,#fff3cf 0%,#fff3cf 22%,#f7d169 22%,',
      '  #e9b23a 76%,#b9801c 76%,#a06c12 100%)}',
      '.yrm-mon-fill.hot{background:linear-gradient(180deg,#ffded5 0%,#ffded5 22%,#f79a7e 22%,',
      '  #e5543a 76%,#b02f18 76%,#8f2410 100%)}',
      '.yrm-mon-val{font-size:12px;text-align:right;color:#123f68;font-weight:700;',
      '  font-variant-numeric:tabular-nums}',
      '.yrm-mon-foot{display:flex;justify-content:space-between;gap:6px;font-size:11px;',
      '  font-weight:600;color:#57574b;border-top:1px solid #c4c4c4;padding-top:4px;',
      '  font-variant-numeric:tabular-nums}',
      /* ---- sidebar mark: an XP shortcut icon ---- */
      '.yrm-mark{position:relative;display:inline-flex;flex:0 0 auto;',
      '  border:1px solid #0831d9;border-radius:3px;background:#fff;overflow:hidden;',
      '  box-shadow:inset 0 1px 0 #ffffff,0 0 0 1px #ffffff40,0 1px 2px #00000040;vertical-align:middle}',
      '.yrm-mark-img{width:100%;height:100%;object-fit:cover;display:block}',
      '.yrm-mark-led{position:absolute;right:1px;bottom:1px;width:5px;height:5px;border-radius:50%;',
      '  border:1px solid #1d5c1a;background:radial-gradient(circle at 35% 30%,#c8ff9e,#39a832 65%,#1d7a18)}',
      '@keyframes yrm-led{0%,80%{opacity:1}81%,100%{opacity:.45}}',
      /* ---- settings page ---- */
      '.yrm-set{display:flex;flex-direction:column;gap:10px;padding:2px;',
      '  font-family:"Microsoft YaHei","MS YaHei","PingFang SC",Tahoma,sans-serif;',
      '  color:var(--dsw-alias-label-primary)}',
      /* One face across the whole section, including controls that set their own font. */
      '.yrm-set, .yrm-set *{font-family:"Microsoft YaHei","MS YaHei","PingFang SC",Tahoma,sans-serif}',
      '.yrm-set-sub{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin:0 0 4px}',
      /* Amber caveat line: the persona only reaches the workspace that owns this package. */
      '.yrm-set-note{font-size:12px;line-height:1.6;margin:0 0 4px;padding:8px 10px;border-radius:6px;',
      '  background:rgba(255,193,7,.13);border:1px solid rgba(255,193,7,.42);',
      '  color:var(--dsw-alias-state-warn-primary)}',
      '.yrm-set-note code{font-family:"Consolas","Menlo",monospace;font-size:11.5px;',
      '  word-break:break-all;color:inherit}',
      '.yrm-set-row{display:flex;align-items:center;gap:12px;padding:10px 0;',
      '  border-top:1px solid var(--dsw-alias-border-l1)}',
      '.yrm-set-name{flex:0 0 128px;font-size:13px}',
      '.yrm-set-range{flex:1 1 auto;min-width:110px;accent-color:var(--dsw-alias-brand-primary)}',
      '.yrm-set-val{flex:0 0 50px;text-align:right;font-size:12px;font-variant-numeric:tabular-nums;',
      '  color:var(--dsw-alias-label-secondary)}',
      '.yrm-set-actions{display:flex;align-items:center;gap:10px;padding-top:4px}',      '.yrm-set-btn{font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;cursor:pointer;',
      '  color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);',
      '  border:1px solid var(--dsw-alias-border-l2)}',
      '.yrm-set-btn:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.yrm-set-seg{display:flex;gap:6px;flex:1 1 auto}',
      '.yrm-set-seg-btn{font:12px/1 "YermuPixel","SimSun",Tahoma,sans-serif;padding:6px 12px;',
      '  border-radius:5px;cursor:pointer;color:var(--dsw-alias-label-secondary);',
      '  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}',
      '.yrm-set-seg-btn:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.yrm-set-seg-btn.is-on{color:#fff;border-color:#5b4d95;',
      '  background:linear-gradient(180deg,#a99ad8,#7d6bb8)}',
      /*
       * Settings dialog: only its own surface is made opaque, in the theme's own colour. Text and
       * controls keep their native colours, so nothing goes unreadable in either colour scheme.
       * The class is attached synchronously by a MutationObserver, before the panel is painted.
       */
      /*
       * Windows-XP skin for the settings dialog, replacing the old white panel with the purple
       * rings. The shell (ui-settings-general, `AnXs9G_*`) lays out a 800px grid: the title cell
       * («设置») and the header cell (打开配置文件 / close) share the top row, so giving both the
       * same gradient turns them into one continuous XP title bar; below it sit the nav list and the
       * content pane. Radii come from the host's tokens, so they are neutralised per dialog instead
       * of per class.
       */
      '.yrm-panel-skin{background:#ece9d8 !important;border-radius:0 !important;',
      '  box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 0 1px #0054e3 !important}',
      'body[data-ds-dark-theme] .yrm-panel-skin{background:#ece9d8 !important}',
      /* The purple window frame steps aside while the dialog is open. */
      'html:has(.yrm-panel-skin) #yrm-frame{display:none !important}',
      '.AnXs9G_panel,.yrm-panel-skin{--dsw-radius-sm:2px;--dsw-radius-md:2px;--dsw-radius-lg:2px;',
      '  --dsw-radius-xl:2px;--dsw-radius-panel:0px}',
      /*
       * XP surfaces are light in both schemes, so the *text* tokens have to be pinned here too.
       * Without this the dark theme kept handing out its pale `label-*` values, which vanished into
       * the grey sheet (section titles, descriptions, row labels). The shell only uses
       * `label-primary` / `-secondary` / `-tertiary` (checked against ui-settings-general), and the
       * input/menu surfaces get light values so the 字号大小 box and the dropdowns stay readable.
       */
      '.yrm-panel-skin,.AnXs9G_panel{--dsw-alias-label-primary:#1a1a1a;',
      '  --dsw-alias-label-secondary:#3a3a3a;--dsw-alias-label-tertiary:#555;',
      '  --dsw-alias-label-caption:#555;--dsw-alias-label-dimmed:#666;',
      '  --dsw-alias-bg-base:#ece9d8;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-layer-2:#ece9d8;',
      '  --dsw-alias-bg-layer-3:#fff;--dsw-alias-bg-layer-4:#ece9d8;',
      /* "Module" surfaces: the font-size stepper, the language / preference selectors and the info
       * boxes all paint with this one token, which is dark under the dark theme. Bottom-of-the-list
       * culprit for the black-on-black number box. */
      '  --dsw-alias-bg-module-platform:#fff;',
      /* Remaining surfaces the settings pages paint with (counted across the settings bundles):
       * cards, pressed states, skeletons and the two static neutrals some rows still reference. */
      '  --dsw-alias-settings-card-fill:#fff;--dsw-alias-interactive-bg-active:#cfe0f7;',
      '  --dsw-alias-interactive-bg-hover-solid:#d6e6ff;--dsw-alias-bg-skeleton:#e6e3d8;',
      '  --dsw-static-neutral-bluish-55:#f4f3ef;--dsw-static-neutral-bluish-850:#ece9d8;',
      '  --dsw-alias-markdown-code-block:#f5f4ef;',
      '  --dsw-alias-border-l1:#919b9c;--dsw-alias-border-l2:#919b9c;--dsw-alias-border-l3:#919b9c;',
      '  --dsw-alias-border-l4:#7f9db9;--dsw-alias-interactive-bg-hover:#d6e6ff;',
      '  --dsw-alias-onboarding-card-fill:#fff;',
      '  --dsw-specific-input-major:#fff;--dsw-specific-selector:#f4f1fd;--dsw-specific-menu:#fff;',
      '  color:#1a1a1a}',
      /* Belt and braces for the stepper (a div, not an input) and the dropdown-style selectors. */
      '.AnXs9G_options [class*="_stepper"],.AnXs9G_options [class*="_selector"]{',
      '  background:#fff !important;border:1px solid #7f9db9 !important;border-radius:0 !important}',
      /* One continuous XP title bar across both top cells. */
      '.AnXs9G_navTitle{background:linear-gradient(180deg,#0a63d8 0%,#0a52c8 45%,#083fb0 100%) !important;',
      '  color:#fff !important;padding:6px 10px !important;',
      '  font:700 13px/18px Tahoma,"Microsoft YaHei",sans-serif !important}',
      '.AnXs9G_header{height:auto !important;padding:3px 6px !important;align-items:center !important;',
      '  background:linear-gradient(180deg,#0a63d8 0%,#0a52c8 45%,#083fb0 100%) !important}',
      '.AnXs9G_close{width:21px !important;height:21px !important;border-radius:2px !important;',
      '  color:#fff !important;background:linear-gradient(180deg,#f0a58f 0%,#d8543a 45%,#b8331c 100%) !important;',
      '  box-shadow:inset 1px 1px 0 rgba(255,255,255,.7),inset -1px -1px 0 rgba(0,0,0,.35) !important}',
      '.AnXs9G_close:hover{filter:brightness(1.12)}',
      /* Left pane: an XP list box. */
      '.AnXs9G_nav{background:#ece9d8 !important;padding:8px !important}',
      '.AnXs9G_navList{background:#fff !important;border:1px solid #7f9db9 !important;',
      '  padding:2px !important;gap:0 !important;box-shadow:inset 1px 1px 0 #a9a9a9 !important}',
      '.AnXs9G_navCell{border-radius:0 !important;height:24px !important;font-size:13px !important;',
      '  color:#000 !important;padding:1px 6px !important;line-height:20px !important;',
      '  font-family:Tahoma,"Microsoft YaHei",sans-serif !important}',
      '.AnXs9G_navCell:hover{background:#d6e6ff !important}',
      '.AnXs9G_navCell.AnXs9G_active{background:#316ac5 !important;color:#fff !important}',
      '.AnXs9G_navCell.AnXs9G_active .AnXs9G_navIcon{color:#fff !important}',
      /* Content pane: XP grey sheet, square cards, classic push buttons. */
      '.AnXs9G_options{background:#ece9d8 !important;padding:12px 14px 14px !important}',
      '.AnXs9G_options [class*="card"],.AnXs9G_options [class*="Card"]{background:#ffffff !important;',
      '  border:1px solid #919b9c !important;border-radius:2px !important;box-shadow:none !important}',
      '.AnXs9G_options button,.AnXs9G_header button:not(.AnXs9G_close){',
      '  border:1px solid #003c74 !important;border-radius:3px !important;color:#000 !important;',
      '  background:linear-gradient(180deg,#fdfdfd 0%,#f2f1ec 45%,#eae9e3 46%,#deddd7 100%) !important;',
      '  box-shadow:inset 1px 1px 0 #fff,inset -1px -1px 0 #c9c8c2 !important;',
      '  font:400 12px/16px Tahoma,"Microsoft YaHei",sans-serif !important}',
      '.AnXs9G_options button:hover,.AnXs9G_header button:not(.AnXs9G_close):hover{',
      '  background:linear-gradient(180deg,#fffdf2 0%,#f7f4e3 45%,#efe9cf 46%,#e8e0bd 100%) !important}',
      /*
       * XP press: the surface darkens and the bevel flips (bright inside becomes a shadow), plus a
       * 1px nudge so a click is felt even when the pointer barely moves.
       */
      '.AnXs9G_options button:active,.AnXs9G_header button:not(.AnXs9G_close):active{',
      '  background:linear-gradient(180deg,#deddd7 0%,#e3e2dc 55%,#eeede7 100%) !important;',
      '  box-shadow:inset 1px 1px 0 #b8b7b1,inset -1px -1px 0 #fff !important;',
      '  padding-top:1px !important}',
      '.AnXs9G_navCell:active{background:#b3cdf2 !important}',
      /*
       * Field surfaces: the host paints `._input_181ew_115` with `--dsw-alias-bg-layer-3` and
       * `label-primary` text. The token above covers it; this rule is the belt-and-braces version for
       * any other input/textarea inside the dialog (border, radius, placeholder).
       */
      '.AnXs9G_options input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),',
      '.AnXs9G_options textarea,.AnXs9G_panel input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),',
      '.AnXs9G_panel textarea,.yrm-panel-skin input:not([type="range"]):not([type="checkbox"]):not([type="radio"]),',
      '.yrm-panel-skin textarea{background:#fff !important;border:1px solid #7f9db9 !important;',
      '  border-radius:0 !important;color:#1a1a1a !important;',
      '  box-shadow:inset 1px 1px 0 rgba(0,0,0,.10) !important}',
      '.AnXs9G_options input::placeholder,.AnXs9G_options textarea::placeholder,',
      '.yrm-panel-skin input::placeholder,.yrm-panel-skin textarea::placeholder{color:#777 !important}',
      /*
       * Switch knob. The host paints `._thumb_1ik0f_33` with `--dsw-alias-switch-thumb` (near white),
       * which disappears on the pale XP track — the green makes the position readable in light mode.
       * Matched by class substring so the build hash (`_1ik0f_`) can change freely.
       */
      '.AnXs9G_options [class*="_switch_"] [class*="_thumb_"],',
      '.yrm-panel-skin [class*="_switch_"] [class*="_thumb_"]{background:#3f9c35 !important;',
      '  box-shadow:0 1px 1px rgba(0,0,0,.35) !important}',
      '.yrm-set-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.yrm-set-input{flex:1 1 auto;min-width:0;height:26px;padding:0 8px;box-sizing:border-box;',
      '  font:12px/1 "YermuPixel","SimSun",Tahoma,sans-serif;color:#3a4162;',
      '  background:#fff;border:1px solid var(--dsw-alias-border-l2);border-radius:4px}',
      '.yrm-set-input:focus{outline:none;border-color:#8d7cc8;',
      '  box-shadow:inset 0 1px 2px rgba(90,74,150,.25)}',
      '.yrm-set-check{display:flex;align-items:center;gap:8px;font-size:12px;',
      '  color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.yrm-set-check input{width:15px;height:15px;accent-color:#8d7cc8;cursor:pointer}',
      '@media (prefers-reduced-motion:reduce){.yrm-win *,.yrm-mark *{animation:none!important}}',
    ].join('\n');

    function Style() {
      return h('style', { 'data-yeermu': '' }, CSS);
    }

    const BLOCKS = 14;

    /** Whole tokens from ten up, one decimal below — same shape as the host's speed figure. */
    function speedText(tokens, ms) {
      if (!(ms > 0)) return null;
      const tps = Math.max(0, tokens / (ms / 1000));
      return tps >= 10 ? String(Math.round(tps)) : String(Math.round(tps * 10) / 10);
    }

    /** Cache-read share of billed prompt tokens; never rounds a partial hit up to 100. */
    function cacheHitText(usage) {
      if (!usage) return null;
      const read = usage.cacheReadTokens;
      const total = (usage.uncachedInputTokens || 0) + (read || 0) + (usage.cacheWriteTokens || 0);
      if (read === undefined || total <= 0) return null;
      if (read >= total) return '100';
      const exact = (read * 100) / total;
      const rounded = Math.round(exact);
      if (rounded < 100) return String(rounded);
      return (Math.floor(exact * 10) / 10).toFixed(1);
    }

    /** Occupancy of the next request's prompt against the route's context window. */
    function contextPercent(pressure) {
      if (!pressure) return null;
      const used = pressure.projectedTokens !== undefined ? pressure.projectedTokens : pressure.pressureTokens;
      const window = pressure.contextWindow;
      if (used === undefined || !(window > 0)) return null;
      return Math.min(100, Math.round((used / window) * 100));
    }

    /* ---- left tile: calendar + weather ------------------------------------------------ */
    const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const WEEK_COLS = ['一', '二', '三', '四', '五', '六', '日'];
    /* WMO weather code → short Chinese label + one monochrome glyph (no emoji, keeps the pixel feel). */
    const WEATHER_LOOK = [
      [[0], '晴', '\u2600'],
      [[1], '少云', '\u2600'],
      [[2], '多云', '\u2601'],
      [[3], '阴', '\u2601'],
      [[45, 48], '雾', '\u2248'],
      [[51, 53, 55, 56, 57], '毛毛雨', '\u2602'],
      [[61, 63, 65, 66, 67], '雨', '\u2602'],
      [[80, 81, 82], '阵雨', '\u2602'],
      [[71, 73, 75, 77, 85, 86], '雪', '\u2744'],
      [[95, 96, 99], '雷雨', '\u26a1'],
    ];
    function weatherLook(code) {
      for (let index = 0; index < WEATHER_LOOK.length; index += 1) {
        if (WEATHER_LOOK[index][0].indexOf(code) >= 0) {
          return { text: WEATHER_LOOK[index][1], glyph: WEATHER_LOOK[index][2] };
        }
      }
      return { text: '\u2014', glyph: '\u00b7' };
    }

    /* Monday-first month grid: leading/trailing cells belong to the neighbouring months. */
    function monthCells(now) {
      const year = now.getFullYear();
      const month = now.getMonth();
      const offset = (new Date(year, month, 1).getDay() + 6) % 7;
      const days = new Date(year, month + 1, 0).getDate();
      const cells = [];
      for (let back = offset; back > 0; back -= 1) {
        cells.push({ key: 'p' + back, day: new Date(year, month, 1 - back).getDate(), out: true });
      }
      for (let day = 1; day <= days; day += 1) {
        cells.push({ key: 'c' + day, day: day, now: day === now.getDate() });
      }
      for (let next = 1; cells.length % 7 !== 0; next += 1) {
        cells.push({ key: 'n' + next, day: next, out: true });
      }
      return cells;
    }

    function SideCalendar(props) {
      const tileHeight = props && props.height;
      const nowState = React.useState(function () {
        return new Date();
      });
      const now = nowState[0];
      const setNow = nowState[1];
      const weatherState = React.useState(null);
      const weather = weatherState[0];
      const setWeather = weatherState[1];

      /* The tile is a clock as well as a date: re-render twice a minute so the day rolls over. */
      React.useEffect(function () {
        const timer = window.setInterval(function () {
          setNow(new Date());
        }, 30000);
        return function () {
          window.clearInterval(timer);
        };
      }, []);

      React.useEffect(function () {
        let alive = true;
        let timer = 0;
        let failures = 0;
        function pull() {
          fetch('/yeermu-theme/weather', { cache: 'no-store' })
            .then(function (response) {
              return response.ok ? response.json() : null;
            })
            .then(function (json) {
              if (!alive) return;
              if (json && json.ok !== false) {
                failures = 0;
                setWeather(json);
              } else {
                failures += 1;
              }
            })
            .catch(function () {
              failures += 1;
            })
            .then(function () {
              if (!alive) return;
              /* A cold cache costs one round trip; a dead network is retried at a lazy pace. */
              timer = window.setTimeout(pull, failures > 0 ? 60000 : 600000);
            });
        }
        pull();
        return function () {
          alive = false;
          window.clearTimeout(timer);
        };
      }, []);

      const look = weatherLook(weather ? weather.code : -1);
      const temperature =
        weather && typeof weather.temperature === 'number' ? weather.temperature + '\u2103' : '--';
      const city = (weather && weather.city) || '\u6d77\u7279\u6d1b';

      /*
       * The grid is clipped to the card's height, and today is usually not on the first row:
       * centre the highlighted cell once per month, and again when the tile height settles.
       */
      const scrollRef = React.useRef(null);
      React.useEffect(
        function () {
          const box = scrollRef.current;
          if (!box) return;
          const cell = box.querySelector('.yrm-cal-grid i.now');
          if (!cell) return;
          const offset = cell.getBoundingClientRect().top - box.getBoundingClientRect().top;
          box.scrollTop = Math.max(
            0,
            box.scrollTop + offset - box.clientHeight / 2 + cell.offsetHeight / 2,
          );
        },
        [tileHeight, now.getFullYear(), now.getMonth()],
      );

      return h(
        'div',
        { className: 'yrm-pan' },
        h(
          'div',
          { className: 'yrm-pan-bar' },
          h('i', { className: 'yrm-pan-dot' }),
          '日历 · 天气',
          h(
            'span',
            { className: 'yrm-btns' },
            h('span', null, '\u2013'),
            h('span', null, '\u25a1'),
            h('span', { className: 'yrm-x' }, '\u2715'),
          ),
        ),
        h(
          'div',
          { className: 'yrm-pan-body' },
          h(
            'div',
            { className: 'yrm-cal-head' },
            h('b', { className: 'yrm-cal-day' }, String(now.getDate()).padStart(2, '0')),
            h(
              'span',
              { className: 'yrm-cal-meta' },
              h('b', null, now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月'),
              h('i', null, WEEK_NAMES[now.getDay()]),
            ),
          ),
          h(
            'div',
            { className: 'yrm-cal-scroll', ref: scrollRef },
            h(
              'div',
              { className: 'yrm-cal-grid' },
              WEEK_COLS.map(function (label) {
                return h('b', { key: label }, label);
              }),
              monthCells(now).map(function (cell) {
                const className = [cell.out ? 'out' : '', cell.now ? 'now' : ''].join(' ').trim();
                return h(
                  'i',
                  { key: cell.key, className: className || undefined },
                  String(cell.day),
                );
              }),
            ),
          ),
          h(
            'div',
            { className: 'yrm-wx' },
            h('span', { className: 'yrm-wx-ico' }, look.glyph),
            h('b', { className: 'yrm-wx-temp' }, temperature),
            h(
              'span',
              { className: 'yrm-wx-txt' },
              h('b', null, look.text),
              h('i', null, city),
            ),
          ),
        ),
      );
    }

    /* ---- right tile: system monitor ------------------------------------------------ */
    /* MiB → GiB, one decimal: the footer only has room for four characters per number. */
    function gib(megabytes) {
      return (Number(megabytes) / 1024).toFixed(1);
    }

    function SideMonitor() {
      const dataState = React.useState(null);
      const data = dataState[0];
      const setData = dataState[1];

      /* The host resamples every 2s and every 5s for the GPU; polling at the faster pace is enough. */
      React.useEffect(function () {
        let alive = true;
        let timer = 0;
        function pull() {
          fetch('/yeermu-theme/metrics', { cache: 'no-store' })
            .then(function (response) {
              return response.ok ? response.json() : null;
            })
            .then(function (json) {
              if (alive && json) setData(json);
            })
            .catch(function () {
              /* keep the last reading; the next tick retries anyway */
            })
            .then(function () {
              if (alive) timer = window.setTimeout(pull, 5000);
            });
        }
        pull();
        return function () {
          alive = false;
          window.clearTimeout(timer);
        };
      }, []);

      const cpu = data && typeof data.cpu === 'number' ? data.cpu : null;
      const mem = data && data.mem ? data.mem : null;
      const gpu = data && data.gpu ? data.gpu : null;
      const memPercent = mem && typeof mem.percent === 'number' ? mem.percent : null;
      const gpuPercent = gpu && typeof gpu.percent === 'number' ? gpu.percent : null;
      const rows = [
        { key: 'cpu', label: 'CPU', percent: cpu },
        { key: 'mem', label: '内存', percent: memPercent },
        { key: 'gpu', label: 'GPU', percent: gpuPercent },
      ];

      return h(
        'div',
        { className: 'yrm-pan is-mon' },
        h(
          'div',
          { className: 'yrm-pan-bar' },
          h('i', { className: 'yrm-pan-dot' }),
          '系统监控',
          h('span', { className: 'yrm-pan-tag' }, '5s'),
          h(
            'span',
            { className: 'yrm-btns' },
            h('span', null, '\u2013'),
            h('span', null, '\u25a1'),
            h('span', { className: 'yrm-x' }, '\u2715'),
          ),
        ),
        h(
          'div',
          { className: 'yrm-pan-body' },
          h(
            'div',
            { className: 'yrm-mon' },
            rows.map(function (row) {
              const value =
                row.percent === null || row.percent === undefined
                  ? null
                  : Math.max(0, Math.min(100, Math.round(row.percent)));
              const tone = value === null ? '' : value >= 85 ? ' hot' : value >= 60 ? ' warn' : '';
              return h(
                'div',
                { key: row.key, className: 'yrm-mon-row' },
                h('span', { className: 'yrm-mon-lbl' }, row.label),
                h(
                  'div',
                  { className: 'yrm-mon-bar' },
                  h('i', { className: 'yrm-mon-fill' + tone, style: { width: (value || 0) + '%' } }),
                ),
                h('span', { className: 'yrm-mon-val' }, value === null ? '--' : value + '%'),
              );
            }),
          ),
          h(
            'div',
            { className: 'yrm-mon-foot' },
            h('span', null, '内存 ' + (mem ? gib(mem.usedMb) + '/' + gib(mem.totalMb) + 'G' : '--')),
            h(
              'span',
              null,
              '显存 ' + (gpu && typeof gpu.usedMb === 'number' ? Math.round(gpu.usedMb) + 'M' : '--'),
            ),
          ),
        ),
      );
    }

    function DockCard(props) {
      const useProjection = props.useProjection;
      const stats = useProjection('sessionStats');
      const usage = useProjection('tokenUsage');
      const pressure = useProjection('contextPressure');

      /*
       * Agent state for the title-bar plate. All three hooks come from the dock slot's standard
       * props; every selector is defensive because these snapshots are host-owned shapes.
       */
      const sessionId = props.sessionId;
      const useSessions = props.useSessions;
      const useSessionStatus = props.useSessionStatus;
      const useChat = props.useChat;
      const running = useSessions
        ? useSessions(function (snapshot) {
            if (!sessionId || !snapshot || !snapshot.byId) return false;
            const entry = snapshot.byId[sessionId];
            return !!(entry && entry.running);
          })
        : false;
      const pending = useSessionStatus
        ? useSessionStatus(function (snapshot) {
            if (!sessionId || !snapshot || typeof snapshot.get !== 'function') return false;
            const entry = snapshot.get(sessionId);
            return !!(entry && entry.pendingInteraction);
          })
        : false;
      const failed = useChat
        ? useChat(function (chat) {
            const nodes = chat && chat.legacy && chat.legacy.nodes;
            if (!nodes || nodes.length === 0) return false;
            const last = nodes[nodes.length - 1];
            return !!(last && last.kind === 'turn-error');
          })
        : false;

      React.useEffect(
        function () {
          try {
            reportSessionState({ running: !!running, pending: !!pending, error: !!failed });
          } catch (error) {
            /* a host shape change must not break the card */
          }
        },
        [running, pending, failed],
      );

      /*
       * Portrait cycling. `face` is the persisted index; `emi` holds the interference class for
       * the length of the burst; `ripple` is where the click landed so the rings start there.
       * One swap at a time — a second click during the 560ms burst is dropped.
       */
      const faceState = React.useState(loadFaceIndex);
      const face = faceState[0];
      const setFace = faceState[1];
      const emiState = React.useState(false);
      const emi = emiState[0];
      const setEmi = emiState[1];
      const rippleState = React.useState({ x: 50, y: 50 });
      const ripple = rippleState[0];
      const setRipple = rippleState[1];
      const swapRef = React.useRef(null);

      React.useEffect(function () {
        return function () {
          const swap = swapRef.current;
          if (!swap) return;
          window.clearTimeout(swap.at);
          window.clearTimeout(swap.off);
          swapRef.current = null;
        };
      }, []);

      function cycleFace(event) {
        if (swapRef.current) return;
        let x = 50;
        let y = 50;
        const target = event && event.currentTarget;
        if (target && typeof target.getBoundingClientRect === 'function' && typeof event.clientX === 'number') {
          const rect = target.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            x = Math.max(12, Math.min(88, ((event.clientX - rect.left) / rect.width) * 100));
            y = Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100));
          }
        }
        setRipple({ x: x, y: y });
        setEmi(true);
        swapRef.current = {
          /* swap under the brightest frame of the tear */
          at: window.setTimeout(function () {
            const next = (face + 1) % FACES.length;
            setFace(next);
            try {
              window.localStorage.setItem(FACE_KEY, String(next));
            } catch (error) {
              /* storage is optional */
            }
          }, 150),
          off: window.setTimeout(function () {
            setEmi(false);
            swapRef.current = null;
          }, 560),
        };
      }

      function faceKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
        event.preventDefault();
        cycleFace(null);
      }

      const speed = stats ? speedText(stats.decodeTokens || 0, stats.decodeMs || 0) : null;
      const hit = cacheHitText(usage);
      const percent = contextPercent(pressure);
      const filled = percent === null ? 0 : Math.round((percent / 100) * BLOCKS);

      const cells = [];
      for (let index = 0; index < BLOCKS; index += 1) {
        cells.push(h('i', { key: index, className: index < filled ? 'on' : undefined }));
      }

      /*
       * Width gate for the side tiles. The dock itself is content-sized, so the reading has to come
       * from the composer row above it (`[data-composer-dock]`'s parent) — that element is as wide
       * as the column, which is exactly the room the row can use.
       */
      const dockRef = React.useRef(null);
      const tightState = React.useState(false);
      const tight = tightState[0];
      const setTight = tightState[1];
      React.useEffect(function () {
        const element = dockRef.current;
        if (!element || typeof ResizeObserver !== 'function') return undefined;
        const seat = typeof element.closest === 'function' ? element.closest('[data-composer-dock]') : null;
        const target = (seat && seat.parentElement) || element.parentElement;
        if (!target) return undefined;
        const measure = function () {
          const width = target.clientWidth || 0;
          setTight(width > 0 && width < 960);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(target);
        return function () {
          observer.disconnect();
        };
      }, []);

      /*
       * Presence for the name row: the browser's own link state is the only offline signal the
       * page has, so listen to `online` / `offline` and keep it in state.
       */
      const linkState = React.useState(function () {
        return typeof navigator === 'undefined' || navigator.onLine !== false;
      });
      const online = linkState[0];
      const setOnline = linkState[1];
      React.useEffect(function () {
        const sync = function () {
          setOnline(typeof navigator === 'undefined' || navigator.onLine !== false);
        };
        window.addEventListener('online', sync);
        window.addEventListener('offline', sync);
        sync();
        return function () {
          window.removeEventListener('online', sync);
          window.removeEventListener('offline', sync);
        };
      }, []);

      /* Working beats everything, then the link state decides between online and lost. */
      const presence = running ? 'busy' : online ? 'online' : 'offline';
      const PRESENCE_TEXT = { online: '在线中', offline: '已断线', busy: '干活中' };

      /*
       * Tile height follows the XP card. Measuring the card instead of hard-coding a number keeps
       * the three panels flush if the card's content (fonts, stats line) ever changes.
       */
      const cardRef = React.useRef(null);
      const tileState = React.useState(0);
      const tileH = tileState[0];
      const setTileH = tileState[1];
      React.useEffect(function () {
        const element = cardRef.current;
        if (!element || typeof ResizeObserver !== 'function') return undefined;
        const measure = function () {
          const height = Math.round(element.getBoundingClientRect().height);
          if (height > 0) setTileH(height);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return function () {
          observer.disconnect();
        };
      }, []);

      return h(
        'div',
        {
          className: tight ? 'yrm-dock is-tight' : 'yrm-dock',
          ref: dockRef,
          style: tileH > 0 ? { '--yrm-tile-h': tileH + 'px' } : undefined,
        },
        h(Style),
        h(SideCalendar, { height: tileH }),
        h(
          'div',
          { className: 'yrm-win', role: 'img', 'aria-label': '曳尔沐 - 全息终端', ref: cardRef },
          h(
            'div',
            { className: 'yrm-bar' },
            h('span', { className: 'yrm-ico' }, h('img', { src: HEAD, alt: '', draggable: false })),
            h('span', { className: 'yrm-title' }, '曳尔沐 - 全息终端'),
            h(
              'span',
              { className: 'yrm-btns' },
              h('span', null, '\u2013'),
              h('span', null, '\u25a1'),
              h('span', { className: 'yrm-x' }, '\u2715'),
            ),
          ),
          h(
            'div',
            { className: 'yrm-body' },
            h(
              'div',
              {
                className: emi ? 'yrm-well is-emi' : 'yrm-well',
                role: 'button',
                tabIndex: 0,
                title: '点击切换形象',
                'aria-label': '切换曳尔沐形象',
                onClick: cycleFace,
                onKeyDown: faceKeyDown,
              },
              h('span', { className: 'yrm-fallback' }, '沐'),
              h('img', { className: 'yrm-shot', src: FACES[face], alt: '', draggable: false }),
              h('span', { className: 'yrm-scan' }),
              h('span', { className: 'yrm-emi' }),
              h('span', {
                className: 'yrm-ripple',
                style: { left: ripple.x + '%', top: ripple.y + '%' },
              }),
              h('span', {
                className: 'yrm-ripple yrm-ripple-b',
                style: { left: ripple.x + '%', top: ripple.y + '%' },
              }),
            ),
            h(
              'div',
              { className: 'yrm-meta' },
              h('div', { className: 'yrm-name' },
                h('i', { className: 'yrm-led is-' + presence }),
                '曳尔沐 \u2014 ' + PRESENCE_TEXT[presence],
              ),
              h('div', { className: 'yrm-id' }, '你看到的我，是哪一种颜色呢？开朗或慢热？~'),
              h(
                'div',
                { className: 'yrm-stats' },
                h('b', null, speed === null ? '--' : speed),
                ' tok/s',
                h('span', { className: 'yrm-sep' }, '\u00b7'),
                '缓存命中 ',
                h('b', null, hit === null ? '--' : hit + '%'),
              ),
              h(
                'div',
                { className: 'yrm-ctx' },
                '上下文',
                h('div', { className: 'yrm-track' }, cells),
                h('span', { className: 'yrm-pct' }, percent === null ? '--' : percent + '%'),
              ),
            ),
          ),
        ),
        /* Right tile: CPU / memory / GPU, polled from the host sampler. */
        h(SideMonitor),
      );
    }

    function BrandMark(props) {
      const size = props && typeof props.size === 'number' ? props.size : 24;
      return h(
        'span',
        { className: 'yrm-mark', style: { width: size, height: size } },
        h(Style),
        h('img', { className: 'yrm-mark-img', src: HEAD, alt: '', draggable: false }),
        h('i', { className: 'yrm-mark-led' }),
      );
    }

    function BrandName() {
      return h(
        'span',
        { className: 'yrm-brand-row' },
        h('img', { className: 'yrm-brand', src: WORDMARK, alt: 'elyms', draggable: false }),
        h('span', { className: 'yrm-harness' }, 'HARNESS'),
      );
    }

    function SettingsSection() {
      const [look, setLook] = React.useState(lookState);
      /* Where the card actually lands, so the workspace caveat names a real path. */
      const [personaPath, setPersonaPath] = React.useState('');
      React.useEffect(function () {
        let alive = true;
        fetch('/yeermu-theme/persona', { cache: 'no-store' })
          .then(function (response) {
            return response.ok ? response.json() : null;
          })
          .then(function (json) {
            if (alive && json && json.path) setPersonaPath(String(json.path));
          })
          .catch(function () {
            /* host half without the route: the note simply shows no path */
          });
        return function () {
          alive = false;
        };
      }, []);

      /* Where the preset source lives, and the reply line of the last recording. */
      const [prefPath, setPrefPath] = React.useState('');
      const [prefMsg, setPrefMsg] = React.useState('');
      /*
       * The regenerate button carries `enabled: look.persona` on the wire, so while the switch is
       * off the host only ever *deletes* — the click looks like it did nothing. Say so instead.
       */
      const [personaMsg, setPersonaMsg] = React.useState('');
      React.useEffect(function () {
        let alive = true;
        fetchPresetInfo().then(function (path) {
          if (alive && path) setPrefPath(path);
        });
        return function () {
          alive = false;
        };
      }, []);

      function commit(next) {
        lookState = next;
        setLook(next);
        saveLook(next);
        applyLook(next);
      }

      function update(key, value) {
        const next = Object.assign({}, look, {});
        next[key] = value;
        commit(next);
      }

      function row(key, name) {
        return h(
          'div',
          { className: 'yrm-set-row', key: key },
          h('div', { className: 'yrm-set-name' }, name),
          h('input', {
            className: 'yrm-set-range',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: look[key],
            'aria-label': name,
            onChange: function (event) {
              update(key, Number(event.target.value));
            },
          }),
          h('div', { className: 'yrm-set-val' }, look[key] + '%'),
        );
      }

      return h(
        'div',
        { className: 'yrm-set' },
        h(Style),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '背景视频与界面表皮的强度。拖动即时生效，自动保存在本机浏览器；换机器要重新调。',
        ),
        row('surface', '界面不透明度'),
        row('video', '背景视频强度'),
        row('veil', '背景压暗'),
        h(
          'div',
          { className: 'yrm-set-row', key: 'scene' },
          h('div', { className: 'yrm-set-name' }, '影片选择'),
          h(
            'div',
            { className: 'yrm-set-seg' },
            SCENE_LABELS.map(function (label, index) {
              const value = index + 1;
              const active = Math.max(1, Math.min(SCENE_COUNT, Number(look.scene) || 1)) === value;
              return h(
                'button',
                {
                  key: value,
                  type: 'button',
                  className: 'yrm-set-seg-btn' + (active ? ' is-on' : ''),
                  onClick: function () {
                    update('scene', value);
                  },
                },
                label,
              );
            }),
          ),
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'status' },
          h('div', { className: 'yrm-set-name' }, '固定台词'),
          h('input', {
            className: 'yrm-set-input',
            type: 'text',
            maxLength: STATUS_MAX,
            value: look.status,
            placeholder: '留空 = 按状态自动换台词',
            'aria-label': '固定台词',
            onChange: function (event) {
              update('status', String(event.target.value).slice(0, STATUS_MAX));
            },
          }),
        ),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '留空时按状态自动换：待机 20 秒一句（浅紫），工作中 10 秒一句（浅蓝），等待批准（黄色），出错（浅红）。填了就一直显示这句。',
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'persona' },
          h('div', { className: 'yrm-set-name' }, '角色扮演'),
          h(
            'label',
            { className: 'yrm-set-check' },
            h('input', {
              type: 'checkbox',
              checked: look.persona === true,
              onChange: function (event) {
                update('persona', event.target.checked);
              },
            }),
            h('span', null, look.persona === true ? '开启（曳尔沐已上线）' : '关闭（默认）'),
          ),
        ),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '在输入框输入 316651 并按回车即可快速开启（不会把代码发出去）。开关会同步到工作区根目录的 AGENTS.local.md：开启即写入角色卡，关闭即删除——只删本插件写的那份，你自己写的 AGENTS.local.md 不会被覆盖。',
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'personaWork' },
          h('div', { className: 'yrm-set-name' }, '工作时也扮演'),
          h(
            'label',
            { className: 'yrm-set-check' },
            h('input', {
              type: 'checkbox',
              checked: look.personaWork === true,
              disabled: look.persona !== true,
              onChange: function (event) {
                update('personaWork', event.target.checked);
              },
            }),
            h(
              'span',
              null,
              look.persona !== true
                ? '需先开启「角色扮演」'
                : look.personaWork === true
                  ? '开启（工作输出也用曳尔沐口吻，代码本身仍保持原样）'
                  : '关闭（代码 / 命令 / 日志保持专业，只有对话用角色口吻）',
            ),
          ),
        ),
        h(
          'p',
          { className: 'yrm-set-note' },
          '角色卡写在本插件所在的工作区：',
          personaPath ? h('code', null, personaPath) : h('code', null, '…'),
          '。换到',
          h('b', null, '其他工作区'),
          '对话时这张卡不会生效——那边需要单独放一份 AGENTS.local.md。',
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'frame' },
          h('div', { className: 'yrm-set-name' }, '窗口外框'),
          h(
            'label',
            { className: 'yrm-set-check' },
            h('input', {
              type: 'checkbox',
              checked: look.frame !== false,
              onChange: function (event) {
                update('frame', event.target.checked);
              },
            }),
            h('span', null, look.frame !== false ? '开启（淡紫边框 + 标题栏）' : '关闭（还原原生界面）'),
          ),
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'splash' },
          h('div', { className: 'yrm-set-name' }, '开屏动画'),
          h(
            'label',
            { className: 'yrm-set-check' },
            h('input', {
              type: 'checkbox',
              checked: look.splash !== false,
              onChange: function (event) {
                update('splash', event.target.checked);
              },
            }),
            h(
              'span',
              null,
              look.splash !== false ? '开启（下次启动生效，点击画面可跳过）' : '关闭（下次启动生效）',
            ),
          ),
        ),
        h(
          'div',
          { className: 'yrm-set-row', key: 'splashSound' },
          h('div', { className: 'yrm-set-name' }, '开屏声音'),
          h(
            'label',
            { className: 'yrm-set-check' },
            h('input', {
              type: 'checkbox',
              checked: look.splashSound !== false,
              onChange: function (event) {
                update('splashSound', event.target.checked);
              },
            }),
            h('span', null, look.splashSound !== false ? '开启（下次启动生效）' : '关闭（下次启动生效）'),
          ),
        ),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '边框是浮在界面边缘的覆盖层，不会改变应用视口尺寸（改动视口会让宿主内置的账号/充值视图错位）。万一那边点不动，关掉「窗口外框」即可退回原生界面。',
        ),
        h(
          'div',
          { className: 'yrm-set-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'yrm-set-btn',
              onClick: function () {
                fetch('/yeermu-theme/open-card', { method: 'POST' }).catch(function () {});
              },
            },
            '打开角色卡文件',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'yrm-set-btn',
              onClick: function () {
                if (lookState.persona !== true) {
                  /* Never pretend to save a file the switch says should not exist. */
                  setPersonaMsg('角色扮演关闭中：保存不会写入文件，先打开上面的「角色扮演」开关。');
                  return;
                }
                syncPersona(lookState);
                setPersonaMsg('已保存：角色卡已同步到工作区的 AGENTS.local.md。');
              },
            },
            '保存角色卡',
          ),
          h(
            'span',
            { className: 'yrm-set-hint' },
            personaMsg ||
              (look.persona === true
                ? '改完角色卡点它保存到工作区'
                : '角色扮演关闭：保存不会写入文件'),
          ),
        ),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '角色卡文件：',
          h('code', null, 'yeermu-theme\\assets\\persona.md'),
          '。改完点「保存角色卡」让改动生效（或切换上面任一开关也会自动同步）。',
        ),
        h(
          'div',
          { className: 'yrm-set-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'yrm-set-btn',
              onClick: function () {
                /* Manual recovery: the layer is a body child no slot owns, so re-mount it on demand. */
                const existing = document.getElementById('yrm-backdrop');
                if (existing) existing.remove();
                mountBackdrop();
                applyBackdropLook(lookState);
              },
            },
            '重新装载背景',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'yrm-set-btn',
              onClick: function () {
                commit(Object.assign({}, presetLook()));
              },
            },
            '恢复默认',
          ),
          h('span', { className: 'yrm-set-hint' }, '回到插件预设，不是 100% / 100% / 0%'),
        ),
        /*
         * Publishing: the default look ships *inside* `client.js`. `assets/preset.json` is the
         * source that `build.py` bakes in, so a downloader needs no file and no button — they get
         * exactly what the author recorded. This button only re-records that source file while
         * developing; a published plugin sits in a read-only package and the write simply fails.
         */
        h(
          'p',
          { className: 'yrm-set-sub' },
          '外观随包发布：下载者装好就是预设的样子，不需要点任何按钮。当前这套预设已经烘焙进 client.js。',
        ),
        h(
          'div',
          { className: 'yrm-set-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'yrm-set-btn',
              onClick: function () {
                setPrefMsg('写入中…');
                savePreset().then(function (reply) {
                  setPrefMsg(
                    reply && reply.ok
                      ? '已写入 ' + (reply.path || 'preset.json') + '，重新 build 后才生效'
                      : '写入失败：' + (reply && reply.error ? reply.error : '无响应'),
                  );
                });
              },
            },
            '存为插件预设',
          ),
          h(
            'span',
            { className: 'yrm-set-hint' },
            prefMsg || '作者用：把当前外观录进 assets/preset.json',
          ),
        ),
        h(
          'p',
          { className: 'yrm-set-sub' },
          '预设文件：',
          h('code', null, prefPath || 'yeermu-theme\\assets\\preset.json'),
          '。这是给开发目录用的录制入口；录制后要重新 build 才会进入发布版。两个角色扮演开关也会一起录进预设。',
        ),
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        /* Never let this half abort the boot pass: a failed client entry can stop the page. */
        try {
          lookState = loadLook();
          const theme = ctx.get('theme');
          if (theme) {
            themeSeat = theme;
          } else {
            /* The restricted context may hide a service until it is injected. */
            ctx.inject(['theme'], function (child) {
              themeSeat = child.theme;
              applySurface(lookState.surface);
            });
          }
          applyLook(lookState);
          restartPhaseTimer();
          ctx.effect(function () {
            return function () {
              stopPhaseTimer();
              if (typeTimer) {
                clearInterval(typeTimer);
                typeTimer = 0;
              }
              try {
                if (surfaceOff) surfaceOff();
                if (extraOff) extraOff();
              } catch (error) {
                /* the theme layer is removed with the plugin anyway */
              }
            };
          });
          ctx.effect(function () {
            return mountBackdrop();
          });
          ctx.effect(function () {
            return startPanelSkin();
          });
          ctx.effect(function () {
            return watchPersonaCode();
          });
          ctx.effect(function () {
            return startEffortSlider();
          });
          if (lookState.splash !== false) mountSplash();
          ctx.slots.inject('settings.section', function () {
            try {
              return ctx.slots.register(
                { name: 'settings.section', id: 'yeermu', order: 25, label: '曳尔沐' },
                SettingsSection,
              );
            } catch (error) {
              console.error('[yeermu-theme] settings section registration failed', error);
              return function () {};
            }
          });
          ctx.slots.inject('conversation.composer.dock', function () {
            try {
              return ctx.slots.register(
                { name: 'conversation.composer.dock', id: 'yeermu-terminal-5', order: 60 },
                DockCard,
              );
            } catch (error) {
              console.error('[yeermu-theme] dock registration failed', error);
              return function () {};
            }
          });
          ctx.slots.inject('sidebar.brand.mark', function () {
            try {
              /* Lower priority value wins a single-slot cell: the shipped mark registers at 0. */
              return ctx.slots.register({ name: 'sidebar.brand.mark', priority: -20 }, BrandMark);
            } catch (error) {
              console.error('[yeermu-theme] brand mark registration failed', error);
              return function () {};
            }
          });
          ctx.slots.inject('sidebar.brand.name', function () {
            try {
              /* Same rule for the wordmark: the shipped "deepseek HARNESS" text is the fallback. */
              return ctx.slots.register({ name: 'sidebar.brand.name', priority: -20 }, BrandName);
            } catch (error) {
              console.error('[yeermu-theme] brand name registration failed', error);
              return function () {};
            }
          });
        } catch (error) {
          console.error('[yeermu-theme] apply failed', error);
        }
      },
    };
  },
});
