#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Photo Gallery BHEL - Setup Script');
console.log('=====================================\n');

// Check if Node.js is installed
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    console.error('❌ Node.js version 16 or higher is required');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Node.js is not installed');
  process.exit(1);
}

// Check if npm is available
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm is not available');
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', 'env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from template');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  console.log('⚠️  No .env.example file found, please create .env manually');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

const packages = [
  { name: 'Root', path: '.' },
  { name: 'Frontend', path: 'src' },
  { name: 'Admin Portal', path: 'admin-portal' },
  { name: 'Backend', path: 'server' }
];

packages.forEach(pkg => {
  const packagePath = path.join(__dirname, pkg.path);
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      console.log(`📦 Installing ${pkg.name} dependencies...`);
      execSync('npm install', { 
        cwd: packagePath, 
        stdio: 'inherit' 
      });
      console.log(`✅ ${pkg.name} dependencies installed`);
    } catch (error) {
      console.error(`❌ Failed to install ${pkg.name} dependencies:`, error.message);
    }
  } else {
    console.log(`⚠️  No package.json found in ${pkg.name} directory`);
  }
});

// Create uploads directory
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } catch (error) {
    console.error('❌ Failed to create uploads directory:', error.message);
  }
} else {
  console.log('✅ Uploads directory already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Configure your .env file in the server directory');
console.log('3. Start the development servers:');
console.log('   - npm run dev (for both frontend and backend)');
console.log('   - npm run dev:frontend (frontend only)');
console.log('   - npm run dev:backend (backend only)');
console.log('   - npm run dev:admin (admin portal)');
console.log('\n🌐 Access URLs:');
console.log('   - Frontend: http://localhost:3000');
console.log('   - Backend API: http://localhost:5000');
console.log('   - Admin Portal: http://localhost:3001');
console.log('\n📖 Check the README.md file for detailed documentation'); 