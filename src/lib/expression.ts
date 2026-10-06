/**
 * A small, safe math expression evaluator for the calculator (no eval).
 *
 * Supports + - * / × ÷ ^ mod, parentheses, implicit multiplication (2π, 3(4+1)),
 * postfix ! and %, √x, constants (pi, π, e, Ans) and common functions.
 */

export type AngleMode = "deg" | "rad";

type Token =
  | { type: "num"; value: number }
  | { type: "id"; value: string }
  | { type: "op"; value: string }
  | { type: "lp" }
  | { type: "rp" }
  | { type: "comma" };

export class ExpressionError extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const src = input.replace(/\s+/g, "");
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/[0-9.]/.test(ch)) {
      const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
      if (!m) throw new ExpressionError(`Unexpected “${ch}”`);
      tokens.push({ type: "num", value: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-zA-Zπ]/.test(ch)) {
      const m = src.slice(i).match(/^(π|log2|[a-zA-Z]+)/)!;
      tokens.push({ type: "id", value: m[0] });
      i += m[0].length;
    } else if (ch === "(") {
      tokens.push({ type: "lp" });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: "rp" });
      i++;
    } else if (ch === ",") {
      tokens.push({ type: "comma" });
      i++;
    } else if ("+-*/^!%√×÷−".includes(ch)) {
      const map: Record<string, string> = { "×": "*", "÷": "/", "−": "-" };
      tokens.push({ type: "op", value: map[ch] ?? ch });
      i++;
    } else {
      throw new ExpressionError(`Unexpected “${ch}”`);
    }
  }
  return tokens;
}

/** Lanczos approximation of the gamma function, used for non-integer factorials. */
function gamma(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function factorial(n: number): number {
  if (n < 0 && Number.isInteger(n)) throw new ExpressionError("Factorial of a negative integer is undefined");
  if (n > 170) return Infinity;
  if (Number.isInteger(n)) {
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  return gamma(n + 1);
}

export function evaluate(input: string, opts: { angle: AngleMode; ans?: number }): number {
  const tokens = tokenize(input);
  let pos = 0;
  const toRad = (x: number) => (opts.angle === "deg" ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (opts.angle === "deg" ? (x * 180) / Math.PI : x);
  const clean = (x: number) => Math.round(x * 1e15) / 1e15;

  const trig = (fn: (x: number) => number, name: string) => (x: number) => {
    if (opts.angle === "deg" && name === "tan" && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) {
      throw new ExpressionError("tan is undefined at 90° + k·180°");
    }
    return clean(fn(toRad(x)));
  };

  const FUNCS: Record<string, (...args: number[]) => number> = {
    sin: trig(Math.sin, "sin"),
    cos: trig(Math.cos, "cos"),
    tan: trig(Math.tan, "tan"),
    asin: (x) => fromRad(Math.asin(x)),
    acos: (x) => fromRad(Math.acos(x)),
    atan: (x) => fromRad(Math.atan(x)),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    ln: Math.log,
    log: (x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base)),
    log2: Math.log2,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    exp: Math.exp,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    fact: factorial,
    nCr: (n, r) => factorial(n) / (factorial(r) * factorial(n - r)),
    nPr: (n, r) => factorial(n) / factorial(n - r),
    min: Math.min,
    max: Math.max,
  };

  const CONSTS: Record<string, () => number> = {
    pi: () => Math.PI,
    π: () => Math.PI,
    e: () => Math.E,
    ans: () => opts.ans ?? 0,
  };

  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.type === "op" && (peek() as { value: string }).value === v;

  const startsOperand = (t: Token | undefined) =>
    !!t && (t.type === "num" || t.type === "id" || t.type === "lp" || (t.type === "op" && t.value === "√"));

  function parseExpr(): number {
    let v = parseTerm();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[pos++] as { value: string }).value;
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  function parseTerm(): number {
    let v = parseUnary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = (tokens[pos++] as { value: string }).value;
        const r = parseUnary();
        v = op === "*" ? v * r : v / r;
      } else if (peek()?.type === "id" && (peek() as { value: string }).value.toLowerCase() === "mod") {
        pos++;
        const r = parseUnary();
        v = ((v % r) + r) % r;
      } else if (startsOperand(peek())) {
        // implicit multiplication: 2π, 3(1+2), (1+2)(3+4)
        v *= parsePower();
      } else {
        return v;
      }
    }
  }

  function parseUnary(): number {
    if (isOp("-")) {
      pos++;
      return -parseUnary();
    }
    if (isOp("+")) {
      pos++;
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePostfix();
    if (isOp("^")) {
      pos++;
      return Math.pow(base, parseUnary());
    }
    return base;
  }

  function parsePostfix(): number {
    let v = parsePrimary();
    while (isOp("!") || isOp("%")) {
      const op = (tokens[pos++] as { value: string }).value;
      v = op === "!" ? factorial(v) : v / 100;
    }
    return v;
  }

  function parseArgs(): number[] {
    if (peek()?.type !== "lp") throw new ExpressionError("Expected “(” after function name");
    pos++;
    const args = [parseExpr()];
    while (peek()?.type === "comma") {
      pos++;
      args.push(parseExpr());
    }
    if (peek()?.type !== "rp") throw new ExpressionError("Missing “)”");
    pos++;
    return args;
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new ExpressionError("Incomplete expression");
    if (t.type === "num") {
      pos++;
      return t.value;
    }
    if (t.type === "op" && t.value === "√") {
      pos++;
      return Math.sqrt(parsePostfix());
    }
    if (t.type === "lp") {
      pos++;
      const v = parseExpr();
      // Be forgiving about missing closing brackets at the end, like most calculators.
      if (peek()?.type === "rp") pos++;
      else if (pos < tokens.length) throw new ExpressionError("Missing “)”");
      return v;
    }
    if (t.type === "id") {
      pos++;
      const name = t.value;
      const lower = name.toLowerCase();
      const fnName = Object.keys(FUNCS).find((k) => k.toLowerCase() === lower);
      if (fnName) return FUNCS[fnName](...parseArgs());
      const c = CONSTS[lower] ?? CONSTS[name];
      if (c) return c();
      throw new ExpressionError(`Unknown name “${name}”`);
    }
    throw new ExpressionError("Unexpected symbol");
  }

  if (!tokens.length) throw new ExpressionError("Empty expression");
  const value = parseExpr();
  if (pos < tokens.length) throw new ExpressionError("Unexpected “)”");
  return value;
}

/** Format a result to at most 12 significant digits, hiding floating point noise. */
export function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Not a number";
  if (!Number.isFinite(value)) return value > 0 ? "∞" : "-∞";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(10).replace(/\.?0+e/, "e");
  return String(Number(value.toPrecision(12)));
}
