import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Must be exactly 32 bytes (256 bits)
// In production, this should be stored securely in an environment variable (e.g., process.env.ENCRYPTION_KEY)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_bytes_long!!' // DO NOT USE THIS IN PRODUCTION

export function encrypt(text: string): string {
  // Generate random IV
  const iv = crypto.randomBytes(16)
  
  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '!').slice(0, 32)), 
    iv
  )
  
  // Encrypt text
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get auth tag
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string | null {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) return null

    const [ivHex, authTagHex, encryptedHex] = parts
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encryptedText = Buffer.from(encryptedHex, 'hex')
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '!').slice(0, 32)), 
      iv
    )
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}
