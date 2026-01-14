# Lorenz Attractor

Interactive visualization of the Lorenz system, a classic example of deterministic chaos.

## The Lorenz System

The Lorenz equations describe convection in a fluid:

```
dx/dt = σ(y - x)
dy/dt = x(ρ - z) - y
dz/dt = xy - βz
```

Where:
- **σ (sigma)** - Prandtl number (ratio of momentum diffusivity to thermal diffusivity)
- **ρ (rho)** - Rayleigh number (driving force of convection)
- **β (beta)** - Geometric factor

## Features

- **3D Attractor View** - Rotatable projection of the strange attractor
- **Dual Trajectories** - Compare two nearby starting points to see sensitive dependence
- **Time Series** - X, Y, Z coordinates over time
- **Phase Space** - Classic X-Z "butterfly" projection
- **Divergence Plot** - Logarithmic view of trajectory separation

## Presets

- **Classic** - σ=10, ρ=28, β=8/3 (Lorenz's original parameters, chaotic)
- **Periodic** - ρ=160 produces a period-2 limit cycle (alternating loops)
- **Transient** - Start near origin to see long transient before settling onto attractor
- **High ρ** - ρ=45 shows different attractor structure

## Running Tests

```bash
node run_tests.js
```

Tests verify:
- Lorenz differential equations
- Fixed point calculations
- RK4 integrator stability
- Sensitive dependence on initial conditions
- 3D projection functions
