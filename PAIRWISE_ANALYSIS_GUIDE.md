# Pairwise Parameter Estimation Analysis Guide

## Overview

The pairwise analysis estimates parameters separately for each PAA concentration pair, then compares them to a global fit. This helps diagnose whether:
1. **rho is concentration-dependent** - Does the IAA-PAA interaction vary with PAA dose?
2. **Parameters are identifiable** - Are qI and q0 consistent across different subsets?
3. **Pooling data is appropriate** - Does the global fit improve or distort estimates?

## What It Does

### 1. Three Pairwise Fits

Each PAA concentration is analyzed using 4 treatments:

**50nM Pair:**
- 100iaa (for qI)
- control (for q0)
- 50paa (for qP_50nM)
- 50then100 (for rho)

**500nM Pair:**
- 100iaa (for qI)
- control (for q0)
- 500paa (for qP_500nM)
- 500then100 (for rho)

**5µM Pair:**
- 100iaa (for qI)
- control (for q0)
- 5upaa (for qP_5uM)
- 5uthen100 (for rho)

Each estimates **7 parameters**: p1, qI, q0, qP, rho, lam, p2

### 2. Global Fit

Uses all 8 treatments together:
- Estimates **9 parameters**: p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2
- Single rho assumed across all PAA concentrations

## How to Run

```bash
python reduced_model_pairwise_analysis.py
```

**Runtime:** ~5-10 minutes (50 initial guesses per fit × 4 fits)

## Output Files

### Parameter Files
- `params_50nM_pair.txt` - Parameters from 50nM pair
- `params_500nM_pair.txt` - Parameters from 500nM pair
- `params_5uM_pair.txt` - Parameters from 5µM pair
- `params_global.txt` - Parameters from global fit

### Summary Files
- `pairwise_parameter_comparison.csv` - Comparison table of all parameters

### Visualization
- `pairwise_fits_comparison.png` - 3×4 grid showing each pair's fit
- `rho_comparison.png` - Bar chart comparing rho values

## Interpreting Results

### Key Metrics Reported

**1. rho Consistency (Coefficient of Variation)**
```
CV rho < 0.2  →  ✓ Excellent consistency (single rho is valid)
CV rho < 0.5  →  ⚠ Moderate variation (check concentration-dependence)
CV rho > 0.5  →  ✗ Poor consistency (rho may be concentration-dependent)
```

**2. Shared Parameter Consistency (qI and q0)**
- These should be identical across all pairs since they're measured in all subsets
- High CV (>0.3) indicates overfitting or identifiability issues

**3. Cost Comparison**
- Pairwise costs should be similar to each other
- Global cost should be slightly higher (more data to fit)
- Very different costs suggest subset-specific issues

### What to Look For

**If rho is consistent across pairs:**
- ✓ The global fit with single rho is appropriate
- ✓ IAA-PAA interaction is concentration-independent
- ✓ Your original concern about rho being too low is addressable

**If rho varies substantially:**
- ⚠ Consider a concentration-dependent interaction model
- ⚠ The global fit may be averaging over different interaction strengths
- ⚠ May need rho(PAA_conc) function instead of single rho

**If qI or q0 vary across pairs:**
- ⚠ Suggests parameter identifiability problems
- ⚠ Limited data per pair may cause overfitting
- ⚠ Consider using the global fit instead

**If p2 hits upper bound (20.0):**
- ⚠ Need to further relax the bound
- ⚠ Parameter estimates may be distorted

## Advantages of This Analysis

1. **Diagnoses concentration-dependence** - Shows if rho varies with PAA dose
2. **Tests model assumptions** - Validates single rho assumption
3. **Improves confidence** - Consistent estimates across subsets = robust parameters
4. **Identifies problematic concentrations** - If one pair fits poorly, that concentration may be problematic

## Expected Results

Based on your concern that rho should be larger:

**Hypothesis 1: Global fit underestimates rho**
- Pairwise rho values > global rho
- Suggests pooling data dilutes the interaction signal

**Hypothesis 2: rho is concentration-dependent**
- rho increases with PAA concentration (or shows non-monotonic pattern)
- Would explain why global single-rho fit gives low value

**Hypothesis 3: p2 boundary constrains rho**
- With relaxed p2 bound, rho should increase
- If it doesn't, the low rho is likely real

## Next Steps After Analysis

**If pairwise rho values are larger and consistent:**
1. Trust the pairwise estimates more than global
2. Consider using mean(rho_pairwise) as the "true" rho
3. Investigate why global fit underestimates

**If pairwise rho values vary significantly:**
1. Implement concentration-dependent interaction: rho(c_PAA)
2. Test different functional forms (linear, saturating, etc.)
3. Consider mechanistic reasons for concentration-dependence

**If pairwise rho values are similar to global:**
1. The global fit is reliable
2. Your expectation of higher rho may need reconsideration
3. Examine biological basis for expected rho magnitude

## Limitations

- Each pair has limited data (4 treatments, 7 parameters)
- May have lower power to detect rho compared to global fit
- Assumes shared qI and q0 across pairs (which should be true biologically)
