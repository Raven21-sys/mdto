import { describe, expect, it } from "vitest";
import { calculateCacheControlHeader } from "./cache";

describe("calculateCacheControlHeader", () => {
	it("should return no-cache if expiration time is in the past", () => {
		const now = new Date("2026-01-18T12:00:00Z").getTime();
		const expirationTime = now - 1000;

		expect(calculateCacheControlHeader(now, expirationTime)).toBe("no-cache");
	});

	it("should return no-cache if expiration time is exactly now", () => {
		const now = new Date("2026-01-18T12:00:00Z").getTime();

		expect(calculateCacheControlHeader(now, now)).toBe("no-cache");
	});

	it("should return correct max-age for future expiration time", () => {
		const now = new Date("2026-01-18T12:00:00Z").getTime();
		const oneHourMs = 60 * 60 * 1000;
		const expirationTime = now + oneHourMs;

		expect(calculateCacheControlHeader(now, expirationTime)).toBe(
			"public, max-age=3600, immutable",
		);
	});

	it("should return correct max-age for 1 day expiration", () => {
		const now = new Date("2026-01-18T12:00:00Z").getTime();
		const oneDayMs = 24 * 60 * 60 * 1000;
		const expirationTime = now + oneDayMs;

		expect(calculateCacheControlHeader(now, expirationTime)).toBe(
			"public, max-age=86400, immutable",
		);
	});
});
