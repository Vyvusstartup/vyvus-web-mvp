import crypto from "crypto";
export function sha256hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
