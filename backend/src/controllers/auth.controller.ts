import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthenticatedRequest, AUTH_COOKIE_NAME } from '../middleware/auth.middleware';

// Initialize Google OAuth client instance
const getGoogleClient = (): OAuth2Client => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  return new OAuth2Client(clientId);
};

/**
 * Helper to format safe public user object
 */
const formatSafeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  avatar: user.avatar || '',
  reputation: user.reputation ?? 0,
  role: user.role || 'USER',
});

/**
 * Helper to get cookie options for localhost / production
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

/**
 * POST /api/auth/google
 * Verifies Google ID token from frontend, creates/updates user in MongoDB, and issues HttpOnly JWT cookie.
 */
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Google credential is required and must be a valid token string.',
      });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('GOOGLE_CLIENT_ID is not configured in backend environment');
      res.status(500).json({
        success: false,
        message: 'Google authentication is not properly configured on the server.',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in backend environment');
      res.status(500).json({
        success: false,
        message: 'Authentication session configuration error on server.',
      });
      return;
    }

    // 1. Verify Google ID token strictly with Google's official library
    const googleClient = getGoogleClient();
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
    } catch (verifyError: any) {
      console.error('Google ID token verification failed:', verifyError.message);
      res.status(401).json({
        success: false,
        message: 'Invalid Google authentication token. Verification failed.',
      });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload received from Google.',
      });
      return;
    }

    // 2. Extract verified claims
    const { sub: googleId, email, email_verified, name, picture } = payload;

    if (!googleId) {
      res.status(401).json({
        success: false,
        message: 'Google token does not contain a valid user identity (sub claim).',
      });
      return;
    }

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Google account does not provide an email address.',
      });
      return;
    }

    if (email_verified === false) {
      res.status(403).json({
        success: false,
        message: 'Google account email is not verified. Please verify your email with Google first.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find or create user in MongoDB
    // First lookup by googleId to guarantee stable Google user identity
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with the same email (e.g., from prior mock or registration)
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Link existing user to Google ID
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        // Create new user with default reputation and role (Do not allow overriding role from input)
        user = await User.create({
          name: name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          googleId,
          avatar: picture || '',
          reputation: 0,
          role: 'USER',
        });
      }
    } else {
      // Existing user: preserve reputation and role untouched
      let changed = false;
      if (!user.avatar && picture) {
        user.avatar = picture;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    // 4. Generate Daily Bugle JWT session token
    const sessionToken = jwt.sign(
      { userId: user._id.toString() },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 5. Store JWT in HttpOnly cookie
    res.cookie(AUTH_COOKIE_NAME, sessionToken, getCookieOptions());

    // 6. Return safe public user info
    res.status(200).json({
      success: true,
      data: {
        user: formatSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user from verified HttpOnly cookie session.
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: formatSafeUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears the HttpOnly JWT session cookie.
 */
export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookieOptions = getCookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
