import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { MLP } from '../engine/NeuralNet';
import { DataScaler } from '../engine/DataScaler';
import AlgorithmTracer from './AlgorithmTracer';
import ToolHeader from './ToolHeader';
import InfoModal from './InfoModal';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const InteractiveEngine = () => {
  const [dataPoints, setDataPoints] = useState([]);
  const [hiddenLayers, setHiddenLayers] = useState([4]);
  const [learningRate, setLearningRate] = useState(0.1);
  const [epochs, setEpochs] = useState(50);
  const [currentLoss, setCurrentLoss] = useState(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(3); // 1 to 5
  const [currentTrace, setCurrentTrace] = useState(null);
  const [initialLoss, setInitialLoss] = useState(null);
  const [sessionReport, setSessionReport] = useState(null);
  const [inferenceX, setInferenceX] = useState('');
  const [inferenceY, setInferenceY] = useState(null);
  const [simEpoch, setSimEpoch] = useState(0);
  const [simPointIdx, setSimPointIdx] = useState(0);

  const [manualX, setManualX] = useState('');
  const [manualY, setManualY] = useState('');

  const [regressionCurve, setRegressionCurve] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'learn', 'developedBy', 'help'

  const fileInputRef = useRef(null);
  const nnRef = useRef(null);
  const scalerRef = useRef(new DataScaler());
  const simTimeoutRef = useRef(null);

  const fullArchitecture = [1, ...hiddenLayers, 1];

  const initializeNetwork = () => {
    stopSimulation();
    nnRef.current = new MLP(fullArchitecture);
    updateRegressionCurve();
    setCurrentLoss(null);
    setCurrentTrace(null);
  };

  useEffect(() => {
    initializeNetwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenLayers]);

  const updateRegressionCurve = useCallback(() => {
    if (!nnRef.current || dataPoints.length === 0) return;
    const minX = Math.min(...dataPoints.map(d => d.x)) - 1;
    const maxX = Math.max(...dataPoints.map(d => d.x)) + 1;

    let curve = [];
    for (let x = minX; x <= maxX; x += (maxX - minX) / 80) {
      const scaledX = scalerRef.current.scaleX(x);
      const pred = nnRef.current.forward(scaledX).output[0];
      curve.push({ x, y: scalerRef.current.inverseScaleY(pred) });
    }
    setRegressionCurve(curve);
  }, [dataPoints]);

  const generateDemoData = () => {
    const demo = [];
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() * 8) - 4;
      const y = Math.sin(x) + (Math.random() * 0.2 - 0.1);
      demo.push({ x, y });
    }
    scalerRef.current.fit(demo);
    setDataPoints(demo);
    initializeNetwork();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const parsed = [];
      for (let line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          if (!isNaN(x) && !isNaN(y)) {
            parsed.push({ x, y });
          }
        }
      }
      if (parsed.length > 0) {
        scalerRef.current.fit(parsed);
        setDataPoints(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const addManualPoint = () => {
    const x = parseFloat(manualX);
    const y = parseFloat(manualY);
    if (isNaN(x) || isNaN(y)) return;
    const newData = [...dataPoints, { x, y }];
    scalerRef.current.fit(newData);
    setDataPoints(newData);
    setManualX('');
    setManualY('');
  };

  const addHiddenLayer = () => {
    if (hiddenLayers.length >= 4) return;
    setHiddenLayers([...hiddenLayers, 4]);
  };

  const removeHiddenLayer = (index) => {
    if (hiddenLayers.length <= 1) return;
    const newLayers = hiddenLayers.filter((_, i) => i !== index);
    setHiddenLayers(newLayers);
  };

  const updateLayerSize = (index, size) => {
    const val = parseInt(size) || 1;
    if (val > 10) return;
    const newLayers = [...hiddenLayers];
    newLayers[index] = val;
    setHiddenLayers(newLayers);
  };

  // --- SIMULATION ENGINE ---

  const stopSimulation = () => {
    clearTimeout(simTimeoutRef.current);
    setIsSimulating(false);
    setIsPaused(false);
  };

  const runSimulationStep = useCallback(() => {
    if (!isSimulating || isPaused) return;

    if (simPointIdx >= dataPoints.length) {
      if (simEpoch + 1 >= epochs) {
        stopSimulation();
        return;
      }
      setSimEpoch(prev => prev + 1);
      setSimPointIdx(0);
      return;
    }

    // Scale the data point before passing to NN
    const scaledX = scalerRef.current.scaleX(dataPoints[simPointIdx].x);
    const scaledY = scalerRef.current.scaleY(dataPoints[simPointIdx].y);
    const trace = nnRef.current.backward(scaledX, scaledY, learningRate);

    if (initialLoss === null) setInitialLoss(trace.loss);
    setCurrentTrace(trace);
    setCurrentLoss(trace.loss);
    setSimPointIdx(prev => prev + 1);

    if (simPointIdx % 5 === 0) updateRegressionCurve();

    // Speed 1: 50,000ms (50 sec), Speed 5: 10,000ms (10 sec), Speed 10: 1,000ms (1 sec)
    const delay = Math.max(10, (11 - simSpeed) * 100);
    simTimeoutRef.current = setTimeout(runSimulationStep, delay);
  }, [isSimulating, isPaused, simPointIdx, dataPoints, simEpoch, epochs, learningRate, simSpeed, updateRegressionCurve, initialLoss]);

  useEffect(() => {
    if (isSimulating && !isPaused) {
      runSimulationStep();
    }
    return () => clearTimeout(simTimeoutRef.current);
  }, [isSimulating, isPaused, runSimulationStep]);

  const trainInstant = () => {
    if (dataPoints.length === 0) return;
    stopSimulation();

    const scaledDataset = scalerRef.current.scale(dataPoints);
    const startLoss = nnRef.current.backward(scaledDataset[0].x, scaledDataset[0].y, 0).loss;
    let loss = 0;
    for (let i = 0; i < epochs; i++) {
      loss = nnRef.current.trainEpoch(scaledDataset, learningRate);
    }
    setCurrentLoss(loss);
    setSessionReport({
      startLoss,
      finalLoss: loss,
      improvement: ((startLoss - loss) / (startLoss || 1) * 100).toFixed(2)
    });
    updateRegressionCurve();
    setCurrentTrace(null);
    if (inferenceX) runInference(inferenceX);
  };

  const runInference = (val) => {
    if (!nnRef.current) return;
    const x = parseFloat(val);
    if (isNaN(x)) {
      setInferenceY(null);
      return;
    }
    const scaledX = scalerRef.current.scaleX(x);
    const result = nnRef.current.forward(scaledX).output[0];
    setInferenceY(scalerRef.current.inverseScaleY(result));
  };

  const startSimulation = () => {
    if (dataPoints.length === 0) return;
    setSimEpoch(0);
    setSimPointIdx(0);
    setIsPaused(false);
    setIsSimulating(true);
  };

  const downloadReport = () => {
    if (dataPoints.length === 0 || !nnRef.current) {
      alert("Please generate/upload data and train a model first!");
      return;
    }

    let csvContent = "Type,X,Y_Actual,Y_Predicted,Residual_Error\n";

    // Historical Data (Scaled for precision)
    dataPoints.forEach(p => {
      const scaledX = scalerRef.current.scaleX(p.x);
      const predScaled = nnRef.current.forward(scaledX).output[0];
      const pred = scalerRef.current.inverseScaleY(predScaled);
      const error = Math.abs(p.y - pred);
      csvContent += `Historical,${p.x},${p.y},${pred.toFixed(6)},${error.toFixed(6)}\n`;
    });

    // Future Extrapolations (from regression curve)
    regressionCurve.forEach(p => {
      csvContent += `Extrapolation,${p.x},,${p.y.toFixed(6)},\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `neocore_regression_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAction = (type) => {
    if (type === 'download') {
      downloadReport();
    } else {
      setActiveModal(type);
    }
  };

  const chartData = {
    datasets: [
      {
        type: 'scatter',
        label: 'Training Data',
        data: dataPoints,
        backgroundColor: '#ef4444',
      },
      {
        type: 'line',
        label: 'NN Regression Curve',
        data: regressionCurve,
        borderColor: '#0ea5e9',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      },
      inferenceY !== null ? {
        type: 'scatter',
        label: 'Prediction',
        data: [{ x: parseFloat(inferenceX), y: inferenceY }],
        backgroundColor: '#10b981',
        pointRadius: 10,
        pointStyle: 'star',
        pointBorderWidth: 2,
        pointBorderColor: '#fff',
        zIndex: 10
      } : null
    ].filter(Boolean),
  };

  if (isSimulating && currentTrace) {
    const currentPoint = dataPoints[simPointIdx - 1];
    if (currentPoint) {
      chartData.datasets.push({
        type: 'scatter',
        label: 'Active Point',
        data: [currentPoint],
        backgroundColor: '#f59e0b',
        pointRadius: 8,
        pointBorderWidth: 4,
        pointBorderColor: 'rgba(245, 158, 11, 0.4)'
      });
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'linear', position: 'bottom', grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { type: 'linear', grid: { color: 'rgba(255,255,255,0.1)' } }
    },
    plugins: {
      legend: { labels: { color: '#f8fafc' }, display: false }
    },
    animation: false
  };

  const drawArchitecture = () => {
    const layerCount = fullArchitecture.length;
    const width = 800;
    const height = 500;
    const yMargin = height * 0.15;
    const yArea = height * 0.7;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Layer Labels */}
        {fullArchitecture.map((_, layerIdx) => {
          const x = (layerIdx / (layerCount > 1 ? layerCount - 1 : 1)) * (width * 0.8) + (width * 0.1);
          let label = `HIDDEN ${layerIdx}`;
          if (layerIdx === 0) label = "INPUT";
          if (layerIdx === layerCount - 1) label = "OUTPUT";

          return (
            <text key={`label-${layerIdx}`} x={x} y={yMargin - 30} textAnchor="middle" fill="var(--text-secondary)" style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
              {label}
            </text>
          );
        })}

        {fullArchitecture.map((nodes, layerIdx) => {
          const x = (layerIdx / (layerCount > 1 ? layerCount - 1 : 1)) * (width * 0.8) + (width * 0.1);
          return Array.from({ length: nodes }).map((_, nodeIdx) => {
            const adjustedY = nodes === 1 ? (height / 2) : (nodeIdx / (nodes - 1)) * yArea + yMargin;

            // Simulation Visuals: Highlight neuron if it has activation > 0.5
            let neuronColor = "#0ea5e9";
            let neuronScale = 1;

            if (isSimulating && currentTrace && currentTrace.activations) {
              const activation = currentTrace.activations[layerIdx][nodeIdx];
              if (activation > 0.5) {
                neuronColor = "#38bdf8";
                neuronScale = 1.3;
              }
            }

            return (
              <g key={`l${layerIdx}-n${nodeIdx}`}>
                <circle
                  cx={x}
                  cy={adjustedY}
                  r={12 * neuronScale}
                  fill={neuronColor}
                  style={{ transition: 'all 0.2s', filter: neuronScale > 1 ? 'drop-shadow(0 0 8px #38bdf8)' : 'none' }}
                />

                {layerIdx < fullArchitecture.length - 1 && Array.from({ length: fullArchitecture[layerIdx + 1] }).map((_, nextIdx) => {
                  const nextX = ((layerIdx + 1) / (layerCount - 1)) * (width * 0.8) + (width * 0.1);
                  const nextNodes = fullArchitecture[layerIdx + 1];
                  const nextAdjustedY = nextNodes === 1 ? (height / 2) : (nextIdx / (nextNodes - 1)) * yArea + yMargin;

                  let linkColor = "rgba(255,255,255,0.15)";
                  let linkWidth = 1.5;

                  if (isSimulating && currentTrace) {
                    // Highlight weights that had high gradients in this step
                    const traceIdx = currentTrace.weightTrace.findIndex(w => w.layer === layerIdx && w.from === nodeIdx && w.to === nextIdx);
                    if (traceIdx !== -1) {
                      const grad = Math.abs(currentTrace.weightTrace[traceIdx].grad);
                      if (grad > 0.05) {
                        linkColor = "#8b5cf6";
                        linkWidth = 3;
                      }
                    }
                  }

                  return <line key={`l${layerIdx}-n${nodeIdx}-t${nextIdx}`} x1={x} y1={adjustedY} x2={nextX} y2={nextAdjustedY} stroke={linkColor} strokeWidth={linkWidth} style={{ transition: 'all 0.2s' }} />
                })}
              </g>
            )
          })
        })}
      </svg>
    )
  };

  return (
    <>
      <ToolHeader title="Neural Core: Neural Network Regression" onAction={handleAction} />

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--panel-border)', borderRadius: '0', margin: '20px' }}>
        <div style={{ padding: '25px 30px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
                Real-time hyper-parameter tuning and surgical-grade backpropagation monitoring.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1px', background: 'var(--panel-border)' }}>

          <div style={{ background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Behavioral Mapping</h3>
                {isSimulating && (
                  <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                    SIMULATING: EPOCH {simEpoch + 1}/{epochs} | POINT {simPointIdx}/{dataPoints.length}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative', minHeight: '350px' }}>
                <Scatter data={chartData} options={chartOptions} />
              </div>
              {currentLoss !== null && (
                <div style={{ marginTop: '15px', padding: '10px 15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--panel-border)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>CURRENT MODEL LOSS (MSE)</span>
                  <span style={{ color: 'var(--accent-color)', fontFamily: 'monospace', fontWeight: 'bold' }}>{currentLoss.toFixed(6)}</span>
                </div>
              )}

              {sessionReport && (
                <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>🏁 Final Output Results</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>REDUCTION IN ERROR</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{sessionReport.improvement}%</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>CONVERGENCE STATE</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#cbd5e1' }}>SUCCESS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--panel-border)' }}>

              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Simulation Controller</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {!isSimulating ? (
                    <button className="btn btn-primary" onClick={startSimulation} style={{ padding: '12px 25px' }}>
                      ▶ Start Algorithmic Trace
                    </button>
                  ) : (
                    <>
                      <button className="btn" onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#10b981' : 'rgba(255,255,255,0.1)', padding: '12px 20px' }}>
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button className="btn" onClick={stopSimulation} style={{ border: '1px solid #ef4444', color: '#ef4444', padding: '12px 20px' }}>
                        Stop
                      </button>
                    </>
                  )}

                  <div style={{ flex: 1 }}></div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SIM_SPEED</span>
                    <input
                      type="range" min="1" max="10" value={simSpeed}
                      onChange={e => setSimSpeed(parseInt(e.target.value))}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', minWidth: '20px' }}>x{simSpeed}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Rapid Training</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" onClick={trainInstant} disabled={isSimulating} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>Compute All Epochs</button>
                    <button className="btn" onClick={initializeNetwork} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Reset Weights</button>
                  </div>
                </div>
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Learning Config</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="number" value={epochs} onChange={e => setEpochs(parseInt(e.target.value))} className="input-field" style={{ width: '60px' }} title="Epochs" />
                    <input type="number" step="0.01" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="input-field" style={{ width: '80px' }} title="Learning Rate" />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px', borderTop: '1px solid var(--panel-border)', paddingTop: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Data Ingress Control</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".csv" />
                    <button className="btn" onClick={() => fileInputRef.current.click()} style={{ width: '100%', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                      📂 Upload Dataset (.csv)
                    </button>
                    <button className="btn" onClick={generateDemoData} style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }}>
                      ⚙ Generate Synthetic Data
                    </button>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>MANUAL POINT INJECTION</span>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="number" placeholder="X" value={manualX} onChange={e => setManualX(e.target.value)} className="input-field" />
                      <input type="number" placeholder="Y" value={manualY} onChange={e => setManualY(e.target.value)} className="input-field" />
                    </div>
                    <button className="btn btn-primary" onClick={addManualPoint} style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}>
                      + Add Coordinate
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px', borderTop: '1px solid var(--panel-border)', paddingTop: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Model Generalization (Inference)</h4>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p className="description" style={{ fontSize: '0.75rem', marginBottom: '10px' }}>Predict a network state (<strong>Y</strong>) for an unseen traffic metric (<strong>X</strong>):</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      placeholder="Enter X..."
                      className="input-field"
                      value={inferenceX}
                      onChange={(e) => {
                        setInferenceX(e.target.value);
                        runInference(e.target.value);
                      }}
                    />
                    <div style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.5px' }}>PREDICTED Y</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>
                        {inferenceY !== null ? inferenceY.toFixed(4) : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', height: '100%' }}>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Architecture {fullArchitecture.join(' × ')}</h3>
                  <button className="btn" onClick={addHiddenLayer} disabled={isSimulating} style={{ fontSize: '0.8rem', padding: '5px 10px' }}>+ Hidden Layer</button>
                </div>

                <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', height: '300px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                  {drawArchitecture()}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {hiddenLayers.map((size, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>H{idx + 1}:</span>
                      <input
                        type="number"
                        min="1" max="10"
                        value={size}
                        onChange={(e) => updateLayerSize(idx, e.target.value)}
                        disabled={isSimulating}
                        style={{ width: '45px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold' }}
                      />
                      <button
                        onClick={() => removeHiddenLayer(idx)}
                        disabled={isSimulating || hiddenLayers.length <= 1}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', lineHeight: '1' }}
                        title="Remove Layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '15px' }}>Step-by-Step Internal Demonstration</h3>
                <div style={{ flex: 1, minHeight: '300px' }}>
                  <AlgorithmTracer trace={currentTrace} />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      <InfoModal
        isOpen={activeModal === 'learn'}
        onClose={() => setActiveModal(null)}
        title="Learn — Neural Regression Concepts"
      >
        <div className="theory-section">
          <p><strong>Universal Approximation Concept:</strong> Neural Network Regression maps input features to a continuous numerical output by learning complex non-linear approximations. Hidden layers act as feature extractors, transforming raw input into high-dimensional representations that can fit any continuous function.</p>
          
          <div style={{ background: 'rgba(30,30,30,0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)', margin: '20px 0' }}>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>Significance of Hidden Layers</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Hidden layers are the mathematical "brains" of the network. Without them, a neural network is merely a linear regressor (like a straight line). 
              <br/><br/>
              <strong>Key Roles:</strong>
              <br/>• <strong>Non-Linearity:</strong> By applying activation functions (like Tanh) in these layers, the model can learn curves, waves, and complex patterns.
              <br/>• <strong>Feature Extraction:</strong> They automatically weigh the importance of input variables, filtering out noise and focusing on relevant data trends.
              <br/>• <strong>Abstraction:</strong> Multiple layers allow for hierarchical learning, where deeper layers represent increasingly abstract concepts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '20px 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.9rem' }}>Mathematical Foundation</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>The model minimizes <strong>Mean Squared Error (MSE)</strong>:</p>
              <div className="math-box block-formula" style={{ margin: '10px 0', fontSize: '0.9rem' }}>MSE = 1/N * Σ(y - ŷ)²</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.9rem' }}>Backpropagation</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Weights are updated using the <strong>Chain Rule</strong> to find the partial derivative of loss:</p>
              <div className="math-box block-formula" style={{ margin: '10px 0', fontSize: '0.9rem' }}>ΔW = -η * ∂L/∂W</div>
            </div>
          </div>

          <h3 style={{ marginBottom: '20px' }}>Mathematical Step-by-Step (Static Example)</h3>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', border: '1px solid var(--panel-border)', marginBottom: '40px' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px', opacity: 0.8 }}>Let's trace a single forward and backward pass for a network with 1 Hidden Layer:</p>

            <div className="step-list" style={{ fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>1. Input Normalization:</strong>
                <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(30, 30, 30, 0.4)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  Raw Input <span className="math-box">X = 4.0</span> &rarr; Scaled <span className="math-box">X<sub>scaled</sub> = 1.0</span> (Max value in training range).
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>2. Forward Pass (Hidden Layer):</strong>
                <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(30, 30, 30, 0.4)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span className="math-box">Z = (X &times; W) + Bias</span>
                  <br /><span className="math-box">Z = (1.0 &times; 0.5) + 0.1 = 0.6</span>
                  <br /><span className="math-box">A = Tanh(0.6) &approx; 0.537</span>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3. Forward Pass (Output Layer):</strong>
                <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(30, 30, 30, 0.4)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span className="math-box">Z<sub>out</sub> = (A &times; W<sub>out</sub>) + B<sub>out</sub></span>
                  <br /><span className="math-box">Z<sub>out</sub> = (0.537 &times; 0.8) + 0.0 = 0.429</span>
                  <br /><span className="math-box">ŷ = 0.429</span> (Final Continuous Prediction)
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>4. Error Calculation (MSE):</strong>
                <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(30, 30, 30, 0.4)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  Target <span className="math-box">Y = 1.0</span> &rarr; Error <span className="math-box">&epsilon; = ŷ - Y = -0.571</span>
                  <br /><span className="math-box">Loss = 0.5 &times; (-0.571)² &approx; 0.163</span>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>5. Backward Pass (Weight Update):</strong>
                <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(30, 30, 30, 0.4)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span className="math-box">W<sub>new</sub> = W<sub>old</sub> - (&eta; &times; Gradient)</span>
                  <br /><span className="math-box">Gradient = &delta; &times; activation<sub>input</sub></span>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '20px' }}>Video Walkthrough</h3>
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src="https://www.youtube.com/embed/2yhLEx2FKoY?start=728"
                title="Neural Network Regression"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </InfoModal>

      <InfoModal
        isOpen={activeModal === 'developedBy'}
        onClose={() => setActiveModal(null)}
        title="Project Credits"
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '30px', opacity: 0.8 }}>Developed By</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '50px' }}>
            <div className="profile-card">
              <div 
                className="avatar-placeholder" 
                style={{ 
                  backgroundImage: 'url(/amanpic.jpeg)',
                  color: 'transparent'
                }}
              >AK</div>
              <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Aman Kajla</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>REG NO: 24BAI1174</p>
            </div>
            <div className="profile-card">
              <div 
                className="avatar-placeholder" 
                style={{ 
                  backgroundImage: 'url(/atharvvit.jpg)',
                  color: 'transparent'
                }}
              >AV</div>
              <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Atharv Verma</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>REG NO: 24BCE1985</p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--panel-border)', width: '60%', margin: '0 auto 40px' }}></div>

          <h3 style={{ marginBottom: '30px', opacity: 0.8 }}>Guided By</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="prof-card" style={{ padding: '20px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '16px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div 
                className="avatar-placeholder prof-avatar" 
                style={{ 
                  border: '3px solid var(--accent-color)',
                  backgroundImage: 'url(/faculty.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: 'transparent'
                }}
              >
                Prof Image
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: '15px' }}>Dr. Swaminathan Annadurai</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--accent-color)', letterSpacing: '1px' }}>PROJECT SUPERVISOR</p>
            </div>
          </div>
        </div>
        <style jsx>{`
            .avatar-placeholder {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: bold;
                margin: 0 auto;
                background-size: cover;
                background-position: center;
            }
            .prof-avatar { width: 140px; height: 140px; font-size: 1rem; }
            .profile-card { transition: transform 0.3s ease; }
            .profile-card:hover { transform: translateY(-5px); }
        `}</style>
      </InfoModal>

      <InfoModal
        isOpen={activeModal === 'help'}
        onClose={() => setActiveModal(null)}
        title="Help & User Guide"
      >
        <div className="help-content">
          <h3 style={{ color: 'var(--accent-color)' }}>Quick Start Guide</h3>
          <ul className="step-list">
            <li><strong>1. Data Ingress:</strong> Use "Generate Synthetic Data" to start or upload a CSV with columns for X and Y coordinates.</li>
            <li><strong>2. Architecture Design:</strong> Add hidden layers and adjust neuron counts to change model complexity. More layers allow for more complex non-linearities.</li>
            <li><strong>3. Model Training:</strong> Click "Start Algorithmic Trace" for a step-by-step educational walkthrough, or "Compute All Epochs" for instant results.</li>
            <li><strong>4. Monitoring:</strong> Watch the "Behavioral Mapping" to see the regression curve fit the data points in real-time.</li>
          </ul>

          <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>CSV Import Specifications</h3>
          <div style={{ background: 'rgba(30,30,30,0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>To import your own research data, ensure your CSV file follows this exact schema:</p>
            <div style={{ background: '#000', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              x, y<br />
              1.2, 0.45<br />
              2.5, 0.89<br />
              3.1, 1.25
            </div>
            <ul style={{ fontSize: '0.85rem', marginTop: '15px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
              <li><strong>Headers:</strong> The first row must contain at least "x" and "y" (case-insensitive).</li>
              <li><strong>Values:</strong> Use numerical floats or integers. Non-numerical rows will be ignored.</li>
              <li><strong>Encoding:</strong> Standard UTF-8 CSV.</li>
            </ul>
          </div>

          <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>Understanding Exports</h3>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Clicking <strong>Download</strong> generates a comprehensive CSV report containing:</p>
            <code style={{ fontSize: '0.8rem', opacity: 0.8, color: 'var(--accent-color)' }}>Historical Data Points | Predicted Values | Model Residual Errors | Future Trends</code>
            <p style={{ fontSize: '0.85rem', marginTop: '15px', color: 'var(--text-secondary)' }}>
              <strong>Usage Tip:</strong> Import the CSV into Excel to plot the "Residual Error" against epochs to see exactly where your model struggled to converge.
            </p>
          </div>
        </div>
      </InfoModal>
    </>
  );
};

export default InteractiveEngine;
