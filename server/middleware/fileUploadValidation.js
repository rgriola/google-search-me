/**
 * File Upload Validation Middleware
 * Implements strict file upload validation and security checks
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('FILE_UPLOAD');

/**
 * File upload configuration
 */
export const UPLOAD_CONFIG = {
  // File size limits (in bytes)
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 50 * 1024 * 1024, // 50MB total
  maxFiles: 20,
  
  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ],
  
  // Allowed file extensions
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'
  ],
  
  // Dangerous file patterns to reject
  dangerousPatterns: [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
    /\.py$/i,
    /\.pl$/i,
    /\.sh$/i,
    /\.bash$/i,
    /\.ps1$/i
  ],
  
  // Magic number validation for common image types
  magicNumbers: {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
    'image/bmp': [0x42, 0x4D]
  }
};

/**
 * Generate secure filename
 */
function generateSecureFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}${ext}`;
}

/**
 * Validate file extension
 */
function validateFileExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return UPLOAD_CONFIG.allowedExtensions.includes(ext);
}

/**
 * Check for dangerous file patterns
 */
function checkDangerousPatterns(filename) {
  return UPLOAD_CONFIG.dangerousPatterns.some(pattern => pattern.test(filename));
}

/**
 * Validate MIME type
 */
function validateMimeType(mimetype) {
  return UPLOAD_CONFIG.allowedMimeTypes.includes(mimetype.toLowerCase());
}

/**
 * Validate file magic numbers (file signature)
 */
function validateMagicNumbers(buffer, mimetype) {
  const expectedBytes = UPLOAD_CONFIG.magicNumbers[mimetype.toLowerCase()];
  if (!expectedBytes) {
    return true; // Skip validation if we don't have magic numbers for this type
  }
  
  if (buffer.length < expectedBytes.length) {
    return false;
  }
  
  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate image dimensions and content
 */
async function validateImageContent(filePath, mimetype) {
  try {
    // Read first few bytes to validate magic numbers
    const buffer = await fs.promises.readFile(filePath, { flag: 'r' });
    const headerBuffer = buffer.slice(0, 32); // Read first 32 bytes
    
    if (!validateMagicNumbers(headerBuffer, mimetype)) {
      logger.warn('File magic number validation failed', {
        mimetype,
        actualBytes: Array.from(headerBuffer.slice(0, 8)).map(b => '0x' + b.toString(16).toUpperCase())
      });
      return false;
    }
    
    // Additional validation could include:
    // - Image dimension limits
    // - Content scanning for embedded scripts
    // - Metadata stripping
    
    return true;
  } catch (error) {
    logger.error('Error validating image content:', { error: error.message });
    return false;
  }
}

/**
 * Custom file filter for multer
 */
function fileFilter(req, file, cb) {
  const errors = [];
  
  // Check MIME type
  if (!validateMimeType(file.mimetype)) {
    errors.push(`Invalid file type: ${file.mimetype}`);
  }
  
  // Check file extension
  if (!validateFileExtension(file.originalname)) {
    errors.push(`Invalid file extension: ${path.extname(file.originalname)}`);
  }
  
  // Check for dangerous patterns
  if (checkDangerousPatterns(file.originalname)) {
    errors.push(`Dangerous file pattern detected: ${file.originalname}`);
  }
  
  // Log security events
  if (errors.length > 0) {
    logger.security('File upload blocked', {
      filename: file.originalname,
      mimetype: file.mimetype,
      errors,
      fieldname: file.fieldname
    });
    
    return cb(new Error(errors.join('; ')), false);
  }
  
  // File passed basic validation
  logger.debug('File upload accepted', {
    filename: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });
  
  cb(null, true);
}

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Ensure upload directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

/**
 * Create multer upload middleware
 */
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.maxFileSize,
    files: UPLOAD_CONFIG.maxFiles,
    fieldSize: 1024 * 1024, // 1MB field size limit
    headerPairs: 2000
  }
});

/**
 * Middleware for additional file validation after upload
 */
export function validateUploadedFiles(req, res, next) {
  if (!req.files && !req.file) {
    return next(); // No files uploaded
  }
  
  const files = req.files ? 
    (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) :
    [req.file];
  
  // Calculate total uploaded size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  if (totalSize > UPLOAD_CONFIG.maxTotalSize) {
    logger.warn('Total upload size exceeded', {
      totalSize,
      maxSize: UPLOAD_CONFIG.maxTotalSize,
      fileCount: files.length
    });
    
    // Clean up uploaded files
    files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) logger.error('Error deleting file:', { error: err.message, path: file.path });
      });
    });
    
    return res.status(413).json({
      error: 'Total upload size too large',
      maxSize: UPLOAD_CONFIG.maxTotalSize,
      actualSize: totalSize,
      code: 'UPLOAD_SIZE_EXCEEDED'
    });
  }
  
  // Validate each file
  const validationPromises = files.map(async (file) => {
    try {
      const isValid = await validateImageContent(file.path, file.mimetype);
      if (!isValid) {
        // Delete invalid file
        await fs.promises.unlink(file.path);
        return { valid: false, filename: file.originalname, error: 'Invalid file content' };
      }
      return { valid: true, filename: file.originalname };
    } catch (error) {
      logger.error('File validation error:', { error: error.message, filename: file.originalname });
      return { valid: false, filename: file.originalname, error: error.message };
    }
  });
  
  Promise.all(validationPromises)
    .then(results => {
      const invalidFiles = results.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        logger.security('Invalid files detected and removed', {
          invalidFiles: invalidFiles.map(f => ({ filename: f.filename, error: f.error }))
        });
        
        return res.status(400).json({
          error: 'Some files failed validation',
          invalidFiles: invalidFiles.map(f => ({ filename: f.filename, error: f.error })),
          code: 'FILE_VALIDATION_FAILED'
        });
      }
      
      // All files are valid
      logger.info('File upload validation successful', {
        fileCount: files.length,
        totalSize
      });
      
      next();
    })
    .catch(error => {
      logger.error('File validation process failed:', { error: error.message });
      
      // Clean up all files on error
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) logger.error('Error deleting file:', { error: err.message, path: file.path });
        });
      });
      
      res.status(500).json({
        error: 'File validation failed',
        code: 'VALIDATION_ERROR'
      });
    });
}

/**
 * Middleware to clean up temporary files on request end
 */
export function cleanupTempFiles(req, res, next) {
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // Clean up temp files after response is sent
    if (req.files || req.file) {
      const files = req.files ? 
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) :
        [req.file];
      
      // Only clean up files that are still in temp directory
      files.forEach(file => {
        if (file.path && file.path.includes('/temp/')) {
          fs.unlink(file.path, (err) => {
            if (err && err.code !== 'ENOENT') {
              logger.debug('Temp file cleanup:', { path: file.path, error: err.message });
            }
          });
        }
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Security headers for file uploads
 */
export function setUploadSecurityHeaders(req, res, next) {
  // Prevent uploaded files from being executed
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'attachment');
  
  next();
}
