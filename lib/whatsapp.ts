/**
 * Formats a phone number into a WhatsApp click-to-chat URL.
 * Strips any leading '+' sign per the wa.me format requirement.
 * Req 10.1
 */
export function formatWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/^\+/, "").replace(/\s+/g, "");
  return `https://wa.me/${digits}`;
}
