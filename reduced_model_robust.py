"""
Robust version of reduced model with enhanced parameter estimation
Includes multiple strategies for improved robustness
"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares, differential_evolution
import matplotlib.pyplot as plt
from copy import deepcopy

# [Include all the data_matrix, labels, ODE functions from reduced_model_full_data.py]
# For brevity, I'm showing just the new robustness features

# ------------------------------
# Enhanced Robustness Features
# ------------------------------

def fit_with_multiple_methods(t_eval, data_matrix, n_starts_per_method=20):
    """
    Try multiple optimization methods and compare results

    Returns the best result across all methods
    """
    print("\n" + "="*70)
    print("ROBUST FITTING: Multiple Methods")
    print("="*70)

    methods_to_try = [
        ('trf', 'linear'),
        ('trf', 'soft_l1'),
        ('dogbox', 'linear'),
        ('dogbox', 'soft_l1'),
    ]

    all_results = []

    for method, loss in methods_to_try:
        print(f"\nTrying method={method}, loss={loss}...")

        rng = np.random.default_rng(42)
        lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6])
        upper = np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 5.0])

        lhs_low  = np.array([0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0, 0.01, 0.05])
        lhs_high = np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 2.0, 0.5, 1.0])

        # Generate starts
        starts = latin_hypercube(n_starts_per_method, len(lower), lhs_low, lhs_high, rng)

        best_for_method = None
        for x0 in starts:
            res = least_squares(
                objective, x0,
                args=(t_eval, data_matrix, None),
                bounds=(lower, upper),
                method=method,
                loss=loss,
                f_scale=0.1,
                xtol=1e-10, ftol=1e-10, gtol=1e-10,
                max_nfev=5000,
                verbose=0
            )

            if (best_for_method is None) or (res.cost < best_for_method.cost):
                best_for_method = res

        print(f"  Best cost for {method}/{loss}: {best_for_method.cost:.6f}")
        all_results.append((best_for_method, method, loss))

    # Find overall best
    all_results.sort(key=lambda x: x[0].cost)
    best_result, best_method, best_loss = all_results[0]

    print(f"\n{'='*70}")
    print(f"BEST METHOD: {best_method} with {best_loss} loss")
    print(f"Best cost: {best_result.cost:.6f}")
    print(f"{'='*70}")

    return best_result, all_results


def fit_with_ensemble(t_eval, data_matrix, n_runs=5, n_starts=30):
    """
    Run fitting multiple times with different random seeds
    Check for consistency across runs
    """
    print("\n" + "="*70)
    print(f"ROBUST FITTING: Ensemble ({n_runs} independent runs)")
    print("="*70)

    all_params = []
    all_costs = []

    for run_idx in range(n_runs):
        print(f"\nRun {run_idx + 1}/{n_runs} (seed={run_idx})...")
        result = fit_reduced_model(t_eval, data_matrix, n_starts=n_starts, seed=run_idx)

        all_params.append(result.x)
        all_costs.append(result.cost)
        print(f"  Cost: {result.cost:.6f}")

    all_params = np.array(all_params)
    all_costs = np.array(all_costs)

    # Compute statistics
    mean_params = np.mean(all_params, axis=0)
    std_params = np.std(all_params, axis=0)
    cv_params = std_params / (np.abs(mean_params) + 1e-10)

    print(f"\n{'='*70}")
    print("ENSEMBLE STATISTICS")
    print(f"{'='*70}")
    print(f"\nCost statistics:")
    print(f"  Mean cost: {np.mean(all_costs):.6f}")
    print(f"  Std cost:  {np.std(all_costs):.6f}")
    print(f"  Min cost:  {np.min(all_costs):.6f}")
    print(f"  Max cost:  {np.max(all_costs):.6f}")

    param_names = ['p1', 'qI', 'q0', 'qP_5nM', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']

    print(f"\nParameter consistency (CV = coefficient of variation):")
    for i, name in enumerate(param_names):
        status = "✓ Good" if cv_params[i] < 0.1 else "⚠ Fair" if cv_params[i] < 0.3 else "✗ Poor"
        print(f"  {status:10s} {name:10s}: mean={mean_params[i]:8.4f}, std={std_params[i]:8.4f}, CV={cv_params[i]:.3f}")

    # Return parameters from best run
    best_idx = np.argmin(all_costs)
    print(f"\nUsing parameters from run {best_idx + 1} (lowest cost)")

    return all_params[best_idx], mean_params, std_params


def fit_with_differential_evolution(t_eval, data_matrix):
    """
    Use differential evolution (global optimizer) as alternative
    This is slower but more robust for difficult landscapes
    """
    print("\n" + "="*70)
    print("ROBUST FITTING: Differential Evolution")
    print("="*70)

    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6])
    upper = np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 5.0])
    bounds = list(zip(lower, upper))

    def cost_function(params):
        residuals = objective(params, t_eval, data_matrix, None)
        return np.sum(residuals**2)

    print("Running differential evolution (this may take several minutes)...")
    result = differential_evolution(
        cost_function,
        bounds,
        strategy='best1bin',
        maxiter=1000,
        popsize=15,
        tol=1e-7,
        mutation=(0.5, 1),
        recombination=0.7,
        seed=42,
        disp=True,
        polish=True,  # Local polish at the end
        workers=1
    )

    print(f"\nDifferential Evolution Results:")
    print(f"  Success: {result.success}")
    print(f"  Cost: {result.fun:.6f}")
    print(f"  Iterations: {result.nit}")

    return result


def fit_with_bootstrap(t_eval, data_matrix, n_bootstrap=50, n_starts=20):
    """
    Bootstrap resampling to estimate parameter uncertainty

    WARNING: This is computationally expensive!
    """
    print("\n" + "="*70)
    print(f"BOOTSTRAP UNCERTAINTY ESTIMATION ({n_bootstrap} samples)")
    print("="*70)
    print("This will take a while...")

    n_timepoints = data_matrix.shape[0]
    bootstrap_params = []

    for i in range(n_bootstrap):
        if (i + 1) % 10 == 0:
            print(f"\nBootstrap sample {i+1}/{n_bootstrap}...")

        # Resample timepoints with replacement
        indices = np.random.choice(n_timepoints, size=n_timepoints, replace=True)
        data_boot = data_matrix[indices, :]
        t_boot = t_eval[indices]

        # Sort by time (important!)
        sort_idx = np.argsort(t_boot)
        t_boot = t_boot[sort_idx]
        data_boot = data_boot[sort_idx, :]

        # Fit
        result = fit_reduced_model(t_boot, data_boot, n_starts=n_starts, seed=i)
        bootstrap_params.append(result.x)

    bootstrap_params = np.array(bootstrap_params)

    mean_params = np.mean(bootstrap_params, axis=0)
    std_params = np.std(bootstrap_params, axis=0)

    param_names = ['p1', 'qI', 'q0', 'qP_5nM', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']

    print(f"\n{'='*70}")
    print("BOOTSTRAP RESULTS")
    print(f"{'='*70}")
    for i, name in enumerate(param_names):
        ci_low, ci_high = np.percentile(bootstrap_params[:, i], [2.5, 97.5])
        print(f"  {name:10s}: {mean_params[i]:8.4f} ± {std_params[i]:8.4f}  95% CI: [{ci_low:8.4f}, {ci_high:8.4f}]")

    return mean_params, std_params, bootstrap_params


# ------------------------------
# Comprehensive Robust Fitting
# ------------------------------

def comprehensive_robust_fit(t_eval, data_matrix,
                            use_ensemble=True,
                            use_multiple_methods=True,
                            use_differential_evolution=False,  # Slow!
                            use_bootstrap=False):  # Very slow!
    """
    Run comprehensive robust fitting with multiple strategies

    Recommended: use_ensemble=True, use_multiple_methods=True
    """
    results = {}

    # Strategy 1: Standard fitting with many starts
    print("\n" + "="*70)
    print("STRATEGY 1: High-quality standard fit (50 starts)")
    print("="*70)
    result_standard = fit_reduced_model(t_eval, data_matrix, n_starts=50, seed=7)
    results['standard'] = result_standard
    print(f"Cost: {result_standard.cost:.6f}")

    # Strategy 2: Ensemble
    if use_ensemble:
        best_ensemble, mean_ensemble, std_ensemble = fit_with_ensemble(
            t_eval, data_matrix, n_runs=5, n_starts=30
        )
        results['ensemble'] = {
            'best': best_ensemble,
            'mean': mean_ensemble,
            'std': std_ensemble
        }

    # Strategy 3: Multiple methods
    if use_multiple_methods:
        best_multi, all_multi = fit_with_multiple_methods(t_eval, data_matrix, n_starts_per_method=20)
        results['multiple_methods'] = best_multi

    # Strategy 4: Differential evolution
    if use_differential_evolution:
        result_de = fit_with_differential_evolution(t_eval, data_matrix)
        results['diff_evolution'] = result_de

    # Strategy 5: Bootstrap
    if use_bootstrap:
        mean_boot, std_boot, all_boot = fit_with_bootstrap(
            t_eval, data_matrix, n_bootstrap=50, n_starts=20
        )
        results['bootstrap'] = {
            'mean': mean_boot,
            'std': std_boot,
            'samples': all_boot
        }

    # Compare all results
    print("\n" + "="*70)
    print("COMPARISON OF ALL METHODS")
    print("="*70)

    for method_name, result in results.items():
        if method_name == 'ensemble':
            cost_std = least_squares(objective, result['best'],
                                    args=(t_eval, data_matrix, None),
                                    method='trf').cost
            print(f"{method_name:20s}: cost = {cost_std:.6f}")
        elif method_name == 'bootstrap':
            cost_boot = least_squares(objective, result['mean'],
                                     args=(t_eval, data_matrix, None),
                                     method='trf').cost
            print(f"{method_name:20s}: cost = {cost_boot:.6f}")
        elif method_name == 'diff_evolution':
            print(f"{method_name:20s}: cost = {result.fun:.6f}")
        else:
            print(f"{method_name:20s}: cost = {result.cost:.6f}")

    return results


# ==============================
# MAIN EXECUTION
# ==============================

if __name__ == "__main__":
    # Import data and functions from reduced_model_full_data.py
    # (You would copy the data_matrix, labels, t_eval, and all ODE functions here)

    print("="*70)
    print("ROBUST REDUCED MODEL PARAMETER ESTIMATION")
    print("="*70)

    # Run comprehensive robust fitting
    results = comprehensive_robust_fit(
        t_eval, data_matrix,
        use_ensemble=True,              # ✓ Recommended
        use_multiple_methods=True,       # ✓ Recommended
        use_differential_evolution=False, # Slow, use if others fail
        use_bootstrap=False              # Very slow, use for final uncertainty
    )

    # Use the best result for final analysis
    best_result = results['multiple_methods']

    print("\n" + "="*70)
    print("RECOMMENDED PARAMETERS (from most robust method)")
    print("="*70)
    param_names = ['p1', 'qI', 'q0', 'qP_5nM', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']
    for name, val in zip(param_names, best_result.x):
        print(f"  {name:10s} = {val:.6g}")

    # Save results
    np.savetxt('reduced_model_robust_parameters.txt', best_result.x)
    print("\nParameters saved to: reduced_model_robust_parameters.txt")
