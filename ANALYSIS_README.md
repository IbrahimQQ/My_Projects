# IAA-PAA ODE Model: Multicore Parameter Estimation with Comprehensive Diagnostics

## Overview

This repository contains an enhanced version of the IAA-PAA dynamics model with:

1. **Multicore parallel processing** for parameter estimation
2. **MCMC sampling** for posterior distribution analysis
3. **Comprehensive diagnostic plots** including:
   - MCMC parameter traces
   - Log posterior evolution
   - Fisher Information Matrix eigenvalues
   - Parameter correlation matrix
   - Profile likelihood for each parameter
   - Convergence diagnostics (corner plots)
   - Bifurcation analysis
   - Elasticity coefficient heatmap
   - Sobol global sensitivity indices

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

## Dependencies

- numpy: Numerical computations
- scipy: ODE integration and optimization
- matplotlib: Plotting
- seaborn: Statistical visualizations
- emcee: MCMC sampling (Affine-Invariant Ensemble Sampler)
- SALib: Sensitivity analysis library
- corner: Corner plots for MCMC posteriors
- tqdm: Progress bars

## Usage

Run the enhanced analysis:

```bash
python enhanced_multicore_diagnostics.py
```

### Computation Time

The full analysis includes:
- **Parallel optimization**: ~2-5 minutes (with multicore)
- **MCMC sampling**: ~10-30 minutes (3000 steps, 32 walkers)
- **Sobol analysis**: ~5-15 minutes (512 samples)
- **Other diagnostics**: ~5-10 minutes

**Total runtime**: ~30-60 minutes (depending on CPU cores)

### Outputs

The script generates:

1. **fitted_parameters_multicore.txt** - Best-fit parameter values
2. **mcmc_traces.png** - MCMC parameter evolution traces
3. **log_posterior.png** - Log posterior evolution during MCMC
4. **eigenvalues.png** - Fisher Information Matrix eigenvalues (identifiability)
5. **correlation_matrix.png** - Parameter correlation heatmap
6. **profile_likelihood.png** - Profile likelihood for kinetic parameters
7. **diagnostics.png** - Corner plot (posterior distributions and pairwise correlations)
8. **bifurcation.png** - Bifurcation diagrams for key parameters
9. **elasticity.png** - Local sensitivity (elasticity coefficients) heatmap
10. **sobol_indices.png** - Global sensitivity (Sobol indices)

## Model Description

### ODE System

The model describes IAA and PAA dynamics with 7 state variables:
- IAA: Auxin (IAA) concentration
- TIR1: Free TIR1 receptor
- IAATIR1: IAA-TIR1 complex
- PAA: PAA (auxin analog) concentration
- PAATIR1: PAA-TIR1 complex
- IAATIR1VENUS: IAA-TIR1-VENUS complex (degradation)
- VENUS: DII-VENUS reporter protein

### Parameters (20 total)

**Kinetic parameters (12):**
- ka1, kd1: IAA-TIR1 binding/unbinding rates
- ka2, kd2: PAA-TIR1 binding/unbinding rates
- la, ld: VENUS degradation association/dissociation rates
- lm: VENUS degradation rate constant
- delta: VENUS production rate
- mu1, mu2: IAA and PAA degradation rates
- lam: VENUS dilution/degradation rate
- TIR1_T: Total TIR1 concentration

**Influx parameters (8):**
- alpha_0_IAA, alpha_0_PAA: Baseline influx rates
- alpha_IAA_100nM: IAA influx for 100nM treatment
- alpha_PAA_5nM, alpha_PAA_50nM, alpha_PAA_500nM: PAA influx for different concentrations
- alpha_PAA_5uM, alpha_PAA_50uM: High PAA concentrations

## Key Features

### 1. Multicore Processing

Uses Python's `multiprocessing` to parallelize Latin Hypercube Sampling across CPU cores:

```python
estimate_parameters_parallel(t_eval, data_matrix, num_samples=30, n_cores=None)
```

- Automatically detects available cores
- Runs multiple optimization attempts in parallel
- Significant speedup (4-8x on modern CPUs)

### 2. MCMC Sampling

Implements Bayesian inference using `emcee`:

```python
run_mcmc(initial_params, t_eval, data_matrix, param_bounds,
         nwalkers=32, nsteps=3000, burn_in=1000)
```

- 32 walkers for robust exploration
- 3000 MCMC steps (1000 burn-in)
- Produces posterior distributions for uncertainty quantification

### 3. Identifiability Analysis

**Fisher Information Matrix eigenvalues:**
- Large condition number → poorly identifiable parameters
- Small eigenvalues → parameter combinations are not well-constrained

**Profile Likelihood:**
- Shows confidence intervals for individual parameters
- Flat profiles indicate weak identifiability

### 4. Sensitivity Analysis

**Local (Elasticity):**
- How output changes with small parameter perturbations
- Time-dependent elasticity coefficients

**Global (Sobol):**
- Variance-based sensitivity indices
- S1: First-order effects (direct impact)
- ST: Total-order effects (including interactions)

### 5. Bifurcation Analysis

Analyzes how steady-state behavior changes with parameters:
- Helps identify critical parameter values
- Reveals potential multistability or transitions

## Interpreting Results

### MCMC Traces
- Should show convergence after burn-in
- Good mixing (no trends, random walk around mean)
- All walkers should explore similar regions

### Log Posterior
- Should plateau after burn-in
- Higher values = better fit

### Eigenvalues
- Wide spread → some parameters poorly constrained
- Condition number > 10^6 indicates numerical issues

### Correlation Matrix
- High correlations (|r| > 0.8) suggest parameter redundancy
- Near-zero correlations suggest independent effects

### Sobol Indices
- S1 close to ST → minimal interactions
- ST >> S1 → strong parameter interactions
- Higher values → more important parameters

## Customization

### Adjusting MCMC Settings

For faster exploration (less accurate):
```python
nwalkers=16, nsteps=1000, burn_in=500
```

For production runs (higher accuracy):
```python
nwalkers=64, nsteps=10000, burn_in=2000
```

### Sobol Samples

Higher samples = better estimates but slower:
```python
n_samples=1024  # Production
n_samples=256   # Quick test
```

## Troubleshooting

### MCMC Not Converging
- Increase burn-in steps
- Check initial parameter bounds
- Inspect trace plots for stuck walkers

### Memory Issues
- Reduce number of walkers
- Reduce MCMC steps
- Reduce Sobol samples

### Slow Performance
- Reduce `num_samples` in optimization
- Use fewer CPU cores (if memory-bound)
- Reduce MCMC steps

## Files

- `enhanced_multicore_diagnostics.py` - Main analysis script
- `requirements.txt` - Python dependencies
- `ANALYSIS_README.md` - This documentation file
