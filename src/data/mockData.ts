import {
	User,
	Complaint,
	ComplaintStatus,
	ComplaintCategory,
	Department,
} from "../types";

export const getCategoryLabel = (category: ComplaintCategory): string => {
	const labels: Record<ComplaintCategory, string> = {
		academic: "Academic",
		administrative: "Administrative",
		facilities: "Facilities",
		technical: "Technical",
		other: "Other",
	};
	return labels[category];
};

export const getDepartmentLabel = (department: Department): string => {
	const labels: Record<Department, string> = {
		"computer-science": "Computer Science",
		engineering: "Engineering",
		business: "Business",
		arts: "Arts",
		sciences: "Sciences",
		"student-affairs": "Student Affairs",
		"facilities-management": "Facilities Management",
		"it-services": "IT Services",
		other: "Other",
	};
	return labels[department];
};

export const getStatusLabel = (status: ComplaintStatus): string => {
	const labels: Record<ComplaintStatus, string> = {
		pending: "Pending",
		"under-review": "Under Review",
		"in-progress": "In Progress",
		resolved: "Resolved",
		rejected: "Rejected",
	};
	return labels[status];
};

export const getStatusColor = (status: ComplaintStatus): string => {
	const colors: Record<ComplaintStatus, string> = {
		pending: "bg-amber-100 text-amber-800 border-amber-300",
		"under-review": "bg-blue-100 text-blue-800 border-blue-300",
		"in-progress": "bg-purple-100 text-purple-800 border-purple-300",
		resolved: "bg-green-100 text-green-800 border-green-300",
		rejected: "bg-red-100 text-red-800 border-red-300",
	};
	return colors[status];
};

export const allCategories: ComplaintCategory[] = [
	"academic",
	"administrative",
	"facilities",
	"technical",
	"other",
];

export const allDepartments: Department[] = [
	"computer-science",
	"engineering",
	"business",
	"arts",
	"sciences",
	"student-affairs",
	"facilities-management",
	"it-services",
	"other",
];

export const allStatuses: ComplaintStatus[] = [
	"pending",
	"under-review",
	"in-progress",
	"resolved",
	"rejected",
];
