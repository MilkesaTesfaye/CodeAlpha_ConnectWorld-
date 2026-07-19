import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import env from '../config/env';
import { AppError } from './error.middleware';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || '',
  api_key: env.CLOUDINARY_API_KEY || '',
  api_secret: env.CLOUDINARY_API_SECRET || '',
});

// Allowed file types for avatars
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Multer memory storage configuration.
 * Files are stored in memory as Buffer before being uploaded to Cloudinary.
 */
const storage = multer.memoryStorage();

/**
 * File filter for avatar uploads.
 */
function fileFilter(_req: any, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400, 'INVALID_FILE_TYPE'));
  }
}

/**
 * Multer upload middleware configured for single avatar uploads.
 */
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('avatar');

/**
 * Upload a buffer to Cloudinary and return the URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'connectworld/avatars',
  resourceType: 'image' | 'raw' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new AppError('Cloudinary is not configured', 500, 'CLOUDINARY_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: resourceType,
    };

    // Only apply image transformations for image uploads
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 400, height: 400, crop: 'limit', quality: 'auto' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          const errorMsg = resourceType === 'image' ? 'Failed to upload image' : 'Failed to upload file';
          reject(new AppError(errorMsg, 500, 'UPLOAD_FAILED'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Silently fail — deletion failures are non-critical
    console.warn(`Failed to delete Cloudinary image: ${publicId}`);
  }
}
