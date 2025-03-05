// Script to clear Vercel cache and check deployment status
const https = require('https');
const fs = require('fs');
const path = require('path');

// Function to update CACHE_KEY in vercel.json
function updateCacheKey() {
  try {
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Generate a new cache key with current date
    const date = new Date();
    const newCacheKey = `reset-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 100)}`;
    
    // Update the cache key
    vercelConfig.build.env.CACHE_KEY = newCacheKey;
    
    // Write the updated config back to the file
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
    
    console.log(`✅ Updated CACHE_KEY to: ${newCacheKey}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update cache key:', error.message);
    return false;
  }
}

// Function to check if a URL is accessible
function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`🔍 Checking ${url}: Status ${res.statusCode}`);
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode >= 200 && res.statusCode < 400
      });
    }).on('error', (err) => {
      console.error(`❌ Error checking ${url}:`, err.message);
      resolve({
        url,
        status: 'Error',
        accessible: false,
        error: err.message
      });
    });
  });
}

// Main function
async function main() {
  console.log('🚀 Starting deployment check and cache clearing...');
  
  // Update the cache key
  const cacheUpdated = updateCacheKey();
  
  if (!cacheUpdated) {
    console.log('⚠️ Failed to update cache key. Please check vercel.json file.');
    process.exit(1);
  }
  
  // URLs to check
  const urls = [
    'https://tf-1-blo8tirxb-will-johnstons-projects-4f35a9d5.vercel.app',
    'https://tf-1-blo8tirxb-will-johnstons-projects-4f35a9d5.vercel.app/appointments',
    'https://tf-1-blo8tirxb-will-johnstons-projects-4f35a9d5.vercel.app/api/sessions?demo=true'
  ];
  
  console.log('🔍 Checking deployment URLs...');
  
  // Check all URLs
  const results = await Promise.all(urls.map(url => checkUrl(url)));
  
  // Print results
  console.log('\n📊 Deployment Status:');
  results.forEach(result => {
    const statusIcon = result.accessible ? '✅' : '❌';
    console.log(`${statusIcon} ${result.url}: ${result.status}`);
  });
  
  console.log('\n📝 Next steps:');
  console.log('1. Commit and push the updated vercel.json file');
  console.log('2. Wait for the deployment to complete');
  console.log('3. Check the deployment URLs again');
  
  if (results.some(r => !r.accessible)) {
    console.log('\n⚠️ Some URLs are not accessible. Please check the deployment logs.');
  } else {
    console.log('\n✅ All URLs are accessible!');
  }
}

// Run the main function
main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
}); 