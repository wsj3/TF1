import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-secure-encryption-key';

/**
 * Encrypts data using AES encryption
 * @param {string} data - The data to encrypt
 * @returns {string} - The encrypted data
 */
export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

/**
 * Decrypts data using AES encryption
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {string} - The decrypted data
 */
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

/**
 * Generates a secure random key
 * @returns {string} - A secure random key
 */
export const generateSecureKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
}; 