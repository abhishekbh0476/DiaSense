// Environment Variables Checker
export function checkEnvironmentVariables() {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missing = [];
  const present = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  console.log('Environment Variables Check:');
  console.log('✅ Present:', present);
  console.log('❌ Missing:', missing);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please create a .env.local file with these variables');
    return false;
  }

  return true;
}

// Auto-check on import in development
if (process.env.NODE_ENV === 'development') {
  checkEnvironmentVariables();
}
