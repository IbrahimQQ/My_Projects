// Physics constants
export const CONSTANTS = {
  g: 9.81, // acceleration due to gravity (m/s^2)
  c: 299792458, // speed of light (m/s)
  h: 6.626e-34, // Planck's constant (J·s)
  e: 1.602e-19, // elementary charge (C)
  k: 8.99e9, // Coulomb's constant (N·m^2/C^2)
  epsilon0: 8.854e-12, // permittivity of free space (F/m)
  mu0: 1.257e-6, // permeability of free space (H/m)
  R: 8.314, // gas constant (J/(mol·K))
  kB: 1.381e-23, // Boltzmann constant (J/K)
  NA: 6.022e23, // Avogadro's number
  me: 9.109e-31, // electron mass (kg)
  mp: 1.673e-27, // proton mass (kg)
  pi: Math.PI,
};

// Unit conversions
export const convertUnits = {
  // Length
  mToCm: (m) => m * 100,
  cmToM: (cm) => cm / 100,
  mToMm: (m) => m * 1000,
  mmToM: (mm) => mm / 1000,

  // Mass
  kgToG: (kg) => kg * 1000,
  gToKg: (g) => g / 1000,

  // Time
  sToMs: (s) => s * 1000,
  msToS: (ms) => ms / 1000,

  // Angle
  degToRad: (deg) => deg * (Math.PI / 180),
  radToDeg: (rad) => rad * (180 / Math.PI),

  // Temperature
  celsiusToKelvin: (c) => c + 273.15,
  kelvinToCelsius: (k) => k - 273.15,
  celsiusToFahrenheit: (c) => (c * 9 / 5) + 32,
  fahrenheitToCelsius: (f) => (f - 32) * 5 / 9,

  // Pressure
  atmToPa: (atm) => atm * 101325,
  paToAtm: (pa) => pa / 101325,
};

// Mechanics simulations
export const mechanics = {
  // Simple Pendulum
  pendulum: {
    period: (length, g = CONSTANTS.g) => 2 * Math.PI * Math.sqrt(length / g),
    frequency: (length, g = CONSTANTS.g) => 1 / (2 * Math.PI * Math.sqrt(length / g)),
    position: (amplitude, length, time, g = CONSTANTS.g) => {
      const omega = Math.sqrt(g / length);
      return amplitude * Math.cos(omega * time);
    },
    velocity: (amplitude, length, time, g = CONSTANTS.g) => {
      const omega = Math.sqrt(g / length);
      return -amplitude * omega * Math.sin(omega * time);
    },
    energy: (mass, amplitude, length, g = CONSTANTS.g) => {
      return 0.5 * mass * g * length * (amplitude * Math.PI / 180) ** 2;
    },
  },

  // Projectile Motion
  projectile: {
    range: (v0, angle, g = CONSTANTS.g) => {
      const theta = convertUnits.degToRad(angle);
      return (v0 * v0 * Math.sin(2 * theta)) / g;
    },
    maxHeight: (v0, angle, g = CONSTANTS.g) => {
      const theta = convertUnits.degToRad(angle);
      return (v0 * v0 * Math.sin(theta) ** 2) / (2 * g);
    },
    flightTime: (v0, angle, g = CONSTANTS.g) => {
      const theta = convertUnits.degToRad(angle);
      return (2 * v0 * Math.sin(theta)) / g;
    },
    position: (v0, angle, time, g = CONSTANTS.g) => {
      const theta = convertUnits.degToRad(angle);
      return {
        x: v0 * Math.cos(theta) * time,
        y: v0 * Math.sin(theta) * time - 0.5 * g * time * time,
      };
    },
    velocity: (v0, angle, time, g = CONSTANTS.g) => {
      const theta = convertUnits.degToRad(angle);
      return {
        vx: v0 * Math.cos(theta),
        vy: v0 * Math.sin(theta) - g * time,
      };
    },
    trajectory: (v0, angle, steps = 100, g = CONSTANTS.g) => {
      const totalTime = mechanics.projectile.flightTime(v0, angle, g);
      const dt = totalTime / steps;
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const t = i * dt;
        const pos = mechanics.projectile.position(v0, angle, t, g);
        if (pos.y >= 0) {
          points.push({ t, ...pos });
        }
      }
      return points;
    },
  },

  // Friction
  friction: {
    staticForce: (normalForce, coefficient) => coefficient * normalForce,
    kineticForce: (normalForce, coefficient) => coefficient * normalForce,
    normalForce: (mass, angle = 0, g = CONSTANTS.g) => {
      return mass * g * Math.cos(convertUnits.degToRad(angle));
    },
    acceleration: (mass, appliedForce, frictionCoeff, angle = 0, g = CONSTANTS.g) => {
      const normal = mechanics.friction.normalForce(mass, angle, g);
      const friction = mechanics.friction.kineticForce(normal, frictionCoeff);
      const gravComponent = mass * g * Math.sin(convertUnits.degToRad(angle));
      return (appliedForce - friction - gravComponent) / mass;
    },
  },

  // Newton's Second Law
  newtonsSecondLaw: {
    acceleration: (force, mass) => force / mass,
    force: (mass, acceleration) => mass * acceleration,
    mass: (force, acceleration) => force / acceleration,
  },

  // Momentum
  momentum: {
    linear: (mass, velocity) => mass * velocity,
    collision: {
      elastic: (m1, v1, m2, v2) => ({
        v1f: ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2),
        v2f: ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2),
      }),
      inelastic: (m1, v1, m2, v2) => ({
        vf: (m1 * v1 + m2 * v2) / (m1 + m2),
      }),
    },
    impulse: (force, time) => force * time,
  },
};

