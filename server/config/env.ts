import { z } from "zod";

const envSchema = z
	.object({
		TURNSTILE_SECRET_KEY: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(1),
		BETTER_AUTH_URL: z.string().min(1),
		GITHUB_CLIENT_ID: z.string().min(1),
		GITHUB_CLIENT_SECRET: z.string().min(1),
	})
	.loose();

export function validateEnv(env: unknown) {
	return envSchema.parse(env);
}
