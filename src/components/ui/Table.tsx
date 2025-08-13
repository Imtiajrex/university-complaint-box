import React from "react";

export const Table: React.FC<{
	className?: string;
	children: React.ReactNode;
}> = ({ className, children }) => (
	<div
		className={`relative overflow-x-auto rounded-md border border-gray-200 ${
			className || ""
		}`}
	>
		<table className="min-w-full divide-y divide-gray-200">{children}</table>
	</div>
);

export const THead: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<thead className={className}>
		<tr className="bg-gray-50">{children}</tr>
	</thead>
);

export const TH: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<th
		scope="col"
		className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
			className || ""
		}`}
	>
		{children}
	</th>
);

export const TBody: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<tbody className={`bg-white divide-y divide-gray-200 ${className || ""}`}>
		{children}
	</tbody>
);

export const TR: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => <tr className={className}>{children}</tr>;

export const TD: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => (
	<td
		className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 ${
			className || ""
		}`}
	>
		{children}
	</td>
);

export default Table;
