import React from 'react';
import './index.css';
import InteractiveEngine from './components/InteractiveEngine';

function App() {
  return (
    <div className="app-container">
      <main className="container-full">
        <InteractiveEngine />
      </main>
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background-color: var(--bg-color);
        }
        .container-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default App;
