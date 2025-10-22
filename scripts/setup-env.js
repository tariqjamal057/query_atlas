#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps generate a .env file with secure random secrets
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

async function main() {
  console.log('\n🔧 LLM Archive - Environment Setup\n');
  console.log('This script will help you create a .env file with secure configuration.\n');

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Configuration Questions:\n');

  // Environment
  const nodeEnv = await question('Environment (development/production) [development]: ') || 'development';

  // Port
  const port = await question('Server port [5000]: ') || '5000';

  // Database URL
  console.log('\n💾 Database Configuration:');
  console.log('   - Local: postgresql://postgres:password@localhost:5432/llm_archive');
  console.log('   - Replit: Leave blank (auto-provided)');
  console.log('   - Neon: Get from neon.tech console\n');
  const databaseUrl = await question('Database URL [leave blank for Replit]: ') || '${DATABASE_URL}';

  // Session secret
  console.log('\n🔐 Generating secure session secret...');
  const sessionSecret = generateSecret(32);
  console.log(`   Generated: ${sessionSecret.substring(0, 20)}...`);

  // JWT secret (optional)
  const includeJWT = await question('\nInclude JWT secret for extension auth? (y/N): ');
  let jwtSecret = '';
  if (includeJWT.toLowerCase() === 'y') {
    jwtSecret = generateSecret(32);
    console.log(`   Generated JWT secret: ${jwtSecret.substring(0, 20)}...`);
  }

  // CORS origin
  const defaultCors = nodeEnv === 'production' ? 'https://your-frontend.vercel.app' : 'http://localhost:5173';
  const corsOrigin = await question(`\nCORS Origin [${defaultCors}]: `) || defaultCors;

  // Build .env content
  let envContent = `# LLM Archive - Environment Variables
# Generated on ${new Date().toISOString()}

# Server Configuration
NODE_ENV=${nodeEnv}
PORT=${port}

# Database Configuration
DATABASE_URL=${databaseUrl}

# Session Security
SESSION_SECRET=${sessionSecret}
`;

  if (jwtSecret) {
    envContent += `
# JWT Authentication
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=30d
`;
  }

  envContent += `
# CORS Configuration
CORS_ORIGIN=${corsOrigin}

# Frontend API URL
VITE_API_URL=/api
`;

  if (nodeEnv === 'development') {
    envContent += `
# Development Settings
LOG_LEVEL=debug
DEBUG=true
`;
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env file created successfully!\n');
  console.log('📄 Location:', envPath);
  console.log('\n📋 Next steps:');
  console.log('   1. Review .env file and adjust as needed');
  console.log('   2. Run: npm run db:push (to set up database)');
  console.log('   3. Run: npm run dev (to start the server)');
  console.log('\n⚠️  Security reminder:');
  console.log('   - Never commit .env to version control');
  console.log('   - Use different secrets for dev/production');
  console.log('   - Rotate secrets regularly\n');

  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
