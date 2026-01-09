import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares, minimize
from scipy.stats.qmc import LatinHypercube
from scipy.linalg import eig
import matplotlib.pyplot as plt
import matplotlib as mpl
from matplotlib.gridspec import GridSpec
import seaborn as sns
import warnings
import multiprocessing as mp
from functools import partial
import emcee
from SALib.sample import saltelli
from SALib.analyze import sobol
import corner
import time

# Suppress excessive warnings
warnings.filterwarnings('ignore', category=RuntimeWarning)

# ------------------------------
# Experimental data (VENUS fold change) - Updated (removed 50µM PAA conditions)
# ------------------------------
# Columns: 100iaa, 5paa, control, 50paa, 500paa, 5upaa,
#          5then100, 50then100, 500then100, 5uthen100
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

# Treatment labels (removed 50upaa and 50uthen100)
labels = ['100iaa', '5paa', 'control', '50paa', '500paa', '5upaa',
          '5then100', '50then100', '500then100', '5uthen100']

# Time points (0-60 min, 4 min intervals)
t_eval = np.arange(0, 61, 4)

# Parameter names
kinetic_names = ['ka1', 'kd1', 'ka2', 'kd2', 'la', 'ld', 'lm',
                 'delta', 'mu1', 'mu2', 'lam', 'TIR1_T']
alpha_names = ['alpha_0_IAA', 'alpha_0_PAA', 'alpha_IAA_100nM',
               'alpha_PAA_5nM', 'alpha_PAA_50nM', 'alpha_PAA_500nM',
               'alpha_PAA_5uM']
all_param_names = kinetic_names + alpha_names

# ------------------------------
# Full IAA+PAA ODE Model
# ------------------------------
def IAA_PAA_model(t, y, params, alpha_I, alpha_P):
    """
    ODE model for IAA and PAA dynamics

    States: [IAA, TIR1, IAATIR1, PAA, PAATIR1, IAATIR1VENUS, VENUS]
    """
    (ka1, kd1, ka2, kd2, la, ld, lm, delta, mu1, mu2, lam, TIR1_T) = params

    IAA, TIR1, IAATIR1, PAA, PAATIR1, IAATIR1VENUS, VENUS = y

    # Add small epsilon to prevent division by zero and ensure positivity
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

# ------------------------------
# Initial conditions at steady state
# ------------------------------
def initial_conditions(params, alpha_0_IAA, alpha_0_PAA):
    """
    Calculate steady-state initial conditions based on baseline influx rates
    """
    ka1, kd1, ka2, kd2, la, ld, lm, delta, mu1, mu2, lam, TIR1_T = params

    epsilon = 1e-12

    # Steady state values with baseline influx
    IAA_ss = alpha_0_IAA / (mu1 + epsilon)
    PAA_ss = alpha_0_PAA / (mu2 + epsilon)

    # Complex steady state expressions
    denominator = (kd2*mu2*kd1*mu1) + (ka2*alpha_0_PAA*kd1*mu1) + (ka1*alpha_0_IAA*kd2*mu2) + epsilon

    TIR1_ss = ((lm*TIR1_T - delta) * kd1 * mu1) / (lm * denominator)

    IAA_TIR1_ss = ((lm*TIR1_T - delta) * ka1 * alpha_0_IAA) / (lm * denominator)

    PAA_TIR1_ss = ((ka2 * alpha_0_PAA) / (kd2 * mu2 + epsilon)) * ((lm*TIR1_T - delta) * kd1 * mu1) / (lm * denominator)

    IAA_TIR1_VENUS_ss = delta / (lm + epsilon)

    VENUS_ss = (delta * (ld + lm) * denominator) / (la * ka1 * alpha_0_IAA * (lm*TIR1_T - delta) + epsilon)

    # Ensure all values are positive
    return [max(val, epsilon) for val in [IAA_ss, TIR1_ss, IAA_TIR1_ss, PAA_ss, PAA_TIR1_ss, IAA_TIR1_VENUS_ss, VENUS_ss]]

# ------------------------------
# Simulate a dataset (handles influx switching)
# ------------------------------
def simulate_dataset(params, alpha_I_list, alpha_P_list, t_switch_list, t_eval):
    """
    Simulate VENUS trajectory with time-dependent influx rates
    """
    # Get baseline influx for initial conditions (first values in the lists)
    alpha_0_IAA = alpha_I_list[0][1]
    alpha_0_PAA = alpha_P_list[0][1]

    # Calculate initial conditions at steady state with baseline influx
    try:
        y0 = initial_conditions(params, alpha_0_IAA, alpha_0_PAA)
        VENUS_0 = y0[-1]  # Initial VENUS value for normalization
    except:
        return np.full(len(t_eval), np.nan)

    # Simulate with piecewise constant influx rates
    all_t = []
    all_VENUS = []

    current_y = y0

    for i in range(len(t_switch_list)):
        t_start = t_switch_list[i]
        t_end = t_switch_list[i+1] if i+1 < len(t_switch_list) else t_eval[-1]

        # Get influx rates for this time segment
        alpha_I = alpha_I_list[i][1]
        alpha_P = alpha_P_list[i][1]

        # Time points in this segment
        t_segment = t_eval[(t_eval >= t_start) & (t_eval <= t_end)]

        if len(t_segment) > 0:
            try:
                # Solve ODE for this segment
                sol = solve_ivp(
                    IAA_PAA_model,
                    [t_start, t_end],
                    current_y,
                    t_eval=t_segment,
                    args=(params, alpha_I, alpha_P),
                    method="BDF",
                    rtol=1e-6,
                    atol=1e-8
                )

                if not sol.success:
                    return np.full(len(t_eval), np.nan)

                all_t.extend(sol.t)
                all_VENUS.extend(sol.y[-1])  # VENUS is the last state

                # Update initial condition for next segment
                if i+1 < len(t_switch_list):
                    current_y = sol.y[:, -1]

            except Exception as e:
                return np.full(len(t_eval), np.nan)

    # Normalize by initial VENUS value
    VENUS_normalized = np.array(all_VENUS) / VENUS_0

    # Check for NaN or Inf values
    if np.any(~np.isfinite(VENUS_normalized)):
        return np.full(len(t_eval), np.nan)

    return VENUS_normalized

