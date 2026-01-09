# Double Pendulum Simulator

An interactive simulation of a double pendulum system demonstrating chaotic dynamics. Features real-time animation, adjustable parameters, and live graphs.

## Features

- **Real-time Animation** - Smooth pendulum motion with trailing path
- **Adjustable Parameters** - Modify masses, lengths, gravity, damping, and initial angles
- **Live Graphs**:
  - Angles (θ₁, θ₂) vs time
  - Phase space (θ vs ω) for both pendulums
  - Energy (kinetic, potential, total) vs time
- **Accurate Physics** - Runge-Kutta 4th order integration
- **Speed Control** - Slow down or speed up the simulation

## Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| Mass 1, 2 | 0.1 - 5 kg | Mass of each pendulum bob |
| Length 1, 2 | 0.5 - 2 m | Length of each rod |
| Initial Angle 1, 2 | -180° to 180° | Starting angles from vertical |
| Gravity | 1 - 20 m/s² | Gravitational acceleration |
| Damping | 0 - 0.1 | Energy dissipation factor |
| Speed | 0.1x - 3x | Simulation speed multiplier |

## Usage

1. Open `index.html` in a browser (or serve locally)
2. Adjust parameters using the sliders
3. Click **Start** to begin the simulation
4. Click **Pause** to freeze, **Reset** to return to initial state
5. Observe the chaotic behavior in the graphs

## Physics

The double pendulum is a classic example of a **chaotic system**. The equations of motion are derived from Lagrangian mechanics:

```
L = T - V (Lagrangian = Kinetic - Potential energy)
```

The resulting coupled differential equations are solved numerically using **4th-order Runge-Kutta integration** (RK4), which provides excellent accuracy and energy conservation.

### Why It's Chaotic

Small changes in initial conditions lead to dramatically different outcomes over time. Try:
1. Set both angles to 120°, run the simulation
2. Reset and change one angle to 120.1°
3. Observe how the trajectories diverge

## Graphs Explained

- **Angles vs Time**: Shows θ₁ (blue) and θ₂ (purple) oscillations
- **Phase Space**: Plots angle vs angular velocity; closed loops indicate periodic motion, while scattered patterns indicate chaos
- **Energy**: Kinetic (red), Potential (blue), and Total (green); total should remain constant without damping

## Running Locally

```bash
# Simple HTTP server
cd double-pendulum
python3 -m http.server 8000
# Open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Tech Stack

- Pure HTML/CSS/JavaScript
- Canvas API for rendering
- No external dependencies
- Single file, no build step
