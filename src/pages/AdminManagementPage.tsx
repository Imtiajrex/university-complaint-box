import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import Dialog, {
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/Dialog";
import Table, { THead, TH, TBody, TR, TD } from "../components/ui/Table";
import { AdminForm, emptyAdminForm } from "../components/admin/AdminForm";

type Admin = {
	id: string;
	name: string;
	email: string;
	role: "admin";
	department?: string | null;
};

const AdminManagementPage: React.FC = () => {
	const qc = useQueryClient();
	const { data, isLoading, error } = useQuery<Admin[]>({
		queryKey: ["admins"],
		queryFn: api.listAdmins,
	});

	const createMutation = useMutation({
		mutationFn: api.createAdmin,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Partial<Admin> & { password?: string };
		}) => api.updateAdmin(id, body as any),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => api.deleteAdmin(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
	});

	// Dialog states
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState<null | string>(null); // store admin id
	const [editSeed, setEditSeed] = useState(emptyAdminForm);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
				<p className="mt-1 text-sm text-gray-600">
					Create, update, and remove admin users
				</p>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Admins</h2>
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="w-4 h-4 mr-1" /> Add Admin
					</Button>
				</div>

				<Card>
					<CardContent>
						{isLoading ? (
							<div className="text-gray-600">Loading…</div>
						) : error ? (
							<div className="text-red-600 text-sm flex items-center">
								<AlertCircle className="w-4 h-4 mr-1" />
								{(error as any).message || "Failed to load admins"}
							</div>
						) : (
							<Table>
								<THead>
									<TH>Name</TH>
									<TH>Email</TH>
									<TH>Department</TH>
									<TH className="text-right">Actions</TH>
								</THead>
								<TBody>
									{(data || []).map((a) => (
										<TR key={a.id}>
											<TD>{a.name}</TD>
											<TD>{a.email}</TD>
											<TD>{a.department || "-"}</TD>
											<TD className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														onClick={() => {
															setEditSeed({
																name: a.name,
																email: a.email,
																department: a.department || "",
															});
															setEditOpen(a.id);
														}}
													>
														Edit
													</Button>
													<Button
														variant="outline"
														onClick={async () => {
															if (!confirm(`Delete admin ${a.name}?`)) return;
															try {
																await deleteMutation.mutateAsync(a.id);
															} catch {}
														}}
													>
														<Trash2 className="w-4 h-4 mr-1" /> Delete
													</Button>
												</div>
											</TD>
										</TR>
									))}
								</TBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Create Dialog */}
			<Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
				<DialogHeader>
					<DialogTitle>Add New Admin</DialogTitle>
				</DialogHeader>
				<DialogContent>
					<AdminForm
						mode="create"
						onSubmit={async (values) => {
							try {
								await createMutation.mutateAsync({
									name: values.name,
									email: values.email,
									password: values.password || "",
									department: values.department || null,
								});
								setCreateOpen(false);
							} catch {}
						}}
						isSubmitting={createMutation.isPending}
						error={(createMutation.error as any)?.message || null}
					/>
				</DialogContent>
				<DialogFooter>
					<Button variant="outline" onClick={() => setCreateOpen(false)}>
						Cancel
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={!!editOpen} onClose={() => setEditOpen(null)}>
				<DialogHeader>
					<DialogTitle>Edit Admin</DialogTitle>
				</DialogHeader>
				<DialogContent>
					<AdminForm
						mode="edit"
						initial={editSeed}
						onSubmit={async (values) => {
							if (!editOpen) return;
							try {
								await updateMutation.mutateAsync({
									id: editOpen,
									body: {
										name: values.name,
										email: values.email,
										department: values.department || null,
										...(values.password ? { password: values.password } : {}),
									},
								});
								setEditOpen(null);
							} catch {}
						}}
						isSubmitting={updateMutation.isPending}
						error={(updateMutation.error as any)?.message || null}
					/>
				</DialogContent>
				<DialogFooter>
					<Button variant="outline" onClick={() => setEditOpen(null)}>
						Close
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	);
};

export default AdminManagementPage;
