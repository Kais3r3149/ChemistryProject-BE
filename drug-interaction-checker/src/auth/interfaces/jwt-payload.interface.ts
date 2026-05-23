/**
 * JWT payload interface.
 * Stored in token after successful authentication.
 */
export interface JwtPayload {
  readonly sub: number; // user ID
  readonly email: string;
  readonly role: string;
}
