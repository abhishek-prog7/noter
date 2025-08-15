// Using AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Database service module
const dbService = (() => {
  // Check if we're running locally with SAM
  const isLocal = process.env.AWS_SAM_LOCAL === 'true';

  // Initialize the DynamoDB client with profile credentials when running locally
  const clientOptions = { region: process.env.AWS_REGION || 'us-east-1' };

  // For local development with SAM CLI, use environment variables for credentials
  if (isLocal) {
    console.log('Running in SAM local environment');
    // We'll rely on environment variables passed from SAM CLI
  }

  const client = new DynamoDBClient(clientOptions);
  const docClient = DynamoDBDocumentClient.from(client);

  return {
    /**
     * Creates a new note in DynamoDB
     * @param {Object} noteData - Note data (title, content)
     * @returns {Promise<Object>} - Created note with id and timestamps
     */
    createNote: async (noteData) => {
      const { title, content } = noteData;
      
      if (!title) {
        throw new Error('Title is required');
      }
      
      const timestamp = new Date().toISOString();
      const noteId = uuidv4();
      
      // Create the note object
      const newNote = {
        id: noteId,
        title,
        content: content || '',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      if (isLocal) {
        console.log('Running locally - using admin profile to access DynamoDB for note creation');
      }
      
      // Use DynamoDB
      const params = {
        TableName: 'noter_db',
        Item: newNote
      };
      
      const command = new PutCommand(params);
      await docClient.send(command);
      
      return newNote;
    }
  };
})();

// Response helper module
const responseHelper = {
  /**
   * Creates a success response with proper CORS headers
   * @param {Object} data - Response data
   * @param {number} statusCode - HTTP status code
   * @returns {Object} - API Gateway response object
   */
  success: (data, statusCode = 200) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(data)
  }),
  
  /**
   * Creates an error response with proper CORS headers
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} - API Gateway response object
   */
  error: (message, statusCode = 500) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({ error: message })
  }),
  
  /**
   * Creates a CORS preflight response
   * @returns {Object} - API Gateway response object
   */
  cors: () => ({
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': true
    },
    body: ''
  })
};

/**
 * Lambda handler function
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.handler = async (event) => {
  console.log('CreateNote Lambda invoked with event:', JSON.stringify(event));
  
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responseHelper.cors();
  }
  
  // Check if event.body exists and is valid JSON
  if (!event.body) {
    console.error('Error: event.body is missing');
    return responseHelper.error('Request body is missing', 400);
  }
  
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
    console.log('Parsed request body:', requestBody);
  } catch (err) {
    console.error('Error parsing request body:', err);
    return responseHelper.error('Invalid JSON in request body', 400);
  }
  
  try {
    // Call the business logic function to create the note
    const newNote = await dbService.createNote(requestBody);
    
    // Return success response with the created note
    return responseHelper.success(newNote, 201);
  } catch (err) {
    console.error('Error creating note:', err);
    
    // Handle specific error types
    if (err.message === 'Title is required') {
      return responseHelper.error(err.message, 400);
    }
    
    // Generic server error
    return responseHelper.error(err.message, 500);
  }
};