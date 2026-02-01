const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup with absolute path
const dbPath = path.join(__dirname, 'assets.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        console.log('Trying to create database in current directory...');
        
        // Try alternative path
        const altPath = path.join(process.cwd(), 'assets.db');
        console.log('Trying alternative path:', altPath);
        
        // Reinitialize with alternative path
        db = new sqlite3.Database(altPath, (err2) => {
            if (err2) {
                console.error('Failed to create database:', err2.message);
            } else {
                console.log('Database created successfully at:', altPath);
                initializeDatabase();
            }
        });
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        initializeDatabase();
    }
});

// Initialize database with tables
function initializeDatabase() {
    console.log('Initializing database tables...');
    
    // Create assets table
    db.run(`
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating assets table:', err.message);
        } else {
            console.log('Assets table ready');
        }
    });

    // Create relationships table
    db.run(`
        CREATE TABLE IF NOT EXISTS asset_relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_asset_code TEXT NOT NULL,
            child_asset_code TEXT NOT NULL,
            FOREIGN KEY (parent_asset_code) REFERENCES assets(asset_code),
            FOREIGN KEY (child_asset_code) REFERENCES assets(asset_code),
            UNIQUE(parent_asset_code, child_asset_code)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating relationships table:', err.message);
        } else {
            console.log('Relationships table ready');
            
            // Insert sample data if database is empty
            insertSampleData();
        }
    });
}

// Insert sample data for testing
function insertSampleData() {
    // Check if we already have data
    db.get('SELECT COUNT(*) as count FROM assets', (err, result) => {
        if (err) {
            console.error('Error checking data:', err.message);
            return;
        }
        
        if (result.count === 0) {
            console.log('Inserting sample data...');
            
            const sampleAssets = [
                ['KHO123', 'Dell Laptop', 'laptop'],
                ['KHO573', 'HP Printer', 'printer'],
                ['KHOWD111', 'Windows 11 Pro License', 'license'],
                ['KHO789', 'Samsung Monitor', 'monitor'],
                ['KHO456', 'Office Chair', 'furniture']
            ];
            
            let insertedCount = 0;
            sampleAssets.forEach(([code, name, type]) => {
                db.run(
                    'INSERT OR IGNORE INTO assets (asset_code, name, type) VALUES (?, ?, ?)',
                    [code, name, type],
                    function(err) {
                        if (err) {
                            console.error(`Error inserting ${code}:`, err.message);
                        } else {
                            insertedCount++;
                            console.log(`Inserted sample asset: ${code} - ${name}`);
                        }
                        
                        // After all assets inserted, add relationships
                        if (insertedCount === sampleAssets.length) {
                            addSampleRelationships();
                        }
                    }
                );
            });
        } else {
            console.log(`Database already has ${result.count} assets`);
        }
    });
}

// Add sample relationships
function addSampleRelationships() {
    console.log('Adding sample relationships...');
    
    // Make KHO123 (laptop) parent of KHOWD111 (license)
    db.run(
        'INSERT OR IGNORE INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)',
        ['KHO123', 'KHOWD111'],
        (err) => {
            if (err) {
                console.error('Error adding relationship:', err.message);
            } else {
                console.log('Added relationship: KHO123 -> KHOWD111');
            }
        }
    );
}

// API Routes

// Get all assets
app.get('/api/assets', (req, res) => {
    db.all('SELECT * FROM assets ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching assets:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Fetched ${rows.length} assets`);
        res.json(rows);
    });
});

// Get a single asset with its children
app.get('/api/assets/:code', (req, res) => {
    const assetCode = req.params.code;
    console.log(`Fetching details for asset: ${assetCode}`);
    
    // Get asset details
    db.get('SELECT * FROM assets WHERE asset_code = ?', [assetCode], (err, asset) => {
        if (err) {
            console.error('Error fetching asset:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!asset) {
            console.log(`Asset not found: ${assetCode}`);
            res.status(404).json({ error: 'Asset not found' });
            return;
        }
        
        console.log(`Found asset: ${asset.asset_code} - ${asset.name}`);
        
        // Get child assets
        db.all(`
            SELECT a.* 
            FROM assets a
            JOIN asset_relationships r ON a.asset_code = r.child_asset_code
            WHERE r.parent_asset_code = ?
        `, [assetCode], (err, children) => {
            if (err) {
                console.error('Error fetching children:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            
            console.log(`Found ${children.length} child assets`);
            
            // Get parent assets
            db.all(`
                SELECT a.* 
                FROM assets a
                JOIN asset_relationships r ON a.asset_code = r.parent_asset_code
                WHERE r.child_asset_code = ?
            `, [assetCode], (err, parents) => {
                if (err) {
                    console.error('Error fetching parents:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                console.log(`Found ${parents.length} parent assets`);
                
                res.json({
                    ...asset,
                    children,
                    parents
                });
            });
        });
    });
});

// Create a new asset
app.post('/api/assets', (req, res) => {
    const { asset_code, name, type } = req.body;
    console.log(`Creating new asset: ${asset_code} - ${name} (${type})`);
    
    if (!asset_code || !name || !type) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    db.run(
        'INSERT INTO assets (asset_code, name, type) VALUES (?, ?, ?)',
        [asset_code.toUpperCase(), name, type],
        function(err) {
            if (err) {
                console.error('Error creating asset:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log(`Asset created with ID: ${this.lastID}`);
            res.json({ 
                id: this.lastID, 
                asset_code: asset_code.toUpperCase(), 
                name, 
                type 
            });
        }
    );
});

// Add parent-child relationship
app.post('/api/assets/:childCode/parents/:parentCode', (req, res) => {
    const { childCode, parentCode } = req.params;
    console.log(`Adding relationship: ${parentCode} -> ${childCode}`);
    
    db.run(
        'INSERT INTO asset_relationships (parent_asset_code, child_asset_code) VALUES (?, ?)',
        [parentCode.toUpperCase(), childCode.toUpperCase()],
        function(err) {
            if (err) {
                console.error('Error adding relationship:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log(`Relationship added: ${parentCode} -> ${childCode}`);
            res.json({ 
                message: 'Relationship added successfully',
                parent: parentCode,
                child: childCode
            });
        }
    );
});

// Remove parent-child relationship
app.delete('/api/assets/:childCode/parents/:parentCode', (req, res) => {
    const { childCode, parentCode } = req.params;
    console.log(`Removing relationship: ${parentCode} -> ${childCode}`);
    
    db.run(
        'DELETE FROM asset_relationships WHERE parent_asset_code = ? AND child_asset_code = ?',
        [parentCode.toUpperCase(), childCode.toUpperCase()],
        function(err) {
            if (err) {
                console.error('Error removing relationship:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log(`Relationship removed: ${parentCode} -> ${childCode}`);
            res.json({ 
                message: 'Relationship removed successfully',
                parent: parentCode,
                child: childCode
            });
        }
    );
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Asset Management API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Database location: ${dbPath}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Assets endpoint: http://localhost:${PORT}/api/assets`);
});