# ------------------------------
# Build treatment configurations from parameters
# ------------------------------
def build_treatments(alpha_params):
    """
    Build treatment configurations from influx parameters
    (Updated: removed 50µM PAA treatments)
    """
    (alpha_0_IAA, alpha_0_PAA, alpha_IAA_100nM,
     alpha_PAA_5nM, alpha_PAA_50nM, alpha_PAA_500nM,
     alpha_PAA_5uM) = alpha_params

    treatments = []

    # Treatment 0: 100nM IAA only
    treatments.append((
        [(0, alpha_IAA_100nM)],
        [(0, alpha_0_PAA)],
        [0]
    ))

    # Treatment 1: 5nM PAA only
    treatments.append((
        [(0, alpha_0_IAA)],
        [(0, alpha_PAA_5nM)],
        [0]
    ))

    # Treatment 2: Control (baseline)
    treatments.append((
        [(0, alpha_0_IAA)],
        [(0, alpha_0_PAA)],
        [0]
    ))

    # Treatment 3: 50nM PAA only
    treatments.append((
        [(0, alpha_0_IAA)],
        [(0, alpha_PAA_50nM)],
        [0]
    ))

    # Treatment 4: 500nM PAA only
    treatments.append((
        [(0, alpha_0_IAA)],
        [(0, alpha_PAA_500nM)],
        [0]
    ))

    # Treatment 5: 5µM PAA only
    treatments.append((
        [(0, alpha_0_IAA)],
        [(0, alpha_PAA_5uM)],
        [0]
    ))

    # Treatment 6: 5nM PAA for 30min, then add 100nM IAA
    treatments.append((
        [(0, alpha_0_IAA), (30, alpha_IAA_100nM)],
        [(0, alpha_PAA_5nM), (30, alpha_PAA_5nM)],
        [0, 30]
    ))

    # Treatment 7: 50nM PAA for 30min, then add 100nM IAA
    treatments.append((
        [(0, alpha_0_IAA), (30, alpha_IAA_100nM)],
        [(0, alpha_PAA_50nM), (30, alpha_PAA_50nM)],
        [0, 30]
    ))

    # Treatment 8: 500nM PAA for 30min, then add 100nM IAA
    treatments.append((
        [(0, alpha_0_IAA), (30, alpha_IAA_100nM)],
        [(0, alpha_PAA_500nM), (30, alpha_PAA_500nM)],
        [0, 30]
    ))

    # Treatment 9: 5µM PAA for 30min, then add 100nM IAA
    treatments.append((
        [(0, alpha_0_IAA), (30, alpha_IAA_100nM)],
        [(0, alpha_PAA_5uM), (30, alpha_PAA_5uM)],
        [0, 30]
    ))

    return treatments

# ------------------------------
# Objective function
# ------------------------------
def objective(all_params, t_eval, data_matrix):
    """
    Objective function for parameter estimation
    (Updated: 10 treatments, 7 influx parameters)
    """
    # Unpack parameters
    kinetic = all_params[:12]  # 12 kinetic parameters
    alpha_params = all_params[12:]  # 7 influx parameters

    # Build all treatments
    treatments = build_treatments(alpha_params)

    # Calculate residuals
    total_err = []

    for j in range(10):  # 10 treatments (removed 50µM PAA conditions)
        alpha_I_list, alpha_P_list, t_switch_list = treatments[j]

        Vsim = simulate_dataset(kinetic, alpha_I_list, alpha_P_list, t_switch_list, t_eval)
        Vdata = data_matrix[:, j]

        # For "then" treatments (6-9), only fit data from t=32 onwards
        if j >= 6:
            valid_idx = t_eval >= 32
            Vsim_valid = Vsim[valid_idx]
            Vdata_valid = Vdata[valid_idx]

            if np.any(~np.isfinite(Vsim_valid)):
                total_err.extend([100.0] * np.sum(valid_idx))
            else:
                residuals = Vsim_valid - Vdata_valid
                total_err.extend(residuals)
        else:
            # For constant treatments, fit all time points
            if np.any(~np.isfinite(Vsim)):
                total_err.extend([100.0] * len(t_eval))
            else:
                residuals = Vsim - Vdata
                total_err.extend(residuals)

    return np.array(total_err)

