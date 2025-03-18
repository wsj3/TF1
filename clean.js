const fs = require('fs');
const path = require('path');

// Files that should be removed to prevent routing conflicts
const filesToRemove = [
  'pages/clients.js' // This file conflicts with pages/clients/index.js
];

// Function to safely remove a file if it exists
const safeRemove = (filePath) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Removing duplicate file: ${filePath}`);
    fs.unlinkSync(fullPath);
    return true;
  } else {
    console.log(`File does not exist (good): ${filePath}`);
    return false;
  }
};

// Main cleaning function
const cleanProject = () => {
  console.log('Starting project cleanup...');
  
  let filesRemoved = 0;
  
  // Remove any conflicting files
  filesToRemove.forEach(file => {
    if (safeRemove(file)) {
      filesRemoved++;
    }
  });
  
  console.log(`Cleanup complete. Removed ${filesRemoved} conflicting files.`);
};

// Run the cleaning process
cleanProject(); 