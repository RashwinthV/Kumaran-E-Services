const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY ||
    "9a7b3c2e5f1a4d8c0b2e7f9a1c3d5e7f8a2b4c6e8d0a2c4e6f8b0d2e4f6a8c0e",
  "hex",
);
const IV_LENGTH = 16;

const isEncryptedFormat = (text) => {
  if (typeof text !== "string" || !text.includes(":")) return false;
  const parts = text.split(":");
  return (
    parts.length === 2 &&
    /^[0-9a-f]{32}$/i.test(parts[0]) &&
    /^[0-9a-f]+$/i.test(parts[1])
  );
};

const encrypt = (text) => {
  if (!text) return text;
  if (isEncryptedFormat(text)) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
};

const decrypt = (text) => {
  if (!text || !text.includes(":")) return text;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const decryptedText = decrypted.toString();

    // Handle double encryption recursively
    if (isEncryptedFormat(decryptedText)) {
      return decrypt(decryptedText);
    }
    return decryptedText;
  } catch (error) {
    console.error("Decryption error:", error);
    return text;
  }
};

module.exports = { encrypt, decrypt };
