import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Extracts the active organizationId from the JWT payload attached to the
 * request by JwtAuthGuard. Throws UnauthorizedException when missing — the
 * caller can be confident the value is non-empty.
 *
 * NOTE: until the organizations table lands (see docs/architecture/
 * optimization-roadmap.md P2), every JWT carries the default tenant id
 * "gatekeeper-default". The decorator already returns it so business code
 * can be written against the final contract.
 */
export const CurrentOrganization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { organizationId?: string };
    }>();
    const orgId = request.user?.organizationId;
    if (!orgId) {
      throw new UnauthorizedException('No active organization in session');
    }
    return orgId;
  },
);
