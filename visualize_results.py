"""
Utility script to visualize results from enhanced_multicore_diagnostics.py
Run this after the main analysis completes to explore the results
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl
from PIL import Image
import os

# Configure matplotlib
mpl.rcParams['font.family'] = 'Arial'
mpl.rcParams['axes.linewidth'] = 1.5

# Parameter names
kinetic_names = ['ka1', 'kd1', 'ka2', 'kd2', 'la', 'ld', 'lm',
                 'delta', 'mu1', 'mu2', 'lam', 'TIR1_T']
alpha_names = ['alpha_0_IAA', 'alpha_0_PAA', 'alpha_IAA_100nM',
               'alpha_PAA_5nM', 'alpha_PAA_50nM', 'alpha_PAA_500nM',
               'alpha_PAA_5uM', 'alpha_PAA_50uM']
all_param_names = kinetic_names + alpha_names

def load_parameters(filename='fitted_parameters_multicore.txt'):
    """Load fitted parameters from file"""
    if not os.path.exists(filename):
        print(f"Error: {filename} not found!")
        print("Run enhanced_multicore_diagnostics.py first.")
        return None

    params = np.loadtxt(filename)
    return params

def print_parameter_summary(params):
    """Print formatted parameter summary"""
    print("\n" + "="*70)
    print("FITTED PARAMETER SUMMARY")
    print("="*70)

    print("\nKinetic Parameters:")
    print("-" * 50)
    for i, name in enumerate(kinetic_names):
        print(f"  {name:12s} = {params[i]:10.6f}")

    print("\nInflux Parameters:")
    print("-" * 50)
    for i, name in enumerate(alpha_names):
        print(f"  {name:20s} = {params[12+i]:10.6f}")

    # Compute some derived quantities
    print("\nDerived Quantities:")
    print("-" * 50)

    ka1, kd1, ka2, kd2 = params[0], params[1], params[2], params[3]

    # Dissociation constants
    Kd_IAA = kd1 / (ka1 + 1e-12)
    Kd_PAA = kd2 / (ka2 + 1e-12)

    print(f"  Kd_IAA (IAA-TIR1)    = {Kd_IAA:.6f} (lower = stronger binding)")
    print(f"  Kd_PAA (PAA-TIR1)    = {Kd_PAA:.6f}")
    print(f"  Binding affinity ratio (IAA/PAA) = {Kd_PAA/Kd_IAA:.2f}")

    print("="*70 + "\n")

    return params

def display_all_plots():
    """Display all generated plots in a grid"""
    plot_files = [
        'mcmc_traces.png',
        'log_posterior.png',
        'eigenvalues.png',
        'correlation_matrix.png',
        'profile_likelihood.png',
        'diagnostics.png',
        'bifurcation.png',
        'elasticity.png',
        'sobol_indices.png'
    ]

    existing_plots = [f for f in plot_files if os.path.exists(f)]

    if not existing_plots:
        print("No plot files found!")
        print("Run enhanced_multicore_diagnostics.py first.")
        return

    print(f"\nFound {len(existing_plots)} diagnostic plots")
    print("-" * 50)

    # Display plots in a grid
    n_plots = len(existing_plots)
    n_cols = 3
    n_rows = (n_plots + n_cols - 1) // n_cols

    fig = plt.figure(figsize=(18, 6*n_rows))

    for i, plot_file in enumerate(existing_plots):
        try:
            img = Image.open(plot_file)
            ax = fig.add_subplot(n_rows, n_cols, i+1)
            ax.imshow(img)
            ax.axis('off')
            ax.set_title(plot_file.replace('.png', '').replace('_', ' ').title(),
                        fontsize=14, fontweight='bold')
            print(f"  ✓ {plot_file}")
        except Exception as e:
            print(f"  ✗ Error loading {plot_file}: {e}")

    plt.tight_layout()
    plt.savefig('all_diagnostics_summary.png', dpi=150, bbox_inches='tight')
    print(f"\nSummary figure saved as: all_diagnostics_summary.png")
    plt.show()

def plot_parameter_bars(params):
    """Create bar plot of all parameters"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # Kinetic parameters
    ax1.bar(range(12), params[:12], color='steelblue', edgecolor='black')
    ax1.set_xticks(range(12))
    ax1.set_xticklabels(kinetic_names, rotation=45, ha='right')
    ax1.set_ylabel('Parameter Value', fontsize=14)
    ax1.set_title('Kinetic Parameters', fontsize=16, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3)

    # Influx parameters
    ax2.bar(range(8), params[12:], color='coral', edgecolor='black')
    ax2.set_xticks(range(8))
    ax2.set_xticklabels(alpha_names, rotation=45, ha='right')
    ax2.set_ylabel('Influx Rate', fontsize=14)
    ax2.set_title('Influx Parameters', fontsize=16, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig('parameter_values.png', dpi=300, bbox_inches='tight')
    print("Parameter bar plot saved as: parameter_values.png")
    plt.show()

def analyze_sensitivity(sobol_file='sobol_indices.png'):
    """Print interpretation of sensitivity analysis"""
    print("\n" + "="*70)
    print("SENSITIVITY ANALYSIS INTERPRETATION")
    print("="*70)

    print("""
Key Concepts:

1. Sobol Indices:
   - S1 (First-order): Direct effect of each parameter
   - ST (Total-order): Total effect including interactions
   - Higher values = more important parameters
   - S1 ≈ ST → minimal parameter interactions
   - ST >> S1 → strong parameter interactions

2. Elasticity Coefficients:
   - Local sensitivity at best-fit parameters
   - Shows time-dependent parameter importance
   - Positive = parameter increases output
   - Negative = parameter decreases output

3. Correlation Matrix:
   - High correlation (|r| > 0.8) → parameters may be redundant
   - Can indicate structural non-identifiability
   - Important for experimental design

4. Profile Likelihood:
   - Flat profiles → parameter poorly constrained
   - Sharp profiles → well-identified parameter
   - Asymmetry → nonlinear parameter effects
""")

    print("="*70 + "\n")

def main():
    """Main function to run all visualizations"""
    print("="*70)
    print("ENHANCED MULTICORE DIAGNOSTICS - RESULTS VIEWER")
    print("="*70)

    # Load and print parameters
    params = load_parameters()

    if params is None:
        return

    print_parameter_summary(params)

    # Create parameter bar plot
    plot_parameter_bars(params)

    # Display all diagnostic plots
    display_all_plots()

    # Print sensitivity interpretation guide
    analyze_sensitivity()

    print("\n" + "="*70)
    print("VISUALIZATION COMPLETE")
    print("="*70)
    print("\nGenerated files:")
    print("  - parameter_values.png")
    print("  - all_diagnostics_summary.png")
    print("="*70)

if __name__ == "__main__":
    main()
