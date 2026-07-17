/**
 * v2012 Reviews Routes
 * GET /api/Data/GetReviews
 * POST /api/Data/AddReview
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../../config/supabase');
const { transformReviewsToV2012, transformReviewToV2012 } = require('../../transformers/v2012/reviewTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');
const { uploadFile } = require('../../services/storageService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * GET /api/Data/GetReviews
 * Returns reviews for a specific spot
 * Query params: spotId (required)
 */
router.get('/GetReviews', async (req, res) => {
  try {
    const { spotId } = req.query;

    if (!spotId) {
      return sendV2012Error(res, 'spotId is required');
    }

    // Fetch reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('spot_id', spotId)
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) {
      console.error('GetReviews error:', error);
      return sendV2012Error(res, 'Failed to fetch reviews');
    }

    // Fetch photos for all reviews
    const reviewIds = (reviews || []).map(r => r.id);
    let photosMap = {};

    if (reviewIds.length > 0) {
      const { data: photos } = await supabase
        .from('review_photos')
        .select('*')
        .in('review_id', reviewIds);

      if (photos) {
        photos.forEach(photo => {
          if (!photosMap[photo.review_id]) {
            photosMap[photo.review_id] = [];
          }
          photosMap[photo.review_id].push(photo);
        });
      }
    }

    const transformedReviews = transformReviewsToV2012(reviews || [], photosMap);
    sendV2012Success(res, transformedReviews);
  } catch (err) {
    console.error('GetReviews exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

/**
 * POST /api/Data/AddReview
 * Add a new review with optional photos
 * Body: spotId, rate, text
 * Files: photos (optional, multipart)
 */
router.post('/AddReview', upload.array('photos', 5), async (req, res) => {
  try {
    const { spotId, rate, text, deviceId } = req.body;

    if (!spotId) {
      return sendV2012Error(res, 'spotId is required');
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        spot_id: spotId,
        rate: parseInt(rate) || 5,
        text: text || '',
        date: new Date().toISOString(),
        device_id: deviceId || null,
        is_deleted: false
      })
      .select()
      .single();

    if (error) {
      console.error('AddReview error:', error);
      return sendV2012Error(res, 'Failed to add review');
    }

    // Upload photos if provided
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const path = `reviews/${review.id}/${Date.now()}_${file.originalname}`;
        const uploadedUrl = await uploadFile(file.buffer, path, file.mimetype);

        if (uploadedUrl) {
          const { data: photo } = await supabase
            .from('review_photos')
            .insert({
              review_id: review.id,
              photo: uploadedUrl
            })
            .select()
            .single();

          if (photo) {
            photos.push(photo);
          }
        }
      }
    }

    const transformedReview = transformReviewToV2012(review, photos);
    sendV2012Success(res, transformedReview);
  } catch (err) {
    console.error('AddReview exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
