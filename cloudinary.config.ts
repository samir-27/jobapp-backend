import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as multer from 'multer';
import * as dotenv from 'dotenv';
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(`cloudname: ${process.env.CLOUDINARY_CLOUD_NAME},api:${process.env.CLOUDINARY_API_KEY},secret:${process.env.CLOUDINARY_API_SECRET}`)

export const storage = new CloudinaryStorage({
  cloudinary,
  params: () => ({
    folder: 'user-profiles', // Correct way to specify folder
    format: 'png', // or 'jpeg', 'jpg'
    public_id: (req, file) => file.originalname.split('.')[0], // Optional: Keep original name
  }),
});

export const upload = multer({ storage });
