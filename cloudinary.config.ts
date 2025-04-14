import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import * as multer from "multer";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log(
//   `cloudname: ${process.env.CLOUDINARY_CLOUD_NAME}, api:${process.env.CLOUDINARY_API_KEY}, secret:${process.env.CLOUDINARY_API_SECRET}`
// );

// Storage for Profile Images
export const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "profile-images",
    resource_type: "image", 
    format: file.mimetype.split("/")[1], // Keep original format
    public_id: `profile-${Date.now()}-${file.originalname.split(".")[0]}`,
  }),
});

// Storage for Resumes
export const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "resumes",
    resource_type: "raw",
    public_id: `resume-${Date.now()}-${file.originalname.split(".")[0]}`,
    access_mode: "public",
  }),
});

