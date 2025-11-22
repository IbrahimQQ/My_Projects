import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import * as Physics from '../simulations/PhysicsEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = 300;

const SimulationScreen = ({ route, navigation }) => {
  const { experimentId } = route.params;
  const { getExperimentById, completeExperiment, settings } = useApp();

  const experiment = getExperimentById(experimentId);

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [params, setParams] = useState(experiment?.defaultParams || {});
  const [results, setResults] = useState({});
  const [dataPoints, setDataPoints] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
    resetSimulation();
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setResults({});
    setDataPoints([]);
    setShowResults(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startSimulation = () => {
    resetSimulation();
    setIsRunning(true);
    startTimeRef.current = Date.now();
    runSimulation();
  };

  const pauseSimulation = () => {
    setIsPaused(!isPaused);
  };

  const runSimulation = () => {
    const speed = settings.animationSpeed || 1;
    const elapsed = (Date.now() - startTimeRef.current) * speed / 1000;

    setTime(elapsed);

    // Calculate simulation based on experiment type
    const simResults = calculateSimulation(elapsed);
    setResults(simResults);

    // Store data point for graph
    if (elapsed < getMaxTime()) {
      setDataPoints(prev => [...prev, { t: elapsed, ...simResults }]);
      animationRef.current = requestAnimationFrame(runSimulation);
    } else {
      finishSimulation(simResults);
    }
  };

  const getMaxTime = () => {
    switch (experiment?.id) {
      case 'pendulum': return Physics.mechanics.pendulum.period(params.length || 1) * 3;
      case 'projectile': return Physics.mechanics.projectile.flightTime(params.velocity || 20, params.angle || 45) * 1.2;
      case 'radioactive_decay': return (params.halfLife || 5) * 5;
      default: return 10;
    }
  };

  const calculateSimulation = (t) => {
    switch (experiment?.id) {
      case 'pendulum':
        return calculatePendulum(t);
      case 'projectile':
        return calculateProjectile(t);
      case 'friction':
        return calculateFriction(t);
      case 'newtons_second':
        return calculateNewtonsSecond(t);
      case 'momentum':
        return calculateMomentum(t);
      case 'standing_waves':
        return calculateStandingWaves(t);
      case 'ohms_law':
        return calculateOhmsLaw();
      case 'rc_circuit':
        return calculateRCCircuit(t);
      case 'snells_law':
        return calculateSnellsLaw();
      case 'lens_formula':
        return calculateLensFormula();
      case 'interference':
        return calculateInterference();
      case 'specific_heat':
        return calculateSpecificHeat(t);
      case 'gas_laws':
        return calculateGasLaws();
      case 'photoelectric':
        return calculatePhotoelectric();
      case 'radioactive_decay':
        return calculateRadioactiveDecay(t);
      default:
        return {};
    }
  };

  // Pendulum simulation
  const calculatePendulum = (t) => {
    const { length = 1, amplitude = 15, mass = 0.5 } = params;
    const period = Physics.mechanics.pendulum.period(length);
    const frequency = Physics.mechanics.pendulum.frequency(length);
    const position = Physics.mechanics.pendulum.position(amplitude, length, t);
    const velocity = Physics.mechanics.pendulum.velocity(amplitude, length, t);

    return { period, frequency, position, velocity, length, amplitude };
  };

  // Projectile simulation
  const calculateProjectile = (t) => {
    const { velocity = 20, angle = 45, mass = 1 } = params;
    const pos = Physics.mechanics.projectile.position(velocity, angle, t);
    const vel = Physics.mechanics.projectile.velocity(velocity, angle, t);
    const range = Physics.mechanics.projectile.range(velocity, angle);
    const maxHeight = Physics.mechanics.projectile.maxHeight(velocity, angle);
    const flightTime = Physics.mechanics.projectile.flightTime(velocity, angle);

    return { x: pos.x, y: Math.max(0, pos.y), vx: vel.vx, vy: vel.vy, range, maxHeight, flightTime };
  };

  // Friction simulation
  const calculateFriction = (t) => {
    const { mass = 2, appliedForce = 10, frictionCoeff = 0.3, angle = 0 } = params;
    const normalForce = Physics.mechanics.friction.normalForce(mass, angle);
    const frictionForce = Physics.mechanics.friction.kineticForce(normalForce, frictionCoeff);
    const acceleration = Physics.mechanics.friction.acceleration(mass, appliedForce, frictionCoeff, angle);
    const velocity = acceleration * t;
    const displacement = 0.5 * acceleration * t * t;

    return { normalForce, frictionForce, acceleration, velocity, displacement };
  };

  // Newton's Second Law simulation
  const calculateNewtonsSecond = (t) => {
    const { mass = 5, force = 20 } = params;
    const acceleration = Physics.mechanics.newtonsSecondLaw.acceleration(force, mass);
    const velocity = acceleration * t;
    const displacement = 0.5 * acceleration * t * t;

    return { acceleration, velocity, displacement, force, mass };
  };

  // Momentum simulation
  const calculateMomentum = (t) => {
    const { m1 = 2, v1 = 5, m2 = 3, v2 = -2, collisionType = 'elastic' } = params;
    const p1 = Physics.mechanics.momentum.linear(m1, v1);
    const p2 = Physics.mechanics.momentum.linear(m2, v2);
    const totalMomentum = p1 + p2;

    let result;
    if (collisionType === 'elastic') {
      result = Physics.mechanics.momentum.collision.elastic(m1, v1, m2, v2);
    } else {
      result = Physics.mechanics.momentum.collision.inelastic(m1, v1, m2, v2);
    }

    return { p1, p2, totalMomentum, ...result };
  };

  // Standing waves simulation
  const calculateStandingWaves = (t) => {
    const { length = 1, harmonic = 1, velocity = 343 } = params;
    const wavelength = Physics.waves.standingWave.wavelength(harmonic, length);
    const frequency = Physics.waves.standingWave.frequency(harmonic, length, velocity);
    const nodes = Physics.waves.standingWave.nodePositions(harmonic, length);
    const antinodes = Physics.waves.standingWave.antinodePositions(harmonic, length);

    return { wavelength, frequency, nodes, antinodes, harmonic };
  };

  // Ohm's Law simulation
  const calculateOhmsLaw = () => {
    const { voltage = 12, resistance = 100 } = params;
    const current = Physics.electricity.ohmsLaw.current(voltage, resistance);
    const power = Physics.electricity.ohmsLaw.power(voltage, current);

    return { voltage, resistance, current: current * 1000, power }; // current in mA
  };

  // RC Circuit simulation
  const calculateRCCircuit = (t) => {
    const { voltage = 10, resistance = 1000, capacitance = 0.001 } = params;
    const timeConstant = Physics.electricity.rcCircuit.timeConstant(resistance, capacitance);
    const voltageC = Physics.electricity.rcCircuit.chargingVoltage(voltage, t, resistance, capacitance);
    const current = Physics.electricity.rcCircuit.chargingCurrent(voltage, t, resistance, capacitance);

    return { timeConstant, voltageC, current: current * 1000, chargePercent: (voltageC / voltage) * 100 };
  };

  // Snell's Law simulation
  const calculateSnellsLaw = () => {
    const { n1 = 1, n2 = 1.5, incidentAngle = 30 } = params;
    const refractedAngle = Physics.optics.snellsLaw.refractedAngle(n1, n2, incidentAngle);
    const criticalAngle = Physics.optics.snellsLaw.criticalAngle(n2, n1);

    return {
      incidentAngle,
      refractedAngle: refractedAngle !== null ? refractedAngle : 'TIR',
      criticalAngle: criticalAngle !== null ? criticalAngle : 'N/A',
      n1,
      n2,
    };
  };

  // Lens Formula simulation
  const calculateLensFormula = () => {
    const { focalLength = 0.1, objectDistance = 0.2 } = params;
    const imageDistance = Physics.optics.thinLens.imageDistance(focalLength, objectDistance);
    const magnification = Physics.optics.thinLens.magnification(imageDistance, objectDistance);
    const power = Physics.optics.thinLens.power(focalLength);

    return {
      focalLength: focalLength * 100,
      objectDistance: objectDistance * 100,
      imageDistance: imageDistance * 100,
      magnification,
      power,
      imageType: imageDistance > 0 ? 'Real' : 'Virtual',
    };
  };

  // Interference simulation
  const calculateInterference = () => {
    const { wavelength = 600e-9, slitSeparation = 0.001, screenDistance = 1 } = params;
    const fringeSpacing = Physics.waves.diffraction.doubleSlit.fringeSpacing(wavelength, slitSeparation, screenDistance);

    return {
      wavelength: wavelength * 1e9,
      slitSeparation: slitSeparation * 1000,
      screenDistance,
      fringeSpacing: fringeSpacing * 1000,
    };
  };

  // Specific Heat simulation
  const calculateSpecificHeat = (t) => {
    const { mass = 0.5, specificHeat = 4186, initialTemp = 20, heatRate = 100 } = params;
    const heatAdded = heatRate * t;
    const tempChange = heatAdded / (mass * specificHeat);
    const currentTemp = initialTemp + tempChange;

    return { heatAdded, tempChange, currentTemp, mass, specificHeat };
  };

  // Gas Laws simulation
  const calculateGasLaws = () => {
    const { pressure = 101325, volume = 0.001, temperature = 300 } = params;
    const n = (pressure * volume) / (Physics.CONSTANTS.R * temperature);

    return {
      pressure: pressure / 1000,
      volume: volume * 1000,
      temperature,
      moles: n,
    };
  };

  // Photoelectric Effect simulation
  const calculatePhotoelectric = () => {
    const { frequency = 6e14, workFunction = 2.5e-19 } = params;
    const photonEnergy = Physics.modernPhysics.photoelectric.photonEnergy(frequency);
    const kineticEnergy = Physics.modernPhysics.photoelectric.kineticEnergy(frequency, workFunction);
    const thresholdFreq = Physics.modernPhysics.photoelectric.thresholdFrequency(workFunction);
    const stoppingPotential = Physics.modernPhysics.photoelectric.stoppingPotential(frequency, workFunction);

    return {
      frequency: frequency / 1e14,
      photonEnergy: photonEnergy / Physics.CONSTANTS.e,
      kineticEnergy: kineticEnergy / Physics.CONSTANTS.e,
      thresholdFreq: thresholdFreq / 1e14,
      stoppingPotential: Math.max(0, stoppingPotential),
      photoelectronsEmitted: kineticEnergy > 0,
    };
  };

  // Radioactive Decay simulation
  const calculateRadioactiveDecay = (t) => {
    const { initialNuclei = 1000, halfLife = 5 } = params;
    const decayConstant = Physics.modernPhysics.radioactiveDecay.decayConstant(halfLife);
    const remaining = Physics.modernPhysics.radioactiveDecay.remainingNuclei(initialNuclei, decayConstant, t);
    const decayed = Physics.modernPhysics.radioactiveDecay.decayedNuclei(initialNuclei, decayConstant, t);
    const activity = Physics.modernPhysics.radioactiveDecay.activity(remaining, decayConstant);

    return { remaining: Math.round(remaining), decayed: Math.round(decayed), activity, halfLife, decayConstant };
  };

  const finishSimulation = (finalResults) => {
    setIsRunning(false);
    setShowResults(true);

    // Calculate score based on data collection and accuracy
    const score = calculateScore(finalResults);

    Alert.alert(
      'Experiment Complete!',
      `Your score: ${score}%\n\nWould you like to save your results?`,
      [
        { text: 'Discard', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            completeExperiment(experimentId, score, { params, results: finalResults, dataPoints });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const calculateScore = (finalResults) => {
    // Base score for completing the experiment
    let score = 70;

    // Bonus for collecting enough data points
    if (dataPoints.length >= 50) score += 10;

    // Bonus for valid results
    if (Object.keys(finalResults).length > 0) score += 10;

    // Bonus for using non-default parameters
    const defaultParams = experiment?.defaultParams || {};
    const modifiedParams = Object.keys(params).filter(
      key => params[key] !== defaultParams[key]
    );
    if (modifiedParams.length > 0) score += 10;

    return Math.min(100, score);
  };

  const renderVisualization = () => {
    switch (experiment?.id) {
      case 'pendulum':
        return renderPendulumViz();
      case 'projectile':
        return renderProjectileViz();
      case 'standing_waves':
        return renderWaveViz();
      case 'ohms_law':
      case 'rc_circuit':
        return renderCircuitViz();
      case 'snells_law':
        return renderOpticsViz();
      case 'radioactive_decay':
        return renderDecayViz();
      default:
        return renderDefaultViz();
    }
  };

  const renderPendulumViz = () => {
    const angle = results.position ? (results.position * Math.PI / 180) : 0;
    const length = 150;
    const pivotX = CANVAS_WIDTH / 2;
    const pivotY = 50;
    const bobX = pivotX + length * Math.sin(angle);
    const bobY = pivotY + length * Math.cos(angle);

    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#e8f4f8" />
            <Stop offset="100%" stopColor="#d4e6f1" />
          </LinearGradient>
        </Defs>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#bgGrad)" rx={12} />

        {/* Pivot */}
        <Rect x={pivotX - 30} y={20} width={60} height={10} fill="#34495e" rx={5} />

        {/* String */}
        <Line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#7f8c8d" strokeWidth={2} />

        {/* Bob */}
        <Circle cx={bobX} cy={bobY} r={20} fill="#3498db" />
        <Circle cx={bobX - 5} cy={bobY - 5} r={5} fill="rgba(255,255,255,0.3)" />

        {/* Labels */}
        <SvgText x={20} y={CANVAS_HEIGHT - 20} fontSize={12} fill="#2c3e50">
          T = {Physics.utils.round(results.period || 0, 2)}s
        </SvgText>
        <SvgText x={CANVAS_WIDTH - 80} y={CANVAS_HEIGHT - 20} fontSize={12} fill="#2c3e50">
          f = {Physics.utils.round(results.frequency || 0, 2)} Hz
        </SvgText>
      </Svg>
    );
  };

  const renderProjectileViz = () => {
    const scaleX = CANVAS_WIDTH / ((results.range || 100) * 1.2);
    const scaleY = CANVAS_HEIGHT / ((results.maxHeight || 50) * 2.5);
    const x = (results.x || 0) * scaleX;
    const y = CANVAS_HEIGHT - 30 - (results.y || 0) * scaleY;

    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#87ceeb" rx={12} />
        <Rect y={CANVAS_HEIGHT - 30} width={CANVAS_WIDTH} height={30} fill="#8b4513" rx={8} />

        {/* Trajectory path */}
        <Path
          d={dataPoints.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x * scaleX} ${CANVAS_HEIGHT - 30 - Math.max(0, p.y) * scaleY}`
          ).join(' ')}
          fill="none"
          stroke="rgba(231, 76, 60, 0.5)"
          strokeWidth={2}
          strokeDasharray="5,5"
        />

        {/* Projectile */}
        <Circle cx={x} cy={y} r={10} fill="#e74c3c" />

        {/* Labels */}
        <SvgText x={20} y={20} fontSize={12} fill="#2c3e50">
          Range: {Physics.utils.round(results.range || 0, 1)}m
        </SvgText>
        <SvgText x={20} y={40} fontSize={12} fill="#2c3e50">
          Max Height: {Physics.utils.round(results.maxHeight || 0, 1)}m
        </SvgText>
      </Svg>
    );
  };

  const renderWaveViz = () => {
    const { harmonic = 1 } = params;
    const amplitude = 50;
    const points = [];

    for (let x = 0; x <= CANVAS_WIDTH; x += 2) {
      const normalizedX = x / CANVAS_WIDTH;
      const y = amplitude * Math.sin(harmonic * Math.PI * normalizedX) * Math.cos(2 * Math.PI * time);
      points.push(`${x === 0 ? 'M' : 'L'} ${x} ${CANVAS_HEIGHT / 2 + y}`);
    }

    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" rx={12} />

        {/* Center line */}
        <Line x1={0} y1={CANVAS_HEIGHT / 2} x2={CANVAS_WIDTH} y2={CANVAS_HEIGHT / 2}
              stroke="#bdc3c7" strokeWidth={1} strokeDasharray="5,5" />

        {/* Wave */}
        <Path d={points.join(' ')} fill="none" stroke="#9b59b6" strokeWidth={3} />

        {/* Nodes */}
        {(results.nodes || []).map((pos, i) => (
          <Circle key={`node-${i}`}
            cx={pos * CANVAS_WIDTH / (params.length || 1)}
            cy={CANVAS_HEIGHT / 2}
            r={6} fill="#e74c3c"
          />
        ))}

        <SvgText x={20} y={20} fontSize={12} fill="#2c3e50">
          n = {harmonic} | f = {Physics.utils.round(results.frequency || 0, 1)} Hz
        </SvgText>
      </Svg>
    );
  };

  const renderCircuitViz = () => {
    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#fafafa" rx={12} />

        {/* Battery */}
        <Line x1={50} y1={100} x2={50} y2={200} stroke="#2c3e50" strokeWidth={2} />
        <Line x1={40} y1={120} x2={60} y2={120} stroke="#2c3e50" strokeWidth={4} />
        <Line x1={35} y1={140} x2={65} y2={140} stroke="#2c3e50" strokeWidth={2} />
        <SvgText x={35} y={170} fontSize={12} fill="#2c3e50">V</SvgText>

        {/* Wire */}
        <Line x1={50} y1={100} x2={150} y2={100} stroke="#2c3e50" strokeWidth={2} />
        <Line x1={50} y1={200} x2={150} y2={200} stroke="#2c3e50" strokeWidth={2} />

        {/* Resistor */}
        <Path d="M150 100 L160 100 L165 85 L175 115 L185 85 L195 115 L205 85 L215 115 L220 100 L250 100"
              fill="none" stroke="#e67e22" strokeWidth={2} />
        <SvgText x={175} y={75} fontSize={12} fill="#2c3e50">R</SvgText>

        {/* Complete circuit */}
        <Line x1={250} y1={100} x2={250} y2={200} stroke="#2c3e50" strokeWidth={2} />
        <Line x1={150} y1={200} x2={250} y2={200} stroke="#2c3e50" strokeWidth={2} />

        {/* Results */}
        <SvgText x={20} y={250} fontSize={14} fill="#2c3e50">
          V = {results.voltage || 0}V
        </SvgText>
        <SvgText x={120} y={250} fontSize={14} fill="#2c3e50">
          I = {Physics.utils.round(results.current || 0, 2)}mA
        </SvgText>
        <SvgText x={240} y={250} fontSize={14} fill="#2c3e50">
          P = {Physics.utils.round(results.power || 0, 2)}W
        </SvgText>
      </Svg>
    );
  };

  const renderOpticsViz = () => {
    const incidentAngle = Physics.convertUnits.degToRad(params.incidentAngle || 30);
    const refractedAngle = typeof results.refractedAngle === 'number'
      ? Physics.convertUnits.degToRad(results.refractedAngle)
      : null;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        {/* Medium 1 (top) */}
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT / 2} fill="#e3f2fd" rx={12} />
        {/* Medium 2 (bottom) */}
        <Rect y={CANVAS_HEIGHT / 2} width={CANVAS_WIDTH} height={CANVAS_HEIGHT / 2} fill="#bbdefb" />

        {/* Interface line */}
        <Line x1={0} y1={centerY} x2={CANVAS_WIDTH} y2={centerY} stroke="#1976d2" strokeWidth={2} />

        {/* Normal */}
        <Line x1={centerX} y1={30} x2={centerX} y2={CANVAS_HEIGHT - 30}
              stroke="#bdc3c7" strokeWidth={1} strokeDasharray="5,5" />

        {/* Incident ray */}
        <Line x1={centerX - 100 * Math.sin(incidentAngle)} y1={centerY - 100 * Math.cos(incidentAngle)}
              x2={centerX} y2={centerY}
              stroke="#f44336" strokeWidth={3} />

        {/* Refracted ray */}
        {refractedAngle !== null && (
          <Line x1={centerX} y1={centerY}
                x2={centerX + 100 * Math.sin(refractedAngle)} y2={centerY + 100 * Math.cos(refractedAngle)}
                stroke="#4caf50" strokeWidth={3} />
        )}

        <SvgText x={20} y={30} fontSize={12} fill="#2c3e50">n1 = {params.n1}</SvgText>
        <SvgText x={20} y={CANVAS_HEIGHT - 20} fontSize={12} fill="#2c3e50">n2 = {params.n2}</SvgText>
        <SvgText x={CANVAS_WIDTH - 100} y={30} fontSize={12} fill="#2c3e50">
          θi = {params.incidentAngle}°
        </SvgText>
        <SvgText x={CANVAS_WIDTH - 100} y={CANVAS_HEIGHT - 20} fontSize={12} fill="#2c3e50">
          θr = {typeof results.refractedAngle === 'number' ? Physics.utils.round(results.refractedAngle, 1) : results.refractedAngle}°
        </SvgText>
      </Svg>
    );
  };

  const renderDecayViz = () => {
    const { initialNuclei = 1000 } = params;
    const remaining = results.remaining || initialNuclei;
    const barHeight = (remaining / initialNuclei) * (CANVAS_HEIGHT - 60);

    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f5f5f5" rx={12} />

        {/* Container */}
        <Rect x={CANVAS_WIDTH / 2 - 60} y={30} width={120} height={CANVAS_HEIGHT - 60}
              fill="none" stroke="#2c3e50" strokeWidth={2} rx={8} />

        {/* Remaining nuclei */}
        <Rect x={CANVAS_WIDTH / 2 - 58} y={CANVAS_HEIGHT - 30 - barHeight}
              width={116} height={barHeight}
              fill="#8e44ad" rx={6} />

        {/* Labels */}
        <SvgText x={20} y={30} fontSize={12} fill="#2c3e50">
          N0 = {initialNuclei}
        </SvgText>
        <SvgText x={20} y={50} fontSize={12} fill="#2c3e50">
          N = {results.remaining || initialNuclei}
        </SvgText>
        <SvgText x={20} y={70} fontSize={12} fill="#2c3e50">
          t1/2 = {params.halfLife}s
        </SvgText>
        <SvgText x={CANVAS_WIDTH / 2 - 30} y={CANVAS_HEIGHT / 2} fontSize={16} fill="#fff" fontWeight="bold">
          {Math.round((remaining / initialNuclei) * 100)}%
        </SvgText>
      </Svg>
    );
  };

  const renderDefaultViz = () => (
    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
      <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" rx={12} />
      <SvgText x={CANVAS_WIDTH / 2} y={CANVAS_HEIGHT / 2} fontSize={16} fill="#7f8c8d" textAnchor="middle">
        Simulation Running...
      </SvgText>
    </Svg>
  );

  const renderParamControl = (key, label, min, max, step = 1, unit = '') => (
    <View key={key} style={styles.paramRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <View style={styles.paramControl}>
        <TouchableOpacity
          style={styles.paramButton}
          onPress={() => updateParam(key, Math.max(min, (params[key] || min) - step))}
        >
          <Text style={styles.paramButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.paramValue}>
          {Physics.utils.round(params[key] || min, 2)} {unit}
        </Text>
        <TouchableOpacity
          style={styles.paramButton}
          onPress={() => updateParam(key, Math.min(max, (params[key] || min) + step))}
        >
          <Text style={styles.paramButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderParams = () => {
    switch (experiment?.id) {
      case 'pendulum':
        return (
          <>
            {renderParamControl('length', 'Length', 0.1, 2, 0.1, 'm')}
            {renderParamControl('amplitude', 'Amplitude', 5, 30, 5, '°')}
          </>
        );
      case 'projectile':
        return (
          <>
            {renderParamControl('velocity', 'Initial Velocity', 5, 50, 5, 'm/s')}
            {renderParamControl('angle', 'Angle', 15, 75, 5, '°')}
          </>
        );
      case 'ohms_law':
        return (
          <>
            {renderParamControl('voltage', 'Voltage', 1, 24, 1, 'V')}
            {renderParamControl('resistance', 'Resistance', 10, 1000, 10, 'Ω')}
          </>
        );
      case 'snells_law':
        return (
          <>
            {renderParamControl('n1', 'n1 (air)', 1, 1.5, 0.1, '')}
            {renderParamControl('n2', 'n2 (glass)', 1, 2.5, 0.1, '')}
            {renderParamControl('incidentAngle', 'Incident Angle', 0, 85, 5, '°')}
          </>
        );
      case 'radioactive_decay':
        return (
          <>
            {renderParamControl('initialNuclei', 'Initial Nuclei', 100, 2000, 100, '')}
            {renderParamControl('halfLife', 'Half-Life', 1, 20, 1, 's')}
          </>
        );
      case 'standing_waves':
        return (
          <>
            {renderParamControl('harmonic', 'Harmonic (n)', 1, 6, 1, '')}
            {renderParamControl('length', 'String Length', 0.5, 2, 0.1, 'm')}
          </>
        );
      default:
        return Object.entries(experiment?.defaultParams || {}).map(([key, defaultVal]) =>
          renderParamControl(key, key, defaultVal * 0.5, defaultVal * 2, defaultVal * 0.1)
        );
    }
  };

  if (!experiment) {
    return (
      <View style={styles.errorContainer}>
        <Text>Experiment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: experiment.categoryColor || '#3498db' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{experiment.title}</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{Physics.utils.round(time, 1)}s</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visualization */}
        <View style={styles.vizContainer}>
          {renderVisualization()}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlButtons}>
            {!isRunning ? (
              <TouchableOpacity style={styles.startButton} onPress={startSimulation}>
                <Text style={styles.controlButtonText}>▶ Start</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.pauseButton} onPress={pauseSimulation}>
                  <Text style={styles.controlButtonText}>{isPaused ? '▶' : '⏸'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={resetSimulation}>
                  <Text style={styles.controlButtonText}>↺ Reset</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Parameters */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>Parameters</Text>
          {renderParams()}
        </View>

        {/* Live Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Live Results</Text>
          <View style={styles.resultsGrid}>
            {Object.entries(results)
              .filter(([key, val]) => typeof val === 'number')
              .slice(0, 6)
              .map(([key, value]) => (
                <View key={key} style={styles.resultItem}>
                  <Text style={styles.resultLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Text style={styles.resultValue}>{Physics.utils.formatScientific(value)}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Formula */}
        {settings.showFormulas && experiment.formula && (
          <View style={styles.formulaContainer}>
            <Text style={styles.sectionTitle}>Formula</Text>
            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>{experiment.formula}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 12,
  },
  timerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  vizContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
  },
  pauseButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginRight: 12,
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paramsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paramLabel: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  paramControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paramButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paramButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paramValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: 80,
    textAlign: 'center',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultItem: {
    width: '50%',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 2,
  },
  formulaContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formulaBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  formulaText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#2c3e50',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SimulationScreen;
