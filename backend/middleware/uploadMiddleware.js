import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import AppError from '../utils/appError.js';
import { uploadDir } from '../config/paths.js';

const EXTENSION = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Configure Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir());
  },
  filename: function (req, file, cb) {
    // Random name; the extension follows the checked MIME type, never the client's file name.
    cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXTENSION[file.mimetype]}`);
  },
});

// Configure validation checks for supported image types
const fileFilter = (req, file, cb) => {
  if (EXTENSION[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG and WEBP images are allowed.', 400), false);
  }
};

// Set limits (max 5MB file sizes)
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Deletes files a request uploaded when the request is refused afterwards (wrong
// OTP, failed validation), so refused requests leave nothing in the public folder.
export const discardUploads = async (files) => {
  await Promise.all((files || []).map((f) => fs.unlink(f.path).catch(() => {})));
};

const reencode = (image, mimetype) => {
  if (mimetype === 'image/png') return image.png();
  if (mimetype === 'image/webp') return image.webp({ quality: 85 });
  return image.jpeg({ quality: 85, mozjpeg: true });
};

// Re-encodes every uploaded photo in place. sharp writes no metadata unless asked,
// so EXIF (GPS position, device, capture time), XMP and IPTC blocks are dropped.
// rotate() first applies the EXIF orientation so the photo still displays upright.
// A file that does not decode as an image is refused, whatever its MIME type said.
export const stripImageMetadata = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  try {
    for (const file of files) {
      const output = await reencode(sharp(file.path).rotate(), file.mimetype).toBuffer();
      await fs.writeFile(file.path, output);
      file.size = output.length;
    }
    next();
  } catch (err) {
    await discardUploads(files);
    next(new AppError('One of the files is not a readable image.', 400));
  }
};

// Handler to format standard Multer library errors gracefully
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size is too large. Maximum allowed size is 5MB.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field or too many files uploaded. Max limit is 3 images.', 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};

export const imagePath = (publicUrl) => path.join(uploadDir(), path.basename(publicUrl));
