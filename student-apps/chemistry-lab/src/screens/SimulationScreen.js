import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import * as Chemistry from '../simulations/ChemistryEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = 280;

const SimulationScreen = ({ route, navigation }) => {
  const { experimentId } = route.params;
  const { getExperimentById, completeExperiment, settings } = useApp();
  const experiment = getExperimentById(experimentId);

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [params, setParams] = useState(experiment?.defaultParams || {});
  const [results, setResults] = useState({});
  const [dataPoints, setDataPoints] = useState([]);

  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => () => animationRef.current && cancelAnimationFrame(animationRef.current), []);

  const updateParam = (key, value) => { setParams(prev => ({ ...prev, [key]: value })); resetSimulation(); };
  const resetSimulation = () => { setIsRunning(false); setTime(0); setResults({}); setDataPoints([]); animationRef.current && cancelAnimationFrame(animationRef.current); };

  const startSimulation = () => {
    resetSimulation();
    setIsRunning(true);
    startTimeRef.current = Date.now();
    runSimulation();
  };

  const runSimulation = () => {
    const elapsed = (Date.now() - startTimeRef.current) * (settings.animationSpeed || 1) / 1000;
    setTime(elapsed);
    const simResults = calculateSimulation(elapsed);
    setResults(simResults);
    if (elapsed < getMaxTime()) {
      setDataPoints(prev => [...prev, { t: elapsed, ...simResults }]);
      animationRef.current = requestAnimationFrame(runSimulation);
    } else {
      finishSimulation(simResults);
    }
  };

  const getMaxTime = () => {
    switch (experiment?.id) {
      case 'ph_titration': return 30;
      case 'rate_of_reaction': return 20;
      case 'fermentation': return 30;
      case 'electrolysis': return 15;
      default: return 15;
    }
  };

  const calculateSimulation = (t) => {
    switch (experiment?.id) {
      case 'ph_titration': return calculateTitration(t);
      case 'rate_of_reaction': return calculateReactionRate(t);
      case 'solubility': return calculateSolubility(t);
      case 'enthalpy_neutralization': return calculateEnthalpy(t);
      case 'esterification': return calculateEsterification(t);
      case 'fermentation': return calculateFermentation(t);
      case 'flame_test': return calculateFlameTest();
      case 'electrochemical_series': return calculateReactivity();
      case 'electroplating': return calculateElectroplating(t);
      case 'equilibrium': return calculateEquilibrium(t);
      case 'electrolysis': return calculateElectrolysis(t);
      case 'ph_testing': return calculatepH();
      default: return {};
    }
  };

  const calculateTitration = (t) => {
    const { acidVolume = 10, baseConcentration = 0.1 } = params;
    const baseVolume = t * 2; // Adding 2 mL/s
    const pH = Chemistry.acidBase.titration.pHDuringTitration(0.1, acidVolume, baseConcentration, baseVolume);
    const equivalenceVol = Chemistry.acidBase.titration.volumeAtEquivalence(0.1, acidVolume, baseConcentration);
    return { baseVolume: Math.min(baseVolume, 25), pH: Chemistry.utils.clamp(pH, 0, 14), equivalenceVol, atEquivalence: Math.abs(baseVolume - equivalenceVol) < 0.5 };
  };

  const calculateReactionRate = (t) => {
    const { acidConcentration = 1.0, magnesiumMass = 0.1 } = params;
    const k = 0.1 * acidConcentration;
    const gasVolume = magnesiumMass * 1000 * (1 - Math.exp(-k * t));
    const rate = k * magnesiumMass * 1000 * Math.exp(-k * t);
    return { gasVolume, rate, concentration: acidConcentration };
  };

  const calculateSolubility = (t) => {
    const { startTemp = 80, soluteMass = 5 } = params;
    const currentTemp = Math.max(20, startTemp - t * 3);
    const solubility = 31.6 + 0.54 * currentTemp;
    const dissolved = Math.min(soluteMass, (solubility / 100) * 5);
    const crystallized = Math.max(0, soluteMass - dissolved);
    return { currentTemp, solubility, dissolved, crystallized };
  };

  const calculateEnthalpy = (t) => {
    const { acidVolume = 25, concentration = 1.0 } = params;
    const maxDeltaT = 6.8;
    const deltaT = maxDeltaT * (1 - Math.exp(-t / 2));
    const q = (acidVolume * 2) * 4.18 * deltaT;
    const moles = (acidVolume / 1000) * concentration;
    const enthalpy = -q / moles / 1000;
    return { temperature: 25 + deltaT, deltaT, heatReleased: q, enthalpy };
  };

  const calculateEsterification = (t) => {
    const { refluxTime = 15 } = params;
    const progress = Math.min(100, (t / refluxTime) * 100);
    const yield_pct = 60 * (1 - Math.exp(-t / 10));
    return { progress, yield: yield_pct, isComplete: progress >= 100 };
  };

  const calculateFermentation = (t) => {
    const { glucoseConcentration = 10, temperature = 35 } = params;
    const rate = Chemistry.organic.fermentationRate(glucoseConcentration, temperature);
    const co2Volume = rate * t * 10;
    const ethanolConc = (glucoseConcentration / 180) * 2 * 46 * (1 - Math.exp(-t / 15));
    return { co2Volume, ethanolConc, bubblesPerMin: Math.round(rate * 60) };
  };

  const calculateFlameTest = () => {
    const { metalIon = 'Na' } = params;
    const colors = Chemistry.spectroscopy.flameTestColors;
    const ionData = colors[metalIon] || { color: '#FFFF00', wavelength: 589 };
    return { color: ionData.color, wavelength: ionData.wavelength, ion: metalIon };
  };

  const calculateReactivity = () => {
    const series = ['K', 'Na', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'H', 'Cu', 'Ag'];
    return { series, description: 'More reactive metals displace less reactive metals' };
  };

  const calculateElectroplating = (t) => {
    const { current = 0.5, solutionConcentration = 1.0 } = params;
    const mass = Chemistry.electrochemistry.faraday.massDeposited(current, t * 60, 63.5, 2);
    const charge = current * t * 60;
    return { massDeposited: mass * 1000, charge, thickness: mass / (0.001 * 8.96) };
  };

  const calculateEquilibrium = (t) => {
    const position = 50 + 30 * Math.sin(t * 0.5);
    return { forwardRate: 50 + (position - 50) * 0.5, reverseRate: 50 - (position - 50) * 0.5, position };
  };

  const calculateElectrolysis = (t) => {
    const { current = 0.5 } = params;
    const h2Volume = (current * t * 22.4) / (2 * 96485) * 1000;
    const o2Volume = h2Volume / 2;
    return { h2Volume, o2Volume, ratio: 2.0, totalCharge: current * t };
  };

  const calculatepH = () => {
    const pH = 7 + (Math.random() - 0.5) * 2;
    return { pH, isAcidic: pH < 7, isBasic: pH > 7 };
  };

  const finishSimulation = (finalResults) => {
    setIsRunning(false);
    const score = 70 + (dataPoints.length >= 30 ? 10 : 0) + (Object.keys(finalResults).length > 0 ? 10 : 0) + 10;
    Alert.alert('Experiment Complete!', `Your score: ${Math.min(100, score)}%`, [
      { text: 'Discard', style: 'cancel' },
      { text: 'Save', onPress: () => { completeExperiment(experimentId, Math.min(100, score), { params, results: finalResults }); navigation.goBack(); } },
    ]);
  };

  const renderVisualization = () => {
    switch (experiment?.id) {
      case 'ph_titration': return renderTitrationViz();
      case 'fermentation': return renderFermentationViz();
      case 'flame_test': return renderFlameTestViz();
      case 'electrolysis': return renderElectrolysisViz();
      default: return renderDefaultViz();
    }
  };

  const renderTitrationViz = () => {
    const pH = results.pH || 7;
    const pHColor = pH < 7 ? `rgb(${255}, ${Math.round(255 * pH / 7)}, 0)` : `rgb(0, ${Math.round(255 * (14 - pH) / 7)}, 255)`;
    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Defs><LinearGradient id="flask" x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0%" stopColor="#fff" /><Stop offset="100%" stopColor="#eee" /></LinearGradient></Defs>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" rx={12} />
        <Rect x={CANVAS_WIDTH/2 - 40} y={80} width={80} height={120} fill="url(#flask)" stroke="#2c3e50" strokeWidth={2} rx={5} />
        <Rect x={CANVAS_WIDTH/2 - 35} y={200 - (results.baseVolume || 0) * 3} width={70} height={(results.baseVolume || 0) * 3} fill={pHColor} rx={3} />
        <Line x1={CANVAS_WIDTH/2} y1={20} x2={CANVAS_WIDTH/2} y2={80} stroke="#2c3e50" strokeWidth={3} />
        <Circle cx={CANVAS_WIDTH/2} cy={75} r={5} fill="#3498db" />
        <SvgText x={20} y={30} fontSize={14} fill="#2c3e50">pH = {Chemistry.utils.round(pH, 1)}</SvgText>
        <SvgText x={20} y={50} fontSize={12} fill="#7f8c8d">Volume added: {Chemistry.utils.round(results.baseVolume || 0, 1)} mL</SvgText>
        {results.atEquivalence && <SvgText x={CANVAS_WIDTH/2} y={CANVAS_HEIGHT - 20} fontSize={14} fill="#27ae60" textAnchor="middle">Equivalence Point!</SvgText>}
      </Svg>
    );
  };

  const renderFermentationViz = () => {
    const bubbleCount = Math.min(20, Math.floor((results.co2Volume || 0) / 5));
    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" rx={12} />
        <Rect x={60} y={60} width={100} height={160} fill="#ffe0b2" stroke="#e65100" strokeWidth={2} rx={5} />
        {[...Array(bubbleCount)].map((_, i) => <Circle key={i} cx={80 + Math.random() * 60} cy={200 - i * 10 - Math.random() * 20} r={3 + Math.random() * 4} fill="rgba(255,255,255,0.7)" stroke="#bbb" strokeWidth={1} />)}
        <Rect x={CANVAS_WIDTH - 120} y={100} width={60} height={100} fill="#e0e0e0" stroke="#9e9e9e" strokeWidth={2} rx={5} />
        <Rect x={CANVAS_WIDTH - 118} y={200 - (results.co2Volume || 0) * 2} width={56} height={Math.min(96, (results.co2Volume || 0) * 2)} fill="rgba(200,200,200,0.5)" />
        <Line x1={160} y1={100} x2={CANVAS_WIDTH - 120} y2={100} stroke="#2c3e50" strokeWidth={2} />
        <SvgText x={20} y={30} fontSize={14} fill="#2c3e50">CO₂: {Chemistry.utils.round(results.co2Volume || 0, 1)} mL</SvgText>
        <SvgText x={20} y={50} fontSize={12} fill="#7f8c8d">Bubbles/min: {results.bubblesPerMin || 0}</SvgText>
      </Svg>
    );
  };

  const renderFlameTestViz = () => {
    const color = results.color || '#FFFF00';
    return (
      <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a1a2e" rx={12} />
        <Rect x={CANVAS_WIDTH/2 - 15} y={CANVAS_HEIGHT - 60} width={30} height={50} fill="#4a4a4a" />
        <Path d={`M${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 60} Q${CANVAS_WIDTH/2 - 40} ${CANVAS_HEIGHT - 150} ${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 200} Q${CANVAS_WIDTH/2 + 40} ${CANVAS_HEIGHT - 150} ${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 60}`} fill={color} opacity={0.9} />
        <Path d={`M${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 60} Q${CANVAS_WIDTH/2 - 20} ${CANVAS_HEIGHT - 120} ${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 160} Q${CANVAS_WIDTH/2 + 20} ${CANVAS_HEIGHT - 120} ${CANVAS_WIDTH/2} ${CANVAS_HEIGHT - 60}`} fill="#fff" opacity={0.3} />
        <SvgText x={20} y={30} fontSize={16} fill="#fff">Ion: {results.ion}</SvgText>
        <SvgText x={20} y={55} fontSize={14} fill="#aaa">λ = {results.wavelength} nm</SvgText>
      </Svg>
    );
  };

  const renderElectrolysisViz = () => (
    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
      <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#e3f2fd" rx={12} />
      <Rect x={40} y={100} width={CANVAS_WIDTH - 80} height={120} fill="#bbdefb" stroke="#1976d2" strokeWidth={2} rx={5} />
      <Rect x={80} y={80} width={20} height={100} fill="#f44336" />
      <Rect x={CANVAS_WIDTH - 100} y={80} width={20} height={100} fill="#2196f3" />
      <Line x1={90} y1={60} x2={90} y2={80} stroke="#333" strokeWidth={2} />
      <Line x1={CANVAS_WIDTH - 90} y1={60} x2={CANVAS_WIDTH - 90} y2={80} stroke="#333" strokeWidth={2} />
      {[...Array(Math.min(10, Math.floor((results.h2Volume || 0) / 2)))].map((_, i) => <Circle key={`h-${i}`} cx={CANVAS_WIDTH - 90 + (Math.random() - 0.5) * 20} cy={160 - i * 8} r={4} fill="rgba(255,255,255,0.8)" />)}
      {[...Array(Math.min(5, Math.floor((results.o2Volume || 0) / 2)))].map((_, i) => <Circle key={`o-${i}`} cx={90 + (Math.random() - 0.5) * 20} cy={160 - i * 12} r={5} fill="rgba(255,255,255,0.8)" />)}
      <SvgText x={CANVAS_WIDTH - 100} y={250} fontSize={12} fill="#2c3e50" textAnchor="middle">H₂: {Chemistry.utils.round(results.h2Volume || 0, 1)} mL</SvgText>
      <SvgText x={90} y={250} fontSize={12} fill="#2c3e50" textAnchor="middle">O₂: {Chemistry.utils.round(results.o2Volume || 0, 1)} mL</SvgText>
    </Svg>
  );

  const renderDefaultViz = () => (
    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
      <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" rx={12} />
      <SvgText x={CANVAS_WIDTH/2} y={CANVAS_HEIGHT/2} fontSize={16} fill="#7f8c8d" textAnchor="middle">Simulation Running...</SvgText>
    </Svg>
  );

  const renderParamControl = (key, label, min, max, step = 1, unit = '') => (
    <View key={key} style={styles.paramRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <View style={styles.paramControl}>
        <TouchableOpacity style={styles.paramButton} onPress={() => updateParam(key, Math.max(min, (params[key] || min) - step))}><Text style={styles.paramButtonText}>-</Text></TouchableOpacity>
        <Text style={styles.paramValue}>{Chemistry.utils.round(params[key] || min, 2)} {unit}</Text>
        <TouchableOpacity style={styles.paramButton} onPress={() => updateParam(key, Math.min(max, (params[key] || min) + step))}><Text style={styles.paramButtonText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderParams = () => {
    switch (experiment?.id) {
      case 'ph_titration': return <>{renderParamControl('acidVolume', 'Acid Volume', 5, 25, 5, 'mL')}{renderParamControl('baseConcentration', 'Base Conc.', 0.05, 0.2, 0.05, 'M')}</>;
      case 'rate_of_reaction': return <>{renderParamControl('acidConcentration', 'Acid Conc.', 0.5, 2, 0.5, 'M')}{renderParamControl('magnesiumMass', 'Mg Mass', 0.05, 0.2, 0.05, 'g')}</>;
      case 'fermentation': return <>{renderParamControl('glucoseConcentration', 'Glucose', 5, 20, 5, 'g/L')}{renderParamControl('temperature', 'Temperature', 20, 45, 5, '°C')}</>;
      case 'electrolysis': return <>{renderParamControl('current', 'Current', 0.1, 1, 0.1, 'A')}</>;
      default: return null;
    }
  };

  if (!experiment) return <View style={styles.errorContainer}><Text>Experiment not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: experiment.categoryColor || '#27ae60' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{experiment.title}</Text>
        <View style={styles.timerBadge}><Text style={styles.timerText}>{Chemistry.utils.round(time, 1)}s</Text></View>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.vizContainer}>{renderVisualization()}</View>
        <View style={styles.controlsContainer}>
          <View style={styles.controlButtons}>
            {!isRunning ? <TouchableOpacity style={styles.startButton} onPress={startSimulation}><Text style={styles.controlButtonText}>▶ Start</Text></TouchableOpacity> : <TouchableOpacity style={styles.resetButton} onPress={resetSimulation}><Text style={styles.controlButtonText}>↺ Reset</Text></TouchableOpacity>}
          </View>
        </View>
        <View style={styles.paramsContainer}><Text style={styles.sectionTitle}>Parameters</Text>{renderParams()}</View>
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Live Results</Text>
          <View style={styles.resultsGrid}>
            {Object.entries(results).filter(([_, val]) => typeof val === 'number').slice(0, 6).map(([key, value]) => (
              <View key={key} style={styles.resultItem}><Text style={styles.resultLabel}>{key.replace(/([A-Z])/g, ' $1')}</Text><Text style={styles.resultValue}>{Chemistry.utils.formatScientific(value)}</Text></View>
            ))}
          </View>
        </View>
        {settings.showFormulas && experiment.formula && <View style={styles.formulaContainer}><Text style={styles.sectionTitle}>Formula</Text><View style={styles.formulaBox}><Text style={styles.formulaText}>{experiment.formula}</Text></View></View>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff', marginHorizontal: 12 },
  timerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  timerText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1 },
  vizContainer: { margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  controlsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  controlButtons: { flexDirection: 'row', justifyContent: 'center' },
  startButton: { backgroundColor: '#27ae60', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 16 },
  resetButton: { backgroundColor: '#e74c3c', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 16 },
  controlButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  paramsContainer: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  paramLabel: { fontSize: 14, color: '#2c3e50', flex: 1 },
  paramControl: { flexDirection: 'row', alignItems: 'center' },
  paramButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  paramButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  paramValue: { fontSize: 14, fontWeight: '600', color: '#2c3e50', minWidth: 80, textAlign: 'center' },
  resultsContainer: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  resultItem: { width: '50%', marginBottom: 12 },
  resultLabel: { fontSize: 11, color: '#7f8c8d', textTransform: 'capitalize' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#27ae60', marginTop: 2 },
  formulaContainer: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  formulaBox: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#27ae60' },
  formulaText: { fontSize: 16, fontFamily: 'monospace', color: '#2c3e50', textAlign: 'center' },
});

export default SimulationScreen;
