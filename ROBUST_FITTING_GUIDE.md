# Robust Parameter Estimation Guide

## Quick Start

```bash
python reduced_model_full_data_robust.py
```

That's it! The script will run with **Standard** settings (recommended for most cases).

---

## What to Expect

### Standard Mode (Default) - Recommended ✓

**Runtime**: 10-20 minutes
**Strategies**: Ensemble + Multiple Methods

**Output**:
```
======================================================================
COMPREHENSIVE ROBUST PARAMETER ESTIMATION
======================================================================

======================================================================
ROBUSTNESS STRATEGY 1: Ensemble (5 runs × 50 starts)
======================================================================

  Run 1/5 (seed=0)...
    Cost: 0.123456  (Time: 45.2s)
  Run 2/5 (seed=1)...
    Cost: 0.123458  (Time: 43.1s)
  ...

======================================================================
ENSEMBLE RESULTS
======================================================================

Cost statistics:
  Mean: 0.123457 ± 0.000002
  Range: [0.123456, 0.123460]

Parameter consistency (CV = coefficient of variation):
Status       Parameter    Mean         Std          CV
----------------------------------------------------------------------
✓ Excellent  p1           1.234567     0.001234     0.001
✓ Excellent  qI           2.345678     0.002345     0.001
✓ Excellent  q0           0.987654     0.000987     0.001
...

✓ Excellent consistency (max CV = 0.003) - Results are highly reliable!

======================================================================
ROBUSTNESS STRATEGY 2: Multiple Methods (30 starts each)
======================================================================

  Trying method=trf, loss=linear...
    Cost: 0.123500  (Time: 25.3s)
  Trying method=trf, loss=soft_l1...
    Cost: 0.123456  (Time: 26.1s)
  ...

======================================================================
METHOD COMPARISON (sorted by cost)
======================================================================
Rank   Method     Loss         Cost
----------------------------------------------------------------------
1      trf        soft_l1      0.123456
2      dogbox     soft_l1      0.123458
3      trf        huber        0.123460
...

✓ Best: trf with soft_l1 loss (cost = 0.123456)

======================================================================
FINAL COMPARISON OF ALL STRATEGIES
======================================================================
  ensemble                 : cost = 0.123456
  multiple_methods         : cost = 0.123456

======================================================================
RECOMMENDED PARAMETERS (from 'ensemble')
Best cost: 0.123456
Total time: 789.5s (13.2 min)
======================================================================

Parameter    Value
------------------------------
p1           1.23457
qI           2.34568
q0           0.98765
qP_5nM       1.11111
qP_50nM      1.22222
qP_500nM     1.33333
qP_5uM       1.44444
rho          0.55555
lam          0.12345
p2           0.67890

Parameters saved to: reduced_model_robust_parameters.txt

Plot saved: reduced_model_robust_fit.png
```

---

## Usage Modes

### Quick Mode (5-10 min)
**For testing or exploratory work**

Edit the script around line 580:
```python
best_params, results = robust_fit_comprehensive(
    t_eval, data_matrix,
    use_ensemble=True,              # ✓
    use_multiple_methods=False,     # ✗ Disabled for speed
    use_differential_evolution=False
)
```

### Standard Mode (10-20 min) - Recommended ✓
**For most analyses**

```python
best_params, results = robust_fit_comprehensive(
    t_eval, data_matrix,
    use_ensemble=True,              # ✓
    use_multiple_methods=True,      # ✓
    use_differential_evolution=False
)
```

### Maximum Robustness (30+ min)
**For publication or critical decisions**

```python
best_params, results = robust_fit_comprehensive(
    t_eval, data_matrix,
    use_ensemble=True,              # ✓
    use_multiple_methods=True,      # ✓
    use_differential_evolution=True # ✓ Adds global optimizer
)
```

---

## Interpreting Results

### ✓ Excellent Consistency (CV < 0.1)
**Your results are highly reliable!**

All runs converged to similar parameter values. You can trust these results.

**What to do**: Proceed with analysis, publish results.

### ⚠ Fair Consistency (CV 0.1-0.3)
**Results are reasonably reliable but check carefully**

Some variation between runs, but parameters are in the same ballpark.

**What to do**:
- Check which parameters vary (high CV)
- Consider tighter bounds on poorly constrained parameters
- Run Maximum Robustness mode
- May indicate model identifiability issues

### ✗ Poor Consistency (CV > 0.3)
**Warning: Results may not be reliable**

Large variation between runs indicates optimization difficulty.

