import React from 'react';
import Closet from './components/Closet';

function App() {
  // Standalone closet app - no portfolio, no GoWhere
  return (
    <div className="min-h-screen bg-canvas">
      <Closet onBack={() => {
        // In standalone mode, just scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}

export default App;
