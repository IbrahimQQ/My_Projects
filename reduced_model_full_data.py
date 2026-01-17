import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares
import matplotlib.pyplot as plt

# ------------------------------
# Experimental data (VENUS fold change) - Same as enhanced_multicore_diagnostics.py
# ------------------------------
# Columns: 100iaa, control, 50paa, 500paa, 5upaa, 50then100, 500then100, 5uthen100
# (5nM PAA data removed: 5paa and 5then100)
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

# Treatment labels
labels = ['100iaa', 'control', '50paa', '500paa', '5upaa',
          '50then100', '500then100', '5uthen100']

# Time points (0-60 min, 4 min intervals)
dt_minutes = 4.0
t_eval = np.arange(data_matrix.shape[0], dtype=float) * dt_minutes
t_switch = 30.0  # Time when IAA is added in sequential treatments

# ------------------------------
# Reduced ODE Model
# ------------------------------
def reduced_rhs(t, y, p1, qj, lam, p2):
    """
    Reduced model ODE
    V' = p2 * (1 - V/(p1*V + qj) - lam*V)
    """
    V = y[0]
    return [p2 * (1.0 - V / (p1 * V + qj) - lam * V)]

# ---------------- q function builders ----------------
def q_const_builder(q_const):
    """Constant q value (for single treatments)"""
    f = lambda t: q_const
    f.piecewise = False
    return f

def q_sequential_builder(qP, qI, rho, t_switch):
    """
    Sequential treatment: PAA alone until t_switch, then PAA + IAA
    qP: PAA contribution
    qI: IAA contribution
    rho: interaction factor
    """
    f = lambda t: (qP if t < t_switch else (qI + rho * qP))
    f.piecewise = True
    return f

# ------------------------------
# Simulation Function
# ------------------------------
def simulate_series(initial_V, p1, lam, p2, q_function, t_eval):
    """
    Simulate VENUS trajectory using the reduced model
    """
    t0, t1 = t_eval[0], t_eval[-1]
    y0 = [float(initial_V)]
    V_out = np.zeros_like(t_eval, dtype=float)

    # Check if we need to split at t_switch for piecewise q
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
    """
    Build residuals for all 8 treatments (5nM PAA removed)

    Parameters:
    - p1: model parameter
    - qI: IAA influx (100nM)
    - q0: baseline (control)
    - qP_50nM, qP_500nM, qP_5uM: PAA influx for different concentrations
    - rho: interaction factor for sequential treatments
    - lam: degradation rate
    - p2: production rate
    """
    p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2 = params

    if weights is None:
        weights = np.ones_like(data_matrix)

    residuals = []

    for j in range(data_matrix.shape[1]):
        series = data_matrix[:, j]
        V0 = series[0]

        # Map each treatment to its q function
        if j == 0:  # 100iaa
            qfun = q_const_builder(qI)
        elif j == 1:  # control
            qfun = q_const_builder(q0)
        elif j == 2:  # 50paa
            qfun = q_const_builder(qP_50nM)
        elif j == 3:  # 500paa
            qfun = q_const_builder(qP_500nM)
        elif j == 4:  # 5upaa
            qfun = q_const_builder(qP_5uM)
        elif j == 5:  # 50then100
            qfun = q_sequential_builder(qP_50nM, qI, rho, t_switch)
        elif j == 6:  # 500then100
            qfun = q_sequential_builder(qP_500nM, qI, rho, t_switch)
        elif j == 7:  # 5uthen100
            qfun = q_sequential_builder(qP_5uM, qI, rho, t_switch)

        sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

        if (sim is None) or np.any(~np.isfinite(sim)):
            residuals.extend(np.full_like(series, 1e3))
        else:
            # For sequential treatments (5-7), only fit from t >= 32 min
            if j >= 5:
                mask = t_eval >= 32
                residuals.extend(weights[mask, j] * (sim[mask] - series[mask]))
            else:
                residuals.extend(weights[:, j] * (sim - series))

    return np.array(residuals, dtype=float)

def objective(params, t_eval, data_matrix, weights=None):
    """Objective function with bounds checking"""
    params = np.asarray(params, dtype=float)
    if np.any(params < 0):
        return build_residuals(params, t_eval, data_matrix, weights) + 1e2
    return build_residuals(params, t_eval, data_matrix, weights)

# ------------------------------
# Latin Hypercube Sampling
# ------------------------------
def latin_hypercube(n_samples, dim, low, high, rng):
    """Generate Latin Hypercube samples"""
    cut = np.linspace(0, 1, n_samples + 1)
    u = rng.uniform(size=(n_samples, dim))
    a = cut[:n_samples]
    b = cut[1:n_samples + 1]
    pts = u * (b - a)[:, None] + a[:, None]
    for d in range(dim):
        rng.shuffle(pts[:, d])
    return low + pts * (high - low)

