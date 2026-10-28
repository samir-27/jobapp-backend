import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

describe('Auth Guards', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(() => {
      guard = new JwtAuthGuard(reflector);
    });

    it('allows public route without token', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('denies access when unauthenticated on private route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
      } as unknown as ExecutionContext;

      expect(() => guard.handleRequest(null, null, null, mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('passes user when authenticated on private route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
      } as unknown as ExecutionContext;
      const user = { id: '123', role: 'user', type: 'user' };

      expect(guard.handleRequest(null, user, null, mockContext)).toEqual(user);
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('allows access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'user' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('denies access when user role does not match required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'user', type: 'user' } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('allows access when user has matching role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const mockContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'admin', type: 'admin' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
});
