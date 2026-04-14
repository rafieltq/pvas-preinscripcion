export const SESSION_COOKIE_NAME = "admin_session"
export const SESSION_DURATION_SECONDS = 60 * 60 * 8

export interface AdminSession {
  userId: number
  email: string
  role: string
  exp: number
}

function toBase64Url(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url")
  }

  const encoded = btoa(input)
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64url").toString("utf8")
  }

  const padded = input.padEnd(Math.ceil(input.length / 4) * 4, "=")
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/")
  return atob(normalized)
}

function toBase64UrlBytes(input: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64url")
  }

  let binary = ""
  for (let i = 0; i < input.length; i++) {
    binary += String.fromCharCode(input[i])
  }
  const encoded = btoa(binary)
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return toBase64UrlBytes(new Uint8Array(signature))
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || ""
}

export async function createSessionToken(input: {
  userId: number
  email: string
  role?: string
}): Promise<string> {
  const secret = getAuthSecret()
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }

  const payload: AdminSession = {
    userId: input.userId,
    email: input.email,
    role: input.role || "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token?: string | null): Promise<AdminSession | null> {
  if (!token) return null

  const secret = getAuthSecret()
  if (!secret) return null

  const [payloadPart, signaturePart] = token.split(".")
  if (!payloadPart || !signaturePart) return null

  const expected = await sign(payloadPart, secret)
  if (expected !== signaturePart) return null

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as AdminSession
    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp <= now) return null
    if (!payload.userId || !payload.email) return null
    return payload
  } catch {
    return null
  }
}
