import { createHash } from "crypto"

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex: string): Uint8Array {
  const output = new Uint8Array(hex.length / 2)
  for (let i = 0; i < output.length; i++) {
    output[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return output
}

export function createSha256PasswordHash(password: string): string {
  return `sha256:${createHash("sha256").update(password).digest("hex")}`
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  )

  return `${toHex(salt.buffer)}:${toHex(derived)}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("sha256:")) {
    const digest = createHash("sha256").update(password).digest("hex")
    return `sha256:${digest}` === storedHash
  }

  const [saltHex, hashHex] = storedHash.split(":")
  if (!saltHex || !hashHex) return false

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  )

  return toHex(derived) === hashHex
}
