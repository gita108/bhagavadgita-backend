/**
 * Transform Supabase 'reviews' row to v2012 'Review' model
 */

/**
 * @param {object} review - Supabase reviews row
 * @param {object[]} photos - Array of review photos
 * @returns {object} v2012 Review model
 */
function transformReviewToV2012(review, photos = []) {
  return {
    id: review.id,
    spotId: review.spot_id,
    rate: review.rate || 5,
    text: review.text || '',
    date: review.date ? Math.floor(new Date(review.date).getTime() / 1000) : 0,
    isDeleted: review.is_deleted || false,
    isMine: review.is_mine || false,
    photos: photos.map(photo => ({
      id: photo.id,
      photo: photo.photo
    }))
  };
}

/**
 * Transform array of reviews
 */
function transformReviewsToV2012(reviews, photosMap = {}) {
  return reviews.map(review => {
    const photos = photosMap[review.id] || [];
    return transformReviewToV2012(review, photos);
  });
}

module.exports = {
  transformReviewToV2012,
  transformReviewsToV2012
};
