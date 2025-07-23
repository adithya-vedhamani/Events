import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  getCloudinary() {
    return cloudinary;
  }

  getStorage() {
    return multer.memoryStorage();
  }

  getUploadMiddleware() {
    return multer({ storage: this.getStorage() });
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'events',
        transformation: [
          { width: 800, height: 600, crop: 'fill' },
          { quality: 'auto' },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Failed to delete image: ${error.message}`);
    }
  }

  async uploadMultipleImages(files: Express.Multer.File[]) {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }
} 