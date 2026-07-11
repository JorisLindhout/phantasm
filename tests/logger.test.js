import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('createLogger', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it('always logs errors', async () => {
        vi.stubEnv('DEV', false);
        const { createLogger } = await import('../js/logger.js');
        const log = createLogger('test');

        log.error('failure');

        expect(console.error).toHaveBeenCalledWith('[test]', 'failure');
    });

    it('logs warnings in development', async () => {
        vi.stubEnv('DEV', true);
        const { createLogger } = await import('../js/logger.js');
        const log = createLogger('test');

        log.warn('heads up');

        expect(console.warn).toHaveBeenCalledWith('[test]', 'heads up');
    });

    it('suppresses warnings in production', async () => {
        vi.stubEnv('DEV', false);
        const { createLogger } = await import('../js/logger.js');
        const log = createLogger('test');

        log.warn('heads up');

        expect(console.warn).not.toHaveBeenCalled();
    });
});
