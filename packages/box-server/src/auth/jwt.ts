import type { BoxTokenProvider } from "./ccg.js";

/**
 * JWT (Server Authentication with a keypair) is intentionally not implemented
 * here yet. Per the integration guide, prefer CCG and only add JWT when a
 * concrete deployment still depends on it — at which point this becomes a real
 * provider (typically wrapping `box-node-sdk`'s app-auth client) that satisfies
 * {@link BoxTokenProvider}.
 */
export interface BoxJwtConfig {
  clientId: string;
  clientSecret: string;
  publicKeyId: string;
  privateKey: string;
  passphrase: string;
  subjectType: "enterprise" | "user";
  subjectId: string;
}

export const createJwtTokenProvider = (_config: BoxJwtConfig): BoxTokenProvider => {
  throw new Error(
    "JWT auth is not implemented. Use createCcgTokenProvider (CCG) or supply your own BoxTokenProvider.",
  );
};
