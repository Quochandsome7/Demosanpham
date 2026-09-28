function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToUtf8(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function generateJWT(
  payload: any,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };

  const headerStr = utf8ToBase64Url(JSON.stringify(header));
  const payloadStr = utf8ToBase64Url(JSON.stringify(payload));
  const data = `${headerStr}.${payloadStr}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  const signatureArr = Array.from(new Uint8Array(signature));
  const signatureStr = btoa(String.fromCharCode.apply(null, signatureArr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${data}.${signatureStr}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [headerStr, payloadStr, signatureStr] = parts;
  const data = `${headerStr}.${payloadStr}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Base64Url decode signature
  let signatureBase64 = signatureStr.replace(/-/g, "+").replace(/_/g, "/");

  while (signatureBase64.length % 4) {
    signatureBase64 += "=";
  }

  const signatureBinary = atob(signatureBase64);
  const signatureArr = new Uint8Array(signatureBinary.length);
  for (let i = 0; i < signatureBinary.length; i++) {
    signatureArr[i] = signatureBinary.charCodeAt(i);
  }

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureArr,
    encoder.encode(data),
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  const payloadJson = base64UrlToUtf8(payloadStr);
  return JSON.parse(payloadJson);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
