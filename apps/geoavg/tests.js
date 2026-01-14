/**
 * Geographic Center Calculator - Automated Test Suite
 * Run with: node run_tests.js
 */

// ============================================================
// Core Functions (extracted from index.html for testing)
// ============================================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const GEOHASH_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEOHASH_PRECISION = 9;

function formatCoord(value) {
    return parseFloat(value).toFixed(6);
}

function encodeGeohash(lat, lng) {
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLng = true;

    while (hash.length < GEOHASH_PRECISION) {
        if (isLng) {
            const mid = (lngMin + lngMax) / 2;
            if (lng >= mid) {
                ch |= (1 << (4 - bit));
                lngMin = mid;
            } else {
                lngMax = mid;
            }
        } else {
            const mid = (latMin + latMax) / 2;
            if (lat >= mid) {
                ch |= (1 << (4 - bit));
                latMin = mid;
            } else {
                latMax = mid;
            }
        }
        isLng = !isLng;
        bit++;
        if (bit === 5) {
            hash += GEOHASH_CHARS[ch];
            bit = 0;
            ch = 0;
        }
    }
    return hash;
}

function decodeGeohash(hash) {
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    let isLng = true;

    for (const c of hash.toLowerCase()) {
        const idx = GEOHASH_CHARS.indexOf(c);
        if (idx === -1) continue;

        for (let bit = 4; bit >= 0; bit--) {
            if (isLng) {
                const mid = (lngMin + lngMax) / 2;
                if (idx & (1 << bit)) {
                    lngMin = mid;
                } else {
                    lngMax = mid;
                }
            } else {
                const mid = (latMin + latMax) / 2;
                if (idx & (1 << bit)) {
                    latMin = mid;
                } else {
                    latMax = mid;
                }
            }
            isLng = !isLng;
        }
    }
    return {
        lat: (latMin + latMax) / 2,
        lng: (lngMin + lngMax) / 2
    };
}

function calculateCenter(locs) {
    if (locs.length === 0) return null;

    let x = 0, y = 0, z = 0;

    for (const loc of locs) {
        const latRad = loc.lat * DEG_TO_RAD;
        const lngRad = loc.lng * DEG_TO_RAD;

        x += Math.cos(latRad) * Math.cos(lngRad);
        y += Math.cos(latRad) * Math.sin(lngRad);
        z += Math.sin(latRad);
    }

    x /= locs.length;
    y /= locs.length;
    z /= locs.length;

    const centralLng = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const centralLat = Math.atan2(z, hyp);

    return {
        lat: centralLat * RAD_TO_DEG,
        lng: centralLng * RAD_TO_DEG
    };
}

function parsePtsParam(pts) {
    const locations = [];
    const pointStrings = pts.split(';');
    for (const pointStr of pointStrings) {
        const parts = pointStr.split(',');
        if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            const name = parts.length > 2 ? decodeURIComponent(parts.slice(2).join(',')) : undefined;
            if (!isNaN(lat) && !isNaN(lng)) {
                locations.push({ lat, lng, name });
            }
        }
    }
    return locations;
}

function parseGeoParam(geo) {
    const locations = [];
    for (let i = 0; i < geo.length; i += GEOHASH_PRECISION) {
        const hash = geo.slice(i, i + GEOHASH_PRECISION);
        if (hash.length === GEOHASH_PRECISION) {
            const { lat, lng } = decodeGeohash(hash);
            locations.push({ lat, lng });
        }
    }
    return locations;
}

function generatePtsParam(locations) {
    return locations.map(loc => {
        const lat = formatCoord(loc.lat);
        const lng = formatCoord(loc.lng);
        if (loc.name) {
            return `${lat},${lng},${encodeURIComponent(loc.name)}`;
        }
        return `${lat},${lng}`;
    }).join(';');
}

