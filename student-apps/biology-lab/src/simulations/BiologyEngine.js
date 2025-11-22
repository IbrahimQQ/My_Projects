// Biology Engine - Calculations and simulations for biology experiments

export const BiologyEngine = {
  // Cell Biology calculations
  cellBiology: {
    // Calculate magnification
    magnification: (eyepiece, objective) => eyepiece * objective,

    // Calculate actual size from image size and magnification
    actualSize: (imageSize, magnification) => imageSize / magnification,

    // Osmosis - water potential calculation
    waterPotential: (soluteConc, pressurePotential = 0) => {
      const R = 8.314; // Gas constant
      const T = 298; // Temperature in Kelvin (25°C)
      const solutePotential = -soluteConc * R * T / 1000; // in kPa
      return solutePotential + pressurePotential;
    },

    // Percent change in mass (osmosis experiment)
    percentChange: (initial, final) => ((final - initial) / initial) * 100,

    // Mitotic index calculation
    mitoticIndex: (dividingCells, totalCells) => (dividingCells / totalCells) * 100,
  },

  // Biochemistry calculations
  biochemistry: {
    // Enzyme kinetics - Michaelis-Menten equation
    reactionRate: (vmax, substrate, km) => (vmax * substrate) / (km + substrate),

    // Q10 temperature coefficient
    q10: (rate1, rate2, temp1, temp2) => Math.pow(rate2 / rate1, 10 / (temp2 - temp1)),

    // Photosynthesis rate (simplified)
    photosynthesisRate: (lightIntensity, co2Conc, temperature) => {
      const lightFactor = 1 - Math.exp(-lightIntensity / 500);
      const co2Factor = co2Conc / (co2Conc + 0.01);
      const tempFactor = Math.exp(-Math.pow((temperature - 25) / 15, 2));
      return lightFactor * co2Factor * tempFactor * 100;
    },

    // Respiration rate (oxygen consumption)
    respirationRate: (volume, time, organisms) => volume / (time * organisms),

    // Benedict's test color intensity (reducing sugars)
    benedictResult: (sugarConc) => {
      if (sugarConc < 0.1) return { color: 'blue', result: 'Negative' };
      if (sugarConc < 0.5) return { color: 'green', result: 'Trace' };
      if (sugarConc < 1.0) return { color: 'yellow', result: 'Low' };
      if (sugarConc < 2.0) return { color: 'orange', result: 'Moderate' };
      return { color: 'brick-red', result: 'High' };
    },
  },

  // Ecology calculations
  ecology: {
    // Population density from quadrat sampling
    populationDensity: (totalCount, quadratArea, numQuadrats) =>
      totalCount / (quadratArea * numQuadrats),

    // Simpson's Diversity Index
    simpsonsIndex: (speciesCounts) => {
      const n = speciesCounts.reduce((a, b) => a + b, 0);
      if (n <= 1) return 0;
      const sumNiNi1 = speciesCounts.reduce((sum, ni) => sum + (ni * (ni - 1)), 0);
      return 1 - (sumNiNi1 / (n * (n - 1)));
    },

    // Shannon-Wiener Diversity Index
    shannonIndex: (speciesCounts) => {
      const total = speciesCounts.reduce((a, b) => a + b, 0);
      if (total === 0) return 0;
      return -speciesCounts.reduce((sum, count) => {
        if (count === 0) return sum;
        const p = count / total;
        return sum + (p * Math.log(p));
      }, 0);
    },

    // Lincoln-Petersen population estimate (mark-recapture)
    populationEstimate: (marked, captured, recaptured) =>
      recaptured > 0 ? (marked * captured) / recaptured : 0,

    // Species evenness
    evenness: (shannonH, speciesCount) =>
      speciesCount > 1 ? shannonH / Math.log(speciesCount) : 0,

    // Percentage cover
    percentCover: (coveredQuadrats, totalQuadrats) => (coveredQuadrats / totalQuadrats) * 100,
  },

  // Human Physiology calculations
  physiology: {
    // Heart rate from pulse count
    heartRate: (pulseCount, seconds) => (pulseCount / seconds) * 60,

    // Cardiac output
    cardiacOutput: (heartRate, strokeVolume) => heartRate * strokeVolume,

    // Breathing rate
    breathingRate: (breaths, seconds) => (breaths / seconds) * 60,

    // Tidal volume (simplified)
    tidalVolume: (vitalCapacity, percentage = 0.12) => vitalCapacity * percentage,

    // Minute ventilation
    minuteVentilation: (tidalVolume, breathingRate) => tidalVolume * breathingRate,

    // BMI calculation
    bmi: (weight, height) => weight / (height * height),

    // Reaction time statistics
    reactionTimeStats: (times) => {
      const sorted = [...times].sort((a, b) => a - b);
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
      return {
        mean,
        median: sorted[Math.floor(sorted.length / 2)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stdDev: Math.sqrt(variance),
      };
    },
  },

  // Genetics calculations
  genetics: {
    // Chi-squared test
    chiSquared: (observed, expected) => {
      return observed.reduce((sum, obs, i) => {
        const exp = expected[i];
        return sum + Math.pow(obs - exp, 2) / exp;
      }, 0);
    },

    // Degrees of freedom
    degreesOfFreedom: (categories) => categories - 1,

    // Expected values from ratio
    expectedFromRatio: (total, ratio) => {
      const ratioSum = ratio.reduce((a, b) => a + b, 0);
      return ratio.map(r => (r / ratioSum) * total);
    },

    // Hardy-Weinberg frequencies
    hardyWeinberg: (p) => {
      const q = 1 - p;
      return {
        AA: p * p,
        Aa: 2 * p * q,
        aa: q * q,
      };
    },

    // Allele frequency from genotype counts
    alleleFrequency: (AA, Aa, aa) => {
      const total = AA + Aa + aa;
      return (2 * AA + Aa) / (2 * total);
    },
  },

  // Microbiology calculations
  microbiology: {
    // Bacterial growth (exponential phase)
    bacterialGrowth: (initial, time, generationTime) => {
      const generations = time / generationTime;
      return initial * Math.pow(2, generations);
    },

    // Generation time calculation
    generationTime: (time, initialCount, finalCount) => {
      const generations = Math.log2(finalCount / initialCount);
      return time / generations;
    },

    // Colony forming units per ml
    cfuPerMl: (colonies, dilutionFactor, volumePlated) =>
      (colonies * dilutionFactor) / volumePlated,

    // Zone of inhibition interpretation
    zoneInterpretation: (zoneDiameter, breakpoints) => {
      if (zoneDiameter >= breakpoints.susceptible) return 'Susceptible';
      if (zoneDiameter <= breakpoints.resistant) return 'Resistant';
      return 'Intermediate';
    },

    // Growth rate constant
    growthRate: (n0, nt, time) => (Math.log(nt) - Math.log(n0)) / time,

    // Lag phase estimation
    lagPhase: (growthData) => {
      for (let i = 1; i < growthData.length; i++) {
        if (growthData[i] > growthData[i-1] * 1.1) return i;
      }
      return growthData.length;
    },
  },

  // Simulation functions
  simulations: {
    // Osmosis simulation - generates data points
    osmosisSimulation: (initialMass, solutionConc, duration, intervals) => {
      const data = [];
      const finalChange = -solutionConc * 20; // Simplified model
      for (let t = 0; t <= duration; t += duration / intervals) {
        const change = finalChange * (1 - Math.exp(-t / (duration / 3)));
        data.push({
          time: t,
          mass: initialMass * (1 + change / 100),
          percentChange: change,
        });
      }
      return data;
    },

    // Enzyme activity simulation
    enzymeSimulation: (substrate, enzyme, temp, pH, duration) => {
      const optimalTemp = 37;
      const optimalPH = 7;
      const tempFactor = Math.exp(-Math.pow((temp - optimalTemp) / 10, 2));
      const phFactor = Math.exp(-Math.pow((pH - optimalPH) / 2, 2));
      const vmax = enzyme * 100 * tempFactor * phFactor;
      const km = 5;

      const data = [];
      let remainingSubstrate = substrate;
      for (let t = 0; t <= duration; t += duration / 20) {
        const rate = (vmax * remainingSubstrate) / (km + remainingSubstrate);
        data.push({
          time: t,
          substrate: remainingSubstrate,
          product: substrate - remainingSubstrate,
          rate,
        });
        remainingSubstrate = Math.max(0, remainingSubstrate - rate * (duration / 20) / 60);
      }
      return data;
    },

    // Bacterial growth curve simulation
    bacterialGrowthCurve: (initial, generationTime, nutrients, duration) => {
      const data = [];
      let population = initial;
      let phase = 'lag';
      const lagDuration = generationTime * 2;
      const maxPopulation = nutrients * 1e6;

      for (let t = 0; t <= duration; t += duration / 30) {
        if (t < lagDuration) {
          phase = 'lag';
        } else if (population < maxPopulation * 0.9) {
          phase = 'exponential';
          const growthFactor = 1 - (population / maxPopulation);
          population *= Math.pow(2, (duration / 30) / generationTime * growthFactor);
        } else if (population < maxPopulation) {
          phase = 'stationary';
        } else {
          phase = 'death';
          population *= 0.95;
        }

        data.push({
          time: t,
          population: Math.round(population),
          logPopulation: Math.log10(population),
          phase,
        });
      }
      return data;
    },

    // Photosynthesis bubble count simulation
    photosynthesisSimulation: (lightIntensity, co2, temp, duration) => {
      const data = [];
      const maxRate = 50; // bubbles per minute

      for (let t = 0; t <= duration; t += 1) {
        const lightFactor = 1 - Math.exp(-lightIntensity / 1000);
        const co2Factor = co2 / (co2 + 0.02);
        const tempFactor = temp >= 10 && temp <= 40
          ? Math.exp(-Math.pow((temp - 25) / 12, 2))
          : 0.1;

        const rate = maxRate * lightFactor * co2Factor * tempFactor;
        const bubbles = Math.round(rate + (Math.random() - 0.5) * rate * 0.2);

        data.push({
          time: t,
          bubbles: Math.max(0, bubbles),
          rate: rate.toFixed(1),
        });
      }
      return data;
    },

    // Heart rate response to exercise
    heartRateSimulation: (restingHR, exerciseIntensity, duration) => {
      const data = [];
      const maxHR = 220 - 25; // Assuming age 25
      const targetHR = restingHR + (maxHR - restingHR) * (exerciseIntensity / 100);

      for (let t = 0; t <= duration; t += duration / 30) {
        let hr;
        if (t < duration / 3) {
          // Exercise phase - HR increases
          const progress = t / (duration / 3);
          hr = restingHR + (targetHR - restingHR) * (1 - Math.exp(-3 * progress));
        } else {
          // Recovery phase - HR decreases
          const recoveryTime = t - duration / 3;
          const recoveryProgress = recoveryTime / (2 * duration / 3);
          hr = targetHR - (targetHR - restingHR) * (1 - Math.exp(-2 * recoveryProgress));
        }

        data.push({
          time: t,
          heartRate: Math.round(hr + (Math.random() - 0.5) * 5),
          phase: t < duration / 3 ? 'exercise' : 'recovery',
        });
      }
      return data;
    },
  },
};

export default BiologyEngine;
