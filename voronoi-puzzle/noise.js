// Simple Perlin-like noise implementation for Voronoi cell animation
// This is a simplified version for smooth boundary animation

class Noise {
    constructor() {
        this.permutation = [];
        this.p = [];
        this.init();
    }

    init() {
        // Create permutation table
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        
        // Shuffle the permutation table
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        
        // Duplicate the permutation array
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i & 255];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.p[X] + Y;
        const AA = this.p[A];
        const AB = this.p[A + 1];
        const B = this.p[X + 1] + Y;
        const BA = this.p[B];
        const BB = this.p[B + 1];
        
        return this.lerp(v,
            this.lerp(u, this.grad(this.p[AA], x, y),
                this.grad(this.p[BA], x - 1, y)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1),
                this.grad(this.p[BB], x - 1, y - 1)));
    }

    // Generate animated noise value for time-based animation
    animatedNoise(x, y, time, frequency = 0.01, amplitude = 1) {
        return this.noise2D(x * frequency, y * frequency + time) * amplitude;
    }
}

// Export for use in main script
window.Noise = Noise;
