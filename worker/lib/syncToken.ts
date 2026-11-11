function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface SyncTokenPayload {
  mid: string
  exp: number
  nonce: string
}

/**
 * Generates a short-lived (120s) signed sync token bound to merchantId.
 */
export async function generateSyncToken(merchantId: string, secret: string): Promise<string> {
  const payload: SyncTokenPayload = {
    mid: merchantId,
    exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes TTL
    nonce: crypto.randomUUID(),
  }

  const payloadJson = JSON.stringify(payload)
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(payloadJson))

  const key = await getHmacKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadEncoded))
  const signatureEncoded = base64UrlEncode(signatureBuffer)

  return `${payloadEncoded}.${signatureEncoded}`
}

/**
 * Validates token signature, expiration, and merchant binding in constant-time.
 */
export async function verifySyncToken(token: string, merchantId: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return false

    const [payloadEncoded, signatureEncoded] = parts
    const signatureBytes = base64UrlDecode(signatureEncoded)

    const key = await getHmacKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(payloadEncoded)
    )

    if (!valid) return false

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadEncoded))
    const payload: SyncTokenPayload = JSON.parse(payloadJson)

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return false

    // Check merchant id binding
    if (payload.mid !== merchantId) return false

    return true
  } catch {
    return false
  }
}

