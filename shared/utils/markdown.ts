import yaml from "js-yaml";
import type { Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
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
import { visit } from "unist-util-visit";

export interface MarkdownMetadata {
	title?: string;
	description?: string;
}

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3).trim()}...`;
}

export interface MarkdownResult {
	html: string;
	metadata: MarkdownMetadata;
}

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
 * Remark plugin to extract metadata from AST
 * Extracts: frontmatter title/description, first heading, first paragraph
 */
function remarkExtractMetadata(metadata: MarkdownMetadata) {
	return (tree: Root) => {
		let foundHeading = false;
		let foundParagraph = false;

		visit(tree, (node) => {
			// Extract from frontmatter (yaml)
			if (node.type === "yaml") {
				try {
					const data = yaml.load(node.value as string) as Record<
						string,
						unknown
					>;
					if (data && typeof data === "object") {
						if (typeof data.title === "string") {
							metadata.title = data.title;
						}
						if (typeof data.description === "string") {
							metadata.description = data.description;
						}
					}
				} catch {
					// Ignore parsing errors
				}
			}

			// Fallback: first heading for title
			if (!metadata.title && !foundHeading && node.type === "heading") {
				metadata.title = truncate(mdastToString(node), MAX_TITLE_LENGTH);
				foundHeading = true;
			}

			// Fallback: first paragraph for description
			if (
				!metadata.description &&
				!foundParagraph &&
				node.type === "paragraph"
			) {
				metadata.description = truncate(
					mdastToString(node),
					MAX_DESCRIPTION_LENGTH,
				);
				foundParagraph = true;
			}
		});
	};
}

/**
 * Convert Markdown text to HTML with metadata extraction
 * @param markdown - Markdown text to convert
 * @returns HTML string and extracted metadata
 */
export async function markdownToHtml(
	markdown: string,
): Promise<MarkdownResult> {
	const metadata: MarkdownMetadata = {};

	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkGfm)
		.use(() => remarkExtractMetadata(metadata))
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

	return {
		html: String(file),
		metadata,
	};
}
