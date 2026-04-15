import React from 'react';

const AlgorithmTracer = ({ trace }) => {
  if (!trace) return (
    <div className="trace-console empty" style={{ padding: '30px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--panel-border)', textAlign: 'center' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Algorithm Idle: Initial State</h4>
      <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
        The network is initialized with <strong>Random Weights</strong>. <br/>
        Start the "Algorithmic Trace" to see the internal Step-by-Step Demonstration.
      </p>
    </div>
  );

  return (
    <div className="trace-console" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }}>
      <div className="trace-header" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '1px' }}>INTERNAL LOGIC DEMONSTRATION</span>
        <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
          ACTIVE_ITERATION
        </span>
      </div>
      
      <div className="trace-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px', overflowY: 'auto' }}>
        
        {/* Phase 1: Forward Propagation */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#0ea5e9', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>1</div>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Forward Pass: Input Mapping</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
            The network receives input <strong>x={trace.input.toFixed(4)}</strong> and propagates it through the layers to calculate a prediction.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
             <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>TARGET (y)</span>
               <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{trace.targetY.toFixed(4)}</span>
             </div>
             <div style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>→</div>
             <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>PREDICTION (ŷ)</span>
               <span style={{ color: '#10b981', fontWeight: 'bold' }}>{trace.predY.toFixed(4)}</span>
             </div>
          </div>
        </section>

        {/* Phase 2: Error Assessment */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#ef4444', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>2</div>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Error Calculation (Loss Check)</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
            We measure the "Mathematical Distance" between the predicted and actual values using Mean Squared Error.
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontFamily: 'monospace' }}>
             <div style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '4px', fontWeight: 'bold' }}>SQUARED_DISTANCE_DELTA (L)</div>
             <div style={{ color: '#ef4444', fontSize: '1.1rem' }}>{trace.error.toFixed(8)}</div>
          </div>
        </section>

        {/* Phase 3: Backpropagation */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#8b5cf6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</div>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Backpropagation: Grading Errors</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
            The <strong>Chain Rule</strong> is applied backwards. We calculate "Deltas" (δ) representing how much each neuron contributed to the total error.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trace.deltas.map((layer, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: 'bold', minWidth: '55px' }}>LAYER {i+1}</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {layer.map((d, j) => (
                    <span key={j} style={{ fontFamily: 'monospace', color: '#c4b5fd', fontSize: '0.75rem' }}>
                      δ={d.toFixed(4)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 4: Synaptic Update */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#10b981', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>4</div>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Optimization: Parameter Update</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
            Finally, we shift the <strong>Weights (w)</strong> following the gradient to lower the error in the future.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {trace.weightTrace.slice(0, 5).map((wt, i) => (
                   <div key={i} style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                      <span>W(L{wt.layer}.{wt.from}→{wt.to})</span>
                      <span style={{ color: '#10b981' }}>{wt.oldWeight.toFixed(3)} → {wt.newWeight.toFixed(3)}</span>
                   </div>
                ))}
                {trace.weightTrace.length > 5 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '5px' }}>
                    + {trace.weightTrace.length - 5} other synapses adjusted
                  </div>
                )}
             </div>
          </div>
        </section>

      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        Note: The ŷ prediction iteratively approaches the target y value as weights are tuned.
      </div>
    </div>
  );
};

export default AlgorithmTracer;
