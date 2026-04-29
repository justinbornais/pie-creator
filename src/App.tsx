import { useState } from 'react';
import PieCreator from './components/PieCreator';
import AngleGuide from './components/AngleGuide';
import { APP_DEFAULTS } from './config/defaults';

type Tab = 'pie' | 'angle';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(APP_DEFAULTS.activeTab);
  const [greyscale, setGreyscale] = useState(APP_DEFAULTS.greyscale);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-icon">📐</span>
          <h1>Angle Creator</h1>
        </div>
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'pie' ? 'active' : ''}`}
            onClick={() => setActiveTab('pie')}
          >
            <span className="tab-icon">◔</span>
            Pie Chart
          </button>
          <button
            className={`tab-btn ${activeTab === 'angle' ? 'active' : ''}`}
            onClick={() => setActiveTab('angle')}
          >
            <span className="tab-icon">∠</span>
            Angle Guide
          </button>
        </nav>
        <label className="header-toggle">
          <input
            type="checkbox"
            checked={greyscale}
            onChange={(e) => setGreyscale(e.target.checked)}
          />
          Greyscale
        </label>
      </header>
      <main className="app-main">
        {activeTab === 'pie' ? <PieCreator greyscale={greyscale} /> : <AngleGuide greyscale={greyscale} />}
      </main>
    </div>
  );
}
