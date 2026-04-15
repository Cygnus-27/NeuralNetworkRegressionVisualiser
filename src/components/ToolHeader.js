import React from 'react';

const ToolHeader = ({ onAction, title }) => {
  return (
    <header className="tool-header">
       <div className="tool-title-section">
          <h1>{title}</h1>
       </div>
       <div className="tool-actions">
          <button className="nav-btn" onClick={() => onAction('developedBy')}>Developed By</button>
          <button className="nav-btn" onClick={() => onAction('learn')}>Learn</button>
          <button className="nav-btn" onClick={() => onAction('help')}>Help</button>
          <button className="nav-btn download-btn" onClick={() => onAction('download')}>Download</button>
       </div>

       <style jsx>{`
         .tool-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 20px 40px;
           background: rgba(11, 15, 25, 0.8);
           backdrop-filter: blur(10px);
           border-bottom: 1px solid var(--panel-border);
           position: sticky;
           top: 0;
           z-index: 1000;
         }

         .tool-title-section h1 {
           margin: 0;
           font-size: 1.6rem;
           letter-spacing: 0.5px;
           background: var(--accent-gradient);
           -webkit-background-clip: text;
           background-clip: text;
           -webkit-text-fill-color: transparent;
         }

         .tool-actions {
           display: flex;
           gap: 12px;
         }

         .nav-btn {
           background: rgba(255, 255, 255, 0.05);
           border: 1px solid var(--panel-border);
           color: var(--text-primary);
           padding: 8px 20px;
           border-radius: 6px;
           font-weight: 600;
           font-size: 0.9rem;
           cursor: pointer;
           transition: all 0.2s ease;
         }

         .nav-btn:hover {
           background: rgba(14, 165, 233, 0.1);
           border-color: var(--accent-color);
           transform: translateY(-1px);
         }

         .download-btn {
           background: var(--accent-gradient);
           border: none;
           padding: 9px 22px;
           box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
         }

         .download-btn:hover {
           box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
           transform: translateY(-1px);
         }
       `}</style>
    </header>
  );
};

export default ToolHeader;
