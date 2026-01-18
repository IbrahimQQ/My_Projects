"""
IAA/PAA VENUS Model - IMPROVED MCMC (5nM PAA removed)
======================================================

Fixes for parameters being too small:
1. WIDER parameter bounds
2. LOG-NORMAL priors (prevents drift to small values)
3. Better proposal adaptation with proper scaling
4. Multiple chain option for better exploration
5. Reflection at boundaries instead of rejection
6. Proper constraint handling

5nM PAA data removed: 8 treatments instead of 10
"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares
from scipy.stats.qmc import LatinHypercube
from scipy.stats import norm, truncnorm
from scipy.linalg import eig
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
import warnings
import multiprocessing as mp
from functools import partial
import time

warnings.filterwarnings('ignore', category=RuntimeWarning)

# ==============================================================================
# EXPERIMENTAL DATA (5nM PAA removed)
# ==============================================================================

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

t_eval = np.arange(0, 61, 4)

kinetic_names = ['ka1', 'kd1', 'ka2', 'kd2', 'la', 'ld', 'lm',
                 'delta', 'mu1', 'mu2', 'lam', 'TIR1_T']
alpha_names = ['alpha_0_IAA', 'alpha_0_PAA', 'alpha_IAA_100nM',
               'alpha_PAA_50nM', 'alpha_PAA_500nM', 'alpha_PAA_5uM']
all_param_names = kinetic_names + alpha_names

STATE_NAMES = ['IAA', 'TIR1', 'IAA_TIR1', 'PAA', 'PAA_TIR1', 'IAA_TIR1_VENUS', 'VENUS']

# ==============================================================================
# EXPANDED PARAMETER BOUNDS (18 parameters: 12 kinetic + 6 alpha)
# ==============================================================================
"""
SIGNIFICANTLY WIDER BOUNDS to allow proper exploration
"""

PARAM_BOUNDS = [
    # Kinetic parameters - WIDER RANGES
    (1e-4, 100),    # ka1 - association rate
    (1e-4, 100),    # kd1 - dissociation rate
    (1e-4, 100),    # ka2 - association rate
    (1e-4, 100),    # kd2 - dissociation rate
    (1e-4, 100),    # la  - VENUS binding
    (1e-4, 100),    # ld  - VENUS unbinding
    (1e-4, 50),     # lm  - degradation rate
    (1e-4, 100),    # delta - VENUS production
    (1e-4, 50),     # mu1 - IAA degradation
    (1e-4, 50),     # mu2 - PAA degradation
    (1e-4, 50),     # lam - free VENUS degradation
    (0.1, 200),     # TIR1_T - total receptor (MUCH WIDER)
    # Influx parameters - WIDER RANGES (6 alpha parameters, no 5nM)
    (0.01, 500),    # alpha_0_IAA
    (0.01, 500),    # alpha_0_PAA
    (0.01, 500),    # alpha_IAA_100nM
    (0.01, 500),    # alpha_PAA_50nM
    (0.01, 500),    # alpha_PAA_500nM
    (0.01, 500),    # alpha_PAA_5uM
]


# ==============================================================================
# ODE MODEL (same as before)
# ==============================================================================

def IAA_PAA_model(t, y, params, alpha_I, alpha_P):
    """ODE model for IAA and PAA dynamics"""
    (ka1, kd1, ka2, kd2, la, ld, lm, delta, mu1, mu2, lam, TIR1_T) = params
    IAA, TIR1, IAATIR1, PAA, PAATIR1, IAATIR1VENUS, VENUS = y

    epsilon = 1e-12
    IAA = max(IAA, epsilon)
    TIR1 = max(TIR1, epsilon)
    IAATIR1 = max(IAATIR1, epsilon)
    PAA = max(PAA, epsilon)
    PAATIR1 = max(PAATIR1, epsilon)
    IAATIR1VENUS = max(IAATIR1VENUS, epsilon)
    VENUS = max(VENUS, epsilon)

    dIAA = alpha_I - mu1*IAA + kd1*IAATIR1 - ka1*IAA*TIR1
    dTIR1 = kd2*PAATIR1 - ka2*PAA*TIR1 - ka1*IAA*TIR1 + kd1*IAATIR1
    dIAATIR1 = ka1*IAA*TIR1 - kd1*IAATIR1 + (ld+lm)*IAATIR1VENUS - la*IAATIR1*VENUS
    dPAA = alpha_P - mu2*PAA + kd2*PAATIR1 - ka2*PAA*TIR1
    dPAATIR1 = ka2*PAA*TIR1 - kd2*PAATIR1
    dIAATIR1VENUS = la*IAATIR1*VENUS - (ld+lm)*IAATIR1VENUS
    dVENUS = delta - la*IAATIR1*VENUS + ld*IAATIR1VENUS - lam*VENUS

    return [dIAA, dTIR1, dIAATIR1, dPAA, dPAATIR1, dIAATIR1VENUS, dVENUS]


def initial_conditions(params, alpha_0_IAA, alpha_0_PAA):
    """Calculate steady-state initial conditions"""
    ka1, kd1, ka2, kd2, la, ld, lm, delta, mu1, mu2, lam, TIR1_T = params
    epsilon = 1e-12

    # Check constraint BEFORE computing
    if lm * TIR1_T <= delta:
        return None

    IAA_ss = alpha_0_IAA / (mu1 + epsilon)
    PAA_ss = alpha_0_PAA / (mu2 + epsilon)

    denominator = (kd2*mu2*kd1*mu1) + (ka2*alpha_0_PAA*kd1*mu1) + (ka1*alpha_0_IAA*kd2*mu2) + epsilon

    TIR1_ss = ((lm*TIR1_T - delta) * kd1 * mu1) / (lm * denominator)
    IAA_TIR1_ss = ((lm*TIR1_T - delta) * ka1 * alpha_0_IAA) / (lm * denominator)
    PAA_TIR1_ss = ((ka2 * alpha_0_PAA) / (kd2 * mu2 + epsilon)) * ((lm*TIR1_T - delta) * kd1 * mu1) / (lm * denominator)
    IAA_TIR1_VENUS_ss = delta / (lm + epsilon)
    VENUS_ss = (delta * (ld + lm) * denominator) / (la * ka1 * alpha_0_IAA * (lm*TIR1_T - delta) + epsilon)

    # Check all positive
    values = [IAA_ss, TIR1_ss, IAA_TIR1_ss, PAA_ss, PAA_TIR1_ss, IAA_TIR1_VENUS_ss, VENUS_ss]
    if any(v <= 0 for v in values):
        return None

    return [max(val, epsilon) for val in values]


def simulate_dataset(params, alpha_I_list, alpha_P_list, t_switch_list, t_eval):
    """Simulate VENUS trajectory"""
    alpha_0_IAA = alpha_I_list[0][1]
    alpha_0_PAA = alpha_P_list[0][1]

    try:
        y0 = initial_conditions(params, alpha_0_IAA, alpha_0_PAA)
        if y0 is None:
            return np.full(len(t_eval), np.nan)
        VENUS_0 = y0[-1]
    except:
        return np.full(len(t_eval), np.nan)

    all_VENUS = []
    current_y = y0

    for i in range(len(t_switch_list)):
        t_start = t_switch_list[i]
        t_end = t_switch_list[i+1] if i+1 < len(t_switch_list) else t_eval[-1]
        alpha_I = alpha_I_list[i][1]
        alpha_P = alpha_P_list[i][1]
        t_segment = t_eval[(t_eval >= t_start) & (t_eval <= t_end)]

        if len(t_segment) > 0:
            try:
                sol = solve_ivp(IAA_PAA_model, [t_start, t_end], current_y,
                    t_eval=t_segment, args=(params, alpha_I, alpha_P),
                    method="BDF", rtol=1e-6, atol=1e-8)
                if not sol.success:
                    return np.full(len(t_eval), np.nan)
                all_VENUS.extend(sol.y[-1])
                if i+1 < len(t_switch_list):
                    current_y = sol.y[:, -1]
            except:
                return np.full(len(t_eval), np.nan)

    VENUS_normalized = np.array(all_VENUS) / VENUS_0
    if np.any(~np.isfinite(VENUS_normalized)):
        return np.full(len(t_eval), np.nan)
    return VENUS_normalized


def build_treatments(alpha_params):
    """
    Build treatment configurations (8 treatments, 5nM PAA removed)

    Parameters:
    - alpha_0_IAA, alpha_0_PAA: baseline
    - alpha_IAA_100nM: 100nM IAA
    - alpha_PAA_50nM, alpha_PAA_500nM, alpha_PAA_5uM: PAA concentrations
    """
    (alpha_0_IAA, alpha_0_PAA, alpha_IAA_100nM,
     alpha_PAA_50nM, alpha_PAA_500nM, alpha_PAA_5uM) = alpha_params

    return [
        # 0: 100iaa
        ([(0, alpha_IAA_100nM)], [(0, alpha_0_PAA)], [0]),
        # 1: control
        ([(0, alpha_0_IAA)], [(0, alpha_0_PAA)], [0]),
        # 2: 50paa
        ([(0, alpha_0_IAA)], [(0, alpha_PAA_50nM)], [0]),
        # 3: 500paa
        ([(0, alpha_0_IAA)], [(0, alpha_PAA_500nM)], [0]),
        # 4: 5upaa
        ([(0, alpha_0_IAA)], [(0, alpha_PAA_5uM)], [0]),
        # 5: 50then100
        ([(0, alpha_0_IAA), (30, alpha_IAA_100nM)], [(0, alpha_PAA_50nM), (30, alpha_PAA_50nM)], [0, 30]),
        # 6: 500then100
        ([(0, alpha_0_IAA), (30, alpha_IAA_100nM)], [(0, alpha_PAA_500nM), (30, alpha_PAA_500nM)], [0, 30]),
        # 7: 5uthen100
        ([(0, alpha_0_IAA), (30, alpha_IAA_100nM)], [(0, alpha_PAA_5uM), (30, alpha_PAA_5uM)], [0, 30]),
    ]


def objective(all_params, t_eval, data_matrix):
    """Objective function for 8 treatments"""
    kinetic = all_params[:12]
    alpha_params = all_params[12:]
    treatments = build_treatments(alpha_params)

    total_err = []
    for j in range(8):  # 8 treatments instead of 10
        alpha_I_list, alpha_P_list, t_switch_list = treatments[j]
        Vsim = simulate_dataset(kinetic, alpha_I_list, alpha_P_list, t_switch_list, t_eval)
        Vdata = data_matrix[:, j]

        # For sequential treatments (5-7), only fit from t >= 32
        if j >= 5:
            valid_idx = t_eval >= 32
            Vsim_valid = Vsim[valid_idx]
            Vdata_valid = Vdata[valid_idx]
            if np.any(~np.isfinite(Vsim_valid)):
                total_err.extend([100.0] * np.sum(valid_idx))
            else:
                total_err.extend(Vsim_valid - Vdata_valid)
        else:
            if np.any(~np.isfinite(Vsim)):
                total_err.extend([100.0] * len(t_eval))
            else:
                total_err.extend(Vsim - Vdata)

    return np.array(total_err)


# ==============================================================================
# LEAST SQUARES ESTIMATION
# ==============================================================================

def fit_single_guess(guess, bounds, t_eval, data_matrix):
    """Worker function for parallel fitting"""
    try:
        result = least_squares(objective, guess, bounds=(bounds[0], bounds[1]),
            args=(t_eval, data_matrix), method='trf', max_nfev=2000, verbose=0)
        return (result.cost, result.x, result.success)
    except:
        return (np.inf, guess, False)


def estimate_parameters_parallel(t_eval, data_matrix, num_samples=50, n_cores=None):
    """Estimate parameters with wider exploration"""
    if n_cores is None:
        n_cores = mp.cpu_count()

    print(f"Using {n_cores} cores, {num_samples} initial guesses")
    print(f"Estimating 18 parameters (12 kinetic + 6 alpha, 5nM PAA removed)")

    lower_bounds = np.array([b[0] for b in PARAM_BOUNDS])
    upper_bounds = np.array([b[1] for b in PARAM_BOUNDS])

    # Latin Hypercube in LOG space for better coverage
    sampler = LatinHypercube(d=len(PARAM_BOUNDS))
    lhs_samples = sampler.random(n=num_samples)

    # Sample in log-space, then transform
    log_lower = np.log(lower_bounds)
    log_upper = np.log(upper_bounds)
    log_samples = log_lower + lhs_samples * (log_upper - log_lower)
    initial_guesses = np.exp(log_samples)

    print(f"Parameter bounds (min, max):")
    for i, name in enumerate(all_param_names):
        print(f"  {name:<18}: [{lower_bounds[i]:.2e}, {upper_bounds[i]:.2e}]")

    worker_func = partial(fit_single_guess, bounds=(lower_bounds, upper_bounds),
                         t_eval=t_eval, data_matrix=data_matrix)

    start_time = time.time()
    with mp.Pool(processes=n_cores) as pool:
        results = pool.map(worker_func, initial_guesses)
    print(f"Completed in {time.time() - start_time:.1f}s")

    best_cost, best_params = np.inf, None
    for cost, params, success in results:
        if success and cost < best_cost:
            best_cost, best_params = cost, params

    print(f"\nBest cost: {best_cost:.6f}")

    if best_params is not None:
        print("\nBest-fit parameters:")
        for i, name in enumerate(all_param_names):
            print(f"  {name:<18}: {best_params[i]:.6f}")

    return best_params, best_cost


# ==============================================================================
# IMPROVED MCMC WITH LOG-NORMAL PRIORS
# ==============================================================================
"""
KEY IMPROVEMENTS:

