import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_api_secret',
});

// Storage for Profile Images
export const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "profile-images",
    resource_type: "image", 
    format: file.mimetype ? file.mimetype.split("/")[1] : 'jpg',
    public_id: `profile-${Date.now()}-${file.originalname ? file.originalname.split(".")[0] : 'image'}`,
  }),
});

// Storage for Resumes (Private / Authenticated delivery SEC-003)
export const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "resumes",
    resource_type: "raw",
    public_id: `resume-${Date.now()}-${file.originalname ? file.originalname.split(".")[0] : 'resume'}`,
    type: "authenticated",
    access_mode: "authenticated",
  }),
});

export { cloudinary };
