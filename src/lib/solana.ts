const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function decodeBase58(input: string): Uint8Array {
  const bytes = [0];

  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error("Invalid base58 character");

    let carry = value;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  let leadingZeros = 0;
  for (const char of input) {
    if (char !== "1") break;
    leadingZeros++;
  }

  // `bytes` seeds as [0]; if the decoded value is trivially zero, that seed
  // isn't a real significant digit, so drop it — otherwise every all-"1"
  // address would decode one byte too long.
  const numericBytes = bytes.length === 1 && bytes[0] === 0 ? [] : bytes;

  const result = new Uint8Array(leadingZeros + numericBytes.length);
  for (let i = 0; i < numericBytes.length; i++) {
    result[leadingZeros + i] = numericBytes[numericBytes.length - 1 - i];
  }
  return result;
}

/** Validates that a string is a well-formed Solana public key: base58, 32 bytes. */
export function isValidSolanaAddress(address: string): boolean {
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;

  for (const char of trimmed) {
    if (!BASE58_ALPHABET.includes(char)) return false;
  }

  try {
    return decodeBase58(trimmed).length === 32;
  } catch {
    return false;
  }
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
