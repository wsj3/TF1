// Script to check for duplicate pages in Next.js build
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to get all page files
function getPageFiles() {
  return new Promise((resolve, reject) => {
    glob('pages/**/*.js', { ignore: 'pages/api/**/*.js' }, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

// Function to extract route from file path
function getRouteFromFilePath(filePath) {
  // Remove 'pages' prefix and '.js' extension
  let route = filePath.replace(/^pages/, '').replace(/\.js$/, '');
  
  // Handle index files
  route = route.replace(/\/index$/, '');
  
  // Handle empty route (root)
  if (route === '') {
    route = '/';
  }
  
  return route;
}

// Main function
async function main() {
  try {
    console.log('🔍 Checking for duplicate pages...');
    
    // Get all page files
    const files = await getPageFiles();
    
    // Map files to routes
    const routeMap = {};
    
    files.forEach(file => {
      const route = getRouteFromFilePath(file);
      
      if (!routeMap[route]) {
        routeMap[route] = [];
      }
      
      routeMap[route].push(file);
    });
    
    // Find duplicates
    const duplicates = Object.entries(routeMap)
      .filter(([route, files]) => files.length > 1);
    
    // Print results
    if (duplicates.length === 0) {
      console.log('✅ No duplicate pages found!');
    } else {
      console.log('❌ Found duplicate pages:');
      
      duplicates.forEach(([route, files]) => {
        console.log(`\nRoute: ${route}`);
        console.log('Files:');
        files.forEach(file => console.log(`  - ${file}`));
      });
      
      console.log('\n⚠️ Duplicate pages can cause routing conflicts in Next.js.');
      console.log('   Consider removing or renaming one of the files for each duplicate route.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 