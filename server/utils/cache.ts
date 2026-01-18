/**
 * Calculate Cache-Control header based on current time and expiration time.
 * This is a pure function that takes both timestamps as arguments for easier testing.
 *
 * @param nowMs - Current time in milliseconds
 * @param expiresAtMs - Expiration time in milliseconds
 * @returns Cache-Control header value
 */
export function calculateCacheControlHeader(
	nowMs: number,
	expiresAtMs: number,
): string {
	const remainingSeconds = Math.max(
		0,
		Math.floor((expiresAtMs - nowMs) / 1000),
	);

	if (remainingSeconds <= 0) {
		return "no-cache";
	}

	return `public, max-age=${remainingSeconds}, immutable`;
}
