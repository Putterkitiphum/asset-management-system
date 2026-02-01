const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Asset Management System...');
console.log('📁 Project root:', __dirname);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Check if backend and frontend folders exist
const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendPath)) {
  console.error(`${colors.bright}❌ Backend folder not found at: ${backendPath}${colors.reset}`);
  process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
  console.error(`${colors.bright}❌ Frontend folder not found at: ${frontendPath}${colors.reset}`);
  process.exit(1);
}

// Start backend
console.log(`${colors.cyan}⚡ Starting Backend Server...${colors.reset}`);
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendPath,
  shell: true,
  stdio: 'inherit'
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log(`${colors.cyan}⚡ Starting Frontend Server...${colors.reset}`);
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: frontendPath,
    shell: true,
    stdio: 'inherit'
  });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log(`${colors.yellow}\n🛑 Shutting down servers...${colors.reset}`);
  process.exit(0);
});

console.log(`${colors.green}✅ Servers are starting...${colors.reset}`);
console.log(`${colors.blue}🌐 Frontend will be at: http://localhost:3000${colors.reset}`);
console.log(`${colors.blue}🔧 Backend API will be at: http://localhost:3001${colors.reset}`);
console.log(`${colors.yellow}📝 Press Ctrl+C to stop both servers${colors.reset}`);