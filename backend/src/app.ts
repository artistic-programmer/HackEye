import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRoutes from './routes/report.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();

// Configure CORS
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:5173'],
    credentials: true,
  })
);

// Enable JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Daily Bugle backend is running',
  });
});

// Report APIs
app.use('/api/reports', reportRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
