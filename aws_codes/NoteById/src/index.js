// Using AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

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
     * Gets a note by ID from DynamoDB
     * @param {string} noteId - The ID of the note to retrieve
     * @returns {Promise<Object|null>} - The note object or null if not found
     */
    getNoteById: async (noteId) => {
      if (!noteId) {
        throw new Error('Note ID is required');
      }
      
      if (isLocal) {
        console.log('Running locally - accessing DynamoDB for note ID:', noteId);
      }
      
      const params = {
        TableName: 'noter_db',
        Key: {
          id: noteId
        }
      };
      
      const command = new GetCommand(params);
      const data = await docClient.send(command);
      
      return data.Item || null;
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
  console.log('NoteById Lambda invoked with event:', JSON.stringify(event));
  
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responseHelper.cors();
  }
  
  // Check if path parameters exist
  if (!event.pathParameters || !event.pathParameters.id) {
    return responseHelper.error('Note ID is required', 400);
  }
  
  const noteId = event.pathParameters.id;
  
  try {
    // Call the business logic function to get the note
    const note = await dbService.getNoteById(noteId);
    
    // Return 404 if note not found
    if (!note) {
      return responseHelper.error('Note not found', 404);
    }
    
    // Return success response with the note
    return responseHelper.success(note);
  } catch (err) {
    console.error('Error retrieving note:', err);
    
    // Handle specific error types
    if (err.message === 'Note ID is required') {
      return responseHelper.error(err.message, 400);
    }
    
    // Generic server error
    return responseHelper.error(err.message, 500);
  }
};