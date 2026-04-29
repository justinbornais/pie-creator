import { useState } from 'react';
import PieCreator from './components/PieCreator';
import AngleGuide from './components/AngleGuide';

type Tab = 'pie' | 'angle';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pie');
  const [greyscale, setGreyscale] = useState(false);

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
