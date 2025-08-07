// Using AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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
     * Updates a note in DynamoDB
     * @param {string} noteId - The ID of the note to update
     * @param {Object} updateData - The data to update (title, content)
     * @returns {Promise<Object>} - The updated note
     */
    updateNote: async (noteId, updateData) => {
      if (!noteId) {
        throw new Error('Note ID is required');
      }
      
      // Check if note exists first
      const exists = await dbService.noteExists(noteId);
      if (!exists) {
        throw new Error('Note not found');
      }
      
      // Validate update data
      const { title, content } = updateData;
      if (!title && content === undefined) {
        throw new Error('At least one field (title or content) must be provided for update');
      }
      
      // Build update expression and attribute values
      let updateExpression = 'SET updatedAt = :updatedAt';
      const expressionAttributeValues = {
        ':updatedAt': new Date().toISOString()
      };
      
      if (title !== undefined) {
        updateExpression += ', title = :title';
        expressionAttributeValues[':title'] = title;
      }
      
      if (content !== undefined) {
        updateExpression += ', content = :content';
        expressionAttributeValues[':content'] = content;
      }
      
      const params = {
        TableName: 'noter_db',
        Key: {
          id: noteId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };
      
      if (isLocal) {
        console.log('Running locally - updating note in DynamoDB:', noteId);
      }
      
      const command = new UpdateCommand(params);
      const result = await docClient.send(command);
      
      return result.Attributes;
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
  console.log('UpdateNote Lambda invoked with event:', JSON.stringify(event));
  
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responseHelper.cors();
  }
  
  // Check if path parameters exist
  if (!event.pathParameters || !event.pathParameters.id) {
    return responseHelper.error('Note ID is required', 400);
  }
  
  const noteId = event.pathParameters.id;
  
  // Check if request body exists and is valid JSON
  if (!event.body) {
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
    // Call the business logic function to update the note
    const updatedNote = await dbService.updateNote(noteId, requestBody);
    
    // Return success response with the updated note
    return responseHelper.success(updatedNote);
  } catch (err) {
    console.error('Error updating note:', err);
    
    // Handle specific error types
    if (err.message === 'Note ID is required') {
      return responseHelper.error(err.message, 400);
    }
    
    if (err.message === 'Note not found') {
      return responseHelper.error(err.message, 404);
    }
    
    if (err.message === 'At least one field (title or content) must be provided for update') {
      return responseHelper.error(err.message, 400);
    }
    
    // Generic server error
    return responseHelper.error(err.message, 500);
  }
};
