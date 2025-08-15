#!/bin/bash

# This script builds and pushes Docker images for all Lambda functions to ECR

# Set variables
AWS_REGION="us-east-1"  # Change to your preferred region
IMAGE_TAG="latest"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Function to build and push a Lambda function
build_and_push() {
    local function_name=$1
    local ecr_repository_name="noter-${function_name,,}"  # Convert to lowercase
    
    echo "========================================="
    echo "Building and pushing $function_name"
    echo "========================================="
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names ${ecr_repository_name} --region ${AWS_REGION} 2>/dev/null || \
        aws ecr create-repository --repository-name ${ecr_repository_name} --region ${AWS_REGION}
    
    # Navigate to function directory
    cd "$function_name"
    
    # Build the Docker image
    docker build -t ${ecr_repository_name}:${IMAGE_TAG} .
    
    # Tag the Docker image
    docker tag ${ecr_repository_name}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ecr_repository_name}:${IMAGE_TAG}
    
    # Push the Docker image to ECR
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ecr_repository_name}:${IMAGE_TAG}
    
    # Return to parent directory
    cd ..
    
    echo "Image URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ecr_repository_name}:${IMAGE_TAG}"
    echo ""
}

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push each Lambda function
build_and_push "GetAllNotes"
build_and_push "CreateNote"
build_and_push "DeleteNote"
build_and_push "NoteById"
build_and_push "UpdateNote"

echo "All Lambda functions have been built and pushed to ECR!"
echo "Update your SAM template with the image URIs above."
