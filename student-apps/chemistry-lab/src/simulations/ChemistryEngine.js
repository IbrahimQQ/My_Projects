// Chemistry constants
export const CONSTANTS = {
  R: 8.314, // Gas constant (J/(mol·K))
  F: 96485, // Faraday constant (C/mol)
  NA: 6.022e23, // Avogadro's number
  kB: 1.381e-23, // Boltzmann constant (J/K)
  h: 6.626e-34, // Planck's constant (J·s)
  c: 299792458, // Speed of light (m/s)
  waterDensity: 1.0, // g/mL
  waterSpecificHeat: 4.186, // J/(g·K)
};

// Common molar masses (g/mol)
export const MOLAR_MASSES = {
  H: 1.008,
  He: 4.003,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.990,
  Mg: 24.305,
  Al: 26.982,
  S: 32.065,
  Cl: 35.453,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.380,
  Ag: 107.868,
  H2O: 18.015,
  NaCl: 58.443,
  HCl: 36.461,
  NaOH: 39.997,
  H2SO4: 98.079,
  CuSO4: 159.609,
  KNO3: 101.103,
};

// pH and Acid-Base calculations
export const acidBase = {
  pH: (hConcentration) => -Math.log10(hConcentration),
  pOH: (ohConcentration) => -Math.log10(ohConcentration),
  hFrompH: (pH) => Math.pow(10, -pH),
  ohFrompOH: (pOH) => Math.pow(10, -pOH),
  neutralization: (acidMoles, baseMoles) => acidMoles === baseMoles,

  titration: {
    volumeAtEquivalence: (acidConc, acidVol, baseConc) =>
      (acidConc * acidVol) / baseConc,
    concentrationFromTitration: (titrantConc, titrantVol, analyteVol) =>
      (titrantConc * titrantVol) / analyteVol,
    pHDuringTitration: (acidConc, acidVol, baseConc, baseVol) => {
      const acidMoles = acidConc * acidVol / 1000;
      const baseMoles = baseConc * baseVol / 1000;
      const totalVol = (acidVol + baseVol) / 1000;

      if (acidMoles > baseMoles) {
        const excessH = (acidMoles - baseMoles) / totalVol;
        return -Math.log10(excessH);
      } else if (baseMoles > acidMoles) {
        const excessOH = (baseMoles - acidMoles) / totalVol;
        const pOH = -Math.log10(excessOH);
        return 14 - pOH;
      } else {
        return 7; // Equivalence point for strong acid-strong base
      }
    },
  },

  buffer: {
    hendersonHasselbalch: (pKa, acidConc, baseConc) =>
      pKa + Math.log10(baseConc / acidConc),
    capacity: (acidConc, baseConc, Ka) =>
      2.303 * ((acidConc * baseConc) / (acidConc + baseConc)),
  },
};

// Kinetics calculations
export const kinetics = {
  rateConstant: (A, Ea, T) => A * Math.exp(-Ea / (CONSTANTS.R * T)),

  rateOfReaction: (k, concentrations, orders) => {
    let rate = k;
    concentrations.forEach((conc, i) => {
      rate *= Math.pow(conc, orders[i]);
    });
    return rate;
  },

  firstOrder: {
    concentration: (c0, k, t) => c0 * Math.exp(-k * t),
    halfLife: (k) => Math.log(2) / k,
    rateConstant: (c0, ct, t) => Math.log(c0 / ct) / t,
  },

  secondOrder: {
    concentration: (c0, k, t) => c0 / (1 + k * c0 * t),
    halfLife: (k, c0) => 1 / (k * c0),
  },

  zeroOrder: {
    concentration: (c0, k, t) => Math.max(0, c0 - k * t),
    halfLife: (c0, k) => c0 / (2 * k),
  },

  arrhenius: {
    activationEnergy: (k1, k2, T1, T2) =>
      (CONSTANTS.R * Math.log(k2 / k1)) / (1 / T1 - 1 / T2),
  },
};

// Thermodynamics calculations
export const thermodynamics = {
  heatEnergy: (mass, specificHeat, deltaT) => mass * specificHeat * deltaT,

  enthalpyChange: (q, moles) => -q / moles,

  finalTemperature: (m1, c1, T1, m2, c2, T2) =>
    (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2),

  neutralizationEnthalpy: (volume, concentration, deltaT) => {
    const mass = volume * CONSTANTS.waterDensity;
    const q = mass * CONSTANTS.waterSpecificHeat * deltaT;
    const moles = (volume / 1000) * concentration;
    return -q / (moles * 1000); // kJ/mol
  },

  gibbsFreeEnergy: (deltaH, T, deltaS) => deltaH - T * deltaS,

  equilibriumConstant: (deltaG, T) => Math.exp(-deltaG / (CONSTANTS.R * T)),
};

// Electrochemistry
export const electrochemistry = {
  faraday: {
    massDeposited: (current, time, molarMass, electrons) =>
      (current * time * molarMass) / (electrons * CONSTANTS.F),
    chargeRequired: (moles, electrons) => moles * electrons * CONSTANTS.F,
    timeRequired: (mass, current, molarMass, electrons) =>
      (mass * electrons * CONSTANTS.F) / (current * molarMass),
  },

  cellPotential: (Ecathode, Eanode) => Ecathode - Eanode,

  nernstEquation: (E0, n, Q, T = 298) =>
    E0 - (CONSTANTS.R * T / (n * CONSTANTS.F)) * Math.log(Q),

  electrolysisCurrent: (moles, electrons, time) =>
    (moles * electrons * CONSTANTS.F) / time,
};

