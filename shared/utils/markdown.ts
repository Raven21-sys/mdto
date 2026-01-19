import yaml from "js-yaml";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const yamlHandler = (
	state: {
		patch: (from: unknown, to: unknown) => void;
		applyData: <T>(from: unknown, to: T) => T;
	},
	node: { type: "yaml"; value: string },
) => {
	let data: Record<string, unknown> | null = null;
	try {
		data = yaml.load(node.value) as Record<string, unknown>;
	} catch {
		// If parsing fails, just ignore
	}

	// biome-ignore lint/suspicious/noExplicitAny: HAST children are loosely typed
	const children: any[] = [];

	if (data && typeof data === "object") {
		for (const [key, value] of Object.entries(data)) {
			const displayValue =
				value instanceof Date ? value.toLocaleDateString() : String(value);

			children.push({
				type: "element" as const,
				tagName: "div",
				properties: { className: ["frontmatter-row"] },
				children: [
					{
						type: "element" as const,
						tagName: "div",
						properties: { className: ["frontmatter-label"] },
						children: [{ type: "text" as const, value: key }],
					},
					{
						type: "element" as const,
						tagName: "div",
						properties: { className: ["frontmatter-value"] },
						children: [{ type: "text" as const, value: displayValue }],
					},
				],
			});
		}
	}

	if (children.length === 0) {
		const result = {
			type: "text" as const,
			value: "",
		};
		state.patch(node, result);
		return state.applyData(node, result);
	}

	const result = {
		type: "element" as const,
		tagName: "div",
		properties: { className: ["frontmatter-container"] },
		children: children,
	};
	state.patch(node, result);
	return state.applyData(node, result);
};

const sanitizeSchema = {
	...defaultSchema,
	attributes: {
		...(defaultSchema.attributes || {}),
		div: [
			...(defaultSchema.attributes?.div || []),
			[
				"className",
				"frontmatter-container",
				"frontmatter-row",
				"frontmatter-label",
				"frontmatter-value",
			],
		],
	},
} as typeof defaultSchema;

/**
 * Convert Markdown text to HTML
 * @param markdown - Markdown text to convert
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkGfm)
		.use(remarkMath)
		// @ts-expect-error - Handler signature is correct but TypeScript can't infer it
		.use(remarkRehype, {
			allowDangerousHtml: true,
			handlers: { yaml: yamlHandler },
		})
		.use(rehypeRaw)
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeHighlight)
		.use(rehypeKatex)
		.use(rehypeSlug)
		.use(rehypeStringify);

	const file = await processor.process(markdown);

	return String(file);
}
