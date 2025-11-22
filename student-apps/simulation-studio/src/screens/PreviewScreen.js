import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Circle, Rect, Line, Path, Text as SvgText, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIM_WIDTH = SCREEN_WIDTH - 32;
const SIM_HEIGHT = 280;

const PreviewScreen = ({ route, navigation }) => {
  const { simulationId } = route.params;
  const { getSimulationById } = useApp();
  const simulation = getSimulationById(simulationId);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [variableValues, setVariableValues] = useState({});
  const [output, setOutput] = useState([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (simulation?.variables) {
      const initial = {};
      simulation.variables.forEach(v => { initial[v.id] = v.value || v.default; });
      setVariableValues(initial);
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [simulation]);

  const updateVariable = (id, delta) => {
    const variable = simulation.variables.find(v => v.id === id);
    if (!variable) return;
    const newVal = Math.max(variable.min, Math.min(variable.max, variableValues[id] + delta));
    setVariableValues(prev => ({ ...prev, [id]: newVal }));
  };

  const runSimulation = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setOutput([]);

    const totalSteps = 30;
    let step = 0;

    animationRef.current = setInterval(() => {
      step++;
      setCurrentStep(step);

      // Generate output data based on simulation type
      const time = step * (simulation.duration || 15) / totalSteps;
      const dataPoint = calculateOutput(time, variableValues, simulation);
      setOutput(prev => [...prev, dataPoint]);

      if (step >= totalSteps) {
        clearInterval(animationRef.current);
        setIsRunning(false);
      }
    }, 100);
  };

  const stopSimulation = () => {
    if (animationRef.current) clearInterval(animationRef.current);
    setIsRunning(false);
  };

  const resetSimulation = () => {
    stopSimulation();
    setCurrentStep(0);
    setOutput([]);
  };

  const calculateOutput = (time, vars, sim) => {
    // Simple physics calculations based on available variables
    let value = 0;
    const formulas = sim.formulas || [];

    if (formulas.find(f => f.id === 'kinetic_energy')) {
      const m = vars.mass || 1;
      const v = vars.velocity || 10;
      value = 0.5 * m * v * v * (1 + Math.sin(time * 0.5) * 0.1);
    } else if (formulas.find(f => f.id === 'ohms_law')) {
      const V = vars.voltage || 12;
      const R = vars.resistance || 10;
      value = V / R * (1 + time * 0.01);
    } else if (formulas.find(f => f.id === 'michaelis_menten')) {
      const S = vars.substrate_conc || 10;
      const Vmax = 100;
      const Km = 5;
      value = (Vmax * S) / (Km + S) * (1 - Math.exp(-time * 0.5));
    } else {
      // Generic output
      value = Object.values(vars).reduce((a, b) => a + (b || 0), 0) * (1 + Math.sin(time) * 0.2);
    }

    return { time: time.toFixed(1), value: value.toFixed(2) };
  };

  const renderVisualization = () => {
    const maxVal = Math.max(...output.map(o => parseFloat(o.value)), 1);

    switch (simulation?.visualType) {
      case 'graph':
      default:
        return (
          <G>
            <Line x1={40} y1={SIM_HEIGHT - 30} x2={SIM_WIDTH - 20} y2={SIM_HEIGHT - 30} stroke="#333" strokeWidth={2} />
            <Line x1={40} y1={20} x2={40} y2={SIM_HEIGHT - 30} stroke="#333" strokeWidth={2} />
            {output.map((point, i) => {
              const x = 40 + (i / 30) * (SIM_WIDTH - 80);
              const y = SIM_HEIGHT - 30 - (parseFloat(point.value) / maxVal) * (SIM_HEIGHT - 60);
              return <Circle key={i} cx={x} cy={y} r={4} fill="#3498db" />;
            })}
            {output.length > 1 && (
              <Path
                d={output.map((p, i) => {
                  const x = 40 + (i / 30) * (SIM_WIDTH - 80);
                  const y = SIM_HEIGHT - 30 - (parseFloat(p.value) / maxVal) * (SIM_HEIGHT - 60);
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3498db"
                strokeWidth={2}
              />
            )}
            <SvgText x={SIM_WIDTH / 2} y={SIM_HEIGHT - 5} textAnchor="middle" fontSize={12} fill="#666">Time</SvgText>
            <SvgText x={15} y={SIM_HEIGHT / 2} fontSize={12} fill="#666" transform={`rotate(-90, 15, ${SIM_HEIGHT / 2})`}>Value</SvgText>
          </G>
        );

      case 'animation':
        const animX = 40 + (currentStep / 30) * (SIM_WIDTH - 100);
        const animY = SIM_HEIGHT / 2 + Math.sin(currentStep * 0.3) * 50;
        return (
          <G>
            <Rect x={20} y={20} width={SIM_WIDTH - 40} height={SIM_HEIGHT - 40} fill="#ecf0f1" rx={10} />
            <Circle cx={animX} cy={animY} r={20} fill="#e74c3c" />
            <Line x1={40} y1={SIM_HEIGHT / 2} x2={SIM_WIDTH - 40} y2={SIM_HEIGHT / 2} stroke="#bdc3c7" strokeWidth={1} strokeDasharray="5,5" />
          </G>
        );

      case 'wave':
        const wavePoints = [];
        for (let i = 0; i <= SIM_WIDTH - 80; i += 5) {
          const x = 40 + i;
          const y = SIM_HEIGHT / 2 + Math.sin((i + currentStep * 10) * 0.05) * 60;
          wavePoints.push(`${wavePoints.length === 0 ? 'M' : 'L'}${x},${y}`);
        }
        return (
          <G>
            <Rect x={20} y={20} width={SIM_WIDTH - 40} height={SIM_HEIGHT - 40} fill="#e8f4f8" rx={10} />
            <Line x1={40} y1={SIM_HEIGHT / 2} x2={SIM_WIDTH - 40} y2={SIM_HEIGHT / 2} stroke="#bdc3c7" strokeWidth={1} />
            <Path d={wavePoints.join(' ')} fill="none" stroke="#3498db" strokeWidth={3} />
          </G>
        );
    }
  };

  if (!simulation) return <View style={s.container}><Text>Simulation not found</Text></View>;

  const subjectColor = simulation.subject === 'chemistry' ? '#9b59b6' : simulation.subject === 'biology' ? '#2ecc71' : '#3498db';

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: subjectColor }]}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Preview</Text>
          <Text style={s.simTitle} numberOfLines={1}>{simulation.title || 'Untitled'}</Text>
        </View>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.simCard}>
          <Svg width={SIM_WIDTH} height={SIM_HEIGHT} viewBox={`0 0 ${SIM_WIDTH} ${SIM_HEIGHT}`}>
            {renderVisualization()}
          </Svg>
        </View>

        <View style={s.controlsCard}>
          <View style={s.buttonRow}>
            {!isRunning ? (
              <TouchableOpacity style={[s.runButton, { backgroundColor: subjectColor }]} onPress={runSimulation}>
                <Text style={s.runIcon}>▶</Text>
                <Text style={s.runText}>Run Simulation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.runButton, { backgroundColor: '#e74c3c' }]} onPress={stopSimulation}>
                <Text style={s.runIcon}>⏹</Text>
                <Text style={s.runText}>Stop</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.resetButton} onPress={resetSimulation}>
              <Text style={s.resetIcon}>↺</Text>
            </TouchableOpacity>
          </View>

          <View style={s.progressContainer}>
            <View style={[s.progressBar, { width: `${(currentStep / 30) * 100}%`, backgroundColor: subjectColor }]} />
          </View>
        </View>

        {simulation.variables?.length > 0 && (
          <View style={s.variablesCard}>
            <Text style={s.cardTitle}>Variables</Text>
            {simulation.variables.map((v) => (
              <View key={v.id} style={s.variableRow}>
                <View style={s.variableInfo}>
                  <Text style={s.variableName}>{v.name}</Text>
                  <Text style={s.variableUnit}>{v.unit}</Text>
                </View>
                <View style={s.variableControls}>
                  <TouchableOpacity style={s.varButton} onPress={() => updateVariable(v.id, -(v.max - v.min) / 10)} disabled={isRunning}>
                    <Text style={s.varButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.variableValue}>{(variableValues[v.id] || 0).toFixed(1)}</Text>
                  <TouchableOpacity style={s.varButton} onPress={() => updateVariable(v.id, (v.max - v.min) / 10)} disabled={isRunning}>
                    <Text style={s.varButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {simulation.formulas?.length > 0 && (
          <View style={s.formulasCard}>
            <Text style={s.cardTitle}>Formulas Used</Text>
            {simulation.formulas.map((f) => (
              <View key={f.id} style={s.formulaRow}>
                <Text style={s.formulaName}>{f.name}</Text>
                <Text style={s.formulaText}>{f.formula}</Text>
              </View>
            ))}
          </View>
        )}

        {output.length > 0 && (
          <View style={s.outputCard}>
            <Text style={s.cardTitle}>Output Data</Text>
            <View style={s.outputHeader}>
              <Text style={s.outputHeaderText}>Time</Text>
              <Text style={s.outputHeaderText}>Value</Text>
            </View>
            {output.slice(-10).map((o, i) => (
              <View key={i} style={s.outputRow}>
                <Text style={s.outputText}>{o.time}s</Text>
                <Text style={s.outputText}>{o.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  simTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1 },
  simCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 8, elevation: 2 },
  controlsCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  runButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginRight: 12 },
  runIcon: { fontSize: 16, color: '#fff', marginRight: 8 },
  runText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  resetButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center' },
  resetIcon: { fontSize: 24, color: '#7f8c8d' },
  progressContainer: { height: 6, backgroundColor: '#ecf0f1', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  variablesCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  variableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  variableInfo: { flex: 1 },
  variableName: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  variableUnit: { fontSize: 11, color: '#7f8c8d' },
  variableControls: { flexDirection: 'row', alignItems: 'center' },
  varButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center' },
  varButtonText: { fontSize: 20, color: '#3498db', fontWeight: 'bold' },
  variableValue: { fontSize: 16, fontWeight: '600', color: '#2c3e50', minWidth: 70, textAlign: 'center' },
  formulasCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 2 },
  formulaRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  formulaName: { fontSize: 13, fontWeight: '500', color: '#2c3e50' },
  formulaText: { fontSize: 14, fontFamily: 'monospace', color: '#3498db', marginTop: 4 },
  outputCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, elevation: 2 },
  outputHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  outputHeaderText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  outputRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  outputText: { fontSize: 13, color: '#2c3e50' },
});

export default PreviewScreen;
