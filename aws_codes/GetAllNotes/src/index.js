// index.js - Using AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize the DynamoDB client
let clientOptions = { region: process.env.AWS_REGION || 'us-east-1' };

// For local development with SAM CLI, use environment variables for credentials
if (process.env.AWS_SAM_LOCAL) {
  console.log('Running in SAM local environment');
  // We'll rely on environment variables passed from SAM CLI
}

const client = new DynamoDBClient(clientOptions);
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const params = {
    TableName: 'noter_db'
  };
  
  try {
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(data.Items)
    };
  } catch (err) {
    console.error('Error accessing DynamoDB:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};