const { getSupabase } = require('../config/supabase');
const path = require('path');

const BUCKET_NAME = 'bhagavadgita';
const PROXY_BASE_URL = 'https://sb.productmind.ru/storage/v1/object/public';

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File data
 * @param {string} filename - Original filename
 * @param {string} folder - Storage folder (e.g., 'spots', 'reviews')
 * @param {string} subfolder - Optional subfolder (e.g., entity ID)
 * @returns {string} Relative path to uploaded file
 */
async function uploadFile(fileBuffer, filename, folder, subfolder = null) {
  const supabase = getSupabase();

  // Generate unique filename
  const ext = path.extname(filename);
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${ext}`;

  // Build path
  const filePath = subfolder
    ? `${folder}/${subfolder}/${uniqueName}`
    : `${folder}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: getMimeType(ext)
    });

  if (error) throw error;

  // Return relative path (stored in DB)
  return `${BUCKET_NAME}/${filePath}`;
}

/**
 * Delete file from Supabase Storage
 * @param {string} relativePath - Path like "holyspots/spots/uuid/image.jpg"
 */
async function deleteFile(relativePath) {
  const supabase = getSupabase();

  // Remove bucket name from path if present
  const filePath = relativePath.startsWith(`${BUCKET_NAME}/`)
    ? relativePath.substring(BUCKET_NAME.length + 1)
    : relativePath;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
  return true;
}

/**
 * Get public URL for a file
 * @param {string} relativePath - Path like "bhagavadgita/uuid.mp3"
 * @returns {string} Full public URL via proxy
 */
function getPublicUrl(relativePath) {
  if (!relativePath) return null;

  // Already a full URL
  if (relativePath.startsWith('http')) return relativePath;

  return `${PROXY_BASE_URL}/${relativePath}`;
}

/**
 * Build public redirect URL for legacy /Files/* paths
 * @param {string} filePath - Filename (e.g., "uuid.mp3")
 * @returns {string} Full public URL for redirect
 */
function buildPublicRedirectUrl(filePath) {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  return `${PROXY_BASE_URL}/${BUCKET_NAME}/${cleanPath}`;
}

/**
 * Get MIME type from extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.mbtiles': 'application/octet-stream'
  };

  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = {
  uploadFile,
  deleteFile,
  getPublicUrl,
  buildPublicRedirectUrl,
  BUCKET_NAME,
  PROXY_BASE_URL
};
