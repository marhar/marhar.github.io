/**
 * Lorenz Attractor - Automated Test Suite
 * Run with: node run_tests.js
 */

// ============================================================
// Core Functions (extracted from index.html for testing)
// ============================================================

const DT = 0.005;

function derivatives(s, params) {
    const { sigma, rho, beta } = params;
    return {
        dx: sigma * (s.y - s.x),
        dy: s.x * (rho - s.z) - s.y,
        dz: s.x * s.y - beta * s.z
    };
}

function rk4Step(s, dt, params) {
    const k1 = derivatives(s, params);

    const s2 = {
        x: s.x + k1.dx * dt / 2,
        y: s.y + k1.dy * dt / 2,
        z: s.z + k1.dz * dt / 2
    };
    const k2 = derivatives(s2, params);

    const s3 = {
        x: s.x + k2.dx * dt / 2,
        y: s.y + k2.dy * dt / 2,
        z: s.z + k2.dz * dt / 2
    };
    const k3 = derivatives(s3, params);

    const s4 = {
        x: s.x + k3.dx * dt,
        y: s.y + k3.dy * dt,
        z: s.z + k3.dz * dt
    };
    const k4 = derivatives(s4, params);

    return {
        x: s.x + (k1.dx + 2*k2.dx + 2*k3.dx + k4.dx) * dt / 6,
        y: s.y + (k1.dy + 2*k2.dy + 2*k3.dy + k4.dy) * dt / 6,
        z: s.z + (k1.dz + 2*k2.dz + 2*k3.dz + k4.dz) * dt / 6
    };
}

function calculateDivergence(s1, s2) {
    const dx = s2.x - s1.x;
    const dy = s2.y - s1.y;
    const dz = s2.z - s1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function project3D(x, y, z, width, height, rotation) {
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);

    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    const scale = Math.min(width, height) / 80;
    const px = width / 2 + rx * scale;
    const py = height / 2 - (z - 25) * scale * 0.8 + ry * scale * 0.3;

    return { x: px, y: py };
}

// Fixed points of the Lorenz system
function getFixedPoints(params) {
    const { sigma, rho, beta } = params;

    // Origin is always a fixed point
    const origin = { x: 0, y: 0, z: 0 };

    // For rho > 1, there are two more fixed points
    if (rho > 1) {
        const c = Math.sqrt(beta * (rho - 1));
        return [
            origin,
            { x: c, y: c, z: rho - 1 },
            { x: -c, y: -c, z: rho - 1 }
        ];
    }

    return [origin];
}

// ============================================================
// Test Suite
// ============================================================

