import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

export interface StoredEvidence {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  mimeType: string;
  originalName: string;
  size: number;
  uploadedAt: Date;
}

export class StorageService {
  private isCloudinaryConfigured: boolean = false;
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.resolve(process.cwd(), 'uploads', 'evidence');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isCloudinaryConfigured = true;
      console.log('StorageService: Cloudinary storage configured.');
    } else {
      console.log('StorageService: Cloudinary credentials not detected. Utilizing local disk storage.');
      // Ensure local upload directory exists
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    }
  }

  /**
   * Determine whether file is image, video, or generic
   */
  private getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  /**
   * Upload file buffer to Cloudinary or secure local storage
   */
  public async uploadEvidence(file: Express.Multer.File): Promise<StoredEvidence> {
    const resourceType = this.getResourceType(file.mimetype);
    const originalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const randomHex = crypto.randomBytes(8).toString('hex');

    if (this.isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'dailybugle/evidence',
            resource_type: resourceType === 'video' ? 'video' : 'auto',
          },
          (error, result) => {
            if (error || !result) {
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType,
              mimeType: file.mimetype,
              originalName,
              size: file.size,
              uploadedAt: new Date(),
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    } else {
      // Local file storage
      const ext = path.extname(originalName) || (resourceType === 'video' ? '.mp4' : '.jpg');
      const safeFilename = `${Date.now()}_${randomHex}${ext}`;
      const filePath = path.join(this.localUploadDir, safeFilename);

      await fs.promises.writeFile(filePath, file.buffer);

      const serverUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      const relativeUrl = `/uploads/evidence/${safeFilename}`;
      const fullUrl = `${serverUrl}${relativeUrl}`;

      return {
        url: fullUrl,
        publicId: `local_${safeFilename}`,
        resourceType,
        mimeType: file.mimetype,
        originalName,
        size: file.size,
        uploadedAt: new Date(),
      };
    }
  }
}

export const storageService = new StorageService();