# ------------------------------
# Parameter Estimation
# ------------------------------
def fit_reduced_model(t_eval, data_matrix, n_starts=50, seed=7):
    """
    Fit the reduced model to all 8 treatments (5nM PAA removed)

    Returns optimized parameters:
    [p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2]
    """
    rng = np.random.default_rng(seed)

    # Parameter bounds (9 parameters)
    lower = np.array([1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 0.0, 1e-6, 1e-6], dtype=float)
    upper = np.array([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 5.0, 2.0, 5.0], dtype=float)

    # Latin Hypercube Sampling bounds (tighter for better initial guesses)
    lhs_low  = np.array([0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0, 0.01, 0.05], dtype=float)
    lhs_high = np.array([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 2.0, 0.5, 1.0], dtype=float)

    starts = latin_hypercube(n_starts, len(lower), lhs_low, lhs_high, rng)

    print(f"Fitting reduced model with {n_starts} initial guesses...")
    print(f"Parameters to estimate: 9 (p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2)")

    best = None
    for i, x0 in enumerate(starts):
        if (i + 1) % 10 == 0:
            print(f"  Attempt {i+1}/{n_starts}...")

        res = least_squares(
            objective, x0,
            args=(t_eval, data_matrix, None),
            bounds=(lower, upper),
            method="trf",
            loss="soft_l1",
            f_scale=0.1,
            xtol=1e-10, ftol=1e-10, gtol=1e-10,
            max_nfev=5000,
            verbose=0
        )

        if (best is None) or (res.cost < best.cost):
            best = res
            print(f"    → New best cost: {best.cost:.6f}")

    return best

# ------------------------------
# Main Execution
# ------------------------------
if __name__ == "__main__":
    print("="*70)
    print("REDUCED MODEL PARAMETER ESTIMATION - FULL DATA (8 TREATMENTS)")
    print("="*70)

    # Fit the model
    result = fit_reduced_model(t_eval, data_matrix, n_starts=50, seed=7)

    # Extract parameters
    p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2 = result.x

    print("\n" + "="*70)
    print("OPTIMIZATION RESULTS")
    print("="*70)
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    print(f"Best cost (sum of squared residuals): {result.cost:.6f}")

    print("\n" + "="*70)
    print("FITTED PARAMETERS")
    print("="*70)
    print(f"  p1        = {p1:.6g}  (model parameter)")
    print(f"  qI        = {qI:.6g}  (100nM IAA)")
    print(f"  q0        = {q0:.6g}  (control/baseline)")
    print(f"  qP_50nM   = {qP_50nM:.6g}  (50nM PAA)")
    print(f"  qP_500nM  = {qP_500nM:.6g}  (500nM PAA)")
    print(f"  qP_5uM    = {qP_5uM:.6g}  (5µM PAA)")
    print(f"  rho       = {rho:.6g}  (interaction factor)")
    print(f"  lam       = {lam:.6g}  (degradation rate)")
    print(f"  p2        = {p2:.6g}  (production rate)")
    print("="*70)

    # Save parameters
    np.savetxt('reduced_model_parameters.txt', result.x,
               header='Reduced model parameters: p1, qI, q0, qP_50nM, qP_500nM, qP_5uM, rho, lam, p2')
    print("\nParameters saved to: reduced_model_parameters.txt")

    # ------------------------------
    # Plotting
    # ------------------------------
    print("\nGenerating plots...")

    plt.rcParams.update({
        "font.family": "Arial",
        "font.size": 12,
        "axes.labelsize": 14,
        "axes.titlesize": 14,
        "legend.fontsize": 10,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "axes.linewidth": 1.5,
        "lines.linewidth": 2.0,
    })

    # Create subplots: 2 rows x 4 columns (8 treatments)
    fig = plt.figure(figsize=(16, 8))

    # Colors for different treatment types
    colors_constant = plt.cm.tab10(np.linspace(0, 1, 5))
    colors_then = plt.cm.Set2(np.linspace(0, 1, 3))

    for j, name in enumerate(labels):
        series = data_matrix[:, j]
        V0 = series[0]

        # Build q function for this treatment
        if j == 0:  # 100iaa
            qfun = q_const_builder(qI)
            color = colors_constant[0]
        elif j == 1:  # control
            qfun = q_const_builder(q0)
            color = colors_constant[1]
        elif j == 2:  # 50paa
            qfun = q_const_builder(qP_50nM)
            color = colors_constant[2]
        elif j == 3:  # 500paa
            qfun = q_const_builder(qP_500nM)
            color = colors_constant[3]
        elif j == 4:  # 5upaa
            qfun = q_const_builder(qP_5uM)
            color = colors_constant[4]
        elif j == 5:  # 50then100
            qfun = q_sequential_builder(qP_50nM, qI, rho, t_switch)
            color = colors_then[0]
        elif j == 6:  # 500then100
            qfun = q_sequential_builder(qP_500nM, qI, rho, t_switch)
            color = colors_then[1]
        elif j == 7:  # 5uthen100
            qfun = q_sequential_builder(qP_5uM, qI, rho, t_switch)
            color = colors_then[2]

        # Simulate
        sim = simulate_series(V0, p1, lam, p2, qfun, t_eval)

        # Create subplot
        ax = plt.subplot(2, 4, j+1)

        # For sequential treatments (j >= 5), only plot from t >= 32
        if j >= 5:
            mask = t_eval >= 32
            ax.plot(t_eval[mask], series[mask], 'o', markersize=6,
                   color=color, label='Data', alpha=0.7)
            if sim is not None:
                ax.plot(t_eval[mask], sim[mask], '-', linewidth=2.5,
                       color=color, label='Model', alpha=0.9)
            # Mark IAA addition
            ax.axvline(t_switch, color='gray', linestyle='--', linewidth=1.5, alpha=0.5)
        else:
            # Constant treatments: plot all points
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

        # Clean borders
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig('reduced_model_fit_full_data.png', dpi=300, bbox_inches='tight')
    print("Plot saved as: reduced_model_fit_full_data.png")
    plt.show()

    print("\n" + "="*70)
    print("ANALYSIS COMPLETE!")
    print("="*70)
