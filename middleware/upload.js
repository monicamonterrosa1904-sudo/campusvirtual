const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const esVideo = ['mp4','webm','avi','mov'].includes(ext);
    return {
      folder: 'campusvirtual',
      resource_type: esVideo ? 'video' : 'raw',
      public_id: `${Date.now()}-${file.originalname.replace(/\s/g,'_')}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

module.exports = { upload, cloudinary };