const TestSuite = {
    passed: 0,
    failed: 0,
    results: [],

    assertEqual(actual, expected, tolerance, testName) {
        const diff = Math.abs(actual - expected);
        const passed = diff <= tolerance;

        this.results.push({
            name: testName,
            passed,
            actual,
            expected,
            diff
        });

        if (passed) {
            this.passed++;
        } else {
            this.failed++;
        }
        return passed;
    },

    assertTrue(condition, testName, actual, expected) {
        this.results.push({
            name: testName,
            passed: condition,
            actual: actual || condition,
            expected: expected || true,
            diff: 0
        });

        if (condition) {
            this.passed++;
        } else {
            this.failed++;
        }
        return condition;
    },

    // ========================================
    // Lorenz Equations Tests
    // ========================================

    testDerivativesAtOrigin() {
        const testName = "Derivatives at origin are zero (fixed point)";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const state = { x: 0, y: 0, z: 0 };
        const d = derivatives(state, params);

        return this.assertTrue(
            Math.abs(d.dx) < 1e-10 && Math.abs(d.dy) < 1e-10 && Math.abs(d.dz) < 1e-10,
            testName,
            `dx=${d.dx}, dy=${d.dy}, dz=${d.dz}`,
            "all zero"
        );
    },

    testDerivativesAtFixedPoint() {
        const testName = "Derivatives at C+ fixed point are zero";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const c = Math.sqrt(params.beta * (params.rho - 1));
        const state = { x: c, y: c, z: params.rho - 1 };
        const d = derivatives(state, params);

        const maxDeriv = Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dz));
        return this.assertTrue(
            maxDeriv < 1e-10,
            testName,
            `max derivative = ${maxDeriv.toExponential(2)}`,
            "< 1e-10"
        );
    },

    testDerivativesSymmetry() {
        const testName = "Lorenz system has Z2 symmetry: (x,y,z) -> (-x,-y,z)";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const state1 = { x: 5, y: 3, z: 20 };
        const state2 = { x: -5, y: -3, z: 20 };

        const d1 = derivatives(state1, params);
        const d2 = derivatives(state2, params);

        // dx and dy should be negated, dz should be the same
        const passed = Math.abs(d1.dx + d2.dx) < 1e-10 &&
                       Math.abs(d1.dy + d2.dy) < 1e-10 &&
                       Math.abs(d1.dz - d2.dz) < 1e-10;

        return this.assertTrue(
            passed,
            testName,
            `d1=(${d1.dx.toFixed(2)}, ${d1.dy.toFixed(2)}, ${d1.dz.toFixed(2)})`,
            "symmetric with d2"
        );
    },

    testDerivativesSigmaEffect() {
        const testName = "σ controls coupling between x and y";
        const state = { x: 1, y: 2, z: 10 };
        const params1 = { sigma: 10, rho: 28, beta: 8/3 };
        const params2 = { sigma: 20, rho: 28, beta: 8/3 };

        const d1 = derivatives(state, params1);
        const d2 = derivatives(state, params2);

        // dx should double when sigma doubles (since dx = sigma * (y - x))
        return this.assertEqual(
            d2.dx / d1.dx,
            2.0,
            1e-10,
            testName
        );
    },

    // ========================================
    // RK4 Integration Tests
    // ========================================

    testRK4Stability() {
        const testName = "RK4 remains stable over 1000 steps";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        let state = { x: 1, y: 1, z: 1 };

        for (let i = 0; i < 1000; i++) {
            state = rk4Step(state, DT, params);
        }

        // Should remain bounded (Lorenz attractor is bounded)
        const bounded = Math.abs(state.x) < 100 &&
                        Math.abs(state.y) < 100 &&
                        Math.abs(state.z) < 100;

        return this.assertTrue(
            bounded,
            testName,
            `x=${state.x.toFixed(2)}, y=${state.y.toFixed(2)}, z=${state.z.toFixed(2)}`,
            "all < 100"
        );
    },

    testRK4AtFixedPoint() {
        const testName = "RK4 preserves fixed point";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const c = Math.sqrt(params.beta * (params.rho - 1));
        let state = { x: c, y: c, z: params.rho - 1 };

        // Take several steps
        for (let i = 0; i < 100; i++) {
            state = rk4Step(state, DT, params);
        }

        // Should stay near the fixed point
        const drift = calculateDivergence(state, { x: c, y: c, z: params.rho - 1 });
        return this.assertTrue(
            drift < 1e-6,
            testName,
            `drift = ${drift.toExponential(2)}`,
            "< 1e-6"
        );
    },

    testRK4Conservation() {
        const testName = "RK4 at subcritical rho converges to origin";
        const params = { sigma: 10, rho: 0.5, beta: 8/3 };  // rho < 1
        let state = { x: 1, y: 1, z: 1 };

        // Take many steps
        for (let i = 0; i < 5000; i++) {
            state = rk4Step(state, DT, params);
        }

        // Should converge to origin when rho < 1
        const dist = Math.sqrt(state.x**2 + state.y**2 + state.z**2);
        return this.assertTrue(
            dist < 0.01,
            testName,
            `distance from origin = ${dist.toFixed(4)}`,
            "< 0.01"
        );
    },

    testRK4AttractorBounds() {
        const testName = "Trajectory stays within known attractor bounds";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        let state = { x: 1, y: 1, z: 1 };

        let maxX = 0, maxY = 0, maxZ = 0;

        for (let i = 0; i < 10000; i++) {
            state = rk4Step(state, DT, params);
            maxX = Math.max(maxX, Math.abs(state.x));
            maxY = Math.max(maxY, Math.abs(state.y));
            maxZ = Math.max(maxZ, state.z);
        }

        // Known bounds for classic Lorenz attractor
        const bounded = maxX < 25 && maxY < 30 && maxZ < 55;
        return this.assertTrue(
            bounded,
            testName,
            `maxX=${maxX.toFixed(1)}, maxY=${maxY.toFixed(1)}, maxZ=${maxZ.toFixed(1)}`,
            "x<25, y<30, z<55"
        );
    },

    // ========================================
    // Sensitivity Tests
    // ========================================

    testSensitiveDependence() {
        const testName = "Nearby trajectories diverge exponentially";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        let state1 = { x: 1, y: 1, z: 1 };
        let state2 = { x: 1.0001, y: 1, z: 1 };  // Tiny perturbation

        const initialDiv = calculateDivergence(state1, state2);

        // Evolve for enough time to see divergence (20 time units)
        for (let i = 0; i < 4000; i++) {
            state1 = rk4Step(state1, DT, params);
            state2 = rk4Step(state2, DT, params);
        }

        const finalDiv = calculateDivergence(state1, state2);

        // Divergence should grow significantly (at least 100x for chaotic system)
        return this.assertTrue(
            finalDiv > initialDiv * 100,
            testName,
            `initial=${initialDiv.toExponential(2)}, final=${finalDiv.toExponential(2)}`,
            "final >> initial"
        );
    },

    testDivergenceCalculation() {
        const testName = "Divergence calculation is Euclidean distance";
        const s1 = { x: 0, y: 0, z: 0 };
        const s2 = { x: 3, y: 4, z: 0 };

        const div = calculateDivergence(s1, s2);
        return this.assertEqual(div, 5.0, 1e-10, testName);
    },

    testDivergence3D() {
        const testName = "Divergence works in 3D";
        const s1 = { x: 1, y: 2, z: 3 };
        const s2 = { x: 4, y: 6, z: 3 };  // (3, 4, 0) offset

        const div = calculateDivergence(s1, s2);
        return this.assertEqual(div, 5.0, 1e-10, testName);
    },

    // ========================================
    // Fixed Points Tests
    // ========================================

    testFixedPointsSubcritical() {
        const testName = "Only origin is fixed point when rho < 1";
        const params = { sigma: 10, rho: 0.5, beta: 8/3 };
        const fps = getFixedPoints(params);

        return this.assertTrue(
            fps.length === 1 && fps[0].x === 0 && fps[0].y === 0 && fps[0].z === 0,
            testName,
            `${fps.length} fixed point(s)`,
            "1 (origin)"
        );
    },

    testFixedPointsSupercritical() {
        const testName = "Three fixed points when rho > 1";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const fps = getFixedPoints(params);

        return this.assertTrue(
            fps.length === 3,
            testName,
            `${fps.length} fixed points`,
            "3"
        );
    },

    testFixedPointsSymmetry() {
        const testName = "C+ and C- fixed points are symmetric";
        const params = { sigma: 10, rho: 28, beta: 8/3 };
        const fps = getFixedPoints(params);

        const cPlus = fps[1];
        const cMinus = fps[2];

        const symmetric = Math.abs(cPlus.x + cMinus.x) < 1e-10 &&
                          Math.abs(cPlus.y + cMinus.y) < 1e-10 &&
                          Math.abs(cPlus.z - cMinus.z) < 1e-10;

        return this.assertTrue(
            symmetric,
            testName,
            `C+=(${cPlus.x.toFixed(2)}, ${cPlus.y.toFixed(2)}, ${cPlus.z.toFixed(2)})`,
            "C- = -C+ (x,y)"
        );
    },

    // ========================================
    // Projection Tests
    // ========================================

    testProjectionCentered() {
        const testName = "Origin projects to center of canvas";
        const p = project3D(0, 0, 25, 800, 600, 0);  // z=25 is centered

        return this.assertTrue(
            Math.abs(p.x - 400) < 1 && Math.abs(p.y - 300) < 50,
            testName,
            `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`,
            "near (400, 300)"
        );
    },

    testProjectionRotation() {
        const testName = "Rotation by 180° flips x coordinate";
        const p1 = project3D(10, 0, 25, 800, 600, 0);
        const p2 = project3D(10, 0, 25, 800, 600, 180);

        // x should be mirrored around center
        const center = 400;
        const offset1 = p1.x - center;
        const offset2 = p2.x - center;

        return this.assertTrue(
            Math.abs(offset1 + offset2) < 1,
            testName,
            `offset1=${offset1.toFixed(1)}, offset2=${offset2.toFixed(1)}`,
            "opposite offsets"
        );
    },

    testProjectionScale() {
        const testName = "Projection scales with canvas size";
        const p1 = project3D(10, 0, 25, 800, 600, 0);
        const p2 = project3D(10, 0, 25, 400, 300, 0);

        // Offset from center should scale
        const offset1 = p1.x - 400;
        const offset2 = p2.x - 200;

        // Ratio should be approximately 2:1
        return this.assertTrue(
            Math.abs(offset1 / offset2 - 2) < 0.5,
            testName,
            `offset1=${offset1.toFixed(1)}, offset2=${offset2.toFixed(1)}`,
            "~2:1 ratio"
        );
    },

    // ========================================
    // Run All Tests
    // ========================================

    runAll() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        console.log("Running Lorenz Attractor Test Suite...\n");

        // Lorenz equations tests
        this.testDerivativesAtOrigin();
        this.testDerivativesAtFixedPoint();
        this.testDerivativesSymmetry();
        this.testDerivativesSigmaEffect();

        // RK4 integration tests
        this.testRK4Stability();
        this.testRK4AtFixedPoint();
        this.testRK4Conservation();
        this.testRK4AttractorBounds();

        // Sensitivity tests
        this.testSensitiveDependence();
        this.testDivergenceCalculation();
        this.testDivergence3D();

        // Fixed points tests
        this.testFixedPointsSubcritical();
        this.testFixedPointsSupercritical();
        this.testFixedPointsSymmetry();

        // Projection tests
        this.testProjectionCentered();
        this.testProjectionRotation();
        this.testProjectionScale();

        console.log("\n========================================");
        console.log(`RESULTS: ${this.passed} passed, ${this.failed} failed`);
        console.log("========================================\n");

        for (const result of this.results) {
            const status = result.passed ? "✓" : "✗";
            console.log(`${status} ${result.name}`);
            if (!result.passed) {
                console.log(`   Expected: ${result.expected}`);
                console.log(`   Actual: ${result.actual}`);
            }
        }

        return {
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestSuite, derivatives, rk4Step, calculateDivergence, project3D, getFixedPoints };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
}
