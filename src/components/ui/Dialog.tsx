import React, { useEffect, useRef } from "react";

type DialogProps = {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
};

export const Dialog: React.FC<DialogProps> = ({
	open,
	onClose,
	children,
	className,
}) => {
	const overlayRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		if (open) {
			document.addEventListener("keydown", onKey);
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [open, onClose]);

	if (!open) return null;

	const onOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onClose();
	};

	return (
		<div
			ref={overlayRef}
			onClick={onOverlayClick}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			aria-modal="true"
			role="dialog"
		>
			<div
				className={`w-full max-w-lg rounded-lg bg-white shadow-lg ${
					className || ""
				}`}
			>
				{children}
			</div>
		</div>
	);
};

export const DialogHeader: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<div className={`px-6 py-4 border-b border-gray-200 ${className || ""}`}>
		{children}
	</div>
);

export const DialogTitle: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<h3 className={`text-lg font-semibold text-gray-900 ${className || ""}`}>
		{children}
	</h3>
);

export const DialogContent: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<div className={`px-6 py-4 ${className || ""}`}>{children}</div>
);

export const DialogFooter: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<div
		className={`px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 ${
			className || ""
		}`}
	>
		{children}
	</div>
);

export default Dialog;
