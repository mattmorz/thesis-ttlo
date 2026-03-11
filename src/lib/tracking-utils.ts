import crypto from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeTrackingCode(input: string) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizePhone(input: string) {
  return input.trim().replace(/[^0-9+]/g, "");
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateTrackingCode() {
  const randomPart = Array.from({ length: 6 }, () => {
    const idx = crypto.randomInt(0, CODE_CHARS.length);
    return CODE_CHARS[idx];
  }).join("");

  return `JT-${randomPart}`;
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}
