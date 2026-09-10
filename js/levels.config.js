/**
 * Ordered level manifest — single source of truth for progression.
 * Add Level-N.svg, theme entry, and one row here to register a new level.
 * `drone` is optional; omitted knobs inherit the engine default in drone-sound.js.
 */

import { createLogger } from './logger.js';

const log = createLogger('levels.config');

/**
 * Resolve difficulty values from a level configuration object.
 * @param {object} levelConfig
 * @returns {{
 *   cellCount: number,
 *   animationSpeed: number,
 *   noiseAmplitude: number,
 *   morphIntervalMs: number,
 *   morphCornerCount: number,
 *   birthOffsetPx: number
 * }}
 */
export function resolveLevelConfig(levelConfig) {
    const config = levelConfig?.config ?? levelConfig?.difficulty ?? levelConfig;
    return {
        cellCount: config.cellCount,
        animationSpeed: config.animationSpeed,
        noiseAmplitude: config.noiseAmplitude,
        morphIntervalMs: config.morphIntervalMs ?? 3500,
        morphCornerCount: config.morphCornerCount ?? 3,
        birthOffsetPx: config.birthOffsetPx ?? 18,
    };
}

export const LEVEL_MANIFEST = [
    {
        id: 'level-1',
        name: 'Level 1',
        theme: 'levelOne',
        asset: './assets/Level-1.svg',
        difficulty: {
            cellCount: 20,
            animationSpeed: 1.2,
            noiseAmplitude: 5,
            morphIntervalMs: 4000,
            morphCornerCount: 3,
            birthOffsetPx: 14,
        },
        release: { phone: 4, tablet: 7, desktop: 10, large: 15 },
        drone: {
            freq: 91,
            detuneHz: 0.33,
            filterFreq: 1085,
            filterQ: 1.4,
            lfoRate: 0.65,
            lfoDepth: 128,
            slowRate: 0.187,
            slowDepth: 681,
            pitchDrift: 5.3,
            wander: 226,
            shimmer: 0.04,
        },
        unlockedByDefault: true,
    },
    {
        id: 'level-2',
        name: 'Level 2',
        theme: 'levelTwo',
        asset: './assets/Level-2.svg',
        difficulty: {
            cellCount: 40,
            animationSpeed: 1.0,
            noiseAmplitude: 10,
            morphIntervalMs: 3200,
            morphCornerCount: 5,
            birthOffsetPx: 16,
        },
        release: { phone: 3, tablet: 5, desktop: 8, large: 12 },
        drone: {
            freq: 114,
            detuneHz: 0.42,
            filterFreq: 1400,
            filterQ: 1.35,
            lfoRate: 0.82,
            lfoDepth: 175,
            slowRate: 0.23,
            slowDepth: 760,
            pitchDrift: 6.4,
            wander: 300,
            shimmer: 0.046,
        },
        unlockedByDefault: false,
    },
    {
        id: 'level-3',
        name: 'Level 3',
        theme: 'levelThree',
        asset: './assets/Level-3.svg',
        difficulty: {
            cellCount: 60,
            animationSpeed: 0.8,
            noiseAmplitude: 15,
            morphIntervalMs: 2400,
            morphCornerCount: 8,
            birthOffsetPx: 18,
        },
        release: { phone: 2, tablet: 4, desktop: 6, large: 10 },
        drone: {
            freq: 136.5,
            detuneHz: 0.52,
            filterFreq: 1850,
            filterQ: 1.25,
            lfoRate: 1.05,
            lfoDepth: 230,
            slowRate: 0.28,
            slowDepth: 820,
            pitchDrift: 7.2,
            wander: 380,
            shimmer: 0.052,
        },
        unlockedByDefault: false,
    },
    {
        id: 'level-4',
        name: 'Level 4',
        theme: 'levelFour',
        asset: './assets/Level-4.svg',
        difficulty: {
            cellCount: 80,
            animationSpeed: 0.6,
            noiseAmplitude: 20,
            morphIntervalMs: 1800,
            morphCornerCount: 12,
            birthOffsetPx: 20,
        },
        release: { phone: 1, tablet: 3, desktop: 4, large: 7 },
        drone: {
            freq: 182,
            detuneHz: 0.66,
            filterFreq: 2400,
            filterQ: 1.15,
            lfoRate: 1.28,
            lfoDepth: 290,
            slowRate: 0.34,
            slowDepth: 880,
            pitchDrift: 8,
            wander: 460,
            shimmer: 0.058,
        },
        unlockedByDefault: false,
    },
];

const UNLOCK_STORAGE_KEY = 'phantasm-unlocked-levels';

/**
 * @param {string} levelId
 * @returns {object | undefined}
 */
export function getLevelById(levelId) {
    return LEVEL_MANIFEST.find((level) => level.id === levelId);
}

/**
 * @param {string} levelId
 * @returns {number}
 */
export function getLevelIndex(levelId) {
    return LEVEL_MANIFEST.findIndex((level) => level.id === levelId);
}

/**
 * @param {string} levelId
 * @returns {string | null}
 */
export function getNextLevelId(levelId) {
    const index = getLevelIndex(levelId);
    if (index < 0 || index >= LEVEL_MANIFEST.length - 1) {
        return null;
    }
    return LEVEL_MANIFEST[index + 1].id;
}

/**
 * @param {string} levelId
 * @returns {boolean}
 */
export function isFinalLevel(levelId) {
    return getLevelIndex(levelId) === LEVEL_MANIFEST.length - 1;
}

/**
 * @returns {string[]}
 */
export function loadUnlockedLevelIds() {
    try {
        const saved = localStorage.getItem(UNLOCK_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        const validIds = new Set(LEVEL_MANIFEST.map((level) => level.id));
        return parsed.filter((id) => validIds.has(id));
    } catch {
        return [];
    }
}

/**
 * @param {string[]} unlockedIds
 */
export function saveUnlockedLevelIds(unlockedIds) {
    try {
        localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(unlockedIds));
    } catch (error) {
        log.warn('Failed to save unlocked levels:', error);
    }
}

/**
 * @param {string} levelId
 * @param {string[]} unlockedIds
 * @returns {string[]}
 */
export function unlockLevelId(levelId, unlockedIds) {
    if (!getLevelById(levelId) || unlockedIds.includes(levelId)) {
        return unlockedIds;
    }
    return [...unlockedIds, levelId];
}

/**
 * @param {object} entry
 * @returns {object}
 */
export function manifestEntryToLevelConfig(entry) {
    return {
        id: entry.id,
        name: entry.name,
        theme: entry.theme,
        asset: entry.asset,
        config: entry.difficulty,
        release: entry.release,
        drone: entry.drone,
        unlockedByDefault: entry.unlockedByDefault,
    };
}
