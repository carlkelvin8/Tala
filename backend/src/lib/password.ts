// Import the bcryptjs library for hashing and comparing passwords
import bcrypt from "bcryptjs"

/* Hash a plain-text password using bcrypt with a cost factor of 10 */
export async function hashPassword(password: string) {
  // bcrypt.hash generates a salt and hashes the password; cost factor 10 is a good balance
  return bcrypt.hash(password, 10)
}

/* Compare a plain-text password against a stored bcrypt hash */
export async function verifyPassword(password: string, hash: string) {
  // bcrypt.compare returns true if the password matches the hash, false otherwise
  return bcrypt.compare(password, hash)
}
