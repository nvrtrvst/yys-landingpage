import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  RateLimitError,
  handleApiError,
  logError,
} from '@/lib/errors';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleApiError', () => {
  it('maps AppError instances to their status and message', async () => {
    const response = handleApiError(new ValidationError('invalid input'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid input' });
  });

  it('maps the remaining AppError kinds', () => {
    expect(handleApiError(new AuthenticationError()).status).toBe(401);
    expect(handleApiError(new ForbiddenError()).status).toBe(403);
    expect(handleApiError(new RateLimitError()).status).toBe(429);
  });

  it('hides internal messages for generic errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = handleApiError(new Error('secret db failure'));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Kesalahan server internal' });
  });

  it('treats non-Error throws as internal errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = handleApiError('boom');
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Kesalahan server internal' });
  });
});

describe('logError', () => {
  it('never throws', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => logError(new ValidationError('x'), 'ctx')).not.toThrow();
    expect(() => logError(new Error('y'), 'ctx')).not.toThrow();
    expect(() => logError('z')).not.toThrow();
  });
});
