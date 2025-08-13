import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Table, { TBody, TD, TH, THead, TR } from "../components/ui/Table";
import { AlertCircle, Trash2, Search } from "lucide-react";
import { User } from "../types";

const departments = [
	{ value: "all", label: "All Departments" },
	{ value: "computer-science", label: "Computer Science" },
	{ value: "engineering", label: "Engineering" },
	{ value: "business", label: "Business" },
	{ value: "arts", label: "Arts" },
	{ value: "sciences", label: "Sciences" },
	{ value: "student-affairs", label: "Student Affairs" },
	{ value: "facilities-management", label: "Facilities Management" },
	{ value: "it-services", label: "IT Services" },
	{ value: "other", label: "Other" },
];

const UserManagementPage: React.FC = () => {
	const qc = useQueryClient();
	const [q, setQ] = useState("");
	const [department, setDepartment] = useState("all");

	const { data, isLoading, error, refetch, isFetching } = useQuery<User[]>({
		queryKey: ["students", { q, department }],
		queryFn: () =>
			api.listStudents({
				q: q || undefined,
				department: department || undefined,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => api.deleteStudent(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
	});

	const filteredCount = data?.length ?? 0;

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">User Management</h1>
				<p className="mt-1 text-sm text-gray-600">
					Search and manage student users
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col md:flex-row md:items-end gap-3">
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Search
							</label>
							<div className="flex gap-2">
								<Input
									placeholder="Name, Email, or Student ID"
									value={q}
									onChange={(e) => setQ(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && refetch()}
								/>
								<Button onClick={() => refetch()} disabled={isFetching}>
									<Search className="w-4 h-4 mr-1" /> Search
								</Button>
							</div>
						</div>
						<div className="w-full md:w-64">
							<Select
								label="Department"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								options={departments}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="text-gray-600">Loading…</div>
					) : error ? (
						<div className="text-red-600 text-sm flex items-center">
							<AlertCircle className="w-4 h-4 mr-1" />
							{(error as any).message || "Failed to load users"}
						</div>
					) : (
						<div className="space-y-2">
							<div className="text-sm text-gray-600">
								{filteredCount} student{filteredCount === 1 ? "" : "s"} found
							</div>
							<Table>
								<THead>
									<TH>Name</TH>
									<TH>Email</TH>
									<TH>Student ID</TH>
									<TH>Department</TH>
									<TH className="text-right">Actions</TH>
								</THead>
								<TBody>
									{(data || []).map((u) => (
										<TR key={u.id}>
											<TD>{u.name}</TD>
											<TD>{u.email}</TD>
											<TD>{u.studentId || "-"}</TD>
											<TD>{u.department || "-"}</TD>
											<TD className="text-right">
												<Button
													variant="outline"
													onClick={async () => {
														if (!confirm(`Delete student ${u.name}?`)) return;
														try {
															await deleteMutation.mutateAsync(u.id);
														} catch {}
													}}
												>
													<Trash2 className="w-4 h-4 mr-1" /> Delete
												</Button>
											</TD>
										</TR>
									))}
								</TBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default UserManagementPage;