// Solubility
export const solubility = {
  ksp: (ionConcentrations, stoichiometry) => {
    let product = 1;
    ionConcentrations.forEach((conc, i) => {
      product *= Math.pow(conc, stoichiometry[i]);
    });
    return product;
  },

  saturationConcentration: (ksp, stoichiometry) => {
    const totalCoeff = stoichiometry.reduce((a, b) => a + b, 0);
    return Math.pow(ksp / Math.pow(stoichiometry[0], stoichiometry[0]) / Math.pow(stoichiometry[1] || 1, stoichiometry[1] || 1), 1 / totalCoeff);
  },

  willPrecipitate: (ionProduct, ksp) => ionProduct > ksp,

  temperatureEffect: (solubility1, T1, deltaH, T2) => {
    const lnRatio = (-deltaH / CONSTANTS.R) * (1 / T2 - 1 / T1);
    return solubility1 * Math.exp(lnRatio);
  },
};

// Gas laws
export const gasLaws = {
  idealGas: {
    pressure: (n, V, T) => (n * CONSTANTS.R * T) / V,
    volume: (n, P, T) => (n * CONSTANTS.R * T) / P,
    temperature: (P, V, n) => (P * V) / (n * CONSTANTS.R),
    moles: (P, V, T) => (P * V) / (CONSTANTS.R * T),
  },

  combined: (P1, V1, T1, P2, V2) => (P1 * V1 * T2) / (T1 * V2),

  daltonPartialPressure: (totalPressure, moleFraction) =>
    totalPressure * moleFraction,

  grahamEffusion: (M1, M2) => Math.sqrt(M2 / M1),
};

// Stoichiometry
export const stoichiometry = {
  molesFromMass: (mass, molarMass) => mass / molarMass,
  massFromMoles: (moles, molarMass) => moles * molarMass,
  molarity: (moles, volumeL) => moles / volumeL,
  molesFromMolarity: (molarity, volumeL) => molarity * volumeL,

  limitingReagent: (molesA, coeffA, molesB, coeffB) => {
    const ratioA = molesA / coeffA;
    const ratioB = molesB / coeffB;
    return ratioA < ratioB ? 'A' : 'B';
  },

  theoreticalYield: (molesLimiting, coeffLimiting, coeffProduct, molarMassProduct) => {
    const molesProduct = (molesLimiting / coeffLimiting) * coeffProduct;
    return molesProduct * molarMassProduct;
  },

  percentYield: (actualYield, theoreticalYield) =>
    (actualYield / theoreticalYield) * 100,

  dilution: (C1, V1, V2) => (C1 * V1) / V2,
};

// Organic chemistry
export const organic = {
  esterYield: (alcoholMoles, acidMoles, efficiency = 0.6) => {
    const limitingMoles = Math.min(alcoholMoles, acidMoles);
    return limitingMoles * efficiency;
  },

  fermentationRate: (glucoseConc, temp, yeastActivity = 1) => {
    const optimalTemp = 35;
    const tempFactor = 1 - Math.abs(temp - optimalTemp) / 30;
    return glucoseConc * tempFactor * yeastActivity * 0.1;
  },

  saponificationValue: (fatMass, kohMass) => (kohMass / fatMass) * 1000,
};

// Spectroscopy
export const spectroscopy = {
  wavelengthToEnergy: (wavelength) => (CONSTANTS.h * CONSTANTS.c) / wavelength,

  wavelengthToFrequency: (wavelength) => CONSTANTS.c / wavelength,

  flameTestColors: {
    Li: { color: '#FF0000', wavelength: 670 },
    Na: { color: '#FFFF00', wavelength: 589 },
    K: { color: '#EE82EE', wavelength: 766 },
    Ca: { color: '#FF4500', wavelength: 622 },
    Sr: { color: '#FF0000', wavelength: 650 },
    Ba: { color: '#00FF00', wavelength: 524 },
    Cu: { color: '#00CED1', wavelength: 510 },
  },

  beersLaw: (absorptivity, pathLength, concentration) =>
    absorptivity * pathLength * concentration,
};

// Equilibrium
export const equilibrium = {
  kc: (productConcs, reactantConcs, productCoeffs, reactantCoeffs) => {
    let numerator = 1;
    let denominator = 1;

    productConcs.forEach((conc, i) => {
      numerator *= Math.pow(conc, productCoeffs[i]);
    });

    reactantConcs.forEach((conc, i) => {
      denominator *= Math.pow(conc, reactantCoeffs[i]);
    });

    return numerator / denominator;
  },

  reactionQuotient: (productConcs, reactantConcs, productCoeffs, reactantCoeffs) =>
    equilibrium.kc(productConcs, reactantConcs, productCoeffs, reactantCoeffs),

  shiftDirection: (Q, K) => {
    if (Q < K) return 'forward';
    if (Q > K) return 'reverse';
    return 'equilibrium';
  },

  vanHoff: (K1, K2, T1, T2) => {
    const lnRatio = Math.log(K2 / K1);
    return -CONSTANTS.R * lnRatio / (1 / T2 - 1 / T1);
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

  celsiusToKelvin: (c) => c + 273.15,
  kelvinToCelsius: (k) => k - 273.15,
};