// Waves simulations
export const waves = {
  // Standing Waves
  standingWave: {
    wavelength: (n, length) => (2 * length) / n,
    frequency: (n, length, velocity) => (n * velocity) / (2 * length),
    nodePositions: (n, length) => {
      const positions = [];
      for (let i = 0; i <= n; i++) {
        positions.push((i * length) / n);
      }
      return positions;
    },
    antinodePositions: (n, length) => {
      const positions = [];
      for (let i = 0; i < n; i++) {
        positions.push(((2 * i + 1) * length) / (2 * n));
      }
      return positions;
    },
    displacement: (x, t, amplitude, wavelength, frequency) => {
      const k = (2 * Math.PI) / wavelength;
      const omega = 2 * Math.PI * frequency;
      return 2 * amplitude * Math.sin(k * x) * Math.cos(omega * t);
    },
  },

  // Sound Resonance
  resonance: {
    openPipe: {
      frequency: (n, length, velocity = 343) => (n * velocity) / (2 * length),
      wavelength: (n, length) => (2 * length) / n,
    },
    closedPipe: {
      frequency: (n, length, velocity = 343) => ((2 * n - 1) * velocity) / (4 * length),
      wavelength: (n, length) => (4 * length) / (2 * n - 1),
    },
  },

  // Diffraction
  diffraction: {
    singleSlit: {
      minima: (m, wavelength, slitWidth) =>
        Math.asin((m * wavelength) / slitWidth),
      centralWidth: (wavelength, slitWidth, distance) =>
        (2 * wavelength * distance) / slitWidth,
      intensity: (theta, wavelength, slitWidth) => {
        const beta = (Math.PI * slitWidth * Math.sin(theta)) / wavelength;
        if (Math.abs(beta) < 0.0001) return 1;
        return (Math.sin(beta) / beta) ** 2;
      },
    },
    doubleSlit: {
      maxima: (m, wavelength, slitSeparation) =>
        Math.asin((m * wavelength) / slitSeparation),
      fringeSpacing: (wavelength, slitSeparation, distance) =>
        (wavelength * distance) / slitSeparation,
    },
  },
};

// Electricity and Magnetism
export const electricity = {
  // Ohm's Law
  ohmsLaw: {
    voltage: (current, resistance) => current * resistance,
    current: (voltage, resistance) => voltage / resistance,
    resistance: (voltage, current) => voltage / current,
    power: (voltage, current) => voltage * current,
    powerFromR: (current, resistance) => current * current * resistance,
  },

  // Kirchhoff's Laws
  kirchhoff: {
    junctionRule: (currentsIn, currentsOut) =>
      currentsIn.reduce((a, b) => a + b, 0) === currentsOut.reduce((a, b) => a + b, 0),
    loopRule: (voltages) => Math.abs(voltages.reduce((a, b) => a + b, 0)) < 0.001,
    seriesResistance: (resistances) => resistances.reduce((a, b) => a + b, 0),
    parallelResistance: (resistances) =>
      1 / resistances.reduce((sum, r) => sum + 1 / r, 0),
  },

  // RC Circuit
  rcCircuit: {
    timeConstant: (resistance, capacitance) => resistance * capacitance,
    chargingVoltage: (v0, t, r, c) => v0 * (1 - Math.exp(-t / (r * c))),
    dischargingVoltage: (v0, t, r, c) => v0 * Math.exp(-t / (r * c)),
    chargingCurrent: (v0, t, r, c) => (v0 / r) * Math.exp(-t / (r * c)),
    energy: (capacitance, voltage) => 0.5 * capacitance * voltage * voltage,
  },

  // Magnetic Field
  magneticField: {
    wire: (current, distance) => (CONSTANTS.mu0 * current) / (2 * Math.PI * distance),
    solenoid: (n, current) => CONSTANTS.mu0 * n * current,
    lorentzForce: (charge, velocity, magneticField, angle = 90) =>
      charge * velocity * magneticField * Math.sin(convertUnits.degToRad(angle)),
    magneticFlux: (field, area, angle = 0) =>
      field * area * Math.cos(convertUnits.degToRad(angle)),
  },
};

