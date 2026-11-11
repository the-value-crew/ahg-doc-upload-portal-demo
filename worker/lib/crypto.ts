/**
 * WebCrypto-based PBKDF2 hashing & JWT utilities for Cloudflare Workers
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  const iterations = 100000
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const saltB64 = btoa(String.fromCharCode(...salt))
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedKey)))
  return `pbkdf2$${iterations}$${saltB64}$${hashB64}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
    const iterations = parseInt(parts[1], 10)
    const salt = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0))
    const expectedHashBytes = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0))

    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    )
    const derivedBytes = new Uint8Array(derived)
    if (derivedBytes.length !== expectedHashBytes.length) return false
    
    // Constant-time comparison
    let diff = 0
    for (let i = 0; i < derivedBytes.length; i++) {
      diff |= derivedBytes[i] ^ expectedHashBytes[i]
    }
    return diff === 0
  } catch {
    return false
  }
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

export async function signJwt(payload: Record<string, any>, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
  return `${data}.${encodedSignature}`
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, signatureB64] = parts

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBytes = Uint8Array.from(base64UrlDecode(signatureB64), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      enc.encode(`${headerB64}.${payloadB64}`)
    )
    if (!valid) return null

    const payload = JSON.parse(base64UrlDecode(payloadB64))
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

