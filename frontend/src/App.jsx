import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({
    asset_code: '',
    name: '',
    type: 'laptop' // default type
  });

  // Fetch all assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchAssetDetails = async (assetCode) => {
    try {
      const response = await axios.get(`/api/assets/${assetCode}`);
      setSelectedAsset(response.data);
    } catch (error) {
      console.error('Error fetching asset details:', error);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/assets', newAsset);
      setNewAsset({ asset_code: '', name: '', type: 'laptop' });
      fetchAssets();
      alert('Asset created successfully!');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Error creating asset. Asset code might already exist.');
    }
  };

  const handleAddParent = async (childCode, parentCode) => {
    try {
      await axios.post(`/api/assets/${childCode}/parents/${parentCode}`);
      fetchAssetDetails(childCode);
      alert('Parent relationship added!');
    } catch (error) {
      console.error('Error adding parent:', error);
      alert('Error adding parent relationship.');
    }
  };

  const handleRemoveParent = async (childCode, parentCode) => {
    try {
      await axios.delete(`/api/assets/${childCode}/parents/${parentCode}`);
      fetchAssetDetails(childCode);
      alert('Parent relationship removed!');
    } catch (error) {
      console.error('Error removing parent:', error);
      alert('Error removing parent relationship.');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>📦 Asset Management System</h1>
        <p>Track assets with parent-child relationships</p>
      </header>

      <div className="container">
        {/* Create Asset Form */}
        <div className="section">
          <h2>Create New Asset</h2>
          <form onSubmit={handleCreateAsset} className="asset-form">
            <div className="form-group">
              <label>Asset Code:</label>
              <input
                type="text"
                value={newAsset.asset_code}
                onChange={(e) => setNewAsset({...newAsset, asset_code: e.target.value.toUpperCase()})}
                placeholder="e.g., KHO123"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Asset Name:</label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                placeholder="e.g., Dell Laptop"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Type:</label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
              >
                <option value="laptop">Laptop</option>
                <option value="printer">Printer</option>
                <option value="license">License</option>
                <option value="monitor">Monitor</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <button type="submit">Create Asset</button>
          </form>
        </div>

        {/* Asset List */}
        <div className="section">
          <h2>All Assets ({assets.length})</h2>
          <div className="asset-list">
            {assets.map(asset => (
              <div 
                key={asset.id} 
                className={`asset-card ${selectedAsset?.asset_code === asset.asset_code ? 'selected' : ''}`}
                onClick={() => fetchAssetDetails(asset.asset_code)}
              >
                <div className="asset-code">{asset.asset_code}</div>
                <div className="asset-name">{asset.name}</div>
                <div className="asset-type">{asset.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Asset Details */}
        {selectedAsset && (
          <div className="section">
            <h2>Selected Asset Details</h2>
            <div className="asset-details">
              <div className="detail-header">
                <h3>{selectedAsset.asset_code} - {selectedAsset.name}</h3>
                <span className="asset-type-badge">{selectedAsset.type}</span>
              </div>
              
              {/* Parent Assets */}
              <div className="relationship-section">
                <h4>Parent Assets ({selectedAsset.parents.length})</h4>
                {selectedAsset.parents.length > 0 ? (
                  <div className="relationship-list">
                    {selectedAsset.parents.map(parent => (
                      <div key={parent.id} className="relationship-item">
                        <span>{parent.asset_code} - {parent.name}</span>
                        <button 
                          onClick={() => handleRemoveParent(selectedAsset.asset_code, parent.asset_code)}
                          className="btn-remove"
                        >
                          Remove Parent
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No parent assets</p>
                )}
                
                {/* Add Parent Form */}
                <div className="add-parent-form">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddParent(selectedAsset.asset_code, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select a parent asset...</option>
                    {assets
                      .filter(asset => 
                        asset.asset_code !== selectedAsset.asset_code && 
                        !selectedAsset.parents.some(p => p.asset_code === asset.asset_code)
                      )
                      .map(asset => (
                        <option key={asset.id} value={asset.asset_code}>
                          {asset.asset_code} - {asset.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              {/* Child Assets */}
              <div className="relationship-section">
                <h4>Child Assets ({selectedAsset.children.length})</h4>
                {selectedAsset.children.length > 0 ? (
                  <div className="relationship-list">
                    {selectedAsset.children.map(child => (
                      <div key={child.id} className="relationship-item">
                        <span>{child.asset_code} - {child.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No child assets</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="section instructions">
          <h2>How It Works</h2>
          <ol>
            <li><strong>Create Assets:</strong> Enter asset code (like KHO123), name, and type</li>
            <li><strong>View Assets:</strong> Click on any asset card to see its details</li>
            <li><strong>Add Relationships:</strong> Select a parent asset from the dropdown to make it a parent</li>
            <li><strong>Example:</strong> Create KHO123 (laptop) and KHOWD111 (license). Then make KHO123 parent of KHOWD111</li>
          </ol>
          <p className="note">
            Note: Each asset must have a unique asset code. An asset can have multiple parents.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;