function generateGeoParam(locations) {
    return locations.map(loc => encodeGeohash(loc.lat, loc.lng)).join('');
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
    // Geohash Tests
    // ========================================

    testGeohashEncodeNYC() {
        const testName = "Geohash encode NYC (40.7128, -74.0060)";
        const hash = encodeGeohash(40.7128, -74.0060);
        // Known geohash for NYC area
        return this.assertTrue(
            hash.startsWith('dr5r'),
            testName,
            hash,
            "starts with 'dr5r'"
        );
    },

    testGeohashEncodeLondon() {
        const testName = "Geohash encode London (51.5074, -0.1278)";
        const hash = encodeGeohash(51.5074, -0.1278);
        // Known geohash for London area
        return this.assertTrue(
            hash.startsWith('gcpv'),
            testName,
            hash,
            "starts with 'gcpv'"
        );
    },

    testGeohashEncodeSydney() {
        const testName = "Geohash encode Sydney (-33.8688, 151.2093)";
        const hash = encodeGeohash(-33.8688, 151.2093);
        // Known geohash for Sydney area
        return this.assertTrue(
            hash.startsWith('r3gx'),
            testName,
            hash,
            "starts with 'r3gx'"
        );
    },

    testGeohashRoundTrip() {
        const testName = "Geohash round-trip precision (~5m)";
        const origLat = 40.7128;
        const origLng = -74.0060;

        const hash = encodeGeohash(origLat, origLng);
        const decoded = decodeGeohash(hash);

        const latDiff = Math.abs(decoded.lat - origLat);
        const lngDiff = Math.abs(decoded.lng - origLng);

        // 9-char geohash should be accurate to ~5m (~0.00005 degrees)
        const maxError = 0.0001;
        const passed = latDiff < maxError && lngDiff < maxError;

        this.results.push({
            name: testName,
            passed,
            actual: `lat diff: ${latDiff.toFixed(6)}, lng diff: ${lngDiff.toFixed(6)}`,
            expected: `< ${maxError}`,
            diff: Math.max(latDiff, lngDiff)
        });

        if (passed) this.passed++;
        else this.failed++;
        return passed;
    },

    testGeohashPolarRegions() {
        const testName = "Geohash works at polar regions";
        const arcticLat = 89.9;
        const arcticLng = 45.0;

        const hash = encodeGeohash(arcticLat, arcticLng);
        const decoded = decodeGeohash(hash);

        const latDiff = Math.abs(decoded.lat - arcticLat);
        return this.assertTrue(
            latDiff < 0.001,
            testName,
            `decoded lat: ${decoded.lat.toFixed(4)}`,
            `~${arcticLat}`
        );
    },

    testGeohashDateLine() {
        const testName = "Geohash works near date line (179°)";
        const lat = 0;
        const lng = 179.9;

        const hash = encodeGeohash(lat, lng);
        const decoded = decodeGeohash(hash);

        const lngDiff = Math.abs(decoded.lng - lng);
        return this.assertTrue(
            lngDiff < 0.001,
            testName,
            `decoded lng: ${decoded.lng.toFixed(4)}`,
            `~${lng}`
        );
    },

    // ========================================
    // Geographic Center Tests
    // ========================================

    testCenterSinglePoint() {
        const testName = "Center of single point is itself";
        const loc = { lat: 40.7128, lng: -74.0060 };
        const center = calculateCenter([loc]);

        const latDiff = Math.abs(center.lat - loc.lat);
        const lngDiff = Math.abs(center.lng - loc.lng);

        return this.assertTrue(
            latDiff < 0.0001 && lngDiff < 0.0001,
            testName,
            `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
            `${loc.lat}, ${loc.lng}`
        );
    },

    testCenterTwoOppositePoints() {
        const testName = "Center of two opposite equator points";
        // Two points on equator, 180° apart
        const locs = [
            { lat: 0, lng: 0 },
            { lat: 0, lng: 180 }
        ];
        const center = calculateCenter(locs);

        // Center should be at equator, at 90° or -90°
        return this.assertTrue(
            Math.abs(center.lat) < 0.0001,
            testName,
            `lat: ${center.lat.toFixed(4)}`,
            "lat: 0 (on equator)"
        );
    },

    testCenterSymmetricPoints() {
        const testName = "Center of symmetric points around origin";
        const locs = [
            { lat: 10, lng: 10 },
            { lat: 10, lng: -10 },
            { lat: -10, lng: 10 },
            { lat: -10, lng: -10 }
        ];
        const center = calculateCenter(locs);

        return this.assertTrue(
            Math.abs(center.lat) < 0.1 && Math.abs(center.lng) < 0.1,
            testName,
            `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
            "~0, ~0"
        );
    },

    testCenterNorthPole() {
        const testName = "Center of points around North Pole";
        const locs = [
            { lat: 89, lng: 0 },
            { lat: 89, lng: 90 },
            { lat: 89, lng: 180 },
            { lat: 89, lng: -90 }
        ];
        const center = calculateCenter(locs);

        return this.assertTrue(
            center.lat > 88,
            testName,
            `lat: ${center.lat.toFixed(2)}`,
            "> 88° (near pole)"
        );
    },

    testCenterEmptyArray() {
        const testName = "Center of empty array returns null";
        const center = calculateCenter([]);
        return this.assertTrue(
            center === null,
            testName,
            center,
            null
        );
    },

    // ========================================
    // URL Parameter Tests
    // ========================================

    testParsePtsSimple() {
        const testName = "Parse simple pts parameter";
        const pts = "40.712800,-74.006000;34.052200,-118.243700";
        const locs = parsePtsParam(pts);

        return this.assertTrue(
            locs.length === 2 &&
            Math.abs(locs[0].lat - 40.7128) < 0.0001 &&
            Math.abs(locs[1].lng - (-118.2437)) < 0.0001,
            testName,
            `${locs.length} points parsed`,
            "2 points with correct coords"
        );
    },

    testParsePtsWithNames() {
        const testName = "Parse pts with URL-encoded names";
        const pts = "40.712800,-74.006000,New%20York;34.052200,-118.243700,Los%20Angeles";
        const locs = parsePtsParam(pts);

        return this.assertTrue(
            locs[0].name === "New York" && locs[1].name === "Los Angeles",
            testName,
            `"${locs[0].name}", "${locs[1].name}"`,
            '"New York", "Los Angeles"'
        );
    },

    testParsePtsWithCommaInName() {
        const testName = "Parse pts with comma in name";
        const pts = "40.712800,-74.006000,New%20York,%20NY";
        const locs = parsePtsParam(pts);

        return this.assertTrue(
            locs[0].name === "New York, NY",
            testName,
            `"${locs[0].name}"`,
            '"New York, NY"'
        );
    },

    testParseGeoParam() {
        const testName = "Parse geo parameter (2 geohashes)";
        const hash1 = encodeGeohash(40.7128, -74.0060);
        const hash2 = encodeGeohash(34.0522, -118.2437);
        const geo = hash1 + hash2;

        const locs = parseGeoParam(geo);

        return this.assertTrue(
            locs.length === 2,
            testName,
            `${locs.length} points parsed`,
            "2 points"
        );
    },

    testGeneratePtsRoundTrip() {
        const testName = "Generate and parse pts round-trip";
        const original = [
            { lat: 40.7128, lng: -74.0060, name: "NYC" },
            { lat: 34.0522, lng: -118.2437 }
        ];

        const pts = generatePtsParam(original);
        const parsed = parsePtsParam(pts);

        const match = parsed.length === 2 &&
            parsed[0].name === "NYC" &&
            parsed[1].name === undefined;

        return this.assertTrue(
            match,
            testName,
            `${parsed.length} points, name: "${parsed[0].name}"`,
            '2 points, name: "NYC"'
        );
    },

    testGenerateGeoRoundTrip() {
        const testName = "Generate and parse geo round-trip";
        const original = [
            { lat: 40.7128, lng: -74.0060 },
            { lat: 34.0522, lng: -118.2437 }
        ];

        const geo = generateGeoParam(original);
        const parsed = parseGeoParam(geo);

        // Check coordinates are close (within geohash precision)
        const lat1Diff = Math.abs(parsed[0].lat - original[0].lat);
        const lat2Diff = Math.abs(parsed[1].lat - original[1].lat);

        return this.assertTrue(
            parsed.length === 2 && lat1Diff < 0.0001 && lat2Diff < 0.0001,
            testName,
            `${parsed.length} points, lat diffs: ${lat1Diff.toFixed(5)}, ${lat2Diff.toFixed(5)}`,
            "2 points with matching coords"
        );
    },

    testGeoShorterThanPts() {
        const testName = "Geo format shorter than pts format";
        const locs = [
            { lat: 40.7128, lng: -74.0060 },
            { lat: 34.0522, lng: -118.2437 }
        ];

        const pts = generatePtsParam(locs);
        const geo = generateGeoParam(locs);

        return this.assertTrue(
            geo.length < pts.length,
            testName,
            `geo: ${geo.length} chars, pts: ${pts.length} chars`,
            "geo < pts"
        );
    },

    // ========================================
    // Format Coord Tests
    // ========================================

    testFormatCoordPrecision() {
        const testName = "formatCoord uses 6 decimal places";
        const result = formatCoord(40.71280000001);
        return this.assertTrue(
            result === "40.712800",
            testName,
            result,
            "40.712800"
        );
    },

    testFormatCoordNegative() {
        const testName = "formatCoord handles negative values";
        const result = formatCoord(-118.2437);
        return this.assertTrue(
            result === "-118.243700",
            testName,
            result,
            "-118.243700"
        );
    },

    // ========================================
    // Run All Tests
    // ========================================

    runAll() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];

        console.log("Running Geographic Center Calculator Test Suite...\n");

        // Geohash tests
        this.testGeohashEncodeNYC();
        this.testGeohashEncodeLondon();
        this.testGeohashEncodeSydney();
        this.testGeohashRoundTrip();
        this.testGeohashPolarRegions();
        this.testGeohashDateLine();

        // Center calculation tests
        this.testCenterSinglePoint();
        this.testCenterTwoOppositePoints();
        this.testCenterSymmetricPoints();
        this.testCenterNorthPole();
        this.testCenterEmptyArray();

        // URL parameter tests
        this.testParsePtsSimple();
        this.testParsePtsWithNames();
        this.testParsePtsWithCommaInName();
        this.testParseGeoParam();
        this.testGeneratePtsRoundTrip();
        this.testGenerateGeoRoundTrip();
        this.testGeoShorterThanPts();

        // Format tests
        this.testFormatCoordPrecision();
        this.testFormatCoordNegative();

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
    module.exports = { TestSuite };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
}
