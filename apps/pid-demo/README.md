# PID Controller Demo

Part 3 of the East Bay Guide to PID Loops series. An interactive helicopter hover simulation for learning PID controller tuning.

- [Part 1: Introduction to PID](https://www.youtube.com/watch?v=l03SioQ9ySg)
- [Part 2: PID Math and Coding](https://www.youtube.com/watch?v=sDd4VOpOnnA)
- Part 3: Interactive Demo (this app)

## How It Works

A helicopter tries to hover at a target altitude. You tune the PID controller to make it reach and hold the target position smoothly.

- **Click** on the simulation to set a target altitude
- **Adjust P, I, D sliders** to tune the controller
- **Wind** adds a constant force to demonstrate steady-state error
- **Disturbance** applies a sudden impulse to test rejection

## Live Formula Display

A real-time formula panel shows the PID calculation as it happens:

```
CURRENT STATE
position:  0.25    velocity:  0.12
setpoint:  0.50    error:     0.25
───────────────────────────────────
PID CALCULATION
P = Kp × error
  = 5.0 ×  0.25
  =  1.25

I = Ki × ∫error dt
  = 0.10 ×  3.45
  =  0.35

D = Kd × d(error)/dt
  = 1.00 × -2.30
  = -2.30
───────────────────────────────────
thrust = P + I + D
       =  1.25 +  0.35 + -2.30
       = -0.70
```

This helps visualize how each term contributes to the final output in real-time.

## PID Tuning Theory

### The PID Equation

```
Output = P*error + I*integral(error) + D*derivative(error)
```

Where:
- **error** = setpoint - current_position
- **integral** = accumulated error over time
- **derivative** = rate of change of error

### P - Proportional

The P term produces output proportional to the current error.

- **Too low**: Slow response, may not reach target
- **Too high**: Oscillation, overshoot
- **Just right**: Fast response with minimal overshoot

**Key insight**: P alone cannot eliminate steady-state error when there's a constant force (like gravity). The helicopter will always hover slightly below the target because it needs some error to generate thrust.

### I - Integral

The I term accumulates error over time, building up output until the error is eliminated.

- **Purpose**: Eliminates steady-state error
- **Too low**: Slow to correct offset
- **Too high**: Overshoot, oscillation, instability
- **Danger**: On oscillating systems, I can make things worse (integral windup)

**Key insight**: I is essential when there's a constant force to overcome (gravity, friction, load). It "remembers" past errors and compensates.

### D - Derivative

The D term responds to the rate of change of error, providing a "braking" force.

- **Purpose**: Dampens oscillation, smooths response
- **Too low**: Oscillation takes longer to settle
- **Too high**: Sluggish response, sensitive to noise
- **Key role**: In undamped systems, D is the only source of damping

**Key insight**: D predicts future error based on current trend. If error is decreasing rapidly (approaching target), D reduces output to prevent overshoot.

### Tuning Strategy

A common manual tuning approach:

1. **Start with P only** (I=0, D=0)
   - Increase P until the system responds quickly but starts to oscillate

2. **Add D to dampen oscillation**
   - Increase D until oscillation stops and response is smooth

3. **Add I to eliminate steady-state error**
   - Start with small I values
   - Increase until the system reaches the exact target
   - Watch for overshoot - reduce I if it overshoots

### Common Problems

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Slow response | P too low | Increase P |
| Oscillation | P too high or D too low | Decrease P or increase D |
| Hovers below target | I too low or zero | Increase I |
| Overshoot | I too high or D too low | Decrease I or increase D |
| Growing oscillation | I too high on oscillating system | Decrease I, add D first |

### Experiments to Try

1. **P-only oscillation**: Set P=10, I=0, D=0. Watch sustained oscillation.

2. **D dampens oscillation**: From above, add D=2. Watch oscillation stop.

3. **Steady-state error**: Set P=5, I=0, D=0. Helicopter hovers below target.

4. **I eliminates offset**: From above, add I=0.1. Watch it slowly rise to target.

5. **Wind disturbance**: Add wind force. See steady-state error. Increase I to compensate.

6. **I instability**: Set P=10, I=0.3, D=0. Watch oscillation grow (integral windup).

## Technical Details

- Single-file HTML/CSS/JavaScript application
- Physics simulation at 60 FPS
- No external dependencies except standard browser APIs
- Canvas-based rendering

## Physics Model

```
force = PID_output - gravity + wind
acceleration = force / mass
velocity = velocity + acceleration * dt
position = position + velocity * dt
```

Constants:
- gravity = 1
- mass = 1
- friction = 0 (undamped system)
