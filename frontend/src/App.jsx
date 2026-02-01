import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import AssetDetail from './AssetDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/asset/:assetCode" element={<AssetDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;