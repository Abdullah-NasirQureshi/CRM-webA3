// **Feature: property-dealer-crm, Property 19: WhatsApp URL format correctness**
// **Validates: Requirements 10.1**
import * as fc from "fast-check";
import { formatWhatsAppUrl } from "@/lib/whatsapp";

describe("Property 19: WhatsApp URL format correctness", () => {
  it("returns a URL matching https://wa.me/<digits> with no + present", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)),
        (digits) => {
          // Test without leading +
          const url = formatWhatsAppUrl(digits);
          expect(url).toBe(`https://wa.me/${digits}`);
          expect(url).not.toContain("+");

          // Test with leading +
          const urlWithPlus = formatWhatsAppUrl(`+${digits}`);
          expect(urlWithPlus).toBe(`https://wa.me/${digits}`);
          expect(urlWithPlus).not.toContain("+");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("always starts with https://wa.me/ for any phone string", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (phone) => {
          const url = formatWhatsAppUrl(phone);
          expect(url.startsWith("https://wa.me/")).toBe(true);
          expect(url).not.toContain("+");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("handles international format with + prefix", () => {
    expect(formatWhatsAppUrl("+923001234567")).toBe("https://wa.me/923001234567");
    expect(formatWhatsAppUrl("923001234567")).toBe("https://wa.me/923001234567");
    expect(formatWhatsAppUrl("+1 800 555 0100")).toBe("https://wa.me/18005550100");
  });
});
