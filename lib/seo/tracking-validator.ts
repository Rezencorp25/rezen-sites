export type TrackingId = "ga4" | "metaPixel" | "adsense" | "googleAds";

export type TrackingValidation = {
  valid: boolean;
  message?: string;
};

const PATTERNS: Record<TrackingId, { pattern: RegExp; example: string }> = {
  ga4: {
    pattern: /^G-[A-Z0-9]{6,12}$/,
    example: "G-XXXXXXXXXX",
  },
  metaPixel: {
    pattern: /^\d{15,16}$/,
    example: "902345671234567 (15-16 cifre)",
  },
  adsense: {
    pattern: /^(ca-)?pub-\d{16}$/,
    example: "pub-1234567890123456 oppure ca-pub-…",
  },
  googleAds: {
    pattern: /^AW-\d{8,12}(\/[A-Za-z0-9_-]+)?$/,
    example: "AW-10987654321 oppure AW-…/CONV_LABEL",
  },
};

export function validateTrackingId(
  id: string,
  type: TrackingId,
): TrackingValidation {
  const trimmed = id.trim();
  if (!trimmed) return { valid: false, message: "ID vuoto" };
  const { pattern, example } = PATTERNS[type];
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      message: `Formato non valido. Esempio: ${example}`,
    };
  }
  return { valid: true };
}
