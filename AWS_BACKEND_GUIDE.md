# AWS Backend Implementation Guide for Noter

This document outlines the steps to implement the serverless backend for the Noter application using AWS services.

## Architecture Overview

The Noter backend uses the following AWS services:
- **Lambda**: For serverless function execution
- **API Gateway**: To create RESTful APIs that trigger Lambda functions
- **DynamoDB**: For storing note data
- **S3**: For hosting the static frontend
- **CloudFront** (optional): For CDN capabilities
- **IAM**: For managing permissions

## 1. DynamoDB Setup

### Create a Notes Table

1. Go to the AWS DynamoDB console
2. Create a new table named `Notes`
3. Primary key: `id` (String)
4. Add a sort key (optional): `userId` (String) - if you plan to implement authentication
5. Configure capacity:
   - Use on-demand capacity for development
   - Consider provisioned capacity for production

### Table Structure

Each note will have the following attributes:
- `id`: String (Primary key, UUID)
- `title`: String
- `content`: String
- `createdAt`: String (ISO date)
- `updatedAt`: String (ISO date)
- `userId`: String (Optional, for multi-user support)

## 2. Lambda Functions

Create the following Lambda functions for CRUD operations:

### GetAllNotes

```javascript
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const params = {
    TableName: 'Notes'
  };
  
  try {
    const data = await docClient.scan(params).promise();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(data.Items)
    };
  } catch (err) {
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
```

### GetNoteById

```javascript
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const noteId = event.pathParameters.id;
  
  const params = {
    TableName: 'Notes',
    Key: {
      id: noteId
    }
  };
  
  try {
    const data = await docClient.get(params).promise();
    
    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Note not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(data.Item)
    };
  } catch (err) {
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
```

### CreateNote

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const requestBody = JSON.parse(event.body);
  const { title, content } = requestBody;
  
  if (!title) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: 'Title is required' })
    };
  }
  
  const timestamp = new Date().toISOString();
  const noteId = uuidv4();
  
  const params = {
    TableName: 'Notes',
    Item: {
      id: noteId,
      title,
      content: content || '',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
  
  try {
    await docClient.put(params).promise();
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(params.Item)
    };
  } catch (err) {
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
```

### UpdateNote

```javascript
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const noteId = event.pathParameters.id;
  const requestBody = JSON.parse(event.body);
  const { title, content } = requestBody;
  
  // Check if note exists
  const getParams = {
    TableName: 'Notes',
    Key: {
      id: noteId
    }
  };
  
  try {
    const data = await docClient.get(getParams).promise();
    
    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Note not found' })
      };
    }
    
    // Update the note
    const timestamp = new Date().toISOString();
    
    const updateParams = {
      TableName: 'Notes',
      Key: {
        id: noteId
      },
      UpdateExpression: 'set title = :title, content = :content, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': title || data.Item.title,
        ':content': content !== undefined ? content : data.Item.content,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const updateResult = await docClient.update(updateParams).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(updateResult.Attributes)
    };
  } catch (err) {
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
```

### DeleteNote

```javascript
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const noteId = event.pathParameters.id;
  
  const params = {
    TableName: 'Notes',
    Key: {
      id: noteId
    }
  };
  
  try {
    await docClient.delete(params).promise();
    
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: ''
    };
  } catch (err) {
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
```

## 3. API Gateway Setup

1. Create a new REST API in API Gateway
2. Create the following resources and methods:

   - `/notes`
     - `GET`: List all notes (GetAllNotes Lambda)
     - `POST`: Create a new note (CreateNote Lambda)
   
   - `/notes/{id}`
     - `GET`: Get a note by ID (GetNoteById Lambda)
     - `PUT`: Update a note (UpdateNote Lambda)
     - `DELETE`: Delete a note (DeleteNote Lambda)

3. Enable CORS for all endpoints
4. Deploy the API to a stage (e.g., "prod")
5. Note the API endpoint URL for frontend configuration

## 4. IAM Permissions

Ensure your Lambda functions have the following permissions:

1. Create an IAM role for Lambda functions with:
   - `AWSLambdaBasicExecutionRole` for CloudWatch Logs
   - Custom policy for DynamoDB access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/Notes"
    }
  ]
}
```

## 5. Frontend Deployment to S3

1. Build the React application:
   ```
   npm run build
   ```

2. Create an S3 bucket for hosting:
   - Enable static website hosting
   - Set index.html as both index and error document
   - Configure bucket policy for public access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. Upload the build files to S3:
   ```
   aws s3 sync build/ s3://your-bucket-name
   ```

4. Access your website at the S3 website endpoint

## 6. CloudFront Setup (Optional)

1. Create a CloudFront distribution pointing to your S3 bucket
2. Configure HTTPS and caching settings
3. Set up custom domain (optional)

## 7. Environment Configuration

Update the frontend API URL:

1. Create a `.env` file in the project root:
   ```
   REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
   ```

2. Rebuild and redeploy the application

## Testing

1. Test each API endpoint using Postman or curl
2. Verify CORS is working correctly
3. Test the full application flow from the frontend

## Monitoring and Logging

- Set up CloudWatch Alarms for monitoring Lambda errors
- Review CloudWatch Logs for debugging
- Consider setting up X-Ray for tracing requests

## Security Considerations

- Implement authentication using Amazon Cognito (recommended for production)
- Use AWS WAF to protect against common web exploits
- Implement rate limiting on API Gateway
- Consider encrypting sensitive data in DynamoDB
