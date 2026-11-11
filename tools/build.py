# Build client.js from the template: inject the base64 artwork and bake in the shipped preset.
#
# Paths are relative to this file, so a fresh clone of the repository can rebuild the exact
# published bundle with `python tools/build.py`.
#
#   tools/client.template.js   the source of truth for client.js
#   tools/src/*                artwork that gets inlined as data: URIs
#   assets/preset.json         the shipped default look (baked in as __PRESET__)
#
# Outputs: client.js and icon.png beside package.json.
import base64
import json
import os
import shutil

TOOLS = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(TOOLS)
SRC = os.path.join(TOOLS, "src")


def data_uri(path, mime):
    with open(path, "rb") as f:
        raw = f.read()
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii")), len(raw)


def src(name):
    return os.path.join(SRC, name)


head, hsize = data_uri(src("head-64.webp"), "image/webp")
wordmark, wsize = data_uri(src("wordmark.webp"), "image/webp")
floppy, fsize = data_uri(src("floppy.png"), "image/png")
hero_face, hfsize = data_uri(src("hero-face.png"), "image/png")
icon_folder, ifsize = data_uri(src("icon-folder.png"), "image/png")
icon_alert, iasize = data_uri(src("icon-alert.png"), "image/png")
icon_doc, idsize = data_uri(src("icon-folder-doc.png"), "image/png")

with open(os.path.join(TOOLS, "client.template.js"), "r", encoding="utf-8") as f:
    tpl = f.read()

out = (
    tpl.replace("__HEAD__", head)
    .replace("__WORDMARK__", wordmark)
    .replace("__FLOPPY__", floppy)
    .replace("__HERO_FACE__", hero_face)
    .replace("__ICON_FOLDER__", icon_folder)
    .replace("__ICON_ALERT__", icon_alert)
    .replace("__ICON_FOLDER_DOC__", icon_doc)
)

# Four portrait faces for the dock card, cycled on click. One placeholder per image.
faces = []
for index in range(1, 5):
    uri, size = data_uri(src("face-%d.webp" % index), "image/webp")
    out = out.replace("__FACE%d__" % index, uri)
    faces.append((size, len(uri)))

for index, (size, chars) in enumerate(faces, 1):
    print("face-%d bytes %d -> uri chars %d" % (index, size, chars))

# Shipped default look, baked into the bundle at build time.
# A marketplace install gets a read-only package: nothing may be read from disk at runtime, so the
# author's look has to be part of client.js itself.
preset_path = os.path.join(PKG, "assets", "preset.json")
with open(preset_path, "r", encoding="utf-8") as f:
    preset = json.load(f)
if not isinstance(preset, dict) or not isinstance(preset.get("look"), dict):
    raise SystemExit("assets/preset.json must be an object with a `look` object")
out = out.replace("__PRESET__", json.dumps(preset, ensure_ascii=False))
print("preset scene=%s surface=%s face=%s" % (
    preset["look"].get("scene"), preset["look"].get("surface"), preset.get("face")))

leftover = [
    token
    for token in (
        "__HEAD__", "__WORDMARK__", "__FLOPPY__", "__HERO_FACE__", "__ICON_FOLDER__",
        "__ICON_ALERT__", "__ICON_FOLDER_DOC__", "__FACE1__", "__FACE2__", "__FACE3__",
        "__FACE4__", "__PRESET__",
    )
    if token in out
]
if leftover:
    raise SystemExit("unreplaced placeholder(s): %s" % ", ".join(leftover))

with open(os.path.join(PKG, "client.js"), "w", encoding="utf-8", newline="\n") as f:
    f.write(out)

shutil.copyfile(src("head-128.png"), os.path.join(PKG, "icon.png"))

print("head bytes", hsize, "-> uri chars", len(head))
print("wordmark bytes", wsize, "-> uri chars", len(wordmark))
print("floppy bytes", fsize, "-> uri chars", len(floppy))
print("hero face bytes", hfsize, "-> uri chars", len(hero_face))
print("client.js bytes", os.path.getsize(os.path.join(PKG, "client.js")))
print("icon.png bytes", os.path.getsize(os.path.join(PKG, "icon.png")))
