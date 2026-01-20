import { createHtmlPage } from "@shared/templates/view.template";
import { markdownToHtml } from "@shared/utils/markdown";
import { useEffect, useMemo, useRef, useState } from "react";

interface UsePreviewProps {
	file: File;
	theme: string;
	expirationDays: number;
}

export function usePreview({ file, theme, expirationDays }: UsePreviewProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const themeName = useMemo(
		() => theme.charAt(0).toUpperCase() + theme.slice(1),
		[theme],
	);

	useEffect(() => {
		let isCancelled = false;
		const iframe = iframeRef.current;

		const handleLoad = () => {
			if (!isCancelled) {
				// Use double requestAnimationFrame to ensure the browser has completed
				// at least one full layout and paint cycle. This prevents flickering
				// by making sure the content is actually rendered on screen before
				// we hide the loading indicator.
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						if (!isCancelled) {
							setLoading(false);
						}
					});
				});
			}
		};

		const renderPreview = async () => {
			try {
				setLoading(true);
				const markdown = await file.text();
				if (isCancelled) return;

				const { html } = await markdownToHtml(markdown);
				const expirationTime =
					Date.now() + expirationDays * 24 * 60 * 60 * 1000;
				const previewHtml = createHtmlPage({
					title: `Preview - ${themeName}`,
					expiresAt: expirationTime.toString(),
					html,
					theme,
					markdown,
				});

				if (iframe) {
					const iframeDoc =
						iframe.contentDocument || iframe.contentWindow?.document;
					if (iframeDoc) {
						iframe.addEventListener("load", handleLoad, { once: true });

						iframeDoc.open();
						iframeDoc.write(previewHtml);
						iframeDoc.close();
					} else {
						setLoading(false);
					}
				} else {
					setLoading(false);
				}
			} catch (err) {
				if (!isCancelled) {
					setError(err instanceof Error ? err.message : "Unknown error");
					setLoading(false);
				}
			}
		};

		setLoading(true);
		renderPreview();

		return () => {
			isCancelled = true;
			if (iframe) {
				iframe.removeEventListener("load", handleLoad);
			}
		};
	}, [file, theme, themeName, expirationDays]);

	return {
		loading,
		error,
		iframeRef,
		themeName,
	};
}