# ------------------------------
# Parallel wrapper for least squares
# ------------------------------
def fit_single_guess(guess, bounds, t_eval, data_matrix):
    """Worker function for parallel parameter estimation"""
    try:
        result = least_squares(
            objective,
            guess,
            bounds=(bounds[0], bounds[1]),
            args=(t_eval, data_matrix),
            method='trf',
            max_nfev=1000,
            verbose=0,
            ftol=1e-6,
            xtol=1e-6,
        )
        return (result.cost, result.x, result.success)
    except Exception as e:
        return (np.inf, guess, False)

# ------------------------------
# Parameter estimation with multiprocessing
# ------------------------------
def estimate_parameters_parallel(t_eval, data_matrix, num_samples=30, n_cores=None):
    """
    Estimate parameters using multiple initial guesses with parallel processing
    """
    if n_cores is None:
        n_cores = mp.cpu_count()

    print(f"Using {n_cores} CPU cores for parallel optimization")

    # Parameter bounds (12 kinetic + 7 influx = 19 total)
    param_bounds = [
        # Kinetic parameters
        (1e-3, 20),   # ka1
        (1e-3, 20),   # kd1
        (1e-3, 20),   # ka2
        (1e-3, 20),   # kd2
        (1e-3, 20),   # la
        (1e-3, 20),   # ld
        (1e-3, 5),    # lm
        (1e-3, 20),   # delta
        (1e-3, 5),    # mu1
        (1e-3, 5),    # mu2
        (1e-3, 5),    # lam
        (1, 50),      # TIR1_T
        # Influx parameters (removed alpha_PAA_50uM)
        (0.1, 100),   # alpha_0_IAA
        (0.1, 100),   # alpha_0_PAA
        (0.1, 100),   # alpha_IAA_100nM
        (0.1, 100),   # alpha_PAA_5nM
        (0.1, 100),   # alpha_PAA_50nM
        (0.1, 100),   # alpha_PAA_500nM
        (0.1, 100),   # alpha_PAA_5uM
    ]

    # Generate initial guesses using Latin Hypercube Sampling
    sampler = LatinHypercube(d=len(param_bounds))
    lhs_samples = sampler.random(n=num_samples)

    lower_bounds = np.array([b[0] for b in param_bounds])
    upper_bounds = np.array([b[1] for b in param_bounds])
    initial_guesses = lhs_samples * (upper_bounds - lower_bounds) + lower_bounds

    print(f"Running parameter estimation with {num_samples} initial guesses...")
    print(f"Total parameters: 12 kinetic + 7 influx = 19")

    # Create partial function with fixed arguments
    worker_func = partial(fit_single_guess,
                         bounds=(lower_bounds, upper_bounds),
                         t_eval=t_eval,
                         data_matrix=data_matrix)

    # Run parallel optimization
    start_time = time.time()
    with mp.Pool(processes=n_cores) as pool:
        results = pool.map(worker_func, initial_guesses)
    elapsed_time = time.time() - start_time

    print(f"\nCompleted in {elapsed_time:.2f} seconds")

    # Find best result
    best_cost = np.inf
    best_params = None

    for i, (cost, params, success) in enumerate(results):
        print(f"Attempt {i+1}/{num_samples}: Cost = {cost:.4f}, Success = {success}")
        if success and cost < best_cost:
            best_cost = cost
            best_params = params

    print(f"\nBest cost achieved: {best_cost:.6f}")

    return best_params, best_cost

# ------------------------------
# MCMC Log Probability
# ------------------------------
def log_prior(params, lower_bounds, upper_bounds):
    """Uniform prior within bounds"""
    if np.all((params >= lower_bounds) & (params <= upper_bounds)):
        return 0.0
    return -np.inf

def log_likelihood(params, t_eval, data_matrix):
    """Log likelihood assuming Gaussian noise"""
    residuals = objective(params, t_eval, data_matrix)

    # Check for invalid residuals
    if np.any(~np.isfinite(residuals)) or np.any(np.abs(residuals) > 50):
        return -np.inf

    # Assume constant noise (can be refined)
    sigma = 0.05  # Estimated measurement noise
    log_like = -0.5 * np.sum((residuals / sigma)**2) - len(residuals) * np.log(sigma * np.sqrt(2 * np.pi))

    return log_like

def log_probability(params, lower_bounds, upper_bounds, t_eval, data_matrix):
    """Log posterior = log prior + log likelihood"""
    lp = log_prior(params, lower_bounds, upper_bounds)
    if not np.isfinite(lp):
        return -np.inf
    return lp + log_likelihood(params, t_eval, data_matrix)

