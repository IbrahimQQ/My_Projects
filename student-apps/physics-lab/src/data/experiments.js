// Comprehensive Physics Experiments Database
export const physicsExperiments = {
  mechanics: {
    title: 'Mechanics',
    icon: '⚙️',
    description: 'Study of motion, forces, and energy',
    experiments: [
      {
        id: 'pendulum',
        title: 'Simple Pendulum',
        difficulty: 'Easy',
        duration: '20 min',
        description: 'Investigate the relationship between pendulum length and period of oscillation.',
        objectives: [
          'Understand simple harmonic motion',
          'Verify the relationship T = 2π√(L/g)',
          'Calculate acceleration due to gravity',
        ],
        theory: `A simple pendulum consists of a mass (bob) suspended from a fixed point by a massless, inextensible string. When displaced from equilibrium and released, it oscillates with a period T that depends on the length L and acceleration due to gravity g.

The period is given by: T = 2π√(L/g)

This relationship shows that:
• Period is independent of mass
• Period is independent of amplitude (for small angles < 15°)
• Period increases with length
• Period decreases with stronger gravity`,
        equipment: ['Pendulum bob', 'String', 'Meter ruler', 'Stopwatch', 'Protractor', 'Clamp stand'],
        procedure: [
          'Set up the pendulum with a specific length L',
          'Displace the bob to a small angle (< 15°)',
          'Release and start the stopwatch',
          'Measure time for 10 complete oscillations',
          'Calculate the period T = time/10',
          'Repeat for different lengths',
        ],
        variables: {
          independent: 'Length of pendulum (L)',
          dependent: 'Period of oscillation (T)',
          controlled: 'Mass of bob, Amplitude, Air resistance',
        },
        defaultParams: { length: 1.0, gravity: 9.81, amplitude: 10 },
        formula: 'T = 2π√(L/g)',
      },
      {
        id: 'projectile',
        title: 'Projectile Motion',
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Study the trajectory of objects launched at various angles.',
        objectives: [
          'Understand 2D kinematics',
          'Analyze horizontal and vertical components of motion',
          'Determine optimal launch angle for maximum range',
        ],
        theory: `Projectile motion is the motion of an object thrown or projected into the air, subject only to gravity. The motion can be analyzed by considering horizontal and vertical components separately.

Horizontal: x = v₀cosθ × t (constant velocity)
Vertical: y = v₀sinθ × t - ½gt² (accelerated motion)

Key formulas:
• Range: R = (v₀²sin2θ)/g
• Maximum height: H = (v₀sinθ)²/(2g)
• Time of flight: T = 2v₀sinθ/g
• Maximum range occurs at θ = 45°`,
        equipment: ['Projectile launcher', 'Balls', 'Measuring tape', 'Protractor', 'Stopwatch', 'Carbon paper'],
        procedure: [
          'Set the launcher to a specific angle',
          'Launch the projectile with consistent force',
          'Mark the landing position',
          'Measure the horizontal range',
          'Record the time of flight',
          'Repeat for different angles',
        ],
        variables: {
          independent: 'Launch angle (θ)',
          dependent: 'Range (R), Maximum height (H)',
          controlled: 'Initial velocity, Launch height',
        },
        defaultParams: { velocity: 20, angle: 45, gravity: 9.81 },
        formula: 'R = (v₀²sin2θ)/g',
      },
      {
        id: 'friction',
        title: 'Coefficient of Friction',
        difficulty: 'Easy',
        duration: '25 min',
        description: 'Determine static and kinetic friction coefficients between surfaces.',
        objectives: [
          'Understand friction forces',
          'Distinguish between static and kinetic friction',
          'Calculate friction coefficients',
        ],
        theory: `Friction is the force that opposes relative motion between surfaces in contact.

Static friction (fs): Prevents motion from starting
fs ≤ μs × N (μs = coefficient of static friction)

Kinetic friction (fk): Opposes motion during sliding
fk = μk × N (μk = coefficient of kinetic friction)

Generally: μs > μk

On an inclined plane at angle θ:
• At the point of sliding: μs = tanθ
• During sliding at constant velocity: μk = tanθ`,
        equipment: ['Inclined plane', 'Blocks of different materials', 'Protractor', 'Spring balance', 'Weights'],
        procedure: [
          'Place the block on the inclined plane',
          'Slowly increase the angle',
          'Note the angle when block starts sliding (θs)',
          'Calculate μs = tan(θs)',
          'Find angle for constant velocity sliding',
          'Calculate μk = tan(θk)',
        ],
        variables: {
          independent: 'Surface material, Normal force',
          dependent: 'Friction force, Angle of repose',
          controlled: 'Surface area, Temperature',
        },
        defaultParams: { mass: 1.0, angle: 30, frictionCoeff: 0.4 },
        formula: 'f = μN',
      },
      {
        id: 'newtons_second',
        title: "Newton's Second Law",
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Verify the relationship between force, mass, and acceleration.',
        objectives: [
          'Verify F = ma experimentally',
          'Understand the concept of net force',
          'Analyze motion on a frictionless track',
        ],
        theory: `Newton's Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.

F = ma

Where:
• F = Net force (Newtons)
• m = Mass (kilograms)
• a = Acceleration (m/s²)

On a frictionless air track with hanging mass:
Total force = mhg (weight of hanging mass)
Total mass = mc + mh (cart + hanging mass)
Acceleration = mhg/(mc + mh)`,
        equipment: ['Air track', 'Cart', 'Pulley', 'Hanging masses', 'Photogate timer', 'Light gate'],
        procedure: [
          'Set up the air track horizontally',
          'Connect cart to hanging mass via string over pulley',
          'Release and measure acceleration using light gates',
          'Vary the hanging mass while keeping total mass constant',
          'Plot F vs a graph',
          'Verify F = ma relationship',
        ],
        variables: {
          independent: 'Applied force (hanging mass)',
          dependent: 'Acceleration',
          controlled: 'Total mass, Friction, Pulley friction',
        },
        defaultParams: { cartMass: 0.5, hangingMass: 0.1, gravity: 9.81 },
        formula: 'a = F/m',
      },
      {
        id: 'momentum',
        title: 'Conservation of Momentum',
        difficulty: 'Medium',
        duration: '35 min',
        description: 'Investigate elastic and inelastic collisions.',
        objectives: [
          'Verify conservation of momentum',
          'Compare elastic and inelastic collisions',
          'Calculate coefficient of restitution',
        ],
        theory: `The law of conservation of momentum states that the total momentum of a closed system remains constant if no external forces act on it.

m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'

Elastic collision: Kinetic energy is conserved
Coefficient of restitution e = 1

Inelastic collision: Kinetic energy is not conserved
Perfectly inelastic: Objects stick together, e = 0

Coefficient of restitution:
e = (v₂' - v₁')/(v₁ - v₂)`,
        equipment: ['Air track', 'Carts with springs/velcro', 'Photogates', 'Masses', 'Computer interface'],
        procedure: [
          'Set up two carts on the air track',
          'Measure masses of both carts',
          'Give one cart an initial velocity',
          'Record velocities before and after collision',
          'Calculate momentum before and after',
          'Compare elastic vs inelastic collisions',
        ],
        variables: {
          independent: 'Initial velocities, Masses',
          dependent: 'Final velocities',
          controlled: 'Friction, External forces',
        },
        defaultParams: { mass1: 1.0, mass2: 1.0, velocity1: 2.0, velocity2: 0 },
        formula: 'p = mv',
      },
    ],
  },
  waves: {
    title: 'Waves & Oscillations',
    icon: '🌊',
    description: 'Study of wave properties and behavior',
    experiments: [
      {
        id: 'standing_waves',
        title: 'Standing Waves on a String',
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Create and analyze standing wave patterns on a vibrating string.',
        objectives: [
          'Understand standing wave formation',
          'Identify nodes and antinodes',
          'Verify the relationship between frequency and wavelength',
        ],
        theory: `Standing waves form when two waves of the same frequency travel in opposite directions and interfere. On a string fixed at both ends:

Wavelength: λn = 2L/n (n = 1, 2, 3...)
Frequency: fn = nv/(2L) = n × f₁

Where:
• L = Length of string
• n = Harmonic number
• v = Wave velocity = √(T/μ)
• T = Tension
• μ = Linear mass density

Nodes: Points of zero displacement
Antinodes: Points of maximum displacement`,
        equipment: ['String', 'Vibration generator', 'Signal generator', 'Pulley', 'Masses', 'Meter ruler'],
        procedure: [
          'Set up string with one end attached to vibrator',
          'Apply tension using hanging mass',
          'Adjust frequency to find fundamental mode',
          'Count nodes and antinodes',
          'Increase frequency to find harmonics',
          'Measure wavelength for each harmonic',
        ],
        variables: {
          independent: 'Frequency, Tension',
          dependent: 'Wavelength, Number of nodes',
          controlled: 'String length, String material',
        },
        defaultParams: { length: 1.0, tension: 10, frequency: 50 },
        formula: 'fn = nv/(2L)',
      },
      {
        id: 'sound_resonance',
        title: 'Resonance Tube',
        difficulty: 'Medium',
        duration: '25 min',
        description: 'Determine the speed of sound using resonance in an air column.',
        objectives: [
          'Understand resonance in air columns',
          'Calculate the speed of sound',
          'Observe harmonic patterns',
        ],
        theory: `When a tuning fork vibrates over a tube, resonance occurs when the air column length matches odd multiples of quarter wavelengths.

For a tube closed at one end:
First resonance: L₁ = λ/4
Second resonance: L₂ = 3λ/4
Third resonance: L₃ = 5λ/4

Speed of sound:
v = fλ = f × 2(L₂ - L₁)

End correction: e = (L₂ - 3L₁)/2`,
        equipment: ['Resonance tube', 'Tuning forks', 'Ruler', 'Water reservoir', 'Thermometer'],
        procedure: [
          'Strike the tuning fork and hold over the tube',
          'Adjust water level to find first resonance',
          'Record the length L₁',
          'Continue to find second resonance L₂',
          'Calculate wavelength and speed of sound',
          'Repeat with different tuning forks',
        ],
        variables: {
          independent: 'Frequency of tuning fork',
          dependent: 'Resonance lengths',
          controlled: 'Temperature, Tube diameter',
        },
        defaultParams: { frequency: 512, temperature: 25 },
        formula: 'v = fλ',
      },
      {
        id: 'diffraction',
        title: 'Single Slit Diffraction',
        difficulty: 'Hard',
        duration: '40 min',
        description: 'Observe and measure diffraction patterns from a single slit.',
        objectives: [
          'Understand wave diffraction',
          'Measure diffraction pattern minima',
          'Calculate slit width from pattern',
        ],
        theory: `When light passes through a narrow slit, it spreads out and creates a diffraction pattern with bright and dark fringes.

Condition for minima:
a sin θ = nλ (n = 1, 2, 3...)

Where:
• a = Slit width
• θ = Angle to nth minimum
• λ = Wavelength
• n = Order of minimum

For small angles: sin θ ≈ tan θ = yn/D

Central maximum width = 2λD/a`,
        equipment: ['Laser', 'Single slit', 'Screen', 'Ruler', 'Micrometer'],
        procedure: [
          'Set up laser, slit, and screen',
          'Measure distance D from slit to screen',
          'Observe the diffraction pattern',
          'Measure positions of dark fringes',
          'Calculate angles to minima',
          'Determine slit width using formula',
        ],
        variables: {
          independent: 'Slit width, Wavelength',
          dependent: 'Fringe positions',
          controlled: 'Slit-screen distance',
        },
        defaultParams: { wavelength: 632.8, slitWidth: 0.1, distance: 1.0 },
        formula: 'a sin θ = nλ',
      },
    ],
  },
  electricity: {
    title: 'Electricity & Magnetism',
    icon: '⚡',
    description: 'Study of electric circuits and magnetic fields',
    experiments: [
      {
        id: 'ohms_law',
        title: "Ohm's Law",
        difficulty: 'Easy',
        duration: '20 min',
        description: 'Verify the relationship between voltage, current, and resistance.',
        objectives: [
          'Verify V = IR experimentally',
          'Understand ohmic and non-ohmic conductors',
          'Plot V-I characteristics',
        ],
        theory: `Ohm's Law states that the current through a conductor is directly proportional to the voltage across it, provided temperature remains constant.

V = IR

Where:
• V = Potential difference (Volts)
• I = Current (Amperes)
• R = Resistance (Ohms)

Ohmic conductors: Linear V-I relationship
Non-ohmic conductors: Non-linear relationship (e.g., diodes, filament lamps)

Power: P = VI = I²R = V²/R`,
        equipment: ['Resistors', 'Power supply', 'Ammeter', 'Voltmeter', 'Connecting wires', 'Rheostat'],
        procedure: [
          'Connect the circuit with resistor',
          'Set voltage to minimum',
          'Record current and voltage',
          'Increase voltage in steps',
          'Plot V vs I graph',
          'Calculate resistance from slope',
        ],
        variables: {
          independent: 'Voltage (V)',
          dependent: 'Current (I)',
          controlled: 'Temperature, Resistance',
        },
        defaultParams: { resistance: 100, voltage: 5 },
        formula: 'V = IR',
      },
      {
        id: 'kirchhoff',
        title: "Kirchhoff's Laws",
        difficulty: 'Medium',
        duration: '35 min',
        description: 'Verify current and voltage laws in complex circuits.',
        objectives: [
          "Verify Kirchhoff's Current Law (KCL)",
          "Verify Kirchhoff's Voltage Law (KVL)",
          'Analyze series and parallel combinations',
        ],
        theory: `Kirchhoff's Current Law (KCL):
The sum of currents entering a junction equals the sum leaving.
ΣI_in = ΣI_out

Kirchhoff's Voltage Law (KVL):
The sum of potential differences around any closed loop is zero.
ΣV = 0

Series: R_total = R₁ + R₂ + R₃ + ...
Parallel: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃ + ...`,
        equipment: ['Resistors', 'Power supply', 'Ammeter', 'Voltmeter', 'Breadboard', 'Connecting wires'],
        procedure: [
          'Build a circuit with multiple branches',
          'Measure current at each junction',
          'Verify KCL at each node',
          'Measure voltage across each component',
          'Verify KVL around each loop',
          'Compare with theoretical calculations',
        ],
        variables: {
          independent: 'Circuit configuration',
          dependent: 'Currents and voltages',
          controlled: 'Component values, EMF',
        },
        defaultParams: { r1: 100, r2: 200, r3: 150, voltage: 12 },
        formula: 'ΣV = 0, ΣI = 0',
      },
      {
        id: 'capacitor',
        title: 'RC Circuit Charging/Discharging',
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Study the time constant of an RC circuit.',
        objectives: [
          'Understand capacitor charging and discharging',
          'Determine the time constant τ = RC',
          'Analyze exponential behavior',
        ],
        theory: `In an RC circuit, the capacitor charges and discharges exponentially.

Charging: V(t) = V₀(1 - e^(-t/τ))
Discharging: V(t) = V₀e^(-t/τ)

Time constant: τ = RC

At t = τ:
• Charging: V = 0.632 V₀
• Discharging: V = 0.368 V₀

After 5τ: Capacitor is effectively fully charged/discharged (99.3%)`,
        equipment: ['Capacitor', 'Resistor', 'Power supply', 'Voltmeter', 'Stopwatch', 'Switch'],
        procedure: [
          'Connect RC circuit with switch',
          'Close switch to start charging',
          'Record voltage at regular intervals',
          'Calculate time constant from graph',
          'Open switch to discharge',
          'Compare τ with theoretical RC',
        ],
        variables: {
          independent: 'Time',
          dependent: 'Capacitor voltage',
          controlled: 'R, C values, Supply voltage',
        },
        defaultParams: { resistance: 10000, capacitance: 100, voltage: 10 },
        formula: 'τ = RC',
      },
      {
        id: 'magnetic_field',
        title: 'Magnetic Field Mapping',
        difficulty: 'Easy',
        duration: '25 min',
        description: 'Map the magnetic field around magnets and current-carrying conductors.',
        objectives: [
          'Visualize magnetic field patterns',
          'Understand field direction and strength',
          'Apply right-hand rules',
        ],
        theory: `Magnetic field lines:
• Run from North to South pole outside the magnet
• Form closed loops
• Never cross each other
• Density indicates field strength

For a long straight wire:
B = μ₀I/(2πr)

For a solenoid:
B = μ₀nI (n = turns per unit length)

Right-hand rule: Thumb points in current direction, fingers curl in field direction`,
        equipment: ['Bar magnets', 'Iron filings', 'Compass', 'Coil', 'Power supply', 'Plotting paper'],
        procedure: [
          'Place magnet under paper',
          'Sprinkle iron filings to visualize field',
          'Use compass to determine field direction',
          'Map field of current-carrying coil',
          'Observe effect of current magnitude',
          'Draw field line diagrams',
        ],
        variables: {
          independent: 'Current, Distance from source',
          dependent: 'Field strength and direction',
          controlled: 'Magnet/coil geometry',
        },
        defaultParams: { current: 1.0, turns: 100, radius: 0.05 },
        formula: 'B = μ₀nI',
      },
    ],
  },
  optics: {
    title: 'Optics',
    icon: '🔬',
    description: 'Study of light behavior and optical instruments',
    experiments: [
      {
        id: 'snells_law',
        title: "Snell's Law & Refraction",
        difficulty: 'Easy',
        duration: '25 min',
        description: 'Investigate the refraction of light at interfaces.',
        objectives: [
          "Verify Snell's law experimentally",
          'Calculate refractive index',
          'Observe total internal reflection',
        ],
        theory: `When light passes from one medium to another, it bends according to Snell's Law:

n₁ sin θ₁ = n₂ sin θ₂

Refractive index: n = c/v = sin θ₁/sin θ₂

Critical angle: sin θc = n₂/n₁ (when n₁ > n₂)

Total internal reflection occurs when θ₁ > θc

Common refractive indices:
• Air: 1.00
• Water: 1.33
• Glass: 1.50
• Diamond: 2.42`,
        equipment: ['Ray box', 'Semicircular glass block', 'Protractor', 'White paper', 'Pins'],
        procedure: [
          'Place glass block on paper',
          'Direct light ray at various angles',
          'Mark incident and refracted rays',
          'Measure angles of incidence and refraction',
          'Calculate refractive index',
          'Find critical angle for total internal reflection',
        ],
        variables: {
          independent: 'Angle of incidence',
          dependent: 'Angle of refraction',
          controlled: 'Medium, Wavelength',
        },
        defaultParams: { n1: 1.0, n2: 1.5, incidentAngle: 30 },
        formula: 'n₁sinθ₁ = n₂sinθ₂',
      },
      {
        id: 'lens_formula',
        title: 'Thin Lens Equation',
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Verify the thin lens equation and study image formation.',
        objectives: [
          'Verify 1/f = 1/u + 1/v',
          'Measure focal length of lenses',
          'Study real and virtual images',
        ],
        theory: `The thin lens equation relates object distance (u), image distance (v), and focal length (f):

1/f = 1/u + 1/v

Magnification: m = v/u = hi/ho

Sign convention:
• Real objects/images: positive distance
• Virtual images: negative distance
• Convex lens: positive f
• Concave lens: negative f

Power of lens: P = 1/f (in diopters when f is in meters)`,
        equipment: ['Convex lens', 'Optical bench', 'Object (illuminated)', 'Screen', 'Ruler'],
        procedure: [
          'Place lens on optical bench',
          'Position object at known distance u',
          'Move screen to get sharp image',
          'Measure image distance v',
          'Calculate f using lens equation',
          'Repeat for different object distances',
        ],
        variables: {
          independent: 'Object distance (u)',
          dependent: 'Image distance (v)',
          controlled: 'Focal length, Object size',
        },
        defaultParams: { focalLength: 0.15, objectDistance: 0.3 },
        formula: '1/f = 1/u + 1/v',
      },
      {
        id: 'interference',
        title: "Young's Double Slit",
        difficulty: 'Hard',
        duration: '40 min',
        description: 'Observe interference patterns and measure wavelength of light.',
        objectives: [
          'Demonstrate wave nature of light',
          'Measure fringe separation',
          'Calculate wavelength from pattern',
        ],
        theory: `When coherent light passes through two slits, interference creates bright and dark fringes.

Path difference for bright fringes: d sin θ = nλ
Path difference for dark fringes: d sin θ = (n + ½)λ

Fringe separation: β = λD/d

Where:
• d = Slit separation
• D = Screen distance
• λ = Wavelength
• n = Order of fringe

Central maximum is always bright (path difference = 0)`,
        equipment: ['Laser', 'Double slit', 'Screen', 'Ruler', 'Micrometer'],
        procedure: [
          'Set up laser, double slit, and screen',
          'Observe interference pattern',
          'Measure fringe separation β',
          'Measure slit-screen distance D',
          'Calculate wavelength using β = λD/d',
          'Compare with known laser wavelength',
        ],
        variables: {
          independent: 'Slit separation',
          dependent: 'Fringe separation',
          controlled: 'Wavelength, Screen distance',
        },
        defaultParams: { slitSeparation: 0.25, screenDistance: 2.0, wavelength: 632.8 },
        formula: 'β = λD/d',
      },
    ],
  },
  thermodynamics: {
    title: 'Thermodynamics',
    icon: '🌡️',
    description: 'Study of heat and energy transfer',
    experiments: [
      {
        id: 'specific_heat',
        title: 'Specific Heat Capacity',
        difficulty: 'Easy',
        duration: '30 min',
        description: 'Determine the specific heat capacity of different materials.',
        objectives: [
          'Understand heat capacity concept',
          'Use calorimetry method',
          'Calculate specific heat capacity',
        ],
        theory: `Specific heat capacity (c) is the amount of heat required to raise the temperature of 1 kg of a substance by 1°C.

Q = mcΔT

Where:
• Q = Heat energy (Joules)
• m = Mass (kg)
• c = Specific heat capacity (J/kg·K)
• ΔT = Temperature change (K or °C)

Method of mixtures:
Heat lost by hot body = Heat gained by cold body
m₁c₁(T₁ - Tf) = m₂c₂(Tf - T₂)`,
        equipment: ['Calorimeter', 'Thermometer', 'Metal samples', 'Hot water', 'Balance', 'Heater'],
        procedure: [
          'Measure mass of metal sample',
          'Heat the sample to known temperature',
          'Measure water mass and temperature in calorimeter',
          'Transfer hot sample to calorimeter',
          'Record final equilibrium temperature',
          'Calculate specific heat capacity',
        ],
        variables: {
          independent: 'Material type',
          dependent: 'Temperature change',
          controlled: 'Mass, Initial temperatures',
        },
        defaultParams: { mass: 0.1, specificHeat: 900, tempChange: 50 },
        formula: 'Q = mcΔT',
      },
      {
        id: 'gas_laws',
        title: 'Ideal Gas Laws',
        difficulty: 'Medium',
        duration: '35 min',
        description: 'Verify the relationship between pressure, volume, and temperature of gases.',
        objectives: [
          "Verify Boyle's Law (P ∝ 1/V)",
          "Verify Charles's Law (V ∝ T)",
          'Understand ideal gas equation',
        ],
        theory: `The ideal gas equation: PV = nRT

Individual gas laws:
• Boyle's Law: P₁V₁ = P₂V₂ (at constant T)
• Charles's Law: V₁/T₁ = V₂/T₂ (at constant P)
• Gay-Lussac's Law: P₁/T₁ = P₂/T₂ (at constant V)

Where:
• P = Pressure (Pa)
• V = Volume (m³)
• n = Number of moles
• R = 8.314 J/(mol·K)
• T = Absolute temperature (K)`,
        equipment: ['Gas syringe', 'Pressure sensor', 'Thermometer', 'Water bath', 'Data logger'],
        procedure: [
          'Set up gas syringe with pressure sensor',
          'Compress/expand gas at constant temperature',
          "Verify Boyle's Law: PV = constant",
          'Heat gas at constant pressure',
          "Verify Charles's Law: V/T = constant",
          'Plot graphs and analyze',
        ],
        variables: {
          independent: 'Volume or Temperature',
          dependent: 'Pressure or Volume',
          controlled: 'Amount of gas, Other variables',
        },
        defaultParams: { pressure: 101325, volume: 0.001, temperature: 300 },
        formula: 'PV = nRT',
      },
    ],
  },
  modern: {
    title: 'Modern Physics',
    icon: '⚛️',
    description: 'Quantum mechanics and relativity concepts',
    experiments: [
      {
        id: 'photoelectric',
        title: 'Photoelectric Effect',
        difficulty: 'Hard',
        duration: '45 min',
        description: "Investigate Einstein's photoelectric effect and determine Planck's constant.",
        objectives: [
          'Understand wave-particle duality',
          'Verify photoelectric equation',
          "Calculate Planck's constant",
        ],
        theory: `The photoelectric effect demonstrates the particle nature of light.

Einstein's photoelectric equation:
Ek(max) = hf - φ

Where:
• Ek(max) = Maximum kinetic energy of electrons
• h = Planck's constant (6.63 × 10⁻³⁴ J·s)
• f = Frequency of incident light
• φ = Work function of metal

Threshold frequency: f₀ = φ/h
Stopping potential: eV₀ = hf - φ

Key observations:
• Ek depends on frequency, not intensity
• No emission below threshold frequency
• Instantaneous emission`,
        equipment: ['Photocell', 'Light source with filters', 'Voltmeter', 'Ammeter', 'Variable DC supply'],
        procedure: [
          'Set up photocell with light source',
          'Measure photocurrent at different light frequencies',
          'Determine stopping potential for each frequency',
          'Plot Ek vs frequency graph',
          'Calculate slope (= h/e)',
          'Determine work function from intercept',
        ],
        variables: {
          independent: 'Light frequency',
          dependent: 'Stopping potential',
          controlled: 'Light intensity',
        },
        defaultParams: { frequency: 6e14, workFunction: 2.3, planckConstant: 6.63e-34 },
        formula: 'Ek = hf - φ',
      },
      {
        id: 'radioactive_decay',
        title: 'Radioactive Decay Simulation',
        difficulty: 'Medium',
        duration: '30 min',
        description: 'Model radioactive decay using dice or computer simulation.',
        objectives: [
          'Understand exponential decay',
          'Calculate half-life',
          'Analyze decay statistics',
        ],
        theory: `Radioactive decay follows exponential law:

N(t) = N₀e^(-λt)

Where:
• N(t) = Number of nuclei at time t
• N₀ = Initial number of nuclei
• λ = Decay constant
• t = Time

Half-life: t½ = ln(2)/λ = 0.693/λ

Activity: A = λN = A₀e^(-λt)

After n half-lives: N = N₀/2ⁿ`,
        equipment: ['Dice (or computer)', 'Counter', 'Graph paper', 'Calculator', 'Timer'],
        procedure: [
          'Start with 100 dice (representing nuclei)',
          'Roll all dice - remove those showing 1 (decayed)',
          'Record remaining count',
          'Repeat until all decayed',
          'Plot N vs number of rolls',
          'Calculate half-life and decay constant',
        ],
        variables: {
          independent: 'Time (number of rolls)',
          dependent: 'Number of remaining nuclei',
          controlled: 'Initial number, Probability',
        },
        defaultParams: { initialNuclei: 1000, halfLife: 5730, decayConstant: 0.000121 },
        formula: 'N = N₀e^(-λt)',
      },
    ],
  },
};

export const getExperimentsByCategory = (category) => {
  return physicsExperiments[category]?.experiments || [];
};

export const getExperimentById = (id) => {
  for (const category of Object.values(physicsExperiments)) {
    const experiment = category.experiments.find(exp => exp.id === id);
    if (experiment) {
      return { ...experiment, category: category.title };
    }
  }
  return null;
};

export const getAllExperiments = () => {
  const all = [];
  for (const [key, category] of Object.entries(physicsExperiments)) {
    category.experiments.forEach(exp => {
      all.push({ ...exp, categoryKey: key, categoryTitle: category.title });
    });
  }
  return all;
};

export const searchExperiments = (query) => {
  const all = getAllExperiments();
  const lowerQuery = query.toLowerCase();
  return all.filter(exp =>
    exp.title.toLowerCase().includes(lowerQuery) ||
    exp.description.toLowerCase().includes(lowerQuery) ||
    exp.theory.toLowerCase().includes(lowerQuery)
  );
};
