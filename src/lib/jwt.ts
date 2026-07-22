export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

export const JWT_ALGORITHMS: JwtAlgorithm[] = ["HS256", "HS384", "HS512"];

const HMAC_HASH: Record<JwtAlgorithm, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

export function isHmacAlgorithm(alg: string): alg is JwtAlgorithm {
  return Object.prototype.hasOwnProperty.call(HMAC_HASH, alg);
}

export class JwtDecodeError extends Error {}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function base64UrlEncodeText(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

export function base64UrlDecodeToText(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

export interface DecodedJwt {
  headerB64: string;
  payloadB64: string;
  signatureB64: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signingInput: string;
}

export function decodeJwtStructure(token: string): DecodedJwt {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtDecodeError(
      "A JWT must have three dot-separated parts: header.payload.signature."
    );
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64) {
    throw new JwtDecodeError("The token is missing a header or payload segment.");
  }

  let header: unknown;
  try {
    header = JSON.parse(base64UrlDecodeToText(headerB64));
  } catch {
    throw new JwtDecodeError("The header segment isn't valid Base64URL-encoded JSON.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecodeToText(payloadB64));
  } catch {
    throw new JwtDecodeError("The payload segment isn't valid Base64URL-encoded JSON.");
  }

  if (typeof header !== "object" || header === null || Array.isArray(header)) {
    throw new JwtDecodeError("The header must decode to a JSON object.");
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new JwtDecodeError("The payload must decode to a JSON object.");
  }

  return {
    headerB64,
    payloadB64,
    signatureB64,
    header: header as Record<string, unknown>,
    payload: payload as Record<string, unknown>,
    signingInput: `${headerB64}.${payloadB64}`,
  };
}

export function secretToBytes(secret: string, isBase64Url: boolean): Uint8Array {
  if (!isBase64Url) return new TextEncoder().encode(secret);
  return base64UrlToBytes(secret);
}

async function hmacKey(alg: JwtAlgorithm, secretBytes: Uint8Array) {
  return crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: HMAC_HASH[alg] },
    false,
    ["sign", "verify"]
  );
}

export async function verifyHmacSignature(
  alg: JwtAlgorithm,
  secretBytes: Uint8Array,
  signingInput: string,
  signatureB64: string
): Promise<boolean> {
  if (!signatureB64) return false;

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signatureB64);
  } catch {
    return false;
  }

  try {
    const key = await hmacKey(alg, secretBytes);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      new TextEncoder().encode(signingInput)
    );
  } catch {
    return false;
  }
}

export async function signHmac(
  alg: JwtAlgorithm,
  secretBytes: Uint8Array,
  signingInput: string
): Promise<string> {
  const key = await hmacKey(alg, secretBytes);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function buildJwt(
  alg: JwtAlgorithm,
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
  secretIsBase64Url: boolean
): Promise<string> {
  const headerB64 = base64UrlEncodeText(JSON.stringify(header));
  const payloadB64 = base64UrlEncodeText(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const secretBytes = secretToBytes(secret, secretIsBase64Url);
  const signatureB64 = await signHmac(alg, secretBytes, signingInput);
  return `${signingInput}.${signatureB64}`;
}

export const HEADER_CLAIM_INFO: Record<string, string> = {
  alg: "Algorithm used to sign the token.",
  typ: 'Type of token — typically "JWT".',
  kid: "Key ID — hints which key was used to sign the token.",
  cty: "Content Type — set when the payload itself contains another JWT.",
};

export const PAYLOAD_CLAIM_INFO: Record<string, string> = {
  iss: "Issuer — identifies the principal that issued the JWT.",
  sub: "Subject — identifies the principal that is the subject of the JWT.",
  aud: "Audience — identifies the recipient(s) the JWT is intended for.",
  exp: "Expiration Time — the token must not be accepted after this time.",
  nbf: "Not Before — the token must not be accepted before this time.",
  iat: "Issued At — the time at which the JWT was issued.",
  jti: "JWT ID — a unique identifier for the token, used to prevent replay.",
};

const EPOCH_SECONDS_CLAIMS = new Set(["exp", "nbf", "iat"]);

export function isEpochSecondsClaim(key: string): boolean {
  return EPOCH_SECONDS_CLAIMS.has(key);
}

export function epochSecondsToDate(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000);
}

export const EXAMPLE_HEADER = { alg: "HS256", typ: "JWT" };
export const EXAMPLE_PAYLOAD = {
  sub: "1234567890",
  name: "John Doe",
  admin: true,
  iat: 1516239022,
  tool: "utility-hub",
};
export const EXAMPLE_SECRET = "string-secret-at-least-256-bits-long";
