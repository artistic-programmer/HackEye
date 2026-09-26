import { Router } from 'express';
import { googleLogin, getMe, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/google - Authenticate with Google ID token
router.post('/google', googleLogin);

// GET /api/auth/me - Retrieve current authenticated user session
router.get('/me', requireAuth, getMe);

// POST /api/auth/logout - Terminate session & clear HttpOnly cookie
router.post('/logout', logout);

export default router;
