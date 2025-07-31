/**
 * S3 Deployment Script for Noter Application
 * 
 * Prerequisites:
 * 1. Node.js and npm installed
 * 2. AWS CLI configured with appropriate credentials
 * 3. S3 bucket created with appropriate permissions
 * 
 * Usage:
 * 1. Update the configuration variables below
 * 2. Run: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // AWS S3 bucket name
  BUCKET_NAME: 'your-noter-app-bucket',
  
  // AWS region
  REGION: 'us-east-1',
  
  // Build directory
  BUILD_DIR: path.join(__dirname, 'build'),
  
  // CloudFront distribution ID (if using CloudFront)
  CLOUDFRONT_DISTRIBUTION_ID: '',
  
  // Whether to build the app before deploying
  BUILD_BEFORE_DEPLOY: true
};

// Ensure build directory exists
function ensureBuildExists() {
  if (!fs.existsSync(config.BUILD_DIR)) {
    console.log('Build directory not found. Building application...');
    if (config.BUILD_BEFORE_DEPLOY) {
      buildApp();
    } else {
      console.error('Error: Build directory not found and BUILD_BEFORE_DEPLOY is set to false.');
      process.exit(1);
    }
  }
}

// Build the application
function buildApp() {
  try {
    console.log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Error building application:', error.message);
    process.exit(1);
  }
}

// Deploy to S3
function deployToS3() {
  try {
    console.log(`Deploying to S3 bucket: ${config.BUCKET_NAME}...`);
    
    // Sync build directory to S3
    execSync(
      `aws s3 sync ${config.BUILD_DIR} s3://${config.BUCKET_NAME} --delete --region ${config.REGION}`,
      { stdio: 'inherit' }
    );
    
    console.log('Deployment to S3 completed successfully.');
    
    // Set public read access for all objects
    execSync(
      `aws s3 cp s3://${config.BUCKET_NAME} s3://${config.BUCKET_NAME} --recursive --acl public-read --region ${config.REGION}`,
      { stdio: 'inherit' }
    );
    
    console.log('Public read access set for all objects.');
    
    // Invalidate CloudFront cache if distribution ID is provided
    if (config.CLOUDFRONT_DISTRIBUTION_ID) {
      invalidateCloudFrontCache();
    }
    
    console.log('\nDeployment completed successfully!');
    console.log(`Your application is now available at: http://${config.BUCKET_NAME}.s3-website-${config.REGION}.amazonaws.com/`);
  } catch (error) {
    console.error('Error deploying to S3:', error.message);
    process.exit(1);
  }
}

// Invalidate CloudFront cache
function invalidateCloudFrontCache() {
  try {
    console.log('Invalidating CloudFront cache...');
    
    execSync(
      `aws cloudfront create-invalidation --distribution-id ${config.CLOUDFRONT_DISTRIBUTION_ID} --paths "/*" --region ${config.REGION}`,
      { stdio: 'inherit' }
    );
    
    console.log('CloudFront cache invalidation initiated.');
  } catch (error) {
    console.error('Error invalidating CloudFront cache:', error.message);
    // Continue execution even if invalidation fails
  }
}

// Main execution
function main() {
  console.log('Noter S3 Deployment Script');
  console.log('=========================\n');
  
  ensureBuildExists();
  deployToS3();
}

main();
