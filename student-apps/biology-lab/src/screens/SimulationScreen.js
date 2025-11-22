import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Circle, Rect, Line, Path, Text as SvgText, G, Ellipse, Polygon } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import BiologyEngine from '../simulations/BiologyEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIM_WIDTH = SCREEN_WIDTH - 32;
const SIM_HEIGHT = 300;

const SimulationScreen = ({ route, navigation }) => {
  const { experimentId } = route.params;
  const { getExperimentById, completeExperiment, settings } = useApp();
  const experiment = getExperimentById(experimentId);
  const [phase, setPhase] = useState('setup');
  const [params, setParams] = useState({});
  const [simData, setSimData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const animationRef = useRef(null);

  useEffect(() => { initializeParams(); return () => { if (animationRef.current) clearInterval(animationRef.current); }; }, [experimentId]);

  const initializeParams = () => {
    const defaultParams = {
      microscopy: { magnification: 100, specimen: 'onion' },
      osmosis: { solutionConc: 0.5, duration: 30, tissue: 'potato' },
      cell_division: { stage: 'interphase', cellType: 'onion' },
      enzyme_activity: { substrate: 10, enzyme: 1, temperature: 37, pH: 7 },
      photosynthesis: { lightIntensity: 500, co2: 0.04, temperature: 25 },
      respiration: { organisms: 5, temperature: 20, duration: 10 },
      food_tests: { sample: 'glucose', test: 'benedict' },
      quadrat_sampling: { quadratSize: 1, numQuadrats: 10, habitat: 'grassland' },
      transect: { length: 50, interval: 5, habitat: 'shore' },
      capture_recapture: { marked: 50, captured: 60, recaptured: 10 },
      heart_rate: { restingHR: 70, exerciseIntensity: 50, duration: 10 },
      breathing_rate: { activity: 'rest', duration: 60 },
      reaction_time: { trials: 10, stimulus: 'visual' },
      dna_extraction: { sample: 'strawberry', detergent: true, salt: true },
      chi_squared: { observed: [315, 108, 101, 32], expected: [312, 104, 104, 35] },
      bacterial_growth: { initial: 1000, generationTime: 30, nutrients: 100, duration: 480 },
      antibiotic_sensitivity: { bacteria: 'ecoli', antibiotics: ['penicillin', 'streptomycin', 'tetracycline'] },
    };
    setParams(defaultParams[experimentId] || {});
  };

  const startSimulation = () => {
    setPhase('running');
    setIsRunning(true);
    setCurrentStep(0);
    runSimulation();
  };

  const runSimulation = () => {
    let data;
    switch (experimentId) {
      case 'osmosis':
        data = BiologyEngine.simulations.osmosisSimulation(5, params.solutionConc, params.duration, 20);
        break;
      case 'enzyme_activity':
        data = BiologyEngine.simulations.enzymeSimulation(params.substrate, params.enzyme, params.temperature, params.pH, 30);
        break;
      case 'photosynthesis':
        data = BiologyEngine.simulations.photosynthesisSimulation(params.lightIntensity, params.co2, params.temperature, 10);
        break;
      case 'bacterial_growth':
        data = BiologyEngine.simulations.bacterialGrowthCurve(params.initial, params.generationTime, params.nutrients, params.duration);
        break;
      case 'heart_rate':
        data = BiologyEngine.simulations.heartRateSimulation(params.restingHR, params.exerciseIntensity, params.duration);
        break;
      case 'capture_recapture':
        const estimate = BiologyEngine.ecology.populationEstimate(params.marked, params.captured, params.recaptured);
        data = { estimate, marked: params.marked, captured: params.captured, recaptured: params.recaptured };
        break;
      case 'chi_squared':
        const chiSq = BiologyEngine.genetics.chiSquared(params.observed, params.expected);
        const df = BiologyEngine.genetics.degreesOfFreedom(params.observed.length);
        data = { chiSquared: chiSq, degreesOfFreedom: df, observed: params.observed, expected: params.expected };
        break;
      default:
        data = generateGenericSimData();
    }
    setSimData(data);

    if (Array.isArray(data)) {
      let step = 0;
      animationRef.current = setInterval(() => {
        step++;
        setCurrentStep(step);
        if (step >= data.length - 1) {
          clearInterval(animationRef.current);
          setIsRunning(false);
          setPhase('results');
          calculateResults(data);
        }
      }, 200 / (settings.animationSpeed || 1));
    } else {
      setTimeout(() => {
        setIsRunning(false);
        setPhase('results');
        calculateResults(data);
      }, 2000);
    }
  };

  const generateGenericSimData = () => {
    const data = [];
    for (let i = 0; i <= 20; i++) {
      data.push({ step: i, value: Math.random() * 100, time: i * 5 });
    }
    return data;
  };

  const calculateResults = (data) => {
    let score = 70 + Math.random() * 30;
    let analysis = '';

    switch (experimentId) {
      case 'osmosis':
        const finalChange = data[data.length - 1].percentChange;
        analysis = finalChange < 0 ? 'Water moved out of the tissue (hypertonic solution)' : 'Water moved into the tissue (hypotonic solution)';
        break;
      case 'enzyme_activity':
        analysis = `Enzyme activity was ${params.temperature === 37 ? 'optimal' : params.temperature > 37 ? 'reduced due to denaturation' : 'reduced due to low kinetic energy'}`;
        break;
      case 'bacterial_growth':
        analysis = 'Bacterial population showed typical growth curve with lag, exponential, and stationary phases';
        break;
      case 'heart_rate':
        analysis = 'Heart rate increased during exercise and gradually returned to resting levels during recovery';
        break;
      case 'capture_recapture':
        analysis = `Estimated population size: ${Math.round(data.estimate)} individuals using Lincoln-Petersen method`;
        score = 85;
        break;
      case 'chi_squared':
        const significant = data.chiSquared > 7.815; // Critical value for df=3, p=0.05
        analysis = `Chi-squared value: ${data.chiSquared.toFixed(2)}. Result is ${significant ? 'significantly different from expected' : 'not significantly different from expected'}`;
        score = 90;
        break;
      default:
        analysis = 'Experiment completed successfully. Review your observations.';
    }

    setResults({ score: Math.round(score), analysis, data });
  };

  const finishExperiment = () => {
    completeExperiment(experimentId, results.score);
    Alert.alert('Experiment Complete!', `Score: ${results.score}%\n\n${results.analysis}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  const renderSetup = () => (
    <View style={s.setupContainer}>
      <Text style={s.setupTitle}>Experiment Setup</Text>
      <Text style={s.setupDescription}>{experiment?.description}</Text>
      <View style={s.paramsContainer}>
        {Object.entries(params).map(([key, value]) => (
          <View key={key} style={s.paramRow}>
            <Text style={s.paramLabel}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            <View style={s.paramControls}>
              {typeof value === 'number' ? (
                <>
                  <TouchableOpacity style={s.paramButton} onPress={() => setParams(p => ({ ...p, [key]: Math.max(0, value - getIncrement(key)) }))}><Text style={s.paramButtonText}>-</Text></TouchableOpacity>
                  <Text style={s.paramValue}>{value}</Text>
                  <TouchableOpacity style={s.paramButton} onPress={() => setParams(p => ({ ...p, [key]: value + getIncrement(key) }))}><Text style={s.paramButtonText}>+</Text></TouchableOpacity>
                </>
              ) : (
                <Text style={s.paramValue}>{String(value)}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.startButton} onPress={startSimulation}><Text style={s.startButtonIcon}>▶</Text><Text style={s.startButtonText}>Start Experiment</Text></TouchableOpacity>
    </View>
  );

  const getIncrement = (key) => {
    const increments = { temperature: 5, pH: 0.5, lightIntensity: 100, solutionConc: 0.1, duration: 5, substrate: 1, enzyme: 0.5, restingHR: 5, exerciseIntensity: 10 };
    return increments[key] || 1;
  };

  const renderSimulation = () => {
    const data = Array.isArray(simData) ? simData : [];
    const currentData = data[Math.min(currentStep, data.length - 1)] || {};

    return (
      <View style={s.simulationContainer}>
        <View style={s.simHeader}><Text style={s.simTitle}>{experiment?.title}</Text><Text style={s.simStatus}>{isRunning ? 'Running...' : 'Complete'}</Text></View>
        <View style={s.simCanvas}>
          <Svg width={SIM_WIDTH} height={SIM_HEIGHT} viewBox={`0 0 ${SIM_WIDTH} ${SIM_HEIGHT}`}>
            {renderSimulationGraphics(data, currentStep)}
          </Svg>
        </View>
        <View style={s.dataPanel}>
          <Text style={s.dataPanelTitle}>Live Data</Text>
          {Object.entries(currentData).slice(0, 4).map(([key, val]) => (
            <View key={key} style={s.dataRow}>
              <Text style={s.dataLabel}>{key}:</Text>
              <Text style={s.dataValue}>{typeof val === 'number' ? val.toFixed(2) : String(val)}</Text>
            </View>
          ))}
        </View>
        <View style={s.progressBar}><View style={[s.progressFill, { width: `${(currentStep / Math.max(1, data.length - 1)) * 100}%` }]} /></View>
      </View>
    );
  };

  const renderSimulationGraphics = (data, step) => {
    if (!data || data.length === 0) return renderDefaultAnimation(step);

    switch (experimentId) {
      case 'osmosis': return renderOsmosisGraphic(data, step);
      case 'enzyme_activity': return renderEnzymeGraphic(data, step);
      case 'photosynthesis': return renderPhotosynthesisGraphic(data, step);
      case 'bacterial_growth': return renderBacterialGrowthGraphic(data, step);
      case 'heart_rate': return renderHeartRateGraphic(data, step);
      default: return renderLineChart(data, step);
    }
  };

  const renderOsmosisGraphic = (data, step) => {
    const current = data[Math.min(step, data.length - 1)];
    const cellSize = 60 + (current.percentChange || 0) * 0.5;
    return (
      <G>
        <Rect x={50} y={50} width={SIM_WIDTH - 100} height={200} fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} rx={10} />
        <SvgText x={SIM_WIDTH / 2} y={30} textAnchor="middle" fontSize={14} fill="#333">Solution: {params.solutionConc}M</SvgText>
        {[0, 1, 2].map(i => (
          <G key={i}>
            <Ellipse cx={100 + i * 100} cy={150} rx={cellSize / 2} ry={cellSize / 2.5} fill="#c8e6c9" stroke="#388e3c" strokeWidth={2} />
            <Ellipse cx={100 + i * 100} cy={150} rx={15} ry={10} fill="#81c784" />
          </G>
        ))}
        {current.percentChange < 0 && Array.from({ length: 10 }).map((_, i) => (
          <Circle key={i} cx={80 + (i % 5) * 70 + Math.random() * 20} cy={100 + Math.floor(i / 5) * 80} r={3} fill="#2196f3" opacity={0.6} />
        ))}
        <SvgText x={SIM_WIDTH / 2} y={280} textAnchor="middle" fontSize={12} fill="#666">Mass change: {(current.percentChange || 0).toFixed(1)}%</SvgText>
      </G>
    );
  };

  const renderEnzymeGraphic = (data, step) => {
    const current = data[Math.min(step, data.length - 1)];
    const substrateCount = Math.max(0, Math.round((current.substrate || params.substrate) / 2));
    const productCount = Math.round((current.product || 0) / 2);
    return (
      <G>
        <Rect x={20} y={50} width={SIM_WIDTH - 40} height={200} fill="#fff3e0" stroke="#ff9800" strokeWidth={2} rx={10} />
        <SvgText x={SIM_WIDTH / 2} y={30} textAnchor="middle" fontSize={14} fill="#333">Temp: {params.temperature}°C | pH: {params.pH}</SvgText>
        {Array.from({ length: substrateCount }).map((_, i) => (
          <Rect key={`s${i}`} x={40 + (i % 5) * 30} y={70 + Math.floor(i / 5) * 25} width={20} height={20} fill="#f44336" rx={3} />
        ))}
        <Path d="M180,140 L200,120 L220,140 L220,160 L200,180 L180,160 Z" fill="#4caf50" stroke="#2e7d32" strokeWidth={2} />
        {Array.from({ length: productCount }).map((_, i) => (
          <Circle key={`p${i}`} cx={280 + (i % 4) * 25} cy={100 + Math.floor(i / 4) * 30} r={10} fill="#2196f3" />
        ))}
        <SvgText x={60} y={220} fontSize={10} fill="#666">Substrate</SvgText>
        <SvgText x={185} y={220} fontSize={10} fill="#666">Enzyme</SvgText>
        <SvgText x={290} y={220} fontSize={10} fill="#666">Product</SvgText>
        <SvgText x={SIM_WIDTH / 2} y={270} textAnchor="middle" fontSize={12} fill="#333">Rate: {(current.rate || 0).toFixed(2)} units/min</SvgText>
      </G>
    );
  };

  const renderPhotosynthesisGraphic = (data, step) => {
    const current = data[Math.min(step, data.length - 1)];
    const bubbleCount = current.bubbles || 0;
    return (
      <G>
        <Rect x={50} y={80} width={SIM_WIDTH - 100} height={180} fill="#e0f7fa" stroke="#00acc1" strokeWidth={2} rx={10} />
        <Rect x={SIM_WIDTH / 2 - 30} y={180} width={60} height={80} fill="#4caf50" />
        <Ellipse cx={SIM_WIDTH / 2} cy={160} rx={50} ry={30} fill="#66bb6a" />
        <Circle cx={80} cy={50} r={30} fill="#ffeb3b" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Line key={i} x1={80} y1={50} x2={80 + Math.cos(i * Math.PI / 4) * 50} y2={50 + Math.sin(i * Math.PI / 4) * 50} stroke="#ffc107" strokeWidth={3} />
        ))}
        {Array.from({ length: Math.min(bubbleCount, 20) }).map((_, i) => (
          <Circle key={i} cx={SIM_WIDTH / 2 - 20 + Math.random() * 40} cy={170 - i * 8 - (step % 10) * 2} r={4 + Math.random() * 3} fill="#b3e5fc" stroke="#03a9f4" strokeWidth={1} opacity={0.8} />
        ))}
        <SvgText x={SIM_WIDTH / 2} y={290} textAnchor="middle" fontSize={12} fill="#333">Bubbles: {bubbleCount}/min | Light: {params.lightIntensity} lux</SvgText>
      </G>
    );
  };

  const renderBacterialGrowthGraphic = (data, step) => {
    const chartHeight = 200;
    const chartWidth = SIM_WIDTH - 80;
    const maxLog = Math.max(...data.map(d => d.logPopulation || 0)) + 1;
    const points = data.slice(0, step + 1).map((d, i) => {
      const x = 50 + (i / (data.length - 1)) * chartWidth;
      const y = 250 - ((d.logPopulation || 0) / maxLog) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const current = data[Math.min(step, data.length - 1)];
    const phaseColor = { lag: '#9e9e9e', exponential: '#4caf50', stationary: '#ff9800', death: '#f44336' }[current.phase] || '#333';

    return (
      <G>
        <Line x1={50} y1={250} x2={SIM_WIDTH - 30} y2={250} stroke="#333" strokeWidth={2} />
        <Line x1={50} y1={50} x2={50} y2={250} stroke="#333" strokeWidth={2} />
        {points && <Path d={`M${points}`} fill="none" stroke="#4caf50" strokeWidth={3} />}
        <SvgText x={SIM_WIDTH / 2} y={285} textAnchor="middle" fontSize={12} fill="#666">Time (minutes)</SvgText>
        <SvgText x={20} y={150} fontSize={12} fill="#666" transform="rotate(-90, 20, 150)">Log₁₀ CFU</SvgText>
        <Rect x={SIM_WIDTH - 120} y={20} width={100} height={30} fill={phaseColor} rx={5} />
        <SvgText x={SIM_WIDTH - 70} y={40} textAnchor="middle" fontSize={12} fill="#fff">{current.phase}</SvgText>
      </G>
    );
  };

  const renderHeartRateGraphic = (data, step) => {
    const chartHeight = 180;
    const chartWidth = SIM_WIDTH - 80;
    const maxHR = 200;
    const points = data.slice(0, step + 1).map((d, i) => {
      const x = 50 + (i / (data.length - 1)) * chartWidth;
      const y = 230 - ((d.heartRate || 70) / maxHR) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const current = data[Math.min(step, data.length - 1)];

    return (
      <G>
        <Line x1={50} y1={230} x2={SIM_WIDTH - 30} y2={230} stroke="#333" strokeWidth={2} />
        <Line x1={50} y1={50} x2={50} y2={230} stroke="#333" strokeWidth={2} />
        {points && <Path d={`M${points}`} fill="none" stroke="#e53935" strokeWidth={3} />}
        <Circle cx={SIM_WIDTH - 80} cy={80} r={40} fill="none" stroke="#e53935" strokeWidth={3} />
        <SvgText x={SIM_WIDTH - 80} y={85} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#e53935">{current.heartRate}</SvgText>
        <SvgText x={SIM_WIDTH - 80} y={100} textAnchor="middle" fontSize={10} fill="#666">BPM</SvgText>
        <SvgText x={SIM_WIDTH / 2} y={270} textAnchor="middle" fontSize={12} fill="#666">Phase: {current.phase}</SvgText>
      </G>
    );
  };

  const renderLineChart = (data, step) => {
    const chartHeight = 180;
    const chartWidth = SIM_WIDTH - 80;
    const values = data.map(d => d.value || d.mass || d.population || 0);
    const maxVal = Math.max(...values) || 100;
    const points = data.slice(0, step + 1).map((d, i) => {
      const x = 50 + (i / (data.length - 1)) * chartWidth;
      const y = 230 - ((d.value || d.mass || d.population || 0) / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <G>
        <Line x1={50} y1={230} x2={SIM_WIDTH - 30} y2={230} stroke="#333" strokeWidth={2} />
        <Line x1={50} y1={50} x2={50} y2={230} stroke="#333" strokeWidth={2} />
        {points && <Path d={`M${points}`} fill="none" stroke="#2ecc71" strokeWidth={3} />}
      </G>
    );
  };

  const renderDefaultAnimation = (step) => (
    <G>
      <Circle cx={SIM_WIDTH / 2} cy={150} r={50 + Math.sin(step * 0.3) * 20} fill="#2ecc71" opacity={0.5} />
      <Circle cx={SIM_WIDTH / 2} cy={150} r={30} fill="#27ae60" />
      <SvgText x={SIM_WIDTH / 2} y={155} textAnchor="middle" fontSize={14} fill="#fff">Running</SvgText>
    </G>
  );

  const renderResults = () => (
    <View style={s.resultsContainer}>
      <View style={s.scoreCard}>
        <Text style={s.scoreLabel}>Your Score</Text>
        <Text style={s.scoreValue}>{results?.score}%</Text>
        <View style={s.scoreBar}><View style={[s.scoreBarFill, { width: `${results?.score}%`, backgroundColor: results?.score >= 80 ? '#2ecc71' : results?.score >= 60 ? '#f39c12' : '#e74c3c' }]} /></View>
      </View>
      <View style={s.analysisCard}>
        <Text style={s.analysisTitle}>Analysis</Text>
        <Text style={s.analysisText}>{results?.analysis}</Text>
      </View>
      {settings.showFormulas && experiment?.formula && (
        <View style={s.formulaCard}>
          <Text style={s.formulaTitle}>Key Formula</Text>
          <Text style={s.formulaText}>{experiment.formula}</Text>
        </View>
      )}
      <View style={s.buttonRow}>
        <TouchableOpacity style={s.retryButton} onPress={() => { setPhase('setup'); setSimData(null); setResults(null); }}><Text style={s.retryButtonText}>Try Again</Text></TouchableOpacity>
        <TouchableOpacity style={s.finishButton} onPress={finishExperiment}><Text style={s.finishButtonText}>Finish</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (!experiment) return <View style={s.container}><Text>Experiment not found</Text></View>;

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: experiment.categoryColor || '#2ecc71' }]}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}><Text style={s.backIcon}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>{experiment.title}</Text>
        <View style={s.phaseIndicator}><Text style={s.phaseText}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text></View>
      </View>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {phase === 'setup' && renderSetup()}
        {(phase === 'running' || phase === 'results') && renderSimulation()}
        {phase === 'results' && renderResults()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  phaseIndicator: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  phaseText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  content: { flex: 1 },
  setupContainer: { padding: 16 },
  setupTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  setupDescription: { fontSize: 14, color: '#7f8c8d', lineHeight: 22, marginBottom: 20 },
  paramsContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  paramLabel: { fontSize: 14, color: '#2c3e50', fontWeight: '500' },
  paramControls: { flexDirection: 'row', alignItems: 'center' },
  paramButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center' },
  paramButtonText: { fontSize: 20, color: '#2ecc71', fontWeight: 'bold' },
  paramValue: { fontSize: 16, fontWeight: '600', color: '#2c3e50', minWidth: 60, textAlign: 'center' },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2ecc71', paddingVertical: 16, borderRadius: 16 },
  startButtonIcon: { fontSize: 18, color: '#fff', marginRight: 8 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  simulationContainer: { padding: 16 },
  simHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  simTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  simStatus: { fontSize: 14, color: '#2ecc71', fontWeight: '500' },
  simCanvas: { backgroundColor: '#fff', borderRadius: 16, padding: 8, marginBottom: 16, elevation: 2 },
  dataPanel: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  dataPanelTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 13, color: '#7f8c8d', textTransform: 'capitalize' },
  dataValue: { fontSize: 13, fontWeight: '600', color: '#2c3e50' },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 4 },
  resultsContainer: { padding: 16 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2 },
  scoreLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  scoreValue: { fontSize: 56, fontWeight: 'bold', color: '#2ecc71' },
  scoreBar: { width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  analysisCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  analysisTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  analysisText: { fontSize: 14, color: '#555', lineHeight: 22 },
  formulaCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  formulaTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  formulaText: { fontSize: 16, fontFamily: 'monospace', color: '#2c3e50' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  retryButton: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2ecc71', marginRight: 8, alignItems: 'center' },
  retryButtonText: { fontSize: 16, fontWeight: '600', color: '#2ecc71' },
  finishButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#2ecc71', marginLeft: 8, alignItems: 'center' },
  finishButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default SimulationScreen;