# ------------------------------
# MCMC Sampling with emcee
# ------------------------------
def run_mcmc(initial_params, t_eval, data_matrix, param_bounds,
             nwalkers=48, nsteps=5000, burn_in=1000):
    """
    Run MCMC sampling using emcee

    Note: nwalkers must be at least 2 * ndim (40 for 20 parameters)
    Default is 48 walkers for better exploration
    """
    print("\n" + "="*70)
    print("RUNNING MCMC SAMPLING")
    print("="*70)

    ndim = len(initial_params)
    lower_bounds = np.array([b[0] for b in param_bounds])
    upper_bounds = np.array([b[1] for b in param_bounds])

    # Ensure we have enough walkers (emcee requires at least 2 * ndim)
    min_walkers = 2 * ndim
    if nwalkers < min_walkers:
        print(f"Warning: nwalkers={nwalkers} is less than 2*ndim={min_walkers}")
        print(f"Increasing nwalkers to {min_walkers}")
        nwalkers = min_walkers

    # Initialize walkers around the best-fit parameters
    pos = initial_params + 1e-2 * np.random.randn(nwalkers, ndim) * initial_params

    # Ensure all walkers are within bounds
    pos = np.clip(pos, lower_bounds, upper_bounds)

    # Set up the sampler
    sampler = emcee.EnsembleSampler(
        nwalkers, ndim, log_probability,
        args=(lower_bounds, upper_bounds, t_eval, data_matrix)
    )

    print(f"Running {nwalkers} walkers for {nsteps} steps...")
    print(f"Burn-in: {burn_in} steps")

    # Run MCMC
    start_time = time.time()
    sampler.run_mcmc(pos, nsteps, progress=True)
    elapsed_time = time.time() - start_time

    print(f"\nMCMC completed in {elapsed_time:.2f} seconds")
    print(f"Mean acceptance fraction: {np.mean(sampler.acceptance_fraction):.3f}")

    # Discard burn-in
    samples = sampler.get_chain(discard=burn_in, flat=True)
    log_prob_samples = sampler.get_log_prob(discard=burn_in, flat=True)

    print(f"Total samples after burn-in: {samples.shape[0]}")

    return sampler, samples, log_prob_samples

# ------------------------------
# Fisher Information Matrix and Eigenvalues
# ------------------------------
def compute_fisher_information(params, t_eval, data_matrix, epsilon=1e-6):
    """
    Compute Fisher Information Matrix using finite differences
    """
    print("\nComputing Fisher Information Matrix...")

    ndim = len(params)
    fisher = np.zeros((ndim, ndim))

    # Compute Jacobian numerically
    residuals_0 = objective(params, t_eval, data_matrix)
    jacobian = np.zeros((len(residuals_0), ndim))

    for i in range(ndim):
        params_plus = params.copy()
        params_plus[i] += epsilon
        residuals_plus = objective(params_plus, t_eval, data_matrix)

        jacobian[:, i] = (residuals_plus - residuals_0) / epsilon

    # Fisher Information Matrix = J^T @ J (for Gaussian noise)
    sigma = 0.05
    fisher = (jacobian.T @ jacobian) / (sigma**2)

    # Compute eigenvalues
    eigenvalues, eigenvectors = eig(fisher)
    eigenvalues = np.real(eigenvalues)
    eigenvalues = np.sort(eigenvalues)[::-1]  # Sort descending

    print(f"Eigenvalue range: {eigenvalues.min():.2e} to {eigenvalues.max():.2e}")
    print(f"Condition number: {eigenvalues.max() / max(eigenvalues.min(), 1e-10):.2e}")

    return fisher, eigenvalues

# ------------------------------
# Profile Likelihood
# ------------------------------
def compute_profile_likelihood(best_params, param_idx, t_eval, data_matrix,
                               param_bounds, n_points=20):
    """
    Compute profile likelihood for a single parameter
    """
    lower_bounds = np.array([b[0] for b in param_bounds])
    upper_bounds = np.array([b[1] for b in param_bounds])

    param_name = all_param_names[param_idx]
    best_val = best_params[param_idx]

    # Create range around best value
    param_min = max(lower_bounds[param_idx], best_val * 0.5)
    param_max = min(upper_bounds[param_idx], best_val * 1.5)
    param_range = np.linspace(param_min, param_max, n_points)

    likelihoods = []

    for val in param_range:
        # Fix this parameter, optimize others
        fixed_params = best_params.copy()
        fixed_params[param_idx] = val

        # Quick evaluation (no re-optimization for speed)
        residuals = objective(fixed_params, t_eval, data_matrix)
        log_like = -0.5 * np.sum(residuals**2) / (0.05**2)
        likelihoods.append(log_like)

    return param_range, np.array(likelihoods)

# ------------------------------
# Elasticity Analysis
# ------------------------------
def compute_elasticity(params, t_eval, data_matrix, treatment_idx=0, epsilon=1e-6):
    """
    Compute elasticity coefficients: (dOutput/dParam) * (Param/Output)
    """
    print(f"\nComputing elasticity for treatment {labels[treatment_idx]}...")

    kinetic = params[:12]
    alpha_params = params[12:]
    treatments = build_treatments(alpha_params)

    alpha_I_list, alpha_P_list, t_switch_list = treatments[treatment_idx]

    # Baseline simulation
    output_0 = simulate_dataset(kinetic, alpha_I_list, alpha_P_list, t_switch_list, t_eval)

    if np.any(~np.isfinite(output_0)):
        return np.zeros((len(params), len(t_eval)))

    elasticity_matrix = np.zeros((len(params), len(t_eval)))

    for i in range(len(params)):
        params_pert = params.copy()
        params_pert[i] += epsilon

        if i < 12:
            kinetic_pert = params_pert[:12]
            output_pert = simulate_dataset(kinetic_pert, alpha_I_list, alpha_P_list, t_switch_list, t_eval)
        else:
            alpha_params_pert = params_pert[12:]
            treatments_pert = build_treatments(alpha_params_pert)
            alpha_I_list_pert, alpha_P_list_pert, t_switch_list_pert = treatments_pert[treatment_idx]
            output_pert = simulate_dataset(kinetic, alpha_I_list_pert, alpha_P_list_pert, t_switch_list_pert, t_eval)

        if np.any(~np.isfinite(output_pert)):
            continue

        # Elasticity: (dY/dP) * (P/Y)
        dOutput_dParam = (output_pert - output_0) / epsilon
        elasticity = dOutput_dParam * params[i] / (output_0 + 1e-12)

        elasticity_matrix[i, :] = elasticity

    return elasticity_matrix