**What to do**:
1. Try Maximum Robustness mode (includes Differential Evolution)
2. Check if parameters hit bounds (may need adjustment)
3. Consider if model is over-parameterized
4. May need to collect more data or use simpler model

---

## Outputs

### 1. Console Output
- Real-time progress for each strategy
- Consistency metrics (CV for each parameter)
- Method comparison
- Recommended parameters

### 2. Files Generated
- `reduced_model_robust_parameters.txt` - Best-fit parameter values
- `reduced_model_robust_fit.png` - Plot showing data vs model for all 10 treatments

### 3. Returned Results Dictionary

```python
results = {
    'ensemble': {
        'params': best_params,           # Best from ensemble
        'all_params': all_ensemble_params,  # All 5 runs
        'all_costs': all_ensemble_costs,    # Costs from all runs
        'cost': min_cost
    },
    'multiple_methods': {
        'params': best_params,           # Best from all methods
        'cost': min_cost,
        'all_results': [(result, method, loss), ...]
    }
}
```

---

## Comparison: Standard vs Robust

| Feature | reduced_model_full_data.py | reduced_model_full_data_robust.py |
|---------|---------------------------|----------------------------------|
| **Strategies** | Single (50 starts) | Multiple (ensemble + methods) |
| **Runtime** | ~5 min | ~10-20 min |
| **Reliability check** | None | Automatic CV analysis |
| **Method comparison** | Single | Tests 5 methods |
| **Consistency report** | No | Yes ✓ |
| **Use case** | Quick fits | Reliable/publication results |

---

## Troubleshooting

### "Poor consistency" warning
**Problem**: Parameters vary significantly between runs

**Solutions**:
1. Enable Differential Evolution:
   ```python
   use_differential_evolution=True
   ```

2. Tighten parameter bounds (if you have prior knowledge):
   ```python
   # In fit_single_run(), around line 176-177:
   lhs_low  = np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0, 0.01, 0.05])
   lhs_high = np.array([2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 0.3, 0.5])
   ```

3. Increase ensemble runs:
   ```python
   n_runs=10  # Instead of 5
   ```

### Script is too slow
**Problem**: 20 minutes is too long

**Solutions**:
1. Use Quick mode (ensemble only)
2. Reduce starts per run:
   ```python
   n_starts=30  # Instead of 50
   ```
3. Reduce ensemble runs:
   ```python
   n_runs=3  # Instead of 5
   ```

### Results differ from original script
**This is expected!** The robust version:
- Explores parameter space more thoroughly
- Tests multiple optimization strategies
- May find better solutions (lower cost)

**Check**: Compare costs. Lower cost = better fit.

---

## FAQ

**Q: Do I always need to use the robust version?**

A: Not always. Use robust version when:
- Results will be published
- Making critical decisions
- Parameters seem unstable
- You want confidence in results

Use standard version when:
- Quick exploration
- Testing models
- Computational resources limited

**Q: What if ensemble and methods give different parameters?**

A: Small differences (CV < 0.1) are normal and OK. Large differences suggest:
- Flat parameter landscape (multiple good solutions)
- Poor identifiability
- Need for more data

Choose the solution with lowest cost.

**Q: How many initial starts is enough?**

A:
- Quick testing: 20-30
- Standard: 50 (default) ✓
- Publication: 100+
- **But**: Ensemble + methods beats just more starts!

**Q: Should I use Differential Evolution?**

A: Only if:
- Ensemble shows poor consistency
- Local methods struggle
- You have time (~30+ min)
- Critical application

For most cases, ensemble + methods is sufficient.

---

## Performance Tips

### Faster Execution
1. Use Quick mode (ensemble only)
2. Reduce n_starts (30 instead of 50)
3. Reduce ensemble runs (3 instead of 5)

### Better Reliability
1. Use Standard or Maximum mode
2. Increase n_starts (100+)
3. Increase ensemble runs (10)
4. Enable Differential Evolution

### Balanced (Recommended)
- Standard mode (default settings)
- ~15 minutes runtime
- Excellent reliability for most cases

---

## Summary

**Key Takeaways:**
1. ✓ **Ensemble method** checks if results are consistent
2. ✓ **Multiple methods** often finds better solutions
3. ✓ **CV < 0.1** means excellent, reliable results
4. ✓ **Standard mode** (15 min) recommended for most users
5. ✓ **Robustness > more initial guesses** for better reliability

**Bottom Line**: The robust version gives you **confidence** in your parameter estimates through automatic consistency checking and method comparison.
