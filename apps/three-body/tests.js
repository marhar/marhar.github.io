/**
 * Three Body Problem - Automated Test Suite
 * Run with: node run_tests.js
 */

// ============================================================
// Constants
// ============================================================

const G = 1;  // Gravitational constant
const SOFTENING = 0.01;

// ============================================================
// Core Functions (extracted from index.html for testing)
// ============================================================

function computeAccelerations(bodies) {
    const n = bodies.length;
    const acc = bodies.map(() => ({ ax: 0, ay: 0 }));

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dx = bodies[j].x - bodies[i].x;
            const dy = bodies[j].y - bodies[i].y;
            const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
            const r = Math.sqrt(r2);
            const r3 = r2 * r;

            const f = G / r3;

            acc[i].ax += f * bodies[j].m * dx;
            acc[i].ay += f * bodies[j].m * dy;

            acc[j].ax -= f * bodies[i].m * dx;
            acc[j].ay -= f * bodies[i].m * dy;
        }
    }

    return acc;
}

function rk4Step(bodies, dt) {
    function addState(base, delta, scale) {
        return base.map((b, i) => ({
            x: b.x + delta[i].dx * scale,
            y: b.y + delta[i].dy * scale,
            vx: b.vx + delta[i].dvx * scale,
            vy: b.vy + delta[i].dvy * scale,
            m: b.m
        }));
    }

    const acc1 = computeAccelerations(bodies);
    const k1 = bodies.map((b, i) => ({
        dx: b.vx,
        dy: b.vy,
        dvx: acc1[i].ax,
        dvy: acc1[i].ay
    }));

    const state2 = addState(bodies, k1, dt / 2);
    const acc2 = computeAccelerations(state2);
    const k2 = state2.map((b, i) => ({
        dx: b.vx,
        dy: b.vy,
        dvx: acc2[i].ax,
        dvy: acc2[i].ay
    }));

    const state3 = addState(bodies, k2, dt / 2);
    const acc3 = computeAccelerations(state3);
    const k3 = state3.map((b, i) => ({
        dx: b.vx,
        dy: b.vy,
        dvx: acc3[i].ax,
        dvy: acc3[i].ay
    }));

    const state4 = addState(bodies, k3, dt);
    const acc4 = computeAccelerations(state4);
    const k4 = state4.map((b, i) => ({
        dx: b.vx,
        dy: b.vy,
        dvx: acc4[i].ax,
        dvy: acc4[i].ay
    }));

    return bodies.map((b, i) => ({
        x: b.x + (k1[i].dx + 2*k2[i].dx + 2*k3[i].dx + k4[i].dx) * dt / 6,
        y: b.y + (k1[i].dy + 2*k2[i].dy + 2*k3[i].dy + k4[i].dy) * dt / 6,
        vx: b.vx + (k1[i].dvx + 2*k2[i].dvx + 2*k3[i].dvx + k4[i].dvx) * dt / 6,
        vy: b.vy + (k1[i].dvy + 2*k2[i].dvy + 2*k3[i].dvy + k4[i].dvy) * dt / 6,
        m: b.m
    }));
}

function calculateEnergy(bodies) {
    let KE = 0;
    let PE = 0;

    for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        KE += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy);

        for (let j = i + 1; j < bodies.length; j++) {
            const bj = bodies[j];
            const dx = bj.x - b.x;
            const dy = bj.y - b.y;
            const r = Math.sqrt(dx * dx + dy * dy + SOFTENING * SOFTENING);
            PE -= G * b.m * bj.m / r;
        }
    }

    return { KE, PE, total: KE + PE };
}

function calculateMomentum(bodies) {
    let px = 0, py = 0;
    for (const b of bodies) {
        px += b.m * b.vx;
        py += b.m * b.vy;
    }
    return { px, py };
}

