/**
 * v2026 Admin Files Upload
 * Direct upload to Supabase Storage
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendV2026Success, sendV2026Error } = require('../../../utils/response');
const { uploadFile, deleteFile, getSignedUrl } = require('../../../services/storageService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for maps/videos
});

/**
 * POST /api/v2026/admin/files/upload
 * Upload a file to storage
 * Body: file (multipart), folder (optional)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendV2026Error(res, 'No file provided', 400);
    }

    const folder = req.body.folder || 'uploads';
    const filename = `${Date.now()}_${req.file.originalname}`;
    const path = `${folder}/${filename}`;

    const url = await uploadFile(req.file.buffer, path, req.file.mimetype);

    if (!url) {
      return sendV2026Error(res, 'Failed to upload file', 500);
    }

    sendV2026Success(res, {
      url,
      path,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/files/upload-multiple
 * Upload multiple files to storage
 */
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendV2026Error(res, 'No files provided', 400);
    }

    const folder = req.body.folder || 'uploads';
    const uploaded = [];

    for (const file of req.files) {
      const filename = `${Date.now()}_${file.originalname}`;
      const path = `${folder}/${filename}`;

      const url = await uploadFile(file.buffer, path, file.mimetype);

      if (url) {
        uploaded.push({
          url,
          path,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }

    sendV2026Success(res, uploaded, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/files
 * Delete a file from storage
 * Body: path (required)
 */
router.delete('/', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return sendV2026Error(res, 'path is required', 400);
    }

    const success = await deleteFile(path);

    if (!success) {
      return sendV2026Error(res, 'Failed to delete file', 500);
    }

    sendV2026Success(res, { deleted: true, path });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/files/signed-url
 * Get a signed URL for a file
 * Body: path (required), expiresIn (optional, seconds)
 */
router.post('/signed-url', async (req, res) => {
  try {
    const { path, expiresIn } = req.body;

    if (!path) {
      return sendV2026Error(res, 'path is required', 400);
    }

    const url = await getSignedUrl(path, expiresIn || 3600);

    if (!url) {
      return sendV2026Error(res, 'Failed to generate signed URL', 500);
    }

    sendV2026Success(res, { url, expiresIn: expiresIn || 3600 });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

module.exports = router;
