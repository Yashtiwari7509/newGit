# Healthcare API Server

This is the backend API server for the Healthcare application.

## Local Development

### Prerequisites

- Node.js 18.x or higher
- MongoDB 5.x or higher
- npm 8.x or higher

### Setup

1. Clone the repository
2. Navigate to the server directory
3. Copy `.env.example` to `.env` and update the values:
   ```
   cp .env.example .env
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Deployment on Render

### Setup Instructions

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:

   - **Name**: healthcare-api (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose an appropriate plan (Free tier works for testing)

4. Add the following environment variables in the Render dashboard:

   - `NODE_ENV`: production
   - `PORT`: 8000 (Render will automatically assign a port, but this is used as a fallback)
   - `MONGODB_URI`: Your MongoDB connection string
   - `SECRET_TOKEN`: Your JWT secret
   - `CORS_ORIGIN`: Your frontend application URL

5. Click "Create Web Service"

### Connecting to MongoDB Atlas

For production, we recommend using MongoDB Atlas:

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster
3. Create a database user with appropriate permissions
4. Whitelist all IP addresses (0.0.0.0/0) or just Render's IPs
5. Get your connection string and add it to Render environment variables

### Monitoring

- Use the Render dashboard to monitor your application
- Check logs for any errors or issues
- Set up alerts for downtime or errors

## API Documentation

The API provides the following endpoints:

- `/api/users` - User management
- `/api/doctors` - Doctor management
- `/api/consultations` - Consultation management
- `/api/fitness` - Fitness data management
- `/api/ai` - AI-powered features
- `/api/ayushman` - Ayushman Bharat related features

## Health Check

The server provides a health check endpoint at `/` that returns the current status and environment.
