#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Admin Portal for Photo Gallery BHEL...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the admin-portal directory.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 16) {
  console.error(`❌ Error: Node.js 16+ is required. Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n🔧 Creating .env file...');
  const envContent = `VITE_API_URL=http://localhost:5000/api
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
} else {
  console.log('✅ .env file already exists');
}

// Check if main server is running
console.log('\n🔍 Checking main server connection...');
try {
  const response = require('http').get('http://localhost:5000/api/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Main server is running on port 5000');
    } else {
      console.log('⚠️  Main server responded with status:', res.statusCode);
    }
  });
  
  response.on('error', () => {
    console.log('⚠️  Main server is not running. Please start the main Photo Gallery BHEL server first.');
    console.log('   Run: cd ../server && npm start');
  });
  
  response.setTimeout(5000, () => {
    console.log('⚠️  Main server connection timeout. Please ensure it\'s running on port 5000.');
  });
} catch (error) {
  console.log('⚠️  Could not check main server status');
}

console.log('\n🎉 Admin Portal setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Ensure the main Photo Gallery BHEL server is running on port 5000');
console.log('2. Start the admin portal: npm run dev');
console.log('3. Open http://localhost:3001/admin-portal in your browser');
console.log('4. Login with admin credentials');
console.log('\n📚 For more information, see README.md'); 