1. LOG-NORMAL PRIORS: Prevents drift to small values
   - Prior is centered on best-fit value
   - Width controls how much deviation is allowed

2. WORKING IN LOG-SPACE: All proposals in log-space
   - Ensures positivity
   - Better scaling across orders of magnitude

3. REFLECTION AT BOUNDARIES: Instead of rejecting, reflect
   - Improves exploration near boundaries

4. CONSTRAINT HANDLING: Explicit check for lm * TIR1_T > delta
"""

def log_prior_lognormal(params, best_fit_params, prior_width=1.0):
    """
    Log-normal prior centered on best-fit values.

    This PREVENTS parameters from drifting to very small values!

    Parameters:
    -----------
    params : array
        Current parameter values (18 params)
    best_fit_params : array
        Best-fit from least squares (prior centers)
    prior_width : float
        Standard deviation in log-space (larger = wider prior)
        - 0.5 = tight prior (stays close to best-fit)
        - 1.0 = moderate prior
        - 2.0 = wide prior (more exploration)
    """
    if np.any(params <= 0):
        return -np.inf

    # Check constraint: lm * TIR1_T > delta
    lm, delta, TIR1_T = params[6], params[7], params[11]
    if lm * TIR1_T <= delta:
        return -np.inf

    # Check bounds
    lower = np.array([b[0] for b in PARAM_BOUNDS])
    upper = np.array([b[1] for b in PARAM_BOUNDS])
    if np.any(params < lower) or np.any(params > upper):
        return -np.inf

    # Log-normal prior: log(θ) ~ N(log(θ_best), σ²)
    log_params = np.log(params)
    log_best = np.log(best_fit_params)

    # Sum of log-normal log-densities
    log_prior = -0.5 * np.sum(((log_params - log_best) / prior_width)**2)

    # Jacobian for log-transform: -sum(log(params))
    log_prior -= np.sum(log_params)

    return log_prior


def log_likelihood(params, t_eval, data_matrix, sigma=0.05):
    """Gaussian likelihood"""
    residuals = objective(params, t_eval, data_matrix)
    if np.any(~np.isfinite(residuals)) or np.any(np.abs(residuals) > 50):
        return -np.inf
    return -0.5 * np.sum((residuals / sigma)**2)


def log_posterior(params, best_fit_params, t_eval, data_matrix, prior_width=1.0):
    """Log posterior = log prior + log likelihood"""
    lp = log_prior_lognormal(params, best_fit_params, prior_width)
    if not np.isfinite(lp):
        return -np.inf
    ll = log_likelihood(params, t_eval, data_matrix)
    return lp + ll


def reflect_at_bounds(params, lower, upper):
    """
    Reflect parameters at boundaries instead of rejecting.
    This improves exploration near bounds.
    """
    reflected = params.copy()
    for i in range(len(params)):
        while reflected[i] < lower[i] or reflected[i] > upper[i]:
            if reflected[i] < lower[i]:
                reflected[i] = 2 * lower[i] - reflected[i]
            if reflected[i] > upper[i]:
                reflected[i] = 2 * upper[i] - reflected[i]
    return reflected


def run_improved_mcmc(best_fit_params, t_eval, data_matrix,
                      n_iterations=15000, burn_in=5000, thin=2,
                      prior_width=1.0, n_chains=1):
    """
    Improved adaptive MCMC with log-normal priors.

    Parameters:
    -----------
    best_fit_params : array (18 params)
        Starting point and prior center
    n_iterations : int
        Total iterations per chain
    burn_in : int
        Burn-in to discard
    thin : int
        Thinning factor
    prior_width : float
        Prior width (0.5=tight, 1.0=moderate, 2.0=wide)
    n_chains : int
        Number of independent chains to run
    """
    print("\n" + "="*70)
    print("IMPROVED ADAPTIVE MCMC (5nM PAA removed - 18 parameters)")
    print("="*70)
    print(f"Iterations: {n_iterations}, Burn-in: {burn_in}, Thin: {thin}")
    print(f"Prior width: {prior_width} (log-space std dev)")
    print(f"Number of chains: {n_chains}")

    n_params = len(best_fit_params)
    lower = np.array([b[0] for b in PARAM_BOUNDS])
    upper = np.array([b[1] for b in PARAM_BOUNDS])

    all_chains = []
    all_log_posts = []

    for chain_idx in range(n_chains):
        print(f"\n--- Chain {chain_idx + 1}/{n_chains} ---")

        # Initialize: perturb best-fit slightly
        if chain_idx == 0:
            current_params = best_fit_params.copy()
        else:
            # Start other chains from perturbed positions
            perturbation = np.exp(0.1 * np.random.randn(n_params))
            current_params = best_fit_params * perturbation
            current_params = np.clip(current_params, lower, upper)

        current_log_post = log_posterior(current_params, best_fit_params,
                                         t_eval, data_matrix, prior_width)

        # Initial proposal covariance (in log-space)
        # Start with diagonal, will adapt
        initial_scale = 0.1  # 10% relative perturbation
        proposal_cov = np.diag((initial_scale * np.ones(n_params))**2)

        # Scaling factor for proposal
        scale = 2.38**2 / n_params  # Optimal for Gaussian target

        # Storage
        n_stored = n_iterations // thin
        chain = np.zeros((n_stored, n_params))
        log_posts = np.zeros(n_stored)

        n_accepted = 0
        stored_idx = 0

        # For adaptive covariance
        mean_log_params = np.log(current_params)
        cov_log_params = proposal_cov.copy()

        print(f"{'Iter':>8} {'Log-Post':>12} {'Accept%':>10} {'Min Param':>12} {'Max Param':>12}")
        print("-" * 56)

        for i in range(n_iterations):
            # Propose in log-space
            current_log = np.log(current_params)
            proposed_log = np.random.multivariate_normal(current_log, scale * proposal_cov)
            proposed_params = np.exp(proposed_log)

            # Reflect at boundaries (instead of rejecting)
            proposed_params = reflect_at_bounds(proposed_params, lower * 1.01, upper * 0.99)

            # Evaluate
            proposed_log_post = log_posterior(proposed_params, best_fit_params,
                                              t_eval, data_matrix, prior_width)

            # Metropolis-Hastings acceptance
            log_alpha = proposed_log_post - current_log_post

            if np.log(np.random.random()) < log_alpha:
                current_params = proposed_params
                current_log_post = proposed_log_post
                n_accepted += 1

            # Store (with thinning)
            if (i + 1) % thin == 0:
                chain[stored_idx] = current_params
                log_posts[stored_idx] = current_log_post
                stored_idx += 1

            # Adaptive covariance update (Haario et al. algorithm)
            if i >= 100 and (i + 1) % 100 == 0:
                # Update running mean and covariance in log-space
                log_chain = np.log(chain[:stored_idx] + 1e-10)

                if stored_idx > 50:
                    # Empirical covariance with regularization
                    proposal_cov = np.cov(log_chain.T) + 1e-6 * np.eye(n_params)

                    # Adjust scale based on acceptance rate
                    recent_start = max(0, stored_idx - 500)
                    if stored_idx > recent_start + 100:
                        # This is approximate - just use overall rate
                        pass

                # Adjust global scale
                current_rate = n_accepted / (i + 1)
                if current_rate < 0.15:
                    scale *= 0.8
                elif current_rate > 0.35:
                    scale *= 1.2
                scale = np.clip(scale, 0.01, 10.0)

            # Progress
            if (i + 1) % (n_iterations // 5) == 0:
                rate = n_accepted / (i + 1) * 100
                min_p = np.min(current_params)
                max_p = np.max(current_params)
                print(f"{i+1:>8} {current_log_post:>12.2f} {rate:>10.1f} {min_p:>12.4f} {max_p:>12.4f}")

        final_rate = n_accepted / n_iterations * 100
        print(f"\nChain {chain_idx + 1} acceptance rate: {final_rate:.1f}%")

        all_chains.append(chain)
        all_log_posts.append(log_posts)

    # Combine chains
    if n_chains > 1:
        combined_chain = np.vstack(all_chains)
        combined_log_posts = np.concatenate(all_log_posts)
    else:
        combined_chain = all_chains[0]
        combined_log_posts = all_log_posts[0]

    return combined_chain, combined_log_posts, all_chains


# ==============================================================================
# DIAGNOSTICS
# ==============================================================================

def compute_effective_sample_size(samples):
    """Compute ESS for each parameter"""
    n_samples, n_params = samples.shape
    ess = np.zeros(n_params)

    for i in range(n_params):
        x = samples[:, i] - np.mean(samples[:, i])
        n = len(x)

        # FFT-based autocorrelation
        fft_x = np.fft.fft(x, n=2*n)
        acf = np.fft.ifft(fft_x * np.conj(fft_x))[:n].real
        acf = acf / (acf[0] + 1e-10)

        # Find cutoff
        neg_idx = np.where(acf < 0.05)[0]
        cutoff = neg_idx[0] if len(neg_idx) > 0 else n // 2

        tau = 1 + 2 * np.sum(acf[1:cutoff])
        ess[i] = n / max(tau, 1)

    return ess


def plot_mcmc_diagnostics(chain, log_posts, burn_in_idx, best_fit_params,
                          save_path='mcmc_diagnostics_no5nm.png'):
    """Comprehensive MCMC diagnostics"""
    print("\nGenerating MCMC diagnostics...")

    n_samples, n_params = chain.shape
    post_samples = chain[burn_in_idx:]

    ess = compute_effective_sample_size(post_samples)

    fig = plt.figure(figsize=(22, 2.5 * n_params))
    gs = GridSpec(n_params, 5, figure=fig, hspace=0.35, wspace=0.3)

    for i in range(n_params):
        trace = chain[:, i]
        posterior = post_samples[:, i]

        # Column 1: Trace
        ax1 = fig.add_subplot(gs[i, 0])
        ax1.plot(trace, 'steelblue', lw=0.5, alpha=0.7)
        ax1.axvline(burn_in_idx, color='red', ls='--', lw=1.5)
        ax1.axhline(best_fit_params[i], color='green', ls='-', lw=2, alpha=0.7, label='LS fit')
        ax1.set_ylabel(all_param_names[i], fontsize=9, fontweight='bold')
        if i == 0:
            ax1.set_title('Trace', fontsize=11, fontweight='bold')
        ax1.grid(alpha=0.3)

        # Column 2: Posterior
        ax2 = fig.add_subplot(gs[i, 1])
        ax2.hist(posterior, bins=50, density=True, color='steelblue', alpha=0.7)
        mean_val = np.mean(posterior)
        ax2.axvline(mean_val, color='red', lw=2, label=f'Mean: {mean_val:.3f}')
        ax2.axvline(best_fit_params[i], color='green', lw=2, ls='--', label=f'LS: {best_fit_params[i]:.3f}')
        q2_5, q97_5 = np.percentile(posterior, [2.5, 97.5])
        ax2.axvline(q2_5, color='orange', ls='--', lw=1.5)
        ax2.axvline(q97_5, color='orange', ls='--', lw=1.5)
        if i == 0:
            ax2.set_title('Posterior', fontsize=11, fontweight='bold')
        ax2.legend(fontsize=6)
        ax2.grid(alpha=0.3)

        # Column 3: Autocorrelation
        ax3 = fig.add_subplot(gs[i, 2])
        max_lag = min(100, len(posterior) // 4)
        x = posterior - np.mean(posterior)
        acf = np.correlate(x, x, mode='full')
        acf = acf[len(acf)//2:len(acf)//2 + max_lag]
        acf = acf / (acf[0] + 1e-10)
        ax3.bar(range(max_lag), acf, color='steelblue', alpha=0.7, width=1.0)
        ax3.axhline(0, color='black', lw=0.5)
        ax3.axhline(0.05, color='red', ls='--', lw=1)
        ax3.set_ylim(-0.15, 1.05)
        ax3.text(0.95, 0.95, f'ESS: {ess[i]:.0f}', transform=ax3.transAxes,
                fontsize=8, va='top', ha='right',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        if i == 0:
            ax3.set_title('Autocorr', fontsize=11, fontweight='bold')
        ax3.grid(alpha=0.3)

        # Column 4: Running mean
        ax4 = fig.add_subplot(gs[i, 3])
        running_mean = np.cumsum(trace) / np.arange(1, len(trace) + 1)
        ax4.plot(running_mean, color='steelblue', lw=1)
        ax4.axhline(mean_val, color='red', ls='-', lw=2)
        ax4.axhline(best_fit_params[i], color='green', ls='--', lw=2)
        ax4.axvline(burn_in_idx, color='red', ls='--', lw=1.5)
        if i == 0:
            ax4.set_title('Running Mean', fontsize=11, fontweight='bold')
        ax4.grid(alpha=0.3)

        # Column 5: Compare to prior center (ratio)
        ax5 = fig.add_subplot(gs[i, 4])
        ratio = posterior / best_fit_params[i]
        ax5.hist(ratio, bins=50, density=True, color='steelblue', alpha=0.7)
        ax5.axvline(1.0, color='green', lw=2, ls='--', label='LS fit')
        ax5.axvline(np.mean(ratio), color='red', lw=2, label=f'Mean: {np.mean(ratio):.2f}')
        ax5.set_xlabel('Ratio to LS fit', fontsize=9)
        if i == 0:
            ax5.set_title('Ratio to LS', fontsize=11, fontweight='bold')
        ax5.legend(fontsize=6)
        ax5.grid(alpha=0.3)

    plt.suptitle('MCMC Diagnostics (Log-Normal Priors, 5nM PAA removed)\n'
                'Green = Least-Squares fit, Red = Posterior mean',
                fontsize=14, fontweight='bold', y=1.002)
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

    # Print summary
    print("\n" + "="*90)
    print("POSTERIOR SUMMARY")
    print("="*90)
    print(f"{'Parameter':<18} {'LS Fit':>10} {'Post Mean':>10} {'Post Std':>10} {'95% CI':>24} {'ESS':>8}")
    print("-" * 90)

    for i, name in enumerate(all_param_names):
        ls_val = best_fit_params[i]
        mean = np.mean(post_samples[:, i])
        std = np.std(post_samples[:, i])
        q2_5, q97_5 = np.percentile(post_samples[:, i], [2.5, 97.5])
        print(f"{name:<18} {ls_val:>10.4f} {mean:>10.4f} {std:>10.4f} [{q2_5:>9.4f}, {q97_5:>9.4f}] {ess[i]:>8.0f}")

    return ess, post_samples


# ==============================================================================
# BIFURCATION ANALYSIS
# ==============================================================================

def analyze_stability(params, alpha_I, alpha_P):
    """Analyze stability of steady state"""
    try:
        y_ss = initial_conditions(params, alpha_I, alpha_P)
        if y_ss is None:
            return None, None, "FAILED", np.nan

        # Compute Jacobian
        n_states = len(y_ss)
        J = np.zeros((n_states, n_states))
        epsilon = 1e-8
        f0 = np.array(IAA_PAA_model(0, y_ss, params, alpha_I, alpha_P))

        for j in range(n_states):
            y_pert = np.array(y_ss, dtype=float)
            y_pert[j] += epsilon
            f_pert = np.array(IAA_PAA_model(0, y_pert, params, alpha_I, alpha_P))
            J[:, j] = (f_pert - f0) / epsilon

        eigenvalues = np.linalg.eigvals(J)
        max_real = np.max(np.real(eigenvalues))

        stability = "STABLE" if max_real < -1e-10 else "UNSTABLE" if max_real > 1e-10 else "MARGINAL"
        return y_ss, eigenvalues, stability, max_real
    except:
        return None, None, "FAILED", np.nan


def plot_bifurcation_analysis(best_params, save_path='bifurcation_analysis_no5nm.png'):
    """Plot bifurcation diagrams"""
    print("\nGenerating bifurcation analysis...")

    param_indices = [0, 4, 6, 7, 11, 12]  # ka1, la, lm, delta, TIR1_T, alpha_0_IAA

    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()

    for idx, param_idx in enumerate(param_indices):
        ax = axes[idx]
        param_name = all_param_names[param_idx]
        best_val = best_params[param_idx]

        # Wider range for bifurcation
        param_range = np.logspace(np.log10(best_val / 5), np.log10(best_val * 5), 60)

        steady_states = []
        stabilities = []

        for val in param_range:
            params_test = best_params.copy()
            params_test[param_idx] = val

            kinetic = params_test[:12]
            y_ss, _, stability, _ = analyze_stability(kinetic, params_test[12], params_test[13])

            if y_ss is not None:
                steady_states.append(y_ss[-1])
                stabilities.append(stability)
            else:
                steady_states.append(np.nan)
                stabilities.append("FAILED")

        colors = ['green' if s == 'STABLE' else 'red' if s == 'UNSTABLE' else 'gray'
                  for s in stabilities]

        ax.scatter(param_range, steady_states, c=colors, s=20, alpha=0.7)
        ax.plot(param_range, steady_states, 'b-', alpha=0.3, lw=1)
        ax.axvline(best_val, color='red', ls='--', lw=2, label='Best fit')

        ax.set_xscale('log')
        ax.set_xlabel(param_name, fontsize=11)
        ax.set_ylabel('VENUS SS', fontsize=11)
        ax.set_title(f'{param_name}', fontsize=12, fontweight='bold')
        ax.grid(alpha=0.3)
        ax.legend(fontsize=9)

    plt.suptitle('Bifurcation Analysis (Green=Stable, Red=Unstable, 5nM PAA removed)',
                fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")


# ==============================================================================
# ELASTICITY HEATMAP
# ==============================================================================

def compute_steady_state_elasticity(params, epsilon=1e-4):
    """Compute elasticity at steady state"""
    kinetic = params[:12]
    y_ss_base = initial_conditions(kinetic, params[12], params[13])
    if y_ss_base is None:
        return None
    y_ss_base = np.array(y_ss_base)

    n_params = len(params)
    n_states = len(y_ss_base)
    elasticity = np.zeros((n_states, n_params))

    for i in range(n_params):
        params_pert = params.copy()
        params_pert[i] *= (1 + epsilon)

        kinetic_pert = params_pert[:12]
        y_ss_pert = initial_conditions(kinetic_pert, params_pert[12], params_pert[13])

        if y_ss_pert is not None:
            y_ss_pert = np.array(y_ss_pert)
            dy = y_ss_pert - y_ss_base
            dtheta = epsilon * params[i]

            for j in range(n_states):
                if y_ss_base[j] > 1e-10:
                    elasticity[j, i] = (dy[j] / dtheta) * (params[i] / y_ss_base[j])

    return elasticity


def plot_elasticity_heatmap(best_params, save_path='elasticity_heatmap_no5nm.png'):
    """Plot elasticity heatmap"""
    print("\nGenerating elasticity heatmap...")

    ss_elasticity = compute_steady_state_elasticity(best_params)

    if ss_elasticity is None:
        print("Could not compute elasticity")
        return

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 10))

    # Heatmap
    vmax = np.abs(ss_elasticity).max()
    im1 = ax1.imshow(ss_elasticity, cmap='RdBu_r', aspect='auto', vmin=-vmax, vmax=vmax)
    ax1.set_yticks(range(len(STATE_NAMES)))
    ax1.set_yticklabels(STATE_NAMES, fontsize=10)
    ax1.set_xticks(range(len(all_param_names)))
    ax1.set_xticklabels(all_param_names, rotation=90, fontsize=9)
    ax1.set_title('Elasticity: ε = ∂ln(y)/∂ln(θ)', fontsize=12, fontweight='bold')
    plt.colorbar(im1, ax=ax1, label='Elasticity')

    # VENUS ranking
    venus_elast = ss_elasticity[-1, :]
    sorted_idx = np.argsort(np.abs(venus_elast))[::-1]
    colors = ['steelblue' if v > 0 else 'coral' for v in venus_elast[sorted_idx]]

    ax2.barh(range(len(all_param_names)), venus_elast[sorted_idx], color=colors,
            edgecolor='black', alpha=0.8)
    ax2.set_yticks(range(len(all_param_names)))
    ax2.set_yticklabels([all_param_names[i] for i in sorted_idx], fontsize=10)
    ax2.axvline(0, color='black', lw=1)
    ax2.set_xlabel('Elasticity', fontsize=11)
    ax2.set_title('VENUS Elasticity (Ranked)', fontsize=12, fontweight='bold')
    ax2.grid(alpha=0.3, axis='x')

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")


# ==============================================================================
# MODEL FIT PLOT
# ==============================================================================

def plot_model_fit(best_params, t_eval, data_matrix, save_path='model_fit_no5nm.png'):
    """Plot model fit (8 treatments)"""
    print("\nGenerating model fit plot...")

    kinetic = best_params[:12]
    treatments = build_treatments(best_params[12:])

    fig, axes = plt.subplots(2, 4, figsize=(16, 8))
    axes = axes.flatten()
    colors = plt.cm.tab10(np.linspace(0, 1, 8))

    for j in range(8):
        ax = axes[j]
        alpha_I_list, alpha_P_list, t_switch_list = treatments[j]

        Vsim = simulate_dataset(kinetic, alpha_I_list, alpha_P_list, t_switch_list, t_eval)
        Vdata = data_matrix[:, j]

        ax.plot(t_eval, Vdata, 'o', color=colors[j], markersize=8, alpha=0.7, label='Data')
        ax.plot(t_eval, Vsim, '-', color=colors[j], linewidth=2, label='Model')

        if j >= 5:  # Sequential treatments
            ax.axvline(30, color='gray', ls='--', alpha=0.5)

        ax.set_xlabel('Time (min)')
        ax.set_ylabel('VENUS')
        ax.set_title(labels[j], fontweight='bold')
        ax.set_xlim(-2, 62)
        ax.set_ylim(0, 1.3)
        ax.grid(alpha=0.3)
        if j == 0:
            ax.legend(fontsize=8)

    plt.suptitle('Model Fit to Data (5nM PAA removed, 8 treatments)', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")


# ==============================================================================
# MAIN
# ==============================================================================

if __name__ == "__main__":
    print("="*70)
    print("IAA/PAA MODEL - IMPROVED MCMC (5nM PAA REMOVED)")
    print("="*70)
    print("18 parameters: 12 kinetic + 6 alpha")
    print("8 treatments: 100iaa, control, 50paa, 500paa, 5upaa,")
    print("              50then100, 500then100, 5uthen100")

    # 1. Parameter Estimation (more guesses for wider bounds)
    best_params, best_cost = estimate_parameters_parallel(
        t_eval, data_matrix, num_samples=50, n_cores=None)

    if best_params is None:
        print("Estimation failed!")
        exit(1)

    np.savetxt('best_parameters_no5nm.txt', best_params,
               header='Parameters (5nM removed): ' + ', '.join(all_param_names))

    # 2. Model Fit
    plot_model_fit(best_params, t_eval, data_matrix)

    # 3. MCMC with log-normal priors
    # prior_width: 0.5=tight, 1.0=moderate, 1.5=wide
    chain, log_posts, all_chains = run_improved_mcmc(
        best_params, t_eval, data_matrix,
        n_iterations=15000, burn_in=5000, thin=2,
        prior_width=1.0,  # Moderate prior - allows exploration but not too far
        n_chains=1)

    # 4. Diagnostics
    burn_in_idx = 5000 // 2  # Adjusted for thinning
    ess, post_samples = plot_mcmc_diagnostics(chain, log_posts, burn_in_idx, best_params)

    # 5. Bifurcation
    plot_bifurcation_analysis(best_params)

    # 6. Elasticity
    plot_elasticity_heatmap(best_params)

    print("\n" + "="*70)
    print("COMPLETE!")
    print("="*70)
    print("\nFiles generated:")
    print("  - best_parameters_no5nm.txt")
    print("  - model_fit_no5nm.png")
    print("  - mcmc_diagnostics_no5nm.png")
    print("  - bifurcation_analysis_no5nm.png")
    print("  - elasticity_heatmap_no5nm.png")
