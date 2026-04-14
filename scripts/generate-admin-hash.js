import { createHash } from "crypto"

const password = process.argv[2]

if (!password) {
  console.error("Usage: node scripts/generate-admin-hash.js <password>")
  process.exit(1)
}

console.log(`sha256:${createHash("sha256").update(password).digest("hex")}`)
