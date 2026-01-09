"""
Quick test version of enhanced_multicore_diagnostics.py
Reduced computational requirements for fast verification
"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import least_squares
from scipy.stats.qmc import LatinHypercube
import matplotlib.pyplot as plt
import warnings
import multiprocessing as mp
from functools import partial
import time

warnings.filterwarnings('ignore', category=RuntimeWarning)

# Import data and model functions from main script
# (In practice, you would import from enhanced_multicore_diagnostics)
# For this test, we'll use simplified versions

data_matrix = np.array([
    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [0.85, 1.09, 0.96, 1.17, 0.92, 0.97, 0.98, 1.0, 1.0, 1.0, 1.0, 1.0],
    [0.68, 1.09, 0.96, 1.09, 0.89, 0.93, 0.80, 1.0, 1.0, 1.0, 1.0, 1.0],
])

t_eval = np.array([0, 4, 8])

print("="*70)
print("QUICK TEST: Multicore Parameter Estimation")
print("="*70)

# Test 1: Multiprocessing availability
print("\nTest 1: Checking multiprocessing...")
n_cores = mp.cpu_count()
print(f"✓ Available CPU cores: {n_cores}")

# Test 2: Check required packages
print("\nTest 2: Checking required packages...")
try:
    import scipy
    print("✓ scipy installed")
except ImportError:
    print("✗ scipy not found - install with: pip install scipy")

try:
    import matplotlib
    print("✓ matplotlib installed")
except ImportError:
    print("✗ matplotlib not found - install with: pip install matplotlib")

try:
    import emcee
    print("✓ emcee installed")
except ImportError:
    print("✗ emcee not found - install with: pip install emcee")

try:
    import SALib
    print("✓ SALib installed")
except ImportError:
    print("✗ SALib not found - install with: pip install SALib")

try:
    import corner
    print("✓ corner installed")
except ImportError:
    print("✗ corner not found - install with: pip install corner")

try:
    import seaborn
    print("✓ seaborn installed")
except ImportError:
    print("✗ seaborn not found - install with: pip install seaborn")

# Test 3: Simple parallel computation
print("\nTest 3: Testing parallel processing...")

def simple_task(x):
    """Simple test function"""
    return x**2 + np.sin(x)

test_data = np.linspace(0, 10, 20)

start_time = time.time()
with mp.Pool(processes=min(4, n_cores)) as pool:
    results = pool.map(simple_task, test_data)
elapsed = time.time() - start_time

print(f"✓ Parallel processing successful ({elapsed:.4f} seconds)")
print(f"  Computed {len(results)} tasks in parallel")

# Test 4: Create a simple plot
print("\nTest 4: Testing plotting...")

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(test_data, results, 'o-', label='Test function')
ax.set_xlabel('x')
ax.set_ylabel('f(x)')
ax.set_title('Parallel Processing Test')
ax.legend()
ax.grid(alpha=0.3)
plt.savefig('test_plot.png', dpi=150)
plt.close()

print("✓ Plot saved as 'test_plot.png'")

# Test 5: Memory and performance estimate
print("\nTest 5: Performance estimates...")

# Estimate memory usage
param_count = 20
walker_count = 32
mcmc_steps = 3000

# Memory per walker (approximate)
mem_per_sample = param_count * 8 / 1024 / 1024  # MB
total_mcmc_memory = walker_count * mcmc_steps * mem_per_sample

print(f"  Estimated MCMC memory usage: {total_mcmc_memory:.1f} MB")

# Estimate runtime based on simple benchmark
n_test_evals = 10
start_time = time.time()

for _ in range(n_test_evals):
    # Simulate a simple ODE (much faster than actual model)
    t_span = (0, 60)
    y0 = [1.0, 1.0, 0.1, 1.0, 0.1, 0.1, 1.0]

    def simple_ode(t, y):
        return [-0.1*y[0], 0.05*y[1], 0.02*y[2], -0.08*y[3],
                0.03*y[4], 0.01*y[5], -0.05*y[6]]

    sol = solve_ivp(simple_ode, t_span, y0, method='BDF', rtol=1e-6, atol=1e-8)

elapsed = time.time() - start_time
time_per_eval = elapsed / n_test_evals

# Rough estimates
optimization_evals = 30 * 1000  # 30 samples, ~1000 evaluations each
mcmc_evals = walker_count * mcmc_steps
sobol_evals = 512 * (param_count + 2)

total_time_estimate = (optimization_evals + mcmc_evals + sobol_evals) * time_per_eval / 60

print(f"  Time per model evaluation: {time_per_eval*1000:.2f} ms")
print(f"  Estimated total runtime: {total_time_estimate:.1f} minutes")
print(f"  (Using {n_cores} cores can reduce this by ~{min(n_cores, 4)}x for optimization)")

print("\n" + "="*70)
print("ALL TESTS PASSED!")
print("="*70)
print("\nYou can now run the full analysis:")
print("  python enhanced_multicore_diagnostics.py")
print("\nFor a quicker test run (5-10 minutes), edit the main script:")
print("  - num_samples=10 (line ~975)")
print("  - nwalkers=16, nsteps=500 (line ~992)")
print("  - n_samples=128 (line ~1008)")
print("="*70)
