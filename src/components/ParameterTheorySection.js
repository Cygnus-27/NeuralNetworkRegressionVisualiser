import React from 'react';

const ParameterTheorySection = () => {
  return (
    <div className="glass-panel" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '30px' }}>Understanding Network Parameters</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* Architecture Depth */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '15px' }}>Architecture Depth (Layers & Neurons)</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Adding more hidden layers and neurons increases the mathematical capacity to map highly non-linear functions. However, too many parameters on a simple domain can lead to <strong>Overfitting</strong>—where the network memorizes exact data noise rather than extracting the generalized underlying structural pattern.
          </p>
        </div>

        {/* Learning Rate */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ marginBottom: '15px' }}>Learning Rate (LR)</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            The learning rate controls the absolute step size taken during gradient descent propagation. A value too <em>high</em> causes the weights to diverge explosively, missing the global minimum entirely. A value too <em>low</em> causes the model to stagger, requiring exorbitant training epochs to converge precisely.
          </p>
        </div>

        {/* Epochs */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ marginBottom: '15px' }}>Training Epochs</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            An epoch encompasses one unified forward and backward pass of the entire dataset sequence. Continuous training iteratively reduces the localized Error Matrix. Insufficient epochs natively result in mathematical <strong>Underfitting</strong>, failing to capture the trend.
          </p>
        </div>

        {/* Data Sets */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          <h3 style={{ marginBottom: '15px' }}>Custom & Generated Data</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            The native "Generate Data" feature formulates a standard Trigonometric Sine Wave array populated with localized Gaussian noise. Utilizing <strong>Manual Inputs</strong> or <strong>CSV Processing</strong> allows inserting external regression structures manually to analyze mapping limitations dynamically.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ParameterTheorySection;