function calculateCenterOfMass(bodies) {
    let totalMass = 0;
    let cx = 0, cy = 0;
    for (const b of bodies) {
        totalMass += b.m;
        cx += b.m * b.x;
        cy += b.m * b.y;
    }
    return { x: cx / totalMass, y: cy / totalMass };
}

function runSimulation(bodies, steps, dt = 0.001) {
    let state = JSON.parse(JSON.stringify(bodies));
    for (let i = 0; i < steps; i++) {
        state = rk4Step(state, dt);
    }
    return state;
}

// ============================================================
// Presets
// ============================================================

const PRESETS = {
    figure8: [
        { x: -0.97000436, y: 0.24308753, vx: 0.4662036850, vy: 0.4323657300, m: 1 },
        { x: 0.97000436, y: -0.24308753, vx: 0.4662036850, vy: 0.4323657300, m: 1 },
        { x: 0, y: 0, vx: -0.93240737, vy: -0.86473146, m: 1 }
    ],
    lagrange: [
        { x: 0, y: 1, vx: 0.5, vy: 0, m: 1 },
        { x: -0.866, y: -0.5, vx: -0.25, vy: 0.433, m: 1 },
        { x: 0.866, y: -0.5, vx: -0.25, vy: -0.433, m: 1 }
    ]
};

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
    // Gravitational Force Tests
    // ========================================

    testAccelerationSymmetry() {
        const testName = "Gravitational acceleration is symmetric (Newton's 3rd law)";
        const bodies = [
            { x: -1, y: 0, vx: 0, vy: 0, m: 2 },
            { x: 1, y: 0, vx: 0, vy: 0, m: 3 }
        ];

        const acc = computeAccelerations(bodies);

        // F = ma, so m1*a1 should equal -m2*a2
        const fx1 = bodies[0].m * acc[0].ax;
        const fy1 = bodies[0].m * acc[0].ay;
        const fx2 = bodies[1].m * acc[1].ax;
        const fy2 = bodies[1].m * acc[1].ay;

        const symmetric = Math.abs(fx1 + fx2) < 1e-10 && Math.abs(fy1 + fy2) < 1e-10;

        return this.assertTrue(
            symmetric,
            testName,
            `F1=(${fx1.toFixed(6)}, ${fy1.toFixed(6)}), F2=(${fx2.toFixed(6)}, ${fy2.toFixed(6)})`,
            "F1 = -F2"
        );
    },

    testAccelerationDirection() {
        const testName = "Acceleration points toward other body";
        const bodies = [
            { x: 0, y: 0, vx: 0, vy: 0, m: 1 },
            { x: 2, y: 0, vx: 0, vy: 0, m: 1 }
        ];

        const acc = computeAccelerations(bodies);

        // Body 0 should accelerate in +x direction (toward body 1)
        // Body 1 should accelerate in -x direction (toward body 0)
        const correct = acc[0].ax > 0 && acc[1].ax < 0 &&
                        Math.abs(acc[0].ay) < 1e-10 && Math.abs(acc[1].ay) < 1e-10;

        return this.assertTrue(
            correct,
            testName,
            `a0=(${acc[0].ax.toFixed(4)}, ${acc[0].ay.toFixed(4)}), a1=(${acc[1].ax.toFixed(4)}, ${acc[1].ay.toFixed(4)})`,
            "a0.x > 0, a1.x < 0, a.y = 0"
        );
    },

    testAccelerationMagnitude() {
        const testName = "Acceleration follows inverse square law";
        const bodies1 = [
            { x: 0, y: 0, vx: 0, vy: 0, m: 1 },
            { x: 1, y: 0, vx: 0, vy: 0, m: 1 }
        ];
        const bodies2 = [
            { x: 0, y: 0, vx: 0, vy: 0, m: 1 },
            { x: 2, y: 0, vx: 0, vy: 0, m: 1 }
        ];

        const acc1 = computeAccelerations(bodies1);
        const acc2 = computeAccelerations(bodies2);

        // At twice the distance, acceleration should be ~1/4
        // (with softening, this is approximate)
        const ratio = acc1[0].ax / acc2[0].ax;

        // Should be close to 4 (inverse square)
        return this.assertTrue(
            ratio > 3.5 && ratio < 4.5,
            testName,
            `ratio = ${ratio.toFixed(4)}`,
            "~4 (inverse square)"
        );
    },

    // ========================================
    // Energy Conservation Tests
    // ========================================

    testEnergyConservation() {
        const testName = "Total energy is conserved over time";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        const initialEnergy = calculateEnergy(bodies);
        bodies = runSimulation(bodies, 10000, 0.001);
        const finalEnergy = calculateEnergy(bodies);

        const energyDrift = Math.abs(finalEnergy.total - initialEnergy.total);
        const relativeError = energyDrift / Math.abs(initialEnergy.total);

        return this.assertTrue(
            relativeError < 0.01,
            testName,
            `initial=${initialEnergy.total.toFixed(6)}, final=${finalEnergy.total.toFixed(6)}, drift=${relativeError.toFixed(6)}`,
            "< 1% drift"
        );
    },

    testKineticEnergyPositive() {
        const testName = "Kinetic energy is always positive";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        let allPositive = true;
        for (let i = 0; i < 1000; i++) {
            bodies = rk4Step(bodies, 0.001);
            const energy = calculateEnergy(bodies);
            if (energy.KE < 0) {
                allPositive = false;
                break;
            }
        }

        return this.assertTrue(allPositive, testName, "all KE >= 0", ">= 0");
    },

    testPotentialEnergyNegative() {
        const testName = "Potential energy is negative (bound system)";
        const bodies = JSON.parse(JSON.stringify(PRESETS.figure8));
        const energy = calculateEnergy(bodies);

        return this.assertTrue(
            energy.PE < 0,
            testName,
            `PE = ${energy.PE.toFixed(4)}`,
            "< 0"
        );
    },

    // ========================================
    // Momentum Conservation Tests
    // ========================================

    testMomentumConservation() {
        const testName = "Total momentum is conserved";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        const initialMomentum = calculateMomentum(bodies);
        bodies = runSimulation(bodies, 10000, 0.001);
        const finalMomentum = calculateMomentum(bodies);

        const pxDrift = Math.abs(finalMomentum.px - initialMomentum.px);
        const pyDrift = Math.abs(finalMomentum.py - initialMomentum.py);

        return this.assertTrue(
            pxDrift < 1e-10 && pyDrift < 1e-10,
            testName,
            `drift: px=${pxDrift.toExponential(2)}, py=${pyDrift.toExponential(2)}`,
            "< 1e-10"
        );
    },

    testZeroNetMomentum() {
        const testName = "Figure-8 preset has zero net momentum";
        const bodies = JSON.parse(JSON.stringify(PRESETS.figure8));
        const momentum = calculateMomentum(bodies);

        const nearZero = Math.abs(momentum.px) < 1e-10 && Math.abs(momentum.py) < 1e-10;

        return this.assertTrue(
            nearZero,
            testName,
            `p=(${momentum.px.toExponential(2)}, ${momentum.py.toExponential(2)})`,
            "~(0, 0)"
        );
    },

    // ========================================
    // Center of Mass Tests
    // ========================================

    testCenterOfMassStationary() {
        const testName = "Center of mass is stationary for zero momentum";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        const initialCOM = calculateCenterOfMass(bodies);
        bodies = runSimulation(bodies, 5000, 0.001);
        const finalCOM = calculateCenterOfMass(bodies);

        const drift = Math.sqrt(
            Math.pow(finalCOM.x - initialCOM.x, 2) +
            Math.pow(finalCOM.y - initialCOM.y, 2)
        );

        return this.assertTrue(
            drift < 1e-10,
            testName,
            `drift = ${drift.toExponential(2)}`,
            "< 1e-10"
        );
    },

    testCenterOfMassCalculation() {
        const testName = "Center of mass calculation is correct";
        const bodies = [
            { x: 0, y: 0, vx: 0, vy: 0, m: 1 },
            { x: 2, y: 0, vx: 0, vy: 0, m: 1 },
            { x: 1, y: 1, vx: 0, vy: 0, m: 1 }
        ];

        const com = calculateCenterOfMass(bodies);
        // COM = (0 + 2 + 1)/3, (0 + 0 + 1)/3 = (1, 1/3)

        const correct = Math.abs(com.x - 1) < 1e-10 && Math.abs(com.y - 1/3) < 1e-10;

        return this.assertTrue(
            correct,
            testName,
            `COM = (${com.x.toFixed(4)}, ${com.y.toFixed(4)})`,
            "(1, 0.333...)"
        );
    },

    // ========================================
    // RK4 Integration Tests
    // ========================================

    testRK4Stability() {
        const testName = "RK4 integration remains stable";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        bodies = runSimulation(bodies, 50000, 0.001);

        // Check that no body has escaped to infinity
        let bounded = true;
        for (const b of bodies) {
            if (Math.abs(b.x) > 100 || Math.abs(b.y) > 100 ||
                Math.abs(b.vx) > 100 || Math.abs(b.vy) > 100) {
                bounded = false;
                break;
            }
        }

        return this.assertTrue(
            bounded,
            testName,
            "all bodies within bounds",
            "bounded < 100"
        );
    },

    testRK4Convergence() {
        const testName = "RK4 with smaller dt gives more accurate results";
        const bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        // Same total time with different step sizes
        const result1 = runSimulation(JSON.parse(JSON.stringify(bodies)), 100, 0.01);
        const result2 = runSimulation(JSON.parse(JSON.stringify(bodies)), 1000, 0.001);

        // They should give similar results (closer step size should be more accurate)
        const diff = Math.sqrt(
            Math.pow(result1[0].x - result2[0].x, 2) +
            Math.pow(result1[0].y - result2[0].y, 2)
        );

        return this.assertTrue(
            diff < 0.1,
            testName,
            `position diff = ${diff.toFixed(6)}`,
            "< 0.1"
        );
    },

    // ========================================
    // Chaos Tests
    // ========================================

    testSensitiveDependence() {
        const testName = "Sensitive dependence on initial conditions (chaos)";
        // Use a chaotic configuration rather than the stable Figure-8
        const bodies1 = [
            { x: -1, y: 0, vx: 0, vy: 0.5, m: 1 },
            { x: 1, y: 0, vx: 0, vy: -0.5, m: 1 },
            { x: 0, y: 1.5, vx: 0.3, vy: 0, m: 1 }
        ];
        const bodies2 = JSON.parse(JSON.stringify(bodies1));

        // Tiny perturbation to initial position
        bodies2[0].x += 0.0001;

        const result1 = runSimulation(bodies1, 50000, 0.001);
        const result2 = runSimulation(bodies2, 50000, 0.001);

        const distance = Math.sqrt(
            Math.pow(result1[0].x - result2[0].x, 2) +
            Math.pow(result1[0].y - result2[0].y, 2)
        );

        // Should diverge significantly
        return this.assertTrue(
            distance > 0.1,
            testName,
            `divergence = ${distance.toFixed(4)}`,
            "> 0.1"
        );
    },

    // ========================================
    // Figure-8 Orbit Tests
    // ========================================

    testFigure8Periodicity() {
        const testName = "Figure-8 orbit is approximately periodic";
        let bodies = JSON.parse(JSON.stringify(PRESETS.figure8));
        const initial = JSON.parse(JSON.stringify(bodies));

        // Figure-8 period is approximately 6.3259
        const period = 6.3259;
        const steps = Math.round(period / 0.001);

        bodies = runSimulation(bodies, steps, 0.001);

        // Check if bodies return close to initial positions
        let maxDist = 0;
        for (let i = 0; i < 3; i++) {
            const dist = Math.sqrt(
                Math.pow(bodies[i].x - initial[i].x, 2) +
                Math.pow(bodies[i].y - initial[i].y, 2)
            );
            maxDist = Math.max(maxDist, dist);
        }

        return this.assertTrue(
            maxDist < 0.1,
            testName,
            `max position error = ${maxDist.toFixed(4)}`,
            "< 0.1"
        );
    },

    testFigure8Symmetry() {
        const testName = "Figure-8 has rotational symmetry";
        const bodies = JSON.parse(JSON.stringify(PRESETS.figure8));

        // Bodies 0 and 1 should be symmetric about origin
        const sumX = bodies[0].x + bodies[1].x;
        const sumY = bodies[0].y + bodies[1].y;

        // Body 2 should be at origin
        const body2AtOrigin = Math.abs(bodies[2].x) < 1e-6 && Math.abs(bodies[2].y) < 1e-6;

        const symmetric = Math.abs(sumX) < 1e-6 && Math.abs(sumY) < 1e-6 && body2AtOrigin;

        return this.assertTrue(
            symmetric,
            testName,
            `sum(0,1)=(${sumX.toFixed(6)}, ${sumY.toFixed(6)}), body2=(${bodies[2].x}, ${bodies[2].y})`,
            "body0 + body1 = 0, body2 at origin"
        );
    },

    // ========================================
    // Lagrange Configuration Tests
    // ========================================

    testLagrangeTriangle() {
        const testName = "Lagrange preset forms equilateral triangle";
        const bodies = JSON.parse(JSON.stringify(PRESETS.lagrange));

        // Calculate distances between all pairs
        const d01 = Math.sqrt(
            Math.pow(bodies[1].x - bodies[0].x, 2) +
            Math.pow(bodies[1].y - bodies[0].y, 2)
        );
        const d02 = Math.sqrt(
            Math.pow(bodies[2].x - bodies[0].x, 2) +
            Math.pow(bodies[2].y - bodies[0].y, 2)
        );
        const d12 = Math.sqrt(
            Math.pow(bodies[2].x - bodies[1].x, 2) +
            Math.pow(bodies[2].y - bodies[1].y, 2)
        );

        // All distances should be equal for equilateral triangle
        const equilateral = Math.abs(d01 - d02) < 0.1 &&
                            Math.abs(d01 - d12) < 0.1 &&
                            Math.abs(d02 - d12) < 0.1;

        return this.assertTrue(
            equilateral,
            testName,
            `distances: ${d01.toFixed(3)}, ${d02.toFixed(3)}, ${d12.toFixed(3)}`,
            "all equal"
        );
    },

    // ========================================
    // Run All Tests
    // ========================================

    runAll() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        console.log("Running Three Body Problem Test Suite...\n");

        // Gravitational force tests
        this.testAccelerationSymmetry();
        this.testAccelerationDirection();
        this.testAccelerationMagnitude();

        // Energy conservation tests
        this.testEnergyConservation();
        this.testKineticEnergyPositive();
        this.testPotentialEnergyNegative();

        // Momentum conservation tests
        this.testMomentumConservation();
        this.testZeroNetMomentum();

        // Center of mass tests
        this.testCenterOfMassStationary();
        this.testCenterOfMassCalculation();

        // RK4 integration tests
        this.testRK4Stability();
        this.testRK4Convergence();

        // Chaos tests
        this.testSensitiveDependence();

        // Figure-8 tests
        this.testFigure8Periodicity();
        this.testFigure8Symmetry();

        // Lagrange tests
        this.testLagrangeTriangle();

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
    module.exports = {
        TestSuite,
        computeAccelerations,
        rk4Step,
        calculateEnergy,
        calculateMomentum,
        calculateCenterOfMass,
        runSimulation,
        PRESETS
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
}
