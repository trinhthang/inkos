# Lists tr(...) call sites and their top-level argument count.
# Usage: python tr-scan.py <file> [more files...]        (default: only 2-arg sites)
#        python tr-scan.py --all <file>                  (every site)
import io, sys, re

args = [a for a in sys.argv[1:] if a != "--all"]
show_all = "--all" in sys.argv

def split_args(s, start):
    depth, j, instr, parts, cur = 1, start, None, [], []
    while j < len(s):
        ch = s[j]
        if instr:
            cur.append(ch)
            if ch == "\\":
                cur.append(s[j + 1]); j += 2; continue
            if ch == instr: instr = None
        elif ch in '"\'`':
            instr = ch; cur.append(ch)
        elif ch in "([{":
            depth += 1; cur.append(ch)
        elif ch in ")]}":
            depth -= 1
            if depth == 0:
                parts.append("".join(cur)); return parts, j
            cur.append(ch)
        elif ch == "," and depth == 1:
            parts.append("".join(cur)); cur = []
        else:
            cur.append(ch)
        j += 1
    return parts, j

total = 0
for path in args:
    s = io.open(path, encoding="utf-8").read()
    for m in re.finditer(r"\btr\(", s):
        parts, _ = split_args(s, m.end())
        parts = [p.strip() for p in parts]
        if parts and parts[-1] == "": parts.pop()
        if not show_all and len(parts) != 2: continue
        line = s.count("\n", 0, m.start()) + 1
        total += 1
        print("%s:%d  [%d args]  %s" % (path, line, len(parts), " || ".join(parts)))
print("---- %d site(s) ----" % total)