# ------------------------------
# Sobol Sensitivity Analysis
# ------------------------------
def run_sobol_analysis(param_bounds, t_eval, data_matrix, n_samples=1024):
    """
    Global sensitivity analysis using Sobol indices
    """
    print("\n" + "="*70)
    print("RUNNING SOBOL SENSITIVITY ANALYSIS")
    print("="*70)

    # Define problem
    problem = {
        'num_vars': len(param_bounds),
        'names': all_param_names,
        'bounds': param_bounds
    }

    # Generate samples
    print(f"Generating {n_samples} Saltelli samples...")
    param_values = saltelli.sample(problem, n_samples, calc_second_order=False)

    print(f"Total evaluations: {param_values.shape[0]}")

    # Evaluate model for each sample (using sum of squared residuals as output)
    Y = np.zeros(param_values.shape[0])

    for i, params in enumerate(param_values):
        if i % 100 == 0:
            print(f"Evaluating sample {i}/{param_values.shape[0]}...")

        residuals = objective(params, t_eval, data_matrix)
        Y[i] = np.sum(residuals**2)  # Total sum of squared errors

    # Perform Sobol analysis
    print("\nComputing Sobol indices...")
    Si = sobol.analyze(problem, Y, calc_second_order=False, print_to_console=False)

    return Si

# ------------------------------
# Bifurcation Analysis
# ------------------------------
def bifurcation_analysis(best_params, param_idx, param_range):
    """
    Simple bifurcation analysis: steady state vs parameter
    """
    print(f"\nPerforming bifurcation analysis for {all_param_names[param_idx]}...")

    kinetic = best_params[:12]
    alpha_params = best_params[12:]

    steady_states = []

    for val in param_range:
        params_test = best_params.copy()
        params_test[param_idx] = val

        if param_idx < 12:
            # Kinetic parameter
            kinetic_test = params_test[:12]
        else:
            # Influx parameter
            alpha_params_test = params_test[12:]
            kinetic_test = kinetic

        # Compute steady state VENUS for control condition
        try:
            alpha_0_IAA = params_test[12]
            alpha_0_PAA = params_test[13]
            y_ss = initial_conditions(kinetic_test, alpha_0_IAA, alpha_0_PAA)
            VENUS_ss = y_ss[-1]
            steady_states.append(VENUS_ss)
        except:
            steady_states.append(np.nan)

    return np.array(steady_states)

# ==============================
# PLOTTING FUNCTIONS
# ==============================

