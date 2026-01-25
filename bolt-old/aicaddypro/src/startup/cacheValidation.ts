import SegmentedCacheManager from '@/src/utils/SegmentedCacheManager';
import CacheManager from '@/src/utils/cacheManager';

/**
 * runCacheValidation
 *
 * Encapsulates startup cache validation and recovery so we can call it
 * after initial UI is painted. This mirrors the previous logic from app/_layout.tsx
 * but keeps it isolated for performance and maintainability.
 */
export async function runCacheValidation(): Promise<void> {
  try {
    // Initialize the segmented cache system
    await SegmentedCacheManager.initialize();
    // Check all cache segments for integrity issues in parallel
    const [legacyValid, ...segmentResults] = await Promise.all([
      // Check original cache for backward compatibility
      CacheManager.validateCacheIntegrity(),

      // Check each segment individually
      SegmentedCacheManager.validateSegmentIntegrity('USER_PREFERENCES'),
      SegmentedCacheManager.validateSegmentIntegrity('COURSE_DATA'),
      SegmentedCacheManager.validateSegmentIntegrity('SHOT_HISTORY'),
      SegmentedCacheManager.validateSegmentIntegrity('OFFLINE_MAPS'),
    ]);

    if (!legacyValid) {
      // Clear legacy cache if needed
      try {
        await CacheManager.clearCache();
      } catch (e) {
        console.error('Failed to clear legacy cache:', e);
      }
    }

    // Handle individual segment validation results
    const segmentNames = Object.keys(SegmentedCacheManager.SEGMENT_KEYS);
    const recoveryPromises: Promise<boolean>[] = [];

    segmentResults.forEach((isValid, index) => {
      if (!isValid) {
        const segmentName = segmentNames[index] as keyof typeof SegmentedCacheManager.SEGMENT_KEYS;
        // Try to recover from backup instead of just clearing
        recoveryPromises.push(
          SegmentedCacheManager.recoverSegment(segmentName).then(recovered => {
            if (!recovered) {
              // If recovery failed, clear the segment
              return SegmentedCacheManager.clearSegment(segmentName);
            }
            return true;
          })
        );
      }
    });

    await Promise.all(recoveryPromises);
  } catch (error) {
    console.error('Error during cache validation:', error);
    // Only clear all segments as a last resort
    try {
      await SegmentedCacheManager.clearAllSegments();
    } catch (e) {
      console.error('Failed to clear all cache segments after error:', e);
    }
  }
}
