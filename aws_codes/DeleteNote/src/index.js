// Using AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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
     * Checks if a note exists in DynamoDB
     * @param {string} noteId - The ID of the note to check
     * @returns {Promise<boolean>} - True if the note exists, false otherwise
     */
    noteExists: async (noteId) => {
      const params = {
        TableName: 'noter_db',
        Key: {
          id: noteId
        }
      };
      
      const command = new GetCommand(params);
      const data = await docClient.send(command);
      
      return !!data.Item;
    },

    /**
     * Deletes a note from DynamoDB
     * @param {string} noteId - The ID of the note to delete
     * @returns {Promise<void>}
     */
    deleteNote: async (noteId) => {
      if (!noteId) {
        throw new Error('Note ID is required');
      }
      
      // Check if note exists first
      const exists = await dbService.noteExists(noteId);
      if (!exists) {
        throw new Error('Note not found');
      }
      
      const params = {
        TableName: 'noter_db',
        Key: {
          id: noteId
        }
      };
      
      if (isLocal) {
        console.log('Running locally - deleting note from DynamoDB:', noteId);
      }
      
      const command = new DeleteCommand(params);
      await docClient.send(command);
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
  console.log('DeleteNote Lambda invoked with event:', JSON.stringify(event));
  
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
    // Call the business logic function to delete the note
    await dbService.deleteNote(noteId);
    
    // Return success response (204 No Content is appropriate for DELETE)
    return responseHelper.success({ message: 'Note deleted successfully' }, 204);
  } catch (err) {
    console.error('Error deleting note:', err);
    
    // Handle specific error types
    if (err.message === 'Note ID is required') {
      return responseHelper.error(err.message, 400);
    }
    
    if (err.message === 'Note not found') {
      return responseHelper.error(err.message, 404);
    }
    
    // Generic server error
    return responseHelper.error(err.message, 500);
  }
};
