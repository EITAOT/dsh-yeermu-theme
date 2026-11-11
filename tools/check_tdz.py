# Guard for a bug that once bit us: a component-top-level `const` read before its declaration
# (temporal dead zone). Only depth-1 occurrences count, so callbacks and nested blocks are ignored.
#
# Paths are relative to this file so a clone can run `python tools/check_tdz.py`.
import os
import re
import sys

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client.template.js")
TARGETS = ["DockCard", "SideCalendar", "SideMonitor", "BrandMark", "SettingsSection"]

src = open(PATH, encoding="utf-8").read()
# Blank out comments so prose that names an identifier is not mistaken for a read.
src = re.sub(r"/\*[\s\S]*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), src)
src = re.sub(r"//[^\n]*", lambda m: " " * len(m.group(0)), src)
lines = src.split("\n")


def body_of(name, lines):
    starts = [i for i, line in enumerate(lines) if line.strip().startswith("function %s(" % name)]
    if not starts:
        return None, None
    start = starts[0]
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if i > start and depth <= 0:
            return start, "\n".join(lines[start:i + 1])
    return start, None


def depth_at(text, index):
    depth = 0
    for char in text[:index]:
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
    return depth


problems = []
for name in TARGETS:
    start, body = body_of(name, lines)
    if body is None:
        problems.append("%s: function not found" % name)
        continue
    for match in re.finditer(r"\n\s+(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=", body):
        ident = match.group(1)
        decl_at = match.start()
        if depth_at(body, decl_at) != 1:
            continue
        for use in re.finditer(r"(?<![\w$.])%s(?![\w$])" % re.escape(ident), body):
            if use.start() >= decl_at:
                break
            if depth_at(body, use.start()) == 1:
                line_no = body[:use.start()].count("\n") + start + 1
                problems.append("%s: '%s' used at template line %d, declared later" % (name, ident, line_no))
                break

print("TDZ/order problems:", len(problems))
for problem in problems:
    print(" -", problem)
sys.exit(1 if problems else 0)
