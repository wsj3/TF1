// Script to remove problematic packages before build
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

console.log('Running prebuild cleanup script...');

// Function to check if a directory exists
const dirExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
};

// Remove node_modules if they exist
if (dirExists('node_modules')) {
  console.log('Removing existing node_modules...');
  rimraf.sync('node_modules');
  console.log('node_modules removed successfully.');
}

// Remove package-lock.json if it exists
const packageLockPath = path.join(__dirname, 'package-lock.json');
if (fileExists(packageLockPath)) {
  console.log('Removing package-lock.json...');
  fs.unlinkSync(packageLockPath);
  console.log('package-lock.json removed successfully.');
}

// Create a .npmrc file to force clean install
const npmrcPath = path.join(__dirname, '.npmrc');
console.log('Creating or updating .npmrc file...');
const npmrcContent = `
platform=linux
arch=x64
force=true
ignore-scripts=false
package-lock=false
unsafe-perm=true
node-linker=hoisted
legacy-peer-deps=true
fetch-retries=5
network-timeout=100000
`;
fs.writeFileSync(npmrcPath, npmrcContent.trim());
console.log('.npmrc file updated successfully.');

// Modify package.json to exclude problematic packages
const packageJsonPath = path.join(__dirname, 'package.json');
if (fileExists(packageJsonPath)) {
  console.log('Modifying package.json to handle platform-specific dependencies...');
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add resolutions to force specific package versions
  packageJson.resolutions = {
    ...packageJson.resolutions,
    "esbuild": "latest",
    "p-defer-es5": "npm:p-defer@latest"
  };
  
  // Write modified package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Package.json updated successfully.');
}

// Create a .buildpacks file to specify buildpacks
const buildpacksPath = path.join(__dirname, '.buildpacks');
console.log('Creating .buildpacks file...');
fs.writeFileSync(buildpacksPath, 'heroku/nodejs');
console.log('.buildpacks file created successfully.');

console.log('Prebuild cleanup completed.'); 