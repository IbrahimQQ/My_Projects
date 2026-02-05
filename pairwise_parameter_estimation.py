"""
Pairwise Parameter Estimation for Reduced Model

For each PAA concentration, estimate parameters using:
- Control data
- 100nM IAA data
- PAA alone data (at that concentration)
- PAA→IAA sequential data (at that concentration)

Then compare to global fit using all data.

Includes histogram visualization to demonstrate parameter identifiability
(showing the model is not sloppy).
"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares
import matplotlib.pyplot as plt
import pandas as pd

# ------------------------------
# Experimental data (VENUS fold change)
# ------------------------------
# Columns: 100iaa, control, 50paa, 500paa, 5upaa, 50then100, 500then100, 5uthen100
data_matrix = np.array([
    [1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         , 1.0         ],
    [0.8523048   , 0.9649733   , 1.166976    , 0.918218    , 0.966466    , 1.0         , 1.0         , 1.0         ],
    [0.6827122   , 0.9568927   , 1.085554    , 0.8876873   , 0.9348458   , 1.0         , 1.0         , 1.0         ],
    [0.6039012   , 0.8308875   , 0.987356    , 0.80062     , 0.8261556   , 1.0         , 1.0         , 1.0         ],
    [0.4960662   , 0.809217    , 0.9792683   , 0.81247     , 0.9108808   , 1.0         , 1.0         , 1.0         ],
    [0.5136364   , 0.7883567   , 0.8671327   , 0.7368553   , 0.8057324   , 1.0         , 1.0         , 1.0         ],
    [0.5333068   , 0.777324    , 1.035506    , 0.8065013   , 0.7686848   , 1.0         , 1.0         , 1.0         ],
    [0.3923052   , 0.7269902   , 1.027591    , 0.840719    , 0.7561538   , 1.0         , 1.0         , 1.0         ],
    [0.3386606   , 0.7498968   , 0.9676473   , 0.7643677   , 0.6663518   , 0.873957    , 0.9182737   , 0.8620715   ],
    [0.2934868   , 0.793647    , 1.047304    , 0.781112    , 0.6994382   , 0.8477453   , 0.9288223   , 0.7836655   ],
    [0.3239684   , 0.793091    , 0.968032    , 0.73581     , 0.6369738   , 0.7563447   , 0.6402197   , 0.7919083   ],
    [0.2830352   , 0.8144522   , 1.072704    , 0.801594    , 0.6702864   , 0.6293247   , 0.8064763   , 0.7053645   ],
    [0.2729652   , 0.8510785   , 1.153924    , 0.810091    , 0.6483174   , 0.5316817   , 0.753376    , 0.739992    ],
    [0.270844    , 0.8415182   , 0.9468663   , 0.8085713   , 0.5959894   , 0.541956    , 0.7471405   , 0.6485895   ],
    [0.2968902   , 0.8177287   , 0.9426123   , 0.6316327   , 0.629189    , 0.5168547   , 0.660822    , 0.6483463   ],
    [0.2502296   , 0.8045162   , 0.927739    , 0.6316327   , 0.6230858   , 0.482083    , 0.7224945   , 0.6616935   ]
], dtype=float)

labels = ['100iaa', 'control', '50paa', '500paa', '5upaa',
          '50then100', '500then100', '5uthen100']

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

# ------------------------------
# Pairwise Fitting Function
# ------------------------------
def fit_paa_pair(data_subset, labels_subset, paa_conc_name, n_starts=50, seed=7,
                 collect_all=True, cost_threshold_factor=2.0):
    """
    Fit reduced model to a single PAA concentration pair

    Parameters estimated: [p1, qI, q0, qP, rho, lam, p2]

    data_subset: Should contain 4 columns: [100iaa, control, PAA_alone, PAA_then_IAA]

    collect_all: If True, collect all converged parameter sets for histogram analysis
    cost_threshold_factor: Keep fits within this factor of the best cost
    """
    print("\n" + "="*70)
    print(f"FITTING {paa_conc_name} PAA PAIR")
    print("="*70)
    print(f"Treatments: {labels_subset}")

    rng = np.random.default_rng(seed)

    # 7 parameters: p1, qI, q0, qP, rho, lam, p2
    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6], dtype=float)
    upper = np.array([50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 20.0], dtype=float)

    lhs_low  = np.array([0.01, 0.01, 0.01, 0.01, 0.0, 0.01, 0.05], dtype=float)
    lhs_high = np.array([5.0, 5.0, 5.0, 5.0, 2.0, 0.5, 2.0], dtype=float)

    starts = latin_hypercube(n_starts, len(lower), lhs_low, lhs_high, rng)

    def build_residuals_pair(params):
        p1, qI, q0, qP, rho, lam, p2 = params
        residuals = []

        for j in range(data_subset.shape[1]):
            series = data_subset[:, j]
            V0 = series[0]

            # Map treatments: [100iaa, control, PAA_alone, PAA_then_IAA]
            if j == 0:  # 100iaa
                qfun = q_const_builder(qI)
                is_sequential = False
            elif j == 1:  # control
                qfun = q_const_builder(q0)
                is_sequential = False
            elif j == 2:  # PAA alone
                qfun = q_const_builder(qP)
                is_sequential = False
            elif j == 3:  # PAA then IAA
                qfun = q_sequential_builder(qP, qI, rho, t_switch)
                is_sequential = True

            sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

            if (sim is None) or np.any(~np.isfinite(sim)):
                residuals.extend(np.full_like(series, 1e3))
            else:
                if is_sequential:
                    mask = t_eval >= 32
                    residuals.extend(sim[mask] - series[mask])
                else:
                    residuals.extend(sim - series)

        return np.array(residuals, dtype=float)

    best = None
    all_results = []  # Store all converged results for histogram

    for i, x0 in enumerate(starts):
        if (i + 1) % 10 == 0:
            print(f"  Attempt {i+1}/{n_starts}...")

        res = least_squares(
            build_residuals_pair, x0,
            bounds=(lower, upper),
            method="trf",
            loss="soft_l1",
            f_scale=0.1,
            xtol=1e-10, ftol=1e-10, gtol=1e-10,
            max_nfev=5000,
            verbose=0
        )

        # Store converged result
        if res.success or res.cost < 1e6:
            all_results.append({'params': res.x.copy(), 'cost': res.cost})

        if (best is None) or (res.cost < best.cost):
            best = res
            print(f"    → New best cost: {best.cost:.6f}")

    # Filter results to keep only those within threshold of best
    if collect_all and all_results:
        best_cost = best.cost
        threshold = best_cost * cost_threshold_factor
        good_results = [r for r in all_results if r['cost'] <= threshold]
        all_params = np.array([r['params'] for r in good_results])
        all_costs = np.array([r['cost'] for r in good_results])
        print(f"  Collected {len(good_results)}/{len(all_results)} fits within {cost_threshold_factor}x best cost")
    else:
        all_params = None
        all_costs = None

    # Attach collected parameters to result object
    best.all_params = all_params
    best.all_costs = all_costs

    return best

# ------------------------------
# Global Fitting Function
# ------------------------------
def fit_all_data(data_matrix, n_starts=50, seed=7, collect_all=True, cost_threshold_factor=2.0):
    """
    Fit reduced model to all 8 treatments

    Parameters estimated: [p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2]

    collect_all: If True, collect all converged parameter sets for histogram analysis
    cost_threshold_factor: Keep fits within this factor of the best cost
    """
    print("\n" + "="*70)
    print("FITTING ALL DATA (GLOBAL FIT)")
    print("="*70)

    rng = np.random.default_rng(seed)

    # 9 parameters
    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6], dtype=float)
    upper = np.array([500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 500.0, 200.0, 200.0], dtype=float)

    lhs_low  = np.array([0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0, 0.01, 0.05], dtype=float)
    lhs_high = np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 2.0, 0.5, 2.0], dtype=float)

    starts = latin_hypercube(n_starts, len(lower), lhs_low, lhs_high, rng)

    def build_residuals_global(params):
        p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2 = params
        residuals = []

        for j in range(data_matrix.shape[1]):
            series = data_matrix[:, j]
            V0 = series[0]

            if j == 0:  # 100iaa
                qfun = q_const_builder(qI)
                is_sequential = False
            elif j == 1:  # control
                qfun = q_const_builder(q0)
                is_sequential = False
            elif j == 2:  # 50paa
                qfun = q_const_builder(qP_50nM)
                is_sequential = False
            elif j == 3:  # 500paa
                qfun = q_const_builder(qP_500nM)
                is_sequential = False
            elif j == 4:  # 5upaa
                qfun = q_const_builder(qP_5uM)
                is_sequential = False
            elif j == 5:  # 50then100
                qfun = q_sequential_builder(qP_50nM, qI, rho, t_switch)
                is_sequential = True
            elif j == 6:  # 500then100
                qfun = q_sequential_builder(qP_500nM, qI, rho, t_switch)
                is_sequential = True
            elif j == 7:  # 5uthen100
                qfun = q_sequential_builder(qP_5uM, qI, rho, t_switch)
                is_sequential = True

            sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

            if (sim is None) or np.any(~np.isfinite(sim)):
                residuals.extend(np.full_like(series, 1e3))
            else:
                if is_sequential:
                    mask = t_eval >= 32
                    residuals.extend(sim[mask] - series[mask])
                else:
                    residuals.extend(sim - series)

        return np.array(residuals, dtype=float)

    best = None
    all_results = []  # Store all converged results for histogram

    for i, x0 in enumerate(starts):
        if (i + 1) % 10 == 0:
            print(f"  Attempt {i+1}/{n_starts}...")

        res = least_squares(
            build_residuals_global, x0,
            bounds=(lower, upper),
            method="trf",
            loss="soft_l1",
            f_scale=0.1,
            xtol=1e-10, ftol=1e-10, gtol=1e-10,
            max_nfev=5000,
            verbose=0
        )

        # Store converged result
        if res.success or res.cost < 1e6:
            all_results.append({'params': res.x.copy(), 'cost': res.cost})

        if (best is None) or (res.cost < best.cost):
            best = res
            print(f"    → New best cost: {best.cost:.6f}")

    # Filter results to keep only those within threshold of best
    if collect_all and all_results:
        best_cost = best.cost
        threshold = best_cost * cost_threshold_factor
        good_results = [r for r in all_results if r['cost'] <= threshold]
        all_params = np.array([r['params'] for r in good_results])
        all_costs = np.array([r['cost'] for r in good_results])
        print(f"  Collected {len(good_results)}/{len(all_results)} fits within {cost_threshold_factor}x best cost")
    else:
        all_params = None
        all_costs = None

    # Attach collected parameters to result object
    best.all_params = all_params
    best.all_costs = all_costs

    return best

# ------------------------------
# Histogram Visualization for Sloppiness Analysis
# ------------------------------
def plot_parameter_histograms(result, param_names, title, filename, best_params=None):
    """
    Plot histograms of parameter distributions from multiple optimization runs.

    Tight, peaked distributions indicate the model is NOT sloppy (well-constrained).
    Wide, flat distributions would indicate sloppiness (poor identifiability).

    Parameters:
    -----------
    result : optimization result with .all_params attribute
    param_names : list of parameter names
    title : plot title
    filename : output filename
    best_params : optional best-fit parameters to mark on histograms
    """
    if result.all_params is None or len(result.all_params) < 3:
        print(f"  Warning: Not enough converged fits for histogram ({title})")
        return None

    all_params = result.all_params
    n_params = len(param_names)
    n_fits = len(all_params)

    # Calculate grid dimensions
    n_cols = 3
    n_rows = int(np.ceil(n_params / n_cols))

    fig, axes = plt.subplots(n_rows, n_cols, figsize=(4*n_cols, 3.5*n_rows))
    axes = axes.flatten() if n_params > 1 else [axes]

    fig.suptitle(f'{title}\n(n={n_fits} converged fits)', fontsize=14, fontweight='bold')

    # Statistics for each parameter
    stats = {}

    for i, (ax, pname) in enumerate(zip(axes[:n_params], param_names)):
        param_values = all_params[:, i]

        # Calculate statistics
        mean_val = np.mean(param_values)
        std_val = np.std(param_values)
        cv = std_val / mean_val if mean_val > 0 else np.inf

        stats[pname] = {'mean': mean_val, 'std': std_val, 'cv': cv}

        # Plot histogram
        n_bins = min(20, max(5, n_fits // 3))
        counts, bins, patches = ax.hist(param_values, bins=n_bins,
                                         color='steelblue', alpha=0.7,
                                         edgecolor='black', linewidth=0.5)

        # Mark best-fit value
        if best_params is not None:
            ax.axvline(best_params[i], color='red', linestyle='--', linewidth=2,
                      label=f'Best: {best_params[i]:.4g}')

        # Mark mean
        ax.axvline(mean_val, color='orange', linestyle='-', linewidth=2,
                  label=f'Mean: {mean_val:.4g}')

        # Add shaded region for ±1 std
        ax.axvspan(mean_val - std_val, mean_val + std_val,
                  alpha=0.2, color='orange', label=f'±1 SD')

        # Title with CV (coefficient of variation)
        cv_status = "TIGHT" if cv < 0.1 else ("OK" if cv < 0.3 else "WIDE")
        ax.set_title(f'{pname}\nCV={cv:.3f} [{cv_status}]', fontsize=11, fontweight='bold')
        ax.set_xlabel('Parameter Value', fontsize=9)
        ax.set_ylabel('Count', fontsize=9)
        ax.legend(fontsize=8, loc='upper right')
        ax.grid(alpha=0.3)

    # Hide unused axes
    for ax in axes[n_params:]:
        ax.set_visible(False)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    print(f"  Histogram saved to: {filename}")

    return stats


def plot_sloppiness_summary(all_stats, filename='sloppiness_summary.png'):
    """
    Create a summary plot showing coefficient of variation for all parameters
    across different fits. Low CV indicates the model is NOT sloppy.
    """
    fig, ax = plt.subplots(figsize=(12, 6))

    # Organize data
    fit_names = list(all_stats.keys())
    all_param_names = set()
    for stats in all_stats.values():
        all_param_names.update(stats.keys())
    param_names = sorted(all_param_names)

    x = np.arange(len(param_names))
    width = 0.2
    offsets = np.linspace(-width*(len(fit_names)-1)/2, width*(len(fit_names)-1)/2, len(fit_names))

    colors = plt.cm.Set2(np.linspace(0, 1, len(fit_names)))

    for idx, (fit_name, stats) in enumerate(all_stats.items()):
        cvs = [stats.get(p, {}).get('cv', np.nan) for p in param_names]
        bars = ax.bar(x + offsets[idx], cvs, width, label=fit_name, color=colors[idx],
                     edgecolor='black', linewidth=0.5)

    # Add threshold lines
    ax.axhline(0.1, color='green', linestyle='--', linewidth=2, alpha=0.7, label='CV=0.1 (Excellent)')
    ax.axhline(0.3, color='orange', linestyle='--', linewidth=2, alpha=0.7, label='CV=0.3 (Acceptable)')
    ax.axhline(0.5, color='red', linestyle='--', linewidth=2, alpha=0.7, label='CV=0.5 (Poor)')

    ax.set_xlabel('Parameter', fontsize=12, fontweight='bold')
    ax.set_ylabel('Coefficient of Variation (CV)', fontsize=12, fontweight='bold')
    ax.set_title('Parameter Identifiability Analysis\n(Lower CV = Better Constrained = NOT Sloppy)',
                fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(param_names, rotation=45, ha='right', fontsize=10)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(axis='y', alpha=0.3)
    ax.set_ylim(0, min(1.0, ax.get_ylim()[1] * 1.1))

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    print(f"Sloppiness summary saved to: {filename}")


def print_sloppiness_assessment(all_stats):
    """Print a detailed assessment of model sloppiness based on parameter CVs."""
    print("\n" + "="*70)
    print("MODEL SLOPPINESS ASSESSMENT")
    print("="*70)
    print("\nCoefficient of Variation (CV) Interpretation:")
    print("  CV < 0.1  : EXCELLENT - Parameter is tightly constrained")
    print("  CV < 0.3  : GOOD - Parameter is reasonably constrained")
    print("  CV < 0.5  : MODERATE - Some uncertainty in parameter")
    print("  CV >= 0.5 : POOR - Parameter may be poorly identifiable (sloppy)")

    for fit_name, stats in all_stats.items():
        print(f"\n{fit_name}:")
        print("-" * 50)

        tight_params = []
        good_params = []
        moderate_params = []
        sloppy_params = []

        for pname, pstats in stats.items():
            cv = pstats['cv']
            if cv < 0.1:
                tight_params.append((pname, cv))
            elif cv < 0.3:
                good_params.append((pname, cv))
            elif cv < 0.5:
                moderate_params.append((pname, cv))
            else:
                sloppy_params.append((pname, cv))

        if tight_params:
            print(f"  EXCELLENT (CV<0.1): {', '.join([f'{p}({cv:.3f})' for p,cv in tight_params])}")
        if good_params:
            print(f"  GOOD (CV<0.3):      {', '.join([f'{p}({cv:.3f})' for p,cv in good_params])}")
        if moderate_params:
            print(f"  MODERATE (CV<0.5):  {', '.join([f'{p}({cv:.3f})' for p,cv in moderate_params])}")
        if sloppy_params:
            print(f"  POOR (CV>=0.5):     {', '.join([f'{p}({cv:.3f})' for p,cv in sloppy_params])}")

        # Overall assessment
        all_cvs = [s['cv'] for s in stats.values()]
        mean_cv = np.mean(all_cvs)
        max_cv = np.max(all_cvs)

        if max_cv < 0.3:
            assessment = "NOT SLOPPY - All parameters well constrained"
        elif max_cv < 0.5 and mean_cv < 0.3:
            assessment = "MOSTLY NOT SLOPPY - Most parameters constrained"
        elif len(sloppy_params) <= 1:
            assessment = "MINOR SLOPPINESS - One parameter poorly constrained"
        else:
            assessment = "SLOPPY - Multiple parameters poorly constrained"

        print(f"\n  Overall: {assessment}")
        print(f"  Mean CV: {mean_cv:.3f}, Max CV: {max_cv:.3f}")


# ------------------------------
# Main Analysis
# ------------------------------
if __name__ == "__main__":
    print("="*70)
    print("PAIRWISE PAA CONCENTRATION ANALYSIS")
    print("="*70)
    print("\nThis analysis estimates parameters separately for each PAA")
    print("concentration pair, then compares to the global fit.")
    print("\nEach pair includes: 100iaa, control, PAA_alone, PAA→IAA")

    # Extract data subsets
    # Columns in data_matrix: 100iaa, control, 50paa, 500paa, 5upaa, 50then100, 500then100, 5uthen100
    #                         0       1        2      3       4      5          6           7

    # 50nM subset: 100iaa, control, 50paa, 50then100
    data_50nM = data_matrix[:, [0, 1, 2, 5]]
    labels_50nM = ['100iaa', 'control', '50paa', '50then100']

    # 500nM subset: 100iaa, control, 500paa, 500then100
    data_500nM = data_matrix[:, [0, 1, 3, 6]]
    labels_500nM = ['100iaa', 'control', '500paa', '500then100']

    # 5µM subset: 100iaa, control, 5upaa, 5uthen100
    data_5uM = data_matrix[:, [0, 1, 4, 7]]
    labels_5uM = ['100iaa', 'control', '5upaa', '5uthen100']

    # Fit each pair (with parameter collection for histograms)
    result_50nM = fit_paa_pair(data_50nM, labels_50nM, "50nM", n_starts=50, seed=7)
    result_500nM = fit_paa_pair(data_500nM, labels_500nM, "500nM", n_starts=50, seed=8)
    result_5uM = fit_paa_pair(data_5uM, labels_5uM, "5µM", n_starts=50, seed=9)

    # Fit all data together
    result_global = fit_all_data(data_matrix, n_starts=50, seed=7)

    # Extract parameters
    p1_50, qI_50, q0_50, qP_50, rho_50, lam_50, p2_50 = result_50nM.x
    p1_500, qI_500, q0_500, qP_500, rho_500, lam_500, p2_500 = result_500nM.x
    p1_5u, qI_5u, q0_5u, qP_5u, rho_5u, lam_5u, p2_5u = result_5uM.x
    p1_g, qI_g, q0_g, qP_50_g, qP_500_g, qP_5u_g, rho_g, lam_g, p2_g = result_global.x

    # Create comparison table
    print("\n" + "="*70)
    print("PARAMETER COMPARISON")
    print("="*70)

    # Create pandas DataFrame for nice formatting
    comparison_data = {
        'Parameter': ['p1', 'qI', 'q0', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2', 'Cost'],
        '50nM Pair': [p1_50, qI_50, q0_50, qP_50, '-', '-', rho_50, lam_50, p2_50, result_50nM.cost],
        '500nM Pair': [p1_500, qI_500, q0_500, '-', qP_500, '-', rho_500, lam_500, p2_500, result_500nM.cost],
        '5µM Pair': [p1_5u, qI_5u, q0_5u, '-', '-', qP_5u, rho_5u, lam_5u, p2_5u, result_5uM.cost],
        'Global Fit': [p1_g, qI_g, q0_g, qP_50_g, qP_500_g, qP_5u_g, rho_g, lam_g, p2_g, result_global.cost]
    }

    df = pd.DataFrame(comparison_data)
    print(df.to_string(index=False))

    # Detailed rho analysis
    print("\n" + "="*70)
    print("RHO (INTERACTION FACTOR) ANALYSIS")
    print("="*70)
    print(f"rho from 50nM pair:   {rho_50:.6f}")
    print(f"rho from 500nM pair:  {rho_500:.6f}")
    print(f"rho from 5µM pair:    {rho_5u:.6f}")
    print(f"rho from global fit:  {rho_g:.6f}")
    print(f"\nMean rho (pairwise):  {np.mean([rho_50, rho_500, rho_5u]):.6f}")
    print(f"Std rho (pairwise):   {np.std([rho_50, rho_500, rho_5u]):.6f}")
    print(f"CV rho (pairwise):    {np.std([rho_50, rho_500, rho_5u]) / np.mean([rho_50, rho_500, rho_5u]):.4f}")

    # Check if rho is concentration-dependent
    rho_values = [rho_50, rho_500, rho_5u]
    rho_concs = [50, 500, 5000]  # in nM

    if max(rho_values) - min(rho_values) > 0.5:
        print("\n  WARNING: rho varies substantially across PAA concentrations!")
        print("   This suggests the interaction may be concentration-dependent.")
    elif np.std(rho_values) / np.mean(rho_values) < 0.2:
        print("\n  GOOD: rho is relatively consistent across PAA concentrations")
        print("   The single rho assumption appears valid.")
    else:
        print("\n  MODERATE: rho shows some variation across PAA concentrations")

    # qI and q0 consistency
    print("\n" + "="*70)
    print("SHARED PARAMETER CONSISTENCY (qI and q0)")
    print("="*70)
    print(f"qI (IAA):      50nM={qI_50:.6g}, 500nM={qI_500:.6g}, 5µM={qI_5u:.6g}, Global={qI_g:.6g}")
    print(f"q0 (Control):  50nM={q0_50:.6g}, 500nM={q0_500:.6g}, 5µM={q0_5u:.6g}, Global={q0_g:.6g}")

    qI_cv = np.std([qI_50, qI_500, qI_5u]) / np.mean([qI_50, qI_500, qI_5u])
    q0_cv = np.std([q0_50, q0_500, q0_5u]) / np.mean([q0_50, q0_500, q0_5u])

    print(f"\nCV for qI:  {qI_cv:.4f}")
    print(f"CV for q0:  {q0_cv:.4f}")

    if qI_cv > 0.3 or q0_cv > 0.3:
        print("\n  WARNING: High variability in qI or q0 across pairs")
        print("   This suggests potential overfitting or identifiability issues.")

    # Save results
    print("\n" + "="*70)
    print("SAVING RESULTS")
    print("="*70)

    df.to_csv('pairwise_parameter_comparison.csv', index=False)
    print("Parameter comparison saved to: pairwise_parameter_comparison.csv")

    # Save individual fits
    np.savetxt('params_50nM_pair.txt', result_50nM.x,
               header='50nM pair: p1, qI, q0, qP_50nM, rho, lam, p2')
    np.savetxt('params_500nM_pair.txt', result_500nM.x,
               header='500nM pair: p1, qI, q0, qP_500nM, rho, lam, p2')
    np.savetxt('params_5uM_pair.txt', result_5uM.x,
               header='5µM pair: p1, qI, q0, qP_5uM, rho, lam, p2')
    np.savetxt('params_global.txt', result_global.x,
               header='Global: p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2')

    print("Individual parameter files saved.")

    # ------------------------------
    # Parameter Distribution Histograms (Sloppiness Analysis)
    # ------------------------------
    print("\n" + "="*70)
    print("GENERATING PARAMETER DISTRIBUTION HISTOGRAMS")
    print("="*70)
    print("\nThese histograms show parameter distributions from multiple optimization")
    print("runs. TIGHT distributions indicate the model is NOT sloppy.")

    pair_param_names = ['p1', 'qI', 'q0', 'qP', 'rho', 'lam', 'p2']
    global_param_names = ['p1', 'qI', 'q0', 'qP_50nM', 'qP_500nM', 'qP_5uM', 'rho', 'lam', 'p2']

    # Generate histograms for each fit
    all_stats = {}

    print("\n50nM Pair:")
    stats_50nM = plot_parameter_histograms(
        result_50nM, pair_param_names,
        '50nM Pair - Parameter Distributions',
        'histogram_50nM_pair.png',
        best_params=result_50nM.x
    )
    if stats_50nM:
        all_stats['50nM Pair'] = stats_50nM

    print("\n500nM Pair:")
    stats_500nM = plot_parameter_histograms(
        result_500nM, pair_param_names,
        '500nM Pair - Parameter Distributions',
        'histogram_500nM_pair.png',
        best_params=result_500nM.x
    )
    if stats_500nM:
        all_stats['500nM Pair'] = stats_500nM

    print("\n5µM Pair:")
    stats_5uM = plot_parameter_histograms(
        result_5uM, pair_param_names,
        '5µM Pair - Parameter Distributions',
        'histogram_5uM_pair.png',
        best_params=result_5uM.x
    )
    if stats_5uM:
        all_stats['5µM Pair'] = stats_5uM

    print("\nGlobal Fit:")
    stats_global = plot_parameter_histograms(
        result_global, global_param_names,
        'Global Fit - Parameter Distributions',
        'histogram_global_fit.png',
        best_params=result_global.x
    )
    if stats_global:
        all_stats['Global Fit'] = stats_global

    # Create summary sloppiness plot
    if all_stats:
        print("\nGenerating sloppiness summary...")
        plot_sloppiness_summary(all_stats, 'sloppiness_summary.png')

        # Print detailed assessment
        print_sloppiness_assessment(all_stats)

    # ------------------------------
    # Visualization
    # ------------------------------
    print("\n" + "="*70)
    print("GENERATING COMPARISON PLOTS")
    print("="*70)

    fig, axes = plt.subplots(3, 4, figsize=(16, 12))
    fig.suptitle('Pairwise vs Global Fits Comparison', fontsize=16, fontweight='bold')

    plot_configs = [
        # Row 1: 50nM pair
        {'row': 0, 'col': 0, 'data': data_matrix[:, 0], 'params': result_50nM.x, 'q_idx': 1,
         'title': '100iaa (50nM fit)', 'is_seq': False, 'color': 'C0'},
        {'row': 0, 'col': 1, 'data': data_matrix[:, 1], 'params': result_50nM.x, 'q_idx': 2,
         'title': 'control (50nM fit)', 'is_seq': False, 'color': 'C1'},
        {'row': 0, 'col': 2, 'data': data_matrix[:, 2], 'params': result_50nM.x, 'q_idx': 3,
         'title': '50paa (50nM fit)', 'is_seq': False, 'color': 'C2'},
        {'row': 0, 'col': 3, 'data': data_matrix[:, 5], 'params': result_50nM.x, 'q_idx': 4,
         'title': '50then100 (50nM fit)', 'is_seq': True, 'color': 'C3'},

        # Row 2: 500nM pair
        {'row': 1, 'col': 0, 'data': data_matrix[:, 0], 'params': result_500nM.x, 'q_idx': 1,
         'title': '100iaa (500nM fit)', 'is_seq': False, 'color': 'C0'},
        {'row': 1, 'col': 1, 'data': data_matrix[:, 1], 'params': result_500nM.x, 'q_idx': 2,
         'title': 'control (500nM fit)', 'is_seq': False, 'color': 'C1'},
        {'row': 1, 'col': 2, 'data': data_matrix[:, 3], 'params': result_500nM.x, 'q_idx': 3,
         'title': '500paa (500nM fit)', 'is_seq': False, 'color': 'C4'},
        {'row': 1, 'col': 3, 'data': data_matrix[:, 6], 'params': result_500nM.x, 'q_idx': 4,
         'title': '500then100 (500nM fit)', 'is_seq': True, 'color': 'C5'},

        # Row 3: 5µM pair
        {'row': 2, 'col': 0, 'data': data_matrix[:, 0], 'params': result_5uM.x, 'q_idx': 1,
         'title': '100iaa (5µM fit)', 'is_seq': False, 'color': 'C0'},
        {'row': 2, 'col': 1, 'data': data_matrix[:, 1], 'params': result_5uM.x, 'q_idx': 2,
         'title': 'control (5µM fit)', 'is_seq': False, 'color': 'C1'},
        {'row': 2, 'col': 2, 'data': data_matrix[:, 4], 'params': result_5uM.x, 'q_idx': 3,
         'title': '5upaa (5µM fit)', 'is_seq': False, 'color': 'C6'},
        {'row': 2, 'col': 3, 'data': data_matrix[:, 7], 'params': result_5uM.x, 'q_idx': 4,
         'title': '5uthen100 (5µM fit)', 'is_seq': True, 'color': 'C7'},
    ]

    for config in plot_configs:
        ax = axes[config['row'], config['col']]
        series = config['data']
        params = config['params']
        V0 = series[0]

        # Extract parameters (7 params: p1, qI, q0, qP, rho, lam, p2)
        p1, qI, q0, qP, rho, lam, p2 = params

        # Build q function
        if config['q_idx'] == 1:  # 100iaa
            qfun = q_const_builder(qI)
        elif config['q_idx'] == 2:  # control
            qfun = q_const_builder(q0)
        elif config['q_idx'] == 3:  # PAA alone
            qfun = q_const_builder(qP)
        elif config['q_idx'] == 4:  # PAA then IAA
            qfun = q_sequential_builder(qP, qI, rho, t_switch)

        sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

        if config['is_seq']:
            mask = t_eval >= 32
            ax.plot(t_eval[mask], series[mask], 'o', markersize=5,
                   color=config['color'], alpha=0.6, label='Data')
            if sim is not None:
                ax.plot(t_eval[mask], sim[mask], '-', linewidth=2,
                       color=config['color'], alpha=0.9, label='Fit')
            ax.axvline(t_switch, color='gray', linestyle='--', linewidth=1, alpha=0.5)
        else:
            ax.plot(t_eval, series, 'o', markersize=5,
                   color=config['color'], alpha=0.6, label='Data')
            if sim is not None:
                ax.plot(t_eval, sim, '-', linewidth=2,
                       color=config['color'], alpha=0.9, label='Fit')

        ax.set_title(config['title'], fontsize=10, fontweight='bold')
        ax.set_xlabel('Time (min)', fontsize=9)
        ax.set_ylabel('DII-VENUS', fontsize=9)
        ax.set_ylim(0, 1.2)
        ax.grid(alpha=0.3)
        ax.legend(fontsize=8)

    plt.tight_layout()
    plt.savefig('pairwise_fits_comparison.png', dpi=300, bbox_inches='tight')
    print("Comparison plot saved to: pairwise_fits_comparison.png")

    # Create rho comparison plot
    fig2, ax2 = plt.subplots(figsize=(8, 6))
    rho_data = {
        'PAA Concentration': ['50nM', '500nM', '5µM', 'Global'],
        'rho': [rho_50, rho_500, rho_5u, rho_g],
        'Color': ['C0', 'C1', 'C2', 'C3']
    }

    ax2.bar(rho_data['PAA Concentration'], rho_data['rho'],
            color=rho_data['Color'], alpha=0.7, edgecolor='black', linewidth=1.5)
    ax2.axhline(rho_g, color='red', linestyle='--', linewidth=2,
                label=f'Global rho = {rho_g:.3f}', alpha=0.8)
    ax2.set_ylabel('rho (Interaction Factor)', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Fit Type', fontsize=12, fontweight='bold')
    ax2.set_title('Comparison of rho Across Different Fits', fontsize=14, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3)
    ax2.legend(fontsize=10)

    # Add value labels on bars
    for i, (conc, rho_val) in enumerate(zip(rho_data['PAA Concentration'], rho_data['rho'])):
        ax2.text(i, rho_val + 0.05, f'{rho_val:.3f}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')

    plt.tight_layout()
    plt.savefig('rho_comparison.png', dpi=300, bbox_inches='tight')
    print("rho comparison plot saved to: rho_comparison.png")

    print("\n" + "="*70)
    print("ANALYSIS COMPLETE!")
    print("="*70)
    print("\nOutput files generated:")
    print("  - pairwise_parameter_comparison.csv")
    print("  - params_50nM_pair.txt")
    print("  - params_500nM_pair.txt")
    print("  - params_5uM_pair.txt")
    print("  - params_global.txt")
    print("  - pairwise_fits_comparison.png")
    print("  - rho_comparison.png")
    print("  - histogram_50nM_pair.png")
    print("  - histogram_500nM_pair.png")
    print("  - histogram_5uM_pair.png")
    print("  - histogram_global_fit.png")
    print("  - sloppiness_summary.png")
