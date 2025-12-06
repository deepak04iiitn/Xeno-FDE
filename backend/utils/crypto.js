import crypto from 'crypto';
import dotenv from 'dotenv';

// Encryption key from environment variable (should be 32 bytes = 64 hex characters for AES-256)
const ALGORITHM = 'aes-256-gcm';

let ENCRYPTION_KEY;
if (process.env.ENCRYPTION_KEY) {
  // Validating key length (must be 64 hex characters = 32 bytes)
  if (process.env.ENCRYPTION_KEY.length !== 64 || !/^[0-9a-fA-F]+$/.test(process.env.ENCRYPTION_KEY)) {
    console.error('ERROR: ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    console.error('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
} else {
  // Generating a random key (not suitable for production)
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('WARNING: ENCRYPTION_KEY not set. Using a random key that will change on restart.');
  console.warn('Set ENCRYPTION_KEY environment variable to a 32-byte hex string for production.');
  console.warn('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(text) {
  if (!text) {
    return null;
  }

  try {
    // Generating a random initialization vector (IV)
    const iv = crypto.randomBytes(16);
    
    // Creating cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    // Encrypting the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Getting the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with encrypt()
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plaintext
 */
export function decrypt(encryptedData) {
  if (!encryptedData) {
    return null;
  }

  try {
    // Splitting the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // If it doesn't have the expected format, assumming it's plaintext (for backward compatibility)
      // This allows existing unencrypted data to still work
      console.warn('Data does not appear to be encrypted, returning as-is (backward compatibility)');
      return encryptedData;
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    
    // Converting from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Creating decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    // Decrypting
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, it might be plaintext (for backward compatibility)
    // Log the error but return the original value
    console.warn('Decryption failed, returning original value (may be plaintext)');
    return encryptedData;
  }
}

