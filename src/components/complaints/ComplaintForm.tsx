import React, { useState } from "react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useComplaints } from "../../contexts/ComplaintsContext";
import { useAuth } from "../../contexts/AuthContext";
import { ComplaintCategory, Department, ComplaintMedia } from "../../types";
import { api } from "../../lib/api";
import {
	allCategories,
	allDepartments,
	getCategoryLabel,
	getDepartmentLabel,
} from "../../data/mockData";

const ComplaintForm: React.FC = () => {
	const { user } = useAuth();
	const { addComplaint } = useComplaints();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<ComplaintCategory>("academic");
	const [department, setDepartment] = useState<Department>("computer-science");
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState("");
	const [success, setSuccess] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [media, setMedia] = useState<ComplaintMedia[]>([]);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [filesSelected, setFilesSelected] = useState<File[]>([]);

	// Form validation errors
	const [titleError, setTitleError] = useState("");
	const [descriptionError, setDescriptionError] = useState("");

	const validateForm = (): boolean => {
		let isValid = true;

		// Reset errors
		setTitleError("");
		setDescriptionError("");
		setFormError("");

		// Validate title
		if (!title.trim()) {
			setTitleError("Title is required");
			isValid = false;
		} else if (title.length < 5) {
			setTitleError("Title must be at least 5 characters");
			isValid = false;
		}

		// Validate description
		if (!description.trim()) {
			setDescriptionError("Description is required");
			isValid = false;
		} else if (description.length < 20) {
			setDescriptionError("Description must be at least 20 characters");
			isValid = false;
		}

		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			setFormError("You must be logged in to submit a complaint");
			return;
		}

		if (!validateForm()) return;

		setIsSubmitting(true);

		try {
			// Simulate network delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			addComplaint({
				title,
				description,
				category,
				department,
				status: "pending",
				studentId: user.id,
				studentName: isAnonymous ? null : user.name,
				isAnonymous,
				media,
			});

			setSuccess(true);
			setTitle("");
			setDescription("");
			setCategory("academic");
			setDepartment("computer-science");
			setIsAnonymous(false);
			setMedia([]);
			setFilesSelected([]);

			// Reset success message after a delay
			setTimeout(() => {
				setSuccess(false);
			}, 5000);
		} catch (error) {
			setFormError("Failed to submit complaint. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{formError && (
				<div className="bg-red-50 p-4 rounded-md">
					<p className="text-sm text-red-700">{formError}</p>
				</div>
			)}

			{success && (
				<div className="bg-green-50 p-4 rounded-md mb-4">
					<p className="text-sm text-green-700">
						Your complaint has been submitted successfully. You can track its
						status in the dashboard.
					</p>
				</div>
			)}

			<Input
				label="Title"
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Brief title of your complaint"
				error={titleError}
				maxLength={100}
			/>

			<Textarea
				label="Description"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				placeholder="Please provide details about your complaint..."
				error={descriptionError}
				className="min-h-[120px]"
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Select
					label="Category"
					value={category}
					onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
					options={allCategories.map((cat) => ({
						value: cat,
						label: getCategoryLabel(cat),
					}))}
				/>

				<Select
					label="Department"
					value={department}
					onChange={(e) => setDepartment(e.target.value as Department)}
					options={allDepartments.map((dept) => ({
						value: dept,
						label: getDepartmentLabel(dept),
					}))}
				/>
			</div>

			<div className="flex items-center">
				<input
					type="checkbox"
					id="anonymous"
					checked={isAnonymous}
					onChange={(e) => setIsAnonymous(e.target.checked)}
					className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
				/>
				<label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
					Submit anonymously (your name will not be visible to administrators)
				</label>
			</div>

			<Button type="submit" isLoading={isSubmitting}>
				Submit Complaint
			</Button>

			<div className="pt-4 border-t">
				<h4 className="text-sm font-medium text-gray-700 mb-2">
					Attachments (Images/Videos)
				</h4>
				<input
					type="file"
					multiple
					accept="image/*,video/*"
					onChange={(e) => {
						const files = Array.from(e.target.files || []);
						setFilesSelected(files.slice(0, 6));
					}}
					className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
				/>
				{filesSelected.length > 0 && (
					<div className="mt-2 text-xs text-gray-500">
						{filesSelected.length} file(s) selected
					</div>
				)}
				{uploadError && (
					<div className="mt-2 text-xs text-red-600">{uploadError}</div>
				)}
				<div className="mt-3 flex gap-2 flex-wrap">
					{media.map((m) => (
						<div key={m.public_id} className="relative group">
							{m.resource_type === "image" ? (
								<img
									src={m.url}
									alt="attachment"
									className="w-20 h-20 object-cover rounded border"
								/>
							) : (
								<video
									src={m.url}
									className="w-20 h-20 object-cover rounded border"
								/>
							)}
							<button
								type="button"
								onClick={() =>
									setMedia((prev) =>
										prev.filter((x) => x.public_id !== m.public_id)
									)
								}
								className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] hidden group-hover:flex items-center justify-center"
							>
								×
							</button>
						</div>
					))}
				</div>
				<div className="mt-4 flex gap-2">
					<Button
						type="button"
						variant="outline"
						isLoading={uploading}
						onClick={async () => {
							if (filesSelected.length === 0) return;
							setUploadError(null);
							setUploading(true);
							try {
								const uploaded: ComplaintMedia[] = [];
								for (const file of filesSelected) {
									if (file.size > 15 * 1024 * 1024) {
										throw new Error(`${file.name} exceeds 15MB limit`);
									}
									const resource_type = file.type.startsWith("video")
										? "video"
										: "image";
									const sig = await api.getUploadSignature(resource_type);
									const form = new FormData();
									form.append("file", file);
									form.append("api_key", sig.api_key);
									form.append("timestamp", String(sig.timestamp));
									form.append("folder", sig.folder);
									form.append("signature", sig.signature);
									// Cloudinary unsigned: use {resource_type} endpoint for videos
									const cloudUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resource_type}/upload`;
									const resp = await fetch(cloudUrl, {
										method: "POST",
										body: form,
									});
									if (!resp.ok) {
										const t = await resp.text();
										throw new Error(`Upload failed: ${t}`);
									}
									const data = await resp.json();
									uploaded.push({
										url: data.secure_url,
										public_id: data.public_id,
										resource_type: data.resource_type,
									});
								}
								setMedia((prev) => [...prev, ...uploaded].slice(0, 6));
								setFilesSelected([]);
							} catch (err: any) {
								setUploadError(err.message || "Upload failed");
							} finally {
								setUploading(false);
							}
						}}
					>
						{media.length > 0 ? "Add More Files" : "Upload Selected Files"}
					</Button>
					{media.length > 0 && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setMedia([])}
						>
							Clear Attachments
						</Button>
					)}
				</div>
			</div>
		</form>
	);
};

export default ComplaintForm;
