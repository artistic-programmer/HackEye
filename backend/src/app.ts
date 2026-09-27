import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import reportRoutes from './routes/report.routes';
import authRoutes from './routes/auth.routes';
import reviewerRoutes from './routes/reviewer.routes';
import incidentRoutes from './routes/incident.routes';
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

// Enable Cookie and JSON parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Daily Bugle backend is running',
  });
});

// Authentication APIs
app.use('/api/auth', authRoutes);

// Report APIs
app.use('/api/reports', reportRoutes);

// Reviewer & Verification APIs
app.use('/api/reviewer', reviewerRoutes);

// Real-World Incident APIs
app.use('/api/incidents', incidentRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
