"""
Robust Reduced Model Parameter Estimation with Full Data
Implements multiple strategies for improved robustness
"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares, differential_evolution
import matplotlib.pyplot as plt
import time

# ------------------------------
# Experimental data (VENUS fold change)
# ------------------------------
data_matrix = np.array([
    [1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.8523048   , 1.087544    , 0.9649733   , 1.166976    , 0.918218    , 0.966466    , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.6827122   , 1.08695     , 0.9568927   , 1.085554    , 0.8876873   , 0.9348458   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.6039012   , 1.103395    , 0.8308875   , 0.987356    , 0.80062     , 0.8261556   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.4960662   , 0.9315695   , 0.809217    , 0.9792683   , 0.81247     , 0.9108808   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.5136364   , 0.9495908   , 0.7883567   , 0.8671327   , 0.7368553   , 0.8057324   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.5333068   , 0.8594795   , 0.777324    , 1.035506    , 0.8065013   , 0.7686848   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.3923052   , 0.9433322   , 0.7269902   , 1.027591    , 0.840719    , 0.7561538   , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.3386606   , 0.9532562   , 0.7498968   , 0.9676473   , 0.7643677   , 0.6663518   , 0.7514892   , 0.873957    , 0.9182737   , 0.8620715   ],
    [0.2934868   , 0.9783455   , 0.793647    , 1.047304    , 0.781112    , 0.6994382   , 0.816073    , 0.8477453   , 0.9288223   , 0.7836655   ],
    [0.3239684   , 1.032918    , 0.793091    , 0.968032    , 0.73581     , 0.6369738   , 0.6846347   , 0.7563447   , 0.6402197   , 0.7919083   ],
    [0.2830352   , 0.9254622   , 0.8144522   , 1.072704    , 0.801594    , 0.6702864   , 0.6529985   , 0.6293247   , 0.8064763   , 0.7053645   ],
    [0.2729652   , 0.9316605   , 0.8510785   , 1.153924    , 0.810091    , 0.6483174   , 0.6470235   , 0.5316817   , 0.753376    , 0.739992    ],
    [0.270844    , 0.8821205   , 0.8415182   , 0.9468663   , 0.8085713   , 0.5959894   , 0.60346     , 0.541956    , 0.7471405   , 0.6485895   ],
    [0.2968902   , 0.8597067   , 0.8177287   , 0.9426123   , 0.6316327   , 0.629189    , 0.5224148   , 0.5168547   , 0.660822    , 0.6483463   ],
    [0.2502296   , 0.8454915   , 0.8045162   , 0.927739    , 0.6316327   , 0.6230858   , 0.5122045   , 0.482083    , 0.7224945   , 0.6616935   ]
], dtype=float)

labels = ['100iaa', '5paa', 'control', '50paa', '500paa', '5upaa',
          '5then100', '50then100', '500then100', '5uthen100']

dt_minutes = 4.0
t_eval = np.arange(data_matrix.shape[0], dtype=float) * dt_minutes
t_switch = 30.0

# ------------------------------
# Reduced ODE Model
# ------------------------------
def reduced_rhs(t, y, p1, qj, lam, p2):
    V = y[0]
    return [p2 * (1.0 - V / (p1 * V + qj) - lam * V)]

def q_const_builder(q_const):
    f = lambda t: q_const
    f.piecewise = False
    return f

def q_sequential_builder(qP, qI, rho, t_switch):
    f = lambda t: (qP if t < t_switch else (qI + rho * qP))
    f.piecewise = True
    return f

def simulate_series(initial_V, p1, lam, p2, q_function, t_eval):
    t0, t1 = t_eval[0], t_eval[-1]
    y0 = [float(initial_V)]
    V_out = np.zeros_like(t_eval, dtype=float)

    if getattr(q_function, "piecewise", False) and (t0 < t_switch) and (t_switch < t1):
        segments = [(t0, t_switch), (t_switch, t1)]
    else:
        segments = [(t0, t1)]

    start_idx = 0
    for (seg_start, seg_end) in segments:
        mask = (t_eval >= seg_start - 1e-12) & (t_eval <= seg_end + 1e-12)
        t_seg = t_eval[mask]
        if len(t_seg) == 0:
            continue

        def rhs(t, y):
            return reduced_rhs(t, y, p1, q_function(t), lam, p2)

        sol = solve_ivp(rhs, (t_seg[0], t_seg[-1]), y0,
                        t_eval=t_seg, rtol=1e-8, atol=1e-10, method="RK45", max_step=2.0)

        if (not sol.success) or (sol.y.shape[1] != len(t_seg)):
            return None

        V_out[start_idx:start_idx+len(t_seg)] = sol.y[0]
        y0 = [sol.y[0, -1]]
        start_idx += len(t_seg)

    return V_out

# ------------------------------
# Residual and Objective Functions
# ------------------------------
def build_residuals(params, t_eval, data_matrix, weights=None):
    p1, qI, q0, qP_5nM, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2 = params

    if weights is None:
        weights = np.ones_like(data_matrix)

    residuals = []

    for j in range(data_matrix.shape[1]):
        series = data_matrix[:, j]
        V0 = series[0]

        if j == 0:
            qfun = q_const_builder(qI)
        elif j == 1:
            qfun = q_const_builder(qP_5nM)
        elif j == 2:
            qfun = q_const_builder(q0)
        elif j == 3:
            qfun = q_const_builder(qP_50nM)
        elif j == 4:
            qfun = q_const_builder(qP_500nM)
        elif j == 5:
            qfun = q_const_builder(qP_5uM)
        elif j == 6:
            qfun = q_sequential_builder(qP_5nM, qI, rho, t_switch)
        elif j == 7:
            qfun = q_sequential_builder(qP_50nM, qI, rho, t_switch)
        elif j == 8:
            qfun = q_sequential_builder(qP_500nM, qI, rho, t_switch)
        elif j == 9:
            qfun = q_sequential_builder(qP_5uM, qI, rho, t_switch)

        sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

        if (sim is None) or np.any(~np.isfinite(sim)):
            residuals.extend(np.full_like(series, 1e3))
        else:
            if j >= 6:
                mask = t_eval >= 32
                residuals.extend(weights[mask, j] * (sim[mask] - series[mask]))
            else:
                residuals.extend(weights[:, j] * (sim - series))

    return np.array(residuals, dtype=float)

def objective(params, t_eval, data_matrix, weights=None):
    params = np.asarray(params, dtype=float)
    if np.any(params < 0):
        return build_residuals(params, t_eval, data_matrix, weights) + 1e2
    return build_residuals(params, t_eval, data_matrix, weights)

# ------------------------------
# Latin Hypercube Sampling
# ------------------------------
def latin_hypercube(n_samples, dim, low, high, rng):
    cut = np.linspace(0, 1, n_samples + 1)
    u = rng.uniform(size=(n_samples, dim))
    a = cut[:n_samples]
    b = cut[1:n_samples + 1]
    pts = u * (b - a)[:, None] + a[:, None]
    for d in range(dim):
        rng.shuffle(pts[:, d])
    return low + pts * (high - low)

# ==============================
# ROBUSTNESS STRATEGIES
# ==============================

def fit_single_run(t_eval, data_matrix, n_starts, seed, method='trf', loss='soft_l1'):
    """Single fitting run with specified method and loss"""
    rng = np.random.default_rng(seed)

    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6], dtype=float)
    upper = np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 5.0], dtype=float)

    lhs_low  = np.array([0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0, 0.01, 0.05], dtype=float)
    lhs_high = np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 2.0, 0.5, 1.0], dtype=float)

    starts = latin_hypercube(n_starts, len(lower), lhs_low, lhs_high, rng)

    best = None
    for i, x0 in enumerate(starts):
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

        if (best is None) or (res.cost < best.cost):
            best = res

    return best


def fit_with_ensemble(t_eval, data_matrix, n_runs=5, n_starts=50):
    """
    STRATEGY 1: Ensemble Method
    Run multiple independent fits with different seeds and check consistency
    """
    print("\n" + "="*70)
    print(f"ROBUSTNESS STRATEGY 1: Ensemble ({n_runs} runs × {n_starts} starts)")
    print("="*70)

    all_params = []
    all_costs = []

    for run_idx in range(n_runs):
        print(f"\n  Run {run_idx + 1}/{n_runs} (seed={run_idx})...")
        start_time = time.time()

        result = fit_single_run(t_eval, data_matrix, n_starts, seed=run_idx)

        elapsed = time.time() - start_time
        all_params.append(result.x)
        all_costs.append(result.cost)
        print(f"    Cost: {result.cost:.6f}  (Time: {elapsed:.1f}s)")

    all_params = np.array(all_params)
    all_costs = np.array(all_costs)

    # Statistics
    mean_params = np.mean(all_params, axis=0)
    std_params = np.std(all_params, axis=0)
    cv_params = std_params / (np.abs(mean_params) + 1e-10)

    param_names = ['p1', 'qI', 'q0', 'qP_5nM', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']

    print(f"\n{'='*70}")
    print("ENSEMBLE RESULTS")
    print(f"{'='*70}")
    print(f"\nCost statistics:")
    print(f"  Mean: {np.mean(all_costs):.6f} ± {np.std(all_costs):.6f}")
    print(f"  Range: [{np.min(all_costs):.6f}, {np.max(all_costs):.6f}]")

    print(f"\nParameter consistency (CV = coefficient of variation):")
    print(f"{'Status':<12} {'Parameter':<12} {'Mean':<12} {'Std':<12} {'CV':<8}")
    print("-" * 70)
    for i, name in enumerate(param_names):
        if cv_params[i] < 0.1:
            status = "✓ Excellent"
        elif cv_params[i] < 0.3:
            status = "⚠ Fair"
        else:
            status = "✗ Poor"

        print(f"{status:<12} {name:<12} {mean_params[i]:<12.6f} {std_params[i]:<12.6f} {cv_params[i]:<8.3f}")

    # Check overall consistency
    max_cv = np.max(cv_params)
    if max_cv < 0.1:
        print(f"\n✓ Excellent consistency (max CV = {max_cv:.3f}) - Results are highly reliable!")
    elif max_cv < 0.3:
        print(f"\n⚠ Fair consistency (max CV = {max_cv:.3f}) - Results are reasonably reliable")
    else:
        print(f"\n✗ Poor consistency (max CV = {max_cv:.3f}) - Consider more optimization or different methods")

    best_idx = np.argmin(all_costs)
    return all_params[best_idx], all_params, all_costs


def fit_with_multiple_methods(t_eval, data_matrix, n_starts=30):
    """
    STRATEGY 2: Multiple Methods
    Try different optimization methods and loss functions
    """
    print("\n" + "="*70)
    print(f"ROBUSTNESS STRATEGY 2: Multiple Methods ({n_starts} starts each)")
    print("="*70)

    methods_to_try = [
        ('trf', 'linear'),
        ('trf', 'soft_l1'),
        ('trf', 'huber'),
        ('dogbox', 'linear'),
        ('dogbox', 'soft_l1'),
    ]

    all_results = []

    for method, loss in methods_to_try:
        print(f"\n  Trying method={method}, loss={loss}...")
        start_time = time.time()

        result = fit_single_run(t_eval, data_matrix, n_starts, seed=42, method=method, loss=loss)

        elapsed = time.time() - start_time
        print(f"    Cost: {result.cost:.6f}  (Time: {elapsed:.1f}s)")
        all_results.append((result, method, loss))

    # Sort by cost
    all_results.sort(key=lambda x: x[0].cost)

    print(f"\n{'='*70}")
    print("METHOD COMPARISON (sorted by cost)")
    print(f"{'='*70}")
    print(f"{'Rank':<6} {'Method':<10} {'Loss':<12} {'Cost':<12}")
    print("-" * 70)
    for rank, (result, method, loss) in enumerate(all_results, 1):
        print(f"{rank:<6} {method:<10} {loss:<12} {result.cost:<12.6f}")

    best_result, best_method, best_loss = all_results[0]
    print(f"\n✓ Best: {best_method} with {best_loss} loss (cost = {best_result.cost:.6f})")

    return best_result, all_results


def fit_with_differential_evolution(t_eval, data_matrix, maxiter=500):
    """
    STRATEGY 3: Differential Evolution (Global Optimizer)
    More robust but slower - use if local methods struggle
    """
    print("\n" + "="*70)
    print(f"ROBUSTNESS STRATEGY 3: Differential Evolution")
    print("="*70)
    print("This is a global optimizer - may take several minutes...")

    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6])
    upper = np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 5.0])
    bounds = list(zip(lower, upper))

    def cost_function(params):
        residuals = objective(params, t_eval, data_matrix, None)
        return np.sum(residuals**2)

    start_time = time.time()

    result = differential_evolution(
        cost_function,
        bounds,
        strategy='best1bin',
        maxiter=maxiter,
        popsize=15,
        tol=1e-7,
        mutation=(0.5, 1),
        recombination=0.7,
        seed=42,
        disp=False,
        polish=True,
        workers=1,
        updating='deferred'
    )

    elapsed = time.time() - start_time

    print(f"\n{'='*70}")
    print(f"Success: {result.success}")
    print(f"Cost: {result.fun:.6f}")
    print(f"Iterations: {result.nit}/{maxiter}")
    print(f"Time: {elapsed:.1f}s")
    print(f"{'='*70}")

    # Convert to least_squares result format for consistency
    class DEResult:
        def __init__(self, de_result):
            self.x = de_result.x
            self.cost = de_result.fun / 2  # Approx, since LS uses sum(residuals^2)/2
            self.success = de_result.success
            self.message = de_result.message

    return DEResult(result)


# ==============================
# COMPREHENSIVE ROBUST FITTING
# ==============================

def robust_fit_comprehensive(t_eval, data_matrix,
                             use_ensemble=True,
                             use_multiple_methods=True,
                             use_differential_evolution=False):
    """
    Run comprehensive robust parameter estimation

    Recommended settings:
    - Quick (5-10 min): use_ensemble=True, others=False
    - Standard (10-20 min): use_ensemble=True, use_multiple_methods=True
    - Maximum robustness (30+ min): all=True
    """
    print("\n" + "="*70)
    print("COMPREHENSIVE ROBUST PARAMETER ESTIMATION")
    print("="*70)

    results = {}
    start_total = time.time()

    # Strategy 1: Ensemble (Highly recommended)
    if use_ensemble:
        best_ensemble, all_ensemble_params, all_ensemble_costs = fit_with_ensemble(
            t_eval, data_matrix, n_runs=5, n_starts=50
        )
        results['ensemble'] = {
            'params': best_ensemble,
            'all_params': all_ensemble_params,
            'all_costs': all_ensemble_costs,
            'cost': np.min(all_ensemble_costs)
        }

    # Strategy 2: Multiple Methods (Recommended)
    if use_multiple_methods:
        best_multi, all_multi = fit_with_multiple_methods(t_eval, data_matrix, n_starts=30)
        results['multiple_methods'] = {
            'params': best_multi.x,
            'cost': best_multi.cost,
            'all_results': all_multi
        }

    # Strategy 3: Differential Evolution (Optional - slow but robust)
    if use_differential_evolution:
        result_de = fit_with_differential_evolution(t_eval, data_matrix, maxiter=500)
        results['diff_evolution'] = {
            'params': result_de.x,
            'cost': result_de.cost
        }

    elapsed_total = time.time() - start_total

    # Final comparison
    print("\n" + "="*70)
    print("FINAL COMPARISON OF ALL STRATEGIES")
    print("="*70)

    for strategy_name, result_dict in results.items():
        cost = result_dict['cost']
        print(f"  {strategy_name:25s}: cost = {cost:.6f}")

    # Select best overall
    best_strategy = min(results.items(), key=lambda x: x[1]['cost'])
    best_name = best_strategy[0]
    best_params = best_strategy[1]['params']
    best_cost = best_strategy[1]['cost']

    print(f"\n{'='*70}")
    print(f"RECOMMENDED PARAMETERS (from '{best_name}')")
    print(f"Best cost: {best_cost:.6f}")
    print(f"Total time: {elapsed_total:.1f}s ({elapsed_total/60:.1f} min)")
    print(f"{'='*70}")

    param_names = ['p1', 'qI', 'q0', 'qP_5nM', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']
    print(f"\n{'Parameter':<12} {'Value':<12}")
    print("-" * 30)
    for name, val in zip(param_names, best_params):
        print(f"{name:<12} {val:<12.6g}")

    return best_params, results


# ==============================
# PLOTTING
# ==============================

def plot_results(params, t_eval, data_matrix, labels, save_path='reduced_model_robust_fit.png'):
    """Plot fitted results"""
    p1, qI, q0, qP_5nM, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2 = params

    plt.rcParams.update({
        "font.family": "Arial",
        "font.size": 12,
        "axes.labelsize": 14,
        "axes.titlesize": 14,
        "legend.fontsize": 10,
    })

    fig = plt.figure(figsize=(16, 12))
    colors_constant = plt.cm.tab10(np.linspace(0, 1, 6))
    colors_then = plt.cm.Set2(np.linspace(0, 1, 4))

    for j, name in enumerate(labels):
        series = data_matrix[:, j]
        V0 = series[0]

        if j == 0:
            qfun = q_const_builder(qI)
            color = colors_constant[0]
        elif j == 1:
            qfun = q_const_builder(qP_5nM)
            color = colors_constant[1]
        elif j == 2:
            qfun = q_const_builder(q0)
            color = colors_constant[2]
        elif j == 3:
            qfun = q_const_builder(qP_50nM)
            color = colors_constant[3]
        elif j == 4:
            qfun = q_const_builder(qP_500nM)
            color = colors_constant[4]
        elif j == 5:
            qfun = q_const_builder(qP_5uM)
            color = colors_constant[5]
        elif j == 6:
            qfun = q_sequential_builder(qP_5nM, qI, rho, t_switch)
            color = colors_then[0]
        elif j == 7:
            qfun = q_sequential_builder(qP_50nM, qI, rho, t_switch)
            color = colors_then[1]
        elif j == 8:
            qfun = q_sequential_builder(qP_500nM, qI, rho, t_switch)
            color = colors_then[2]
        elif j == 9:
            qfun = q_sequential_builder(qP_5uM, qI, rho, t_switch)
            color = colors_then[3]

        sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

        ax = plt.subplot(3, 4, j+1)

        if j >= 6:
            mask = t_eval >= 32
            ax.plot(t_eval[mask], series[mask], 'o', markersize=6,
                   color=color, label='Data', alpha=0.7)
            if sim is not None:
                ax.plot(t_eval[mask], sim[mask], '-', linewidth=2.5,
                       color=color, label='Model', alpha=0.9)
            ax.axvline(t_switch, color='gray', linestyle='--', linewidth=1.5, alpha=0.5)
        else:
            ax.plot(t_eval, series, 'o', markersize=6,
                   color=color, label='Data', alpha=0.7)
            if sim is not None:
                ax.plot(t_eval, sim, '-', linewidth=2.5,
                       color=color, label='Model', alpha=0.9)

        ax.set_xlabel("Time (min)", fontsize=12)
        ax.set_ylabel("DII-VENUS (fold change)", fontsize=12)
        ax.set_title(name, fontsize=13, fontweight='bold')
        ax.set_ylim(0, 1.15)
        ax.set_xlim(-2, 62)
        ax.legend(frameon=False, fontsize=9)
        ax.grid(alpha=0.3)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

    fig.delaxes(fig.axes[10])
    fig.delaxes(fig.axes[10])

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"\nPlot saved: {save_path}")
    plt.show()


# ==============================
# MAIN EXECUTION
# ==============================

if __name__ == "__main__":
    print("="*70)
    print("ROBUST REDUCED MODEL PARAMETER ESTIMATION - FULL DATA")
    print("="*70)

    # Choose robustness level:
    # Option 1: Quick (5-10 min) - Good for testing
    # best_params, results = robust_fit_comprehensive(
    #     t_eval, data_matrix,
    #     use_ensemble=True,
    #     use_multiple_methods=False,
    #     use_differential_evolution=False
    # )

    # Option 2: Standard (10-20 min) - Recommended for most cases
    best_params, results = robust_fit_comprehensive(
        t_eval, data_matrix,
        use_ensemble=True,
        use_multiple_methods=True,
        use_differential_evolution=False
    )

    # Option 3: Maximum robustness (30+ min) - For publication/critical work
    # best_params, results = robust_fit_comprehensive(
    #     t_eval, data_matrix,
    #     use_ensemble=True,
    #     use_multiple_methods=True,
    #     use_differential_evolution=True
    # )

    # Save results
    np.savetxt('reduced_model_robust_parameters.txt', best_params,
               header='Robust parameters: p1, qI, q0, qP_5nM, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2')
    print("\nParameters saved to: reduced_model_robust_parameters.txt")

    # Plot results
    plot_results(best_params, t_eval, data_matrix, labels)

    print("\n" + "="*70)
    print("ANALYSIS COMPLETE!")
    print("="*70)
