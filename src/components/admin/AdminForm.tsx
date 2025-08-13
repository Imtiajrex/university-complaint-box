import React, { useEffect, useState } from "react";
import Input from "../ui/Input";

export type AdminFormValues = {
	name: string;
	email: string;
	password?: string;
	department?: string | null;
};

export const emptyAdminForm: AdminFormValues = {
	name: "",
	email: "",
	password: "",
	department: "",
};

export const AdminForm: React.FC<{
	initial?: Partial<AdminFormValues>;
	mode: "create" | "edit";
	onSubmit: (values: AdminFormValues) => Promise<void> | void;
	submitLabel?: string;
	isSubmitting?: boolean;
	error?: string | null;
}> = ({ initial, mode, onSubmit, submitLabel, isSubmitting, error }) => {
	const [values, setValues] = useState<AdminFormValues>({
		...emptyAdminForm,
		...(initial || {}),
	});

	useEffect(() => {
		setValues({ ...emptyAdminForm, ...(initial || {}) });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initial?.name, initial?.email, initial?.department]);

	const canSubmit =
		values.name && values.email && (mode === "edit" ? true : !!values.password);

	return (
		<div className="space-y-3">
			<Input
				placeholder="Name"
				value={values.name}
				onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
			/>
			<Input
				placeholder="Email"
				value={values.email}
				onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
			/>
			<Input
				placeholder={mode === "edit" ? "New Password (optional)" : "Password"}
				type="password"
				value={values.password || ""}
				onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
			/>
			<Input
				placeholder="Department (optional)"
				value={values.department || ""}
				onChange={(e) =>
					setValues((v) => ({ ...v, department: e.target.value }))
				}
			/>

			{error && <div className="text-red-600 text-sm">{error}</div>}

			<div className="flex justify-end">
				<button
					type="button"
					disabled={!canSubmit || isSubmitting}
					className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${
						!canSubmit || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
					}`}
					onClick={() =>
						onSubmit({ ...values, department: values.department || null })
					}
				>
					{submitLabel || (mode === "edit" ? "Save Changes" : "Create Admin")}
				</button>
			</div>
		</div>
	);
};

export default AdminForm;
