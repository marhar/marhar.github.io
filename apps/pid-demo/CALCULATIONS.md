# PID Controller Calculation Notes

Technical notes on the PID implementation in this demo.

## Thrust Formula

```
thrust = gravity + PID_output
```

Where:
```
PID_output = P × error + I × integral(error) + D × derivative(error)
error = setpoint - position
```

### Component Breakdown

| Component | Formula | Purpose |
|-----------|---------|---------|
| Feedforward | `gravity` (constant = 1) | Baseline thrust to hover |
| P term | `kP × error` | Proportional response to error |
| I term | `kI × ∫error dt` | Accumulates to correct persistent offset |
| D term | `kD × d(error)/dt` | Dampens based on rate of change |

### Net Force

```
net_force = thrust - gravity + wind
         = (gravity + PID_output) - gravity + wind
         = PID_output + wind
```

The feedforward cancels gravity, so the PID only handles deviations and disturbances.

## Integral Calculation

### Current Implementation: Rectangular (Euler)

```javascript
state.integral += error * dt
iTerm = kI * state.integral
```

This is Euler integration - each frame adds `error × dt` to a running sum:

```
integral ≈ Σ(error × dt) ≈ ∫error dt
```

With `dt = 1/60` (60 FPS), each frame adds a small rectangle of area `error × 0.0167`.

### Anti-Windup

Prevents integral from growing unbounded:

```javascript
maxIntegral = maxForce / kI
state.integral = clamp(state.integral, -maxIntegral, +maxIntegral)
```

## Derivative Calculation

### Current Implementation: Backward Difference

```javascript
derivative = (error - lastError) / dt
dTerm = kD * derivative
lastError = error  // save for next frame
```

This is finite difference - approximating the slope:

```
derivative ≈ Δerror/Δt ≈ d(error)/dt
```

Compares current error to previous frame's error, divided by time step.

## Alternative Integration Methods

### 1. Rectangular (Current - Euler)

```
integral += error × dt
```

- Simplest, uses current error as rectangle height
- First-order accuracy O(dt)
- Can be "left" (previous) or "right" (current) rectangle

### 2. Trapezoidal

```
integral += (error + lastError) / 2 × dt
```

- Averages current and previous error
- Second-order accuracy O(dt²)
- Better approximation of the curve
- Commonly used in industrial PLCs

### 3. Simpson's Rule

```
integral += (lastLastError + 4×lastError + error) / 6 × dt
```

- Uses parabolic interpolation over 3 points
- Fourth-order accuracy O(dt⁴)
- Requires storing 2 previous errors
- Overkill for most PID applications

### 4. Exponential Moving Average (Leaky Integrator)

```
integral = α × integral + error × dt
```

Where `α < 1` (e.g., 0.99)

- Built-in forgetting factor
- Prevents windup naturally
- Used when recent errors matter more than old ones

### Comparison

| Method | Accuracy | Complexity | Use Case |
|--------|----------|------------|----------|
| Rectangular | O(dt) | Simplest | Fast loops, simple systems |
| Trapezoidal | O(dt²) | +1 multiply | Industrial standard |
| Simpson's | O(dt⁴) | +memory | Rarely needed |
| Leaky | N/A | +1 multiply | Adaptive systems |

## Why Rectangular is Sufficient Here

- `dt` is small (1/60 sec = 16.7ms)
- Visual demo doesn't need high precision
- Anti-windup handles accumulation issues
- Trapezoidal would add minimal benefit for extra complexity

## Physics Model

```
force = PID_output + wind
acceleration = force / mass
velocity = velocity + acceleration × dt
position = position + velocity × dt
```

Constants:
- gravity = 1
- mass = 1
- friction = 0 (undamped system)
