import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Max file sizes
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/mpeg',
]);

const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.com', '.dll',
  '.js', '.mjs', '.cjs', '.ts', '.py', '.php', '.phtml', '.jsp',
  '.asp', '.aspx', '.cgi', '.pl', '.jar', '.vbs', '.wsf', '.scr'
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject executable or dangerous extensions immediately
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(new Error('Executable or script files are strictly prohibited.'));
  }

  // Validate allowed MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(
        `Unsupported file type (${file.mimetype}). Supported formats: JPEG, PNG, WEBP, GIF, MP4, WEBM, QuickTime.`
      )
    );
  }

  cb(null, true);
};

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Express wrapper to catch Multer-specific errors cleanly
 */
export const handleEvidenceUpload = (fieldName: string = 'evidence') => {
  const upload = uploadMiddleware.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds maximum allowed limit (60MB for video, 15MB for images).',
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed validation',
        });
      }
      next();
    });
  };
};