def plot_mcmc_traces(sampler, burn_in=1000, save_path='mcmc_traces.png'):
    """Plot MCMC parameter traces"""
    print("\nGenerating MCMC trace plots...")

    samples = sampler.get_chain()
    n_params = len(all_param_names)

    fig, axes = plt.subplots(n_params, 1, figsize=(12, 2.5*n_params))

    for i in range(n_params):
        ax = axes[i]
        for j in range(samples.shape[1]):  # For each walker
            ax.plot(samples[:, j, i], alpha=0.3, lw=0.5)
        ax.axvline(burn_in, color='r', linestyle='--', label='Burn-in')
        ax.set_ylabel(all_param_names[i], fontsize=10)
        ax.set_xlim(0, samples.shape[0])
        if i == 0:
            ax.legend()
        if i < n_params - 1:
            ax.set_xticks([])

    axes[-1].set_xlabel("Step", fontsize=12)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_log_posterior(sampler, burn_in=1000, save_path='log_posterior.png'):
    """Plot log posterior evolution"""
    print("\nGenerating log posterior plot...")

    log_prob = sampler.get_log_prob()

    fig, ax = plt.subplots(figsize=(10, 4))

    for i in range(log_prob.shape[1]):
        ax.plot(log_prob[:, i], alpha=0.3, lw=0.5)

    ax.axvline(burn_in, color='r', linestyle='--', label='Burn-in', lw=2)
    ax.set_xlabel("Step", fontsize=14)
    ax.set_ylabel("Log Posterior", fontsize=14)
    ax.set_title("MCMC Log Posterior Evolution", fontsize=16, fontweight='bold')
    ax.legend()

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_parameter_diagnostics(sampler, burn_in=1000, save_path='parameter_diagnostics.png'):
    """
    Plot comprehensive diagnostics for each parameter:
    - Column 1: MCMC trace
    - Column 2: Posterior histogram
    - Column 3: Autocorrelation
    """
    print("\nGenerating comprehensive parameter diagnostics...")

    # Get samples after burn-in
    chain = sampler.get_chain()
    flat_samples = sampler.get_chain(discard=burn_in, flat=True)
    n_params = len(all_param_names)

    # Compute autocorrelation function
    def compute_autocorr(x, maxlag=50):
        """Compute autocorrelation for a 1D array"""
        x = x - np.mean(x)
        autocorr = np.correlate(x, x, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        autocorr = autocorr / autocorr[0]
        return autocorr[:min(maxlag, len(autocorr))]

    # Create figure with subplots
    fig = plt.figure(figsize=(18, 2.5*n_params))
    gs = GridSpec(n_params, 3, figure=fig, hspace=0.4, wspace=0.3)

    for i in range(n_params):
        # Column 1: Trace plot
        ax1 = fig.add_subplot(gs[i, 0])
        for j in range(chain.shape[1]):  # For each walker
            ax1.plot(chain[:, j, i], alpha=0.3, lw=0.5, color='steelblue')
        ax1.axvline(burn_in, color='red', linestyle='--', lw=1.5, alpha=0.7)
        ax1.set_ylabel(all_param_names[i], fontsize=10, fontweight='bold')
        ax1.set_xlim(0, chain.shape[0])
        if i == 0:
            ax1.set_title('MCMC Trace', fontsize=12, fontweight='bold')
        if i < n_params - 1:
            ax1.set_xticklabels([])
        else:
            ax1.set_xlabel('Step', fontsize=10)
        ax1.grid(alpha=0.3)

        # Column 2: Posterior histogram
        ax2 = fig.add_subplot(gs[i, 1])
        ax2.hist(flat_samples[:, i], bins=50, color='steelblue',
                 alpha=0.7, edgecolor='black', density=True)

        # Add mean and credible intervals
        mean_val = np.mean(flat_samples[:, i])
        q16, q84 = np.percentile(flat_samples[:, i], [16, 84])
        ax2.axvline(mean_val, color='red', linestyle='-', lw=2, label=f'Mean: {mean_val:.3f}')
        ax2.axvline(q16, color='orange', linestyle='--', lw=1.5, alpha=0.7)
        ax2.axvline(q84, color='orange', linestyle='--', lw=1.5, alpha=0.7)
        ax2.fill_betweenx([0, ax2.get_ylim()[1]], q16, q84, alpha=0.2, color='orange',
                          label=f'68% CI: [{q16:.3f}, {q84:.3f}]')

        if i == 0:
            ax2.set_title('Posterior Distribution', fontsize=12, fontweight='bold')
        ax2.set_xlabel(all_param_names[i], fontsize=9)
        ax2.set_ylabel('Density', fontsize=9)
        ax2.legend(fontsize=7, loc='best')
        ax2.grid(alpha=0.3)

        # Column 3: Autocorrelation
        ax3 = fig.add_subplot(gs[i, 2])

        # Compute autocorrelation for all walkers and average
        maxlag = 100
        autocorrs = []
        for j in range(chain.shape[1]):
            # Use samples after burn-in for autocorrelation
            samples_walker = chain[burn_in:, j, i]
            if len(samples_walker) > maxlag:
                autocorr = compute_autocorr(samples_walker, maxlag)
                autocorrs.append(autocorr)

        if autocorrs:
            mean_autocorr = np.mean(autocorrs, axis=0)
            std_autocorr = np.std(autocorrs, axis=0)
            lags = np.arange(len(mean_autocorr))

            ax3.plot(lags, mean_autocorr, 'o-', color='steelblue', lw=2, markersize=3)
            ax3.fill_between(lags, mean_autocorr - std_autocorr, mean_autocorr + std_autocorr,
                            alpha=0.3, color='steelblue')
            ax3.axhline(0, color='black', linestyle='-', lw=0.8, alpha=0.5)
            ax3.axhline(0.1, color='red', linestyle='--', lw=1, alpha=0.5, label='Threshold=0.1')

            # Find autocorrelation length (where it crosses 0.1)
            try:
                acorr_length = np.where(mean_autocorr < 0.1)[0][0]
                ax3.text(0.95, 0.95, f'τ ≈ {acorr_length}',
                        transform=ax3.transAxes, fontsize=8,
                        verticalalignment='top', horizontalalignment='right',
                        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            except:
                pass

        if i == 0:
            ax3.set_title('Autocorrelation', fontsize=12, fontweight='bold')
        ax3.set_xlabel('Lag', fontsize=9)
        ax3.set_ylabel('ACF', fontsize=9)
        ax3.set_ylim(-0.1, 1.1)
        ax3.legend(fontsize=7, loc='best')
        ax3.grid(alpha=0.3)

    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_eigenvalues(eigenvalues, save_path='eigenvalues.png'):
    """Plot eigenvalues of Fisher Information Matrix"""
    print("\nGenerating eigenvalue plot...")

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

    # Linear scale
    ax1.bar(range(len(eigenvalues)), eigenvalues, color='steelblue', edgecolor='black')
    ax1.set_xlabel("Eigenvalue Index", fontsize=12)
    ax1.set_ylabel("Eigenvalue", fontsize=12)
    ax1.set_title("Fisher Information Matrix Eigenvalues", fontsize=14, fontweight='bold')

    # Log scale
    ax2.bar(range(len(eigenvalues)), eigenvalues, color='steelblue', edgecolor='black')
    ax2.set_yscale('log')
    ax2.set_xlabel("Eigenvalue Index", fontsize=12)
    ax2.set_ylabel("Eigenvalue (log scale)", fontsize=12)
    ax2.set_title("Fisher Information Matrix Eigenvalues (Log)", fontsize=14, fontweight='bold')

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_correlation_matrix(samples, save_path='correlation_matrix.png'):
    """Plot parameter correlation matrix"""
    print("\nGenerating correlation matrix...")

    corr_matrix = np.corrcoef(samples.T)
    n_params = len(all_param_names)

    fig, ax = plt.subplots(figsize=(14, 12))

    im = ax.imshow(corr_matrix, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')

    ax.set_xticks(range(n_params))
    ax.set_yticks(range(n_params))
    ax.set_xticklabels(all_param_names, rotation=90, fontsize=10)
    ax.set_yticklabels(all_param_names, fontsize=10)

    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Correlation', fontsize=12)

    # Add correlation values
    for i in range(n_params):
        for j in range(n_params):
            text = ax.text(j, i, f'{corr_matrix[i, j]:.2f}',
                          ha="center", va="center", color="black", fontsize=6)

    ax.set_title("Parameter Correlation Matrix", fontsize=16, fontweight='bold')

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_profile_likelihood_grid(best_params, t_eval, data_matrix, param_bounds,
                                save_path='profile_likelihood.png'):
    """Plot profile likelihood for selected parameters"""
    print("\nGenerating profile likelihood plots...")

    # Select subset of parameters to profile (first 12 kinetic params)
    fig, axes = plt.subplots(3, 4, figsize=(16, 12))
    axes = axes.flatten()

    for i in range(12):
        param_range, likelihoods = compute_profile_likelihood(
            best_params, i, t_eval, data_matrix, param_bounds, n_points=15
        )

        # Normalize to best value
        likelihoods = likelihoods - likelihoods.max()

        axes[i].plot(param_range, likelihoods, 'o-', color='steelblue', lw=2)
        axes[i].axvline(best_params[i], color='red', linestyle='--', label='Best fit')
        axes[i].axhline(-1.92, color='orange', linestyle=':', label='95% CI')  # Chi-squared threshold
        axes[i].set_xlabel(all_param_names[i], fontsize=10)
        axes[i].set_ylabel('Log Likelihood', fontsize=10)
        axes[i].set_title(f'Profile: {all_param_names[i]}', fontsize=11, fontweight='bold')
        axes[i].grid(alpha=0.3)
        if i == 0:
            axes[i].legend(fontsize=8)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_diagnostics(samples, save_path='diagnostics.png'):
    """Plot MCMC diagnostics: autocorrelation and posterior distributions"""
    print("\nGenerating diagnostics plots...")

    # Corner plot for subset of parameters
    fig = corner.corner(
        samples[:, :8],  # First 8 parameters
        labels=all_param_names[:8],
        quantiles=[0.16, 0.5, 0.84],
        show_titles=True,
        title_kwargs={"fontsize": 10},
    )

    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_bifurcation(best_params, save_path='bifurcation.png'):
    """Plot bifurcation diagrams for key parameters"""
    print("\nGenerating bifurcation analysis plots...")

    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()

    # Analyze bifurcation for selected parameters
    param_indices = [0, 1, 4, 7, 12, 14]  # ka1, kd1, la, delta, alpha_0_IAA, alpha_IAA_100nM

    for idx, param_idx in enumerate(param_indices):
        ax = axes[idx]

        best_val = best_params[param_idx]
        param_range = np.linspace(best_val * 0.5, best_val * 1.5, 50)

        steady_states = bifurcation_analysis(best_params, param_idx, param_range)

        ax.plot(param_range, steady_states, 'o-', color='steelblue', markersize=3, lw=1.5)
        ax.axvline(best_val, color='red', linestyle='--', label='Best fit')
        ax.set_xlabel(all_param_names[param_idx], fontsize=11)
        ax.set_ylabel('VENUS Steady State', fontsize=11)
        ax.set_title(f'Bifurcation: {all_param_names[param_idx]}', fontsize=12, fontweight='bold')
        ax.grid(alpha=0.3)
        ax.legend(fontsize=9)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_elasticity_heatmap(best_params, t_eval, data_matrix, save_path='elasticity.png'):
    """Plot elasticity coefficient heatmap"""
    print("\nGenerating elasticity heatmap...")

    # Compute elasticity for control condition
    elasticity = compute_elasticity(best_params, t_eval, data_matrix, treatment_idx=2)
    n_params = len(all_param_names)

    fig, ax = plt.subplots(figsize=(14, 10))

    im = ax.imshow(elasticity, cmap='RdBu_r', aspect='auto',
                   vmin=-np.abs(elasticity).max(), vmax=np.abs(elasticity).max())

    ax.set_yticks(range(n_params))
    ax.set_yticklabels(all_param_names, fontsize=10)
    ax.set_xticks(range(0, len(t_eval), 2))
    ax.set_xticklabels(t_eval[::2], fontsize=9)
    ax.set_xlabel("Time (min)", fontsize=12)
    ax.set_ylabel("Parameters", fontsize=12)
    ax.set_title("Elasticity Coefficients (Control Condition)", fontsize=14, fontweight='bold')

    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Elasticity', fontsize=12)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

def plot_sobol_indices(Si, save_path='sobol_indices.png'):
    """Plot Sobol sensitivity indices"""
    print("\nGenerating Sobol indices plot...")

    S1 = Si['S1']
    ST = Si['ST']

    fig, ax = plt.subplots(figsize=(12, 8))

    x = np.arange(len(all_param_names))
    width = 0.35

    ax.bar(x - width/2, S1, width, label='First-order (S1)', color='steelblue', edgecolor='black')
    ax.bar(x + width/2, ST, width, label='Total-order (ST)', color='coral', edgecolor='black')

    ax.set_xlabel('Parameters', fontsize=12)
    ax.set_ylabel('Sobol Index', fontsize=12)
    ax.set_title('Global Sensitivity Analysis (Sobol Indices)', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(all_param_names, rotation=90, fontsize=10)
    ax.legend(fontsize=11)
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved: {save_path}")

# ==============================
# MAIN EXECUTION
# ==============================

if __name__ == "__main__":
    # Parameter bounds (12 kinetic + 7 influx = 19 total)
    param_bounds = [
        (1e-3, 20), (1e-3, 20), (1e-3, 20), (1e-3, 20),
        (1e-3, 20), (1e-3, 20), (1e-3, 5), (1e-3, 20),
        (1e-3, 5), (1e-3, 5), (1e-3, 5), (1, 50),
        (0.1, 100), (0.1, 100), (0.1, 100), (0.1, 100),
        (0.1, 100), (0.1, 100), (0.1, 100),
    ]

    print("="*70)
    print("MULTICORE PARAMETER ESTIMATION WITH COMPREHENSIVE DIAGNOSTICS")
    print("="*70)

    # Step 1: Parallel parameter estimation
    best_params, best_cost = estimate_parameters_parallel(
        t_eval, data_matrix, num_samples=30, n_cores=None
    )

    if best_params is None:
        print("Parameter estimation failed!")
        exit(1)

    # Save best parameters
    np.savetxt('fitted_parameters_multicore.txt', best_params,
               header='Fitted parameters: ' + ', '.join(all_param_names))
    print("\nBest parameters saved to: fitted_parameters_multicore.txt")

    # Step 2: MCMC Sampling
    sampler, samples, log_prob_samples = run_mcmc(
        best_params, t_eval, data_matrix, param_bounds,
        nwalkers=48, nsteps=3000, burn_in=1000
    )

    # Step 3: Generate all diagnostic plots
    print("\n" + "="*70)
    print("GENERATING DIAGNOSTIC PLOTS")
    print("="*70)

    # 1. MCMC Traces
    plot_mcmc_traces(sampler, burn_in=1000, save_path='mcmc_traces.png')

    # 2. Log Posterior
    plot_log_posterior(sampler, burn_in=1000, save_path='log_posterior.png')

    # 3. Comprehensive Parameter Diagnostics (Trace + Posterior + Autocorr)
    plot_parameter_diagnostics(sampler, burn_in=1000, save_path='parameter_diagnostics.png')

    # 4. Eigenvalues
    fisher, eigenvalues = compute_fisher_information(best_params, t_eval, data_matrix)
    plot_eigenvalues(eigenvalues, save_path='eigenvalues.png')

    # 5. Correlation Matrix
    plot_correlation_matrix(samples, save_path='correlation_matrix.png')

    # 6. Profile Likelihood
    plot_profile_likelihood_grid(best_params, t_eval, data_matrix, param_bounds,
                                 save_path='profile_likelihood.png')

    # 7. Diagnostics (Corner plot)
    plot_diagnostics(samples, save_path='diagnostics.png')

    # 8. Bifurcation Analysis
    plot_bifurcation(best_params, save_path='bifurcation.png')

    # 9. Elasticity Heatmap
    plot_elasticity_heatmap(best_params, t_eval, data_matrix, save_path='elasticity.png')

    # 10. Sobol Sensitivity Analysis
    Si = run_sobol_analysis(param_bounds, t_eval, data_matrix, n_samples=512)
    plot_sobol_indices(Si, save_path='sobol_indices.png')

    print("\n" + "="*70)
    print("ALL ANALYSES COMPLETE!")
    print("="*70)
    print("\nGenerated files:")
    print("  - fitted_parameters_multicore.txt")
    print("  - mcmc_traces.png")
    print("  - log_posterior.png")
    print("  - parameter_diagnostics.png (NEW: Trace + Posterior + Autocorr for each param)")
    print("  - eigenvalues.png")
    print("  - correlation_matrix.png")
    print("  - profile_likelihood.png")
    print("  - diagnostics.png")
    print("  - bifurcation.png")
    print("  - elasticity.png")
    print("  - sobol_indices.png")
    print("="*70)
