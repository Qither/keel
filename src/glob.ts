// Minimal path pattern matching for Grant.allowed_operations: `**` matches any
// number of segments, `*` matches within one segment. Paths use `/`.
// Source: HC-03 s1 (controls proportionate to risk); design 3.2.
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function matchesPattern(pattern: string, path: string): boolean {
  const re = toRegExp(normalizePath(pattern));
  return re.test(normalizePath(path));
}

const SPECIALS = new Set(["\\", "^", "$", ".", "|", "?", "+", "(", ")", "[", "]", "{", "}"]);

function toRegExp(pattern: string): RegExp {
  let out = "^";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        i++;
        if (pattern[i + 1] === "/") {
          i++;
          out += "(?:.*/)?";
        } else {
          out += ".*";
        }
      } else {
        out += "[^/]*";
      }
    } else if (SPECIALS.has(ch)) {
      out += "\\" + ch;
    } else {
      out += ch;
    }
  }
  return new RegExp(out + "$");
}
