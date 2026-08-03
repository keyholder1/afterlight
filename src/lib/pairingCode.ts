// Pairing code generation — see docs/06-technical-architecture.md § Auth &
// pairing: 6 characters from a 32-character alphabet excluding ambiguous
// characters (0/O/1/I/L).

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export function generateCodeString(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function formatCodeForDisplay(code: string): string {
  // "9FK3X7" -> "9F K3 X7" — matches docs/02-ux-flows-and-wireframes.md § 1
  return code.replace(/(.{2})/g, '$1 ').trim();
}
