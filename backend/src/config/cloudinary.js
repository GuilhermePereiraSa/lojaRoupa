import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lojaroupa_produtos", // Nome da pasta que será criada lá no Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"], // Formatos permitidos
    transformation: [{ width: 800, height: 800, crop: "limit" }], // Opcional: já redimensiona a imagem no upload!
  },
});

const upload = multer({ storage });

export { cloudinary, storage, upload };
