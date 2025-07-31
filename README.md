# Noter - Note-Taking Application

A simple, elegant note-taking application built with React and TypeScript. This frontend application can be hosted on AWS S3 and connects to AWS Lambda functions for backend operations.

## Features

- Create, read, update, and delete notes
- Responsive design that works on desktop and mobile
- Clean, modern user interface
- Serverless architecture using AWS services

## Project Structure

```
noter/
├── public/             # Static assets
│   └── index.html      # Main HTML file
├── src/                # Source code
│   ├── components/     # Reusable components
│   │   ├── NoteItem.tsx
│   │   └── NoteList.tsx
│   ├── models/         # TypeScript interfaces
│   │   └── Note.ts
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   └── NoteEditor.tsx
│   ├── services/       # API services
│   │   └── api.ts
│   ├── App.tsx         # Main App component
│   └── index.tsx       # Entry point
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Prerequisites

- Node.js and npm installed
- AWS account for deployment

## Local Development

1. Install Node.js and npm if not already installed
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## AWS Backend Setup

The application is designed to work with AWS Lambda functions for backend operations. You'll need to:

1. Create Lambda functions for CRUD operations
2. Set up API Gateway to expose the Lambda functions
3. Configure DynamoDB for note storage
4. Update the `REACT_APP_API_URL` environment variable with your API Gateway URL

## Deployment to S3

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to S3:
   ```
   aws s3 sync build/ s3://your-bucket-name --acl public-read
   ```

3. Configure S3 for static website hosting:
   - Enable static website hosting in S3 bucket properties
   - Set index.html as both the index and error document

4. (Optional) Set up CloudFront for CDN:
   - Create a CloudFront distribution pointing to your S3 bucket
   - Configure HTTPS and caching settings

## Environment Variables

- `REACT_APP_API_URL`: URL of your API Gateway endpoint

## License

MIT
