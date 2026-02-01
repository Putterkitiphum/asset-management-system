const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Asset Management Backend Server...');
console.log('📁 Current directory:', process.cwd());

// Check if database exists
const dbPath = path.join(__dirname, 'assets.db');
console.log('🔍 Checking for database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('📝 Database not found. Creating new one...');
    // Create an empty file to ensure SQLite can open it
    fs.writeFileSync(dbPath, '');
    console.log('✅ Database file created successfully');
}

// Start the server
console.log('⚡ Starting server with nodemon...');
const server = spawn('npx', ['nodemon', 'server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    console.log('💡 Try running: npm run dev');
});