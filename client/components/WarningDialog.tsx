import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { cn } from "../utils/styles";

interface WarningDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onLogin?: () => void;
}

export function WarningDialog({
	isOpen,
	onClose,
	onLogin,
}: WarningDialogProps) {
	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose],
	);

	const handleOverlayKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/80 z-1000 flex items-center justify-center p-2.5 backdrop-blur-sm animate-fade-in"
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="dialog"
			aria-modal="true"
		>
			<div className="bg-surface border border-border rounded-xl w-full max-w-[400px] flex flex-col shadow-dialog relative p-6">
				<div className="flex items-center justify-center mb-4">
					<div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center">
						<HugeiconsIcon
							icon={Alert01Icon}
							className="w-6 h-6 text-yellow-500"
						/>
					</div>
				</div>
				<div className="text-lg font-medium text-text-primary mb-2 text-center">
					Warning
				</div>
				<div className="text-sm text-text-secondary text-center mb-6">
					Once created, pages cannot be modified or deleted.
				</div>

				<div className="flex gap-2">
					{onLogin && (
						<button
							type="button"
							onClick={() => {
								onClose();
								onLogin();
							}}
							className={cn(
								"flex-1 bg-surface-highlight hover:bg-[#25262a] text-text-primary",
								"border border-border hover:border-text-tertiary py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
								"transition-all duration-200 flex items-center justify-center gap-2",
								"hover:scale-[1.02] active:scale-[0.98]",
							)}
						>
							Log in
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className={cn(
							onLogin ? "flex-1" : "w-full",
							"bg-primary hover:bg-[#4e5ac0] text-white",
							"border border-none py-2.5 h-10 rounded-lg text-[13px] font-medium cursor-pointer",
							"transition-all duration-200 shadow-btn flex items-center justify-center gap-2",
							"hover:scale-[1.02] active:scale-[0.98]",
						)}
					>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}
