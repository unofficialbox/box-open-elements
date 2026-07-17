/** Authoritative modern Box typography stack. Lato belongs to legacy BUE only. */
export const boeFontFamily = {
  base: "var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif)",
  fallback: "InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

export interface BoeTypeRole {
  fontSize: string;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing: string;
  lineHeight: string;
}

/** Product type roles derived from the current Box measurements in the visual reference contract. */
export const boeType = {
  pageHeading: { fontSize: "21px", lineHeight: "32px", fontWeight: 700, letterSpacing: "-0.01em" },
  dialogHeading: { fontSize: "19px", lineHeight: "24px", fontWeight: 700, letterSpacing: "-0.005em" },
  sectionHeading: { fontSize: "16px", lineHeight: "24px", fontWeight: 700, letterSpacing: "0" },
  button: { fontSize: "16px", lineHeight: "24px", fontWeight: 700, letterSpacing: "0" },
  menuItem: { fontSize: "15px", lineHeight: "20px", fontWeight: 400, letterSpacing: "0" },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: 400, letterSpacing: "0" },
  bodyStrong: { fontSize: "14px", lineHeight: "20px", fontWeight: 600, letterSpacing: "0" },
  label: { fontSize: "13px", lineHeight: "20px", fontWeight: 600, letterSpacing: "0" },
  metadata: { fontSize: "12px", lineHeight: "16px", fontWeight: 400, letterSpacing: "0" },
  caption: { fontSize: "11px", lineHeight: "16px", fontWeight: 600, letterSpacing: "0" },
} as const satisfies Record<string, BoeTypeRole>;

export const boeTypographyHostDeclaration = `font-family: ${boeFontFamily.base};`;

export const boeTypeStyles = (selector: string, role: BoeTypeRole): string => `
  ${selector} {
    font-size: ${role.fontSize};
    line-height: ${role.lineHeight};
    font-weight: ${role.fontWeight};
    letter-spacing: ${role.letterSpacing};
  }
`;