// Optics simulations
export const optics = {
  // Snell's Law
  snellsLaw: {
    refractedAngle: (n1, n2, theta1) => {
      const sinTheta2 = (n1 / n2) * Math.sin(convertUnits.degToRad(theta1));
      if (Math.abs(sinTheta2) > 1) return null; // Total internal reflection
      return convertUnits.radToDeg(Math.asin(sinTheta2));
    },
    criticalAngle: (n1, n2) => {
      if (n1 <= n2) return null;
      return convertUnits.radToDeg(Math.asin(n2 / n1));
    },
    refractiveIndex: (c, v) => c / v,
  },

  // Thin Lens
  thinLens: {
    imageDistance: (focalLength, objectDistance) =>
      (focalLength * objectDistance) / (objectDistance - focalLength),
    magnification: (imageDistance, objectDistance) => -imageDistance / objectDistance,
    lensmakerEquation: (n, r1, r2) => (n - 1) * (1 / r1 - 1 / r2),
    focalLength: (objectDistance, imageDistance) =>
      (objectDistance * imageDistance) / (objectDistance + imageDistance),
    power: (focalLength) => 1 / focalLength,
  },

  // Interference
  interference: {
    pathDifference: (slitSeparation, angle) =>
      slitSeparation * Math.sin(convertUnits.degToRad(angle)),
    constructiveCondition: (m, wavelength) => m * wavelength,
    destructiveCondition: (m, wavelength) => (m + 0.5) * wavelength,
    fringePosition: (m, wavelength, distance, slitSeparation) =>
      (m * wavelength * distance) / slitSeparation,
  },
};

// Thermodynamics simulations
export const thermodynamics = {
  // Specific Heat
  specificHeat: {
    heatEnergy: (mass, specificHeat, deltaT) => mass * specificHeat * deltaT,
    finalTemperature: (m1, c1, t1, m2, c2, t2) =>
      (m1 * c1 * t1 + m2 * c2 * t2) / (m1 * c1 + m2 * c2),
    latentHeat: (mass, latentHeat) => mass * latentHeat,
  },

  // Gas Laws
  gasLaws: {
    idealGas: {
      pressure: (n, T, V) => (n * CONSTANTS.R * T) / V,
      volume: (n, T, P) => (n * CONSTANTS.R * T) / P,
      temperature: (P, V, n) => (P * V) / (n * CONSTANTS.R),
    },
    boyle: (p1, v1, v2) => (p1 * v1) / v2,
    charles: (v1, t1, t2) => (v1 * t2) / t1,
    gayLussac: (p1, t1, t2) => (p1 * t2) / t1,
    combined: (p1, v1, t1, p2, t2) => (p1 * v1 * t2) / (t1 * p2),
    work: (pressure, deltaV) => pressure * deltaV,
  },
};

// Modern Physics simulations
export const modernPhysics = {
  // Photoelectric Effect
  photoelectric: {
    photonEnergy: (frequency) => CONSTANTS.h * frequency,
    photonEnergyWavelength: (wavelength) => (CONSTANTS.h * CONSTANTS.c) / wavelength,
    kineticEnergy: (frequency, workFunction) =>
      Math.max(0, CONSTANTS.h * frequency - workFunction),
    thresholdFrequency: (workFunction) => workFunction / CONSTANTS.h,
    stoppingPotential: (frequency, workFunction) =>
      (CONSTANTS.h * frequency - workFunction) / CONSTANTS.e,
  },

  // Radioactive Decay
  radioactiveDecay: {
    remainingNuclei: (n0, lambda, t) => n0 * Math.exp(-lambda * t),
    halfLife: (lambda) => Math.log(2) / lambda,
    decayConstant: (halfLife) => Math.log(2) / halfLife,
    activity: (n, lambda) => lambda * n,
    decayedNuclei: (n0, lambda, t) => n0 * (1 - Math.exp(-lambda * t)),
  },

  // Special Relativity
  relativity: {
    lorentzFactor: (v) => 1 / Math.sqrt(1 - (v / CONSTANTS.c) ** 2),
    timeDilation: (t0, v) => t0 * modernPhysics.relativity.lorentzFactor(v),
    lengthContraction: (l0, v) => l0 / modernPhysics.relativity.lorentzFactor(v),
    relativisticMass: (m0, v) => m0 * modernPhysics.relativity.lorentzFactor(v),
    energy: (m) => m * CONSTANTS.c * CONSTANTS.c,
  },
};

// Utility functions
export const utils = {
  round: (value, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
  formatScientific: (value, decimals = 2) => {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
      return value.toExponential(decimals);
    }
    return utils.round(value, decimals).toString();
  },
  clamp: (value, min, max) => Math.min(Math.max(value, min), max),
  lerp: (a, b, t) => a + (b - a) * t,
  randomInRange: (min, max) => Math.random() * (max - min) + min,
};
