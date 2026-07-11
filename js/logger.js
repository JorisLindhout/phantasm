/**
 * Minimal app logger — errors in all environments; warnings in dev only.
 */

const isDev = import.meta.env.DEV;

/**
 * @param {string} namespace
 */
export function createLogger(namespace) {
    const prefix = `[${namespace}]`;

    return {
        error: (...args) => console.error(prefix, ...args),
        warn: (...args) => {
            if (isDev) {
                console.warn(prefix, ...args);
            }
        },
    };
}
