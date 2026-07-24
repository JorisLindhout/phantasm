/**
 * Ordered level manifest — single source of truth for progression.
 * Add Level-N.svg, theme entry, and one row here to register a new level.
 */

import { createLogger } from './logger.js';

const log = createLogger('levels.config');

/**
 * Resolve difficulty values from a level configuration object.
 * @param {object} levelConfig
 * @returns {{ cellCount: number, animationSpeed: number, noiseAmplitude: number, morphIntervalMs: number }}
 */
export function resolveLevelConfig(levelConfig) {
    const config = levelConfig?.config ?? levelConfig?.difficulty ?? levelConfig;
    return {
        cellCount: config.cellCount,
        animationSpeed: config.animationSpeed,
        noiseAmplitude: config.noiseAmplitude,
        morphIntervalMs: config.morphIntervalMs ?? 3500,
    };
}

export const LEVEL_MANIFEST = [
    {
        id: 'level-1',
        name: 'Level 1',
        theme: 'levelOne',
        asset: './assets/Level-1.svg',
        difficulty: { cellCount: 20, animationSpeed: 1.2, noiseAmplitude: 5, morphIntervalMs: 3500 },
        release: { phone: 4, tablet: 7, desktop: 10, large: 15 },
        unlockedByDefault: true,
    },
    {
        id: 'level-2',
        name: 'Level 2',
        theme: 'levelTwo',
        asset: './assets/Level-2.svg',
        difficulty: { cellCount: 40, animationSpeed: 1.0, noiseAmplitude: 10, morphIntervalMs: 2800 },
        release: { phone: 3, tablet: 5, desktop: 8, large: 12 },
        unlockedByDefault: false,
    },
    {
        id: 'level-3',
        name: 'Level 3',
        theme: 'levelThree',
        asset: './assets/Level-3.svg',
        difficulty: { cellCount: 60, animationSpeed: 0.8, noiseAmplitude: 15, morphIntervalMs: 2100 },
        release: { phone: 2, tablet: 4, desktop: 6, large: 10 },
        unlockedByDefault: false,
    },
    {
        id: 'level-4',
        name: 'Level 4',
        theme: 'levelFour',
        asset: './assets/Level-4.svg',
        difficulty: { cellCount: 80, animationSpeed: 0.6, noiseAmplitude: 20, morphIntervalMs: 1500 },
        release: { phone: 1, tablet: 3, desktop: 4, large: 7 },
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
        unlockedByDefault: entry.unlockedByDefault,
    };
}
