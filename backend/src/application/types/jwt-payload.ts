/**
 * Shape of the object attached to request.user by JwtAuthGuard
 * after successful token verification and DB lookup.
 *
 * The guard resolves the full User record and appends organizationId
 * from the JWT claim, so all User fields except the password hash
 * are available alongside the tenant identifier.
 */
export interface JwtPayload {
  id: string;
  rut: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  roles?: string[];
}
