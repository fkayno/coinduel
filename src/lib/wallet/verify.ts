import nacl from "tweetnacl";
import { decodeBase58 } from "@/lib/solana";
import { hexToBytes } from "@/lib/hex";

/**
 * Cryptographically verifies that `signatureHex` is a valid ed25519
 * detached signature over `message`, produced by the private key
 * corresponding to `walletAddress`. This is the ONLY thing that is allowed
 * to mark a wallet as verified — never a client's say-so.
 */
export function verifyWalletSignature(input: {
  message: string;
  signatureHex: string;
  walletAddress: string;
}): boolean {
  try {
    const messageBytes = new TextEncoder().encode(input.message);
    const signatureBytes = hexToBytes(input.signatureHex);
    const publicKeyBytes = decodeBase58(input.walletAddress);

    // ed25519 keys and detached signatures are always exactly these lengths.
    if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
