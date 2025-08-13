import React, { useMemo, useState } from "react";
import { useComplaints } from "../contexts/ComplaintsContext";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import Select from "../components/ui/Select";
import {
	BarChart as BarChartIcon,
	PieChart as PieChartIcon,
	TrendingUp,
	Clock,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { ComplaintCategory, ComplaintStatus, Department } from "../types";
import {
	getCategoryLabel,
	getDepartmentLabel,
	getStatusLabel,
} from "../data/mockData";

const AnalyticsPage: React.FC = () => {
	const { complaints } = useComplaints();
	const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
		"month"
	);

	// Helper: get start date for selected range
	const rangeStart = useMemo(() => {
		const now = new Date();
		const d = new Date(now);
		if (timeRange === "week") {
			d.setDate(now.getDate() - 6); // include today + previous 6 days
		} else if (timeRange === "month") {
			d.setDate(now.getDate() - 29); // last 30 days
		} else {
			d.setFullYear(now.getFullYear() - 1); // last 12 months
			d.setDate(d.getDate() + 1); // inclusive range
		}
		d.setHours(0, 0, 0, 0);
		return d;
	}, [timeRange]);

	// Filter by time range (by complaint creation time)
	const filtered = useMemo(
		() => complaints.filter((c) => c.createdAt >= rangeStart),
		[complaints, rangeStart]
	);

	// Calculate statistics based on filtered set
	const totalComplaints = filtered.length;
	const resolvedComplaints = filtered.filter(
		(c) => c.status === "resolved"
	).length;
	const pendingComplaints = filtered.filter(
		(c) => c.status === "pending"
	).length;

	// Helper: first response time in ms, or null if no responses
	const getFirstResponseMs = (c: {
		createdAt: Date;
		responses: { createdAt: Date }[];
	}) => {
		if (!c.responses || c.responses.length === 0) return null;
		const first = c.responses.reduce(
			(min, r) => (r.createdAt < min ? r.createdAt : min),
			c.responses[0].createdAt
		);
		const diff = first.getTime() - c.createdAt.getTime();
		return diff >= 0 ? diff : null;
	};

	const averageResponseTime = useMemo(() => {
		const deltas = filtered
			.map(getFirstResponseMs)
			.filter((ms): ms is number => ms !== null);
		if (deltas.length === 0) return "N/A";
		const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
		// format avg
		const minutes = Math.round(avg / 60000);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const remMin = minutes % 60;
		if (hours < 24) return `${hours}h ${remMin}m`;
		const days = Math.floor(hours / 24);
		const remH = hours % 24;
		return `${days}d ${remH}h`;
	}, [filtered]);

	// Calculate category distribution
	const categoryDistribution = filtered.reduce((acc, complaint) => {
		acc[complaint.category] = (acc[complaint.category] || 0) + 1;
		return acc;
	}, {} as Record<ComplaintCategory, number>);

	// Calculate department distribution
	const departmentDistribution = filtered.reduce((acc, complaint) => {
		acc[complaint.department] = (acc[complaint.department] || 0) + 1;
		return acc;
	}, {} as Record<Department, number>);

	// Calculate status distribution
	const statusDistribution = filtered.reduce((acc, complaint) => {
		acc[complaint.status] = (acc[complaint.status] || 0) + 1;
		return acc;
	}, {} as Record<ComplaintStatus, number>);

	// Build response time trend buckets per selected range
	type TrendBucket = { key: string; label: string; avgMs: number | null };
	const trendBuckets: TrendBucket[] = useMemo(() => {
		const buckets: TrendBucket[] = [];
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");

		if (timeRange === "week") {
			// 7 days including today
			for (let i = 6; i >= 0; i--) {
				const d = new Date(now);
				d.setDate(now.getDate() - i);
				d.setHours(0, 0, 0, 0);
				const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
					d.getDate()
				)}`;
				const label = d.toLocaleDateString(undefined, { weekday: "short" });
				buckets.push({ key, label, avgMs: null });
			}
			// aggregate
			const map = new Map(buckets.map((b) => [b.key, [] as number[]]));
			filtered.forEach((c) => {
				const d = new Date(c.createdAt);
				d.setHours(0, 0, 0, 0);
				const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
					d.getDate()
				)}`;
				const ms = getFirstResponseMs(c);
				if (map.has(key) && ms !== null) map.get(key)!.push(ms);
			});
			buckets.forEach((b) => {
				const arr = map.get(b.key) || [];
				b.avgMs = arr.length
					? arr.reduce((a, x) => a + x, 0) / arr.length
					: null;
			});
		} else if (timeRange === "month") {
			// Group into 4 roughly equal weekly buckets ending today
			const starts: Date[] = [];
			const end = new Date(now);
			end.setHours(23, 59, 59, 999);
			for (let i = 4; i >= 1; i--) {
				const start = new Date(now);
				start.setDate(now.getDate() - i * 7 + 1);
				start.setHours(0, 0, 0, 0);
				starts.push(start);
			}
			const ends: Date[] = [...starts.slice(1), end];
			for (let i = 0; i < starts.length; i++) {
				const s = starts[i];
				const e = ends[i];
				const key = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(
					s.getDate()
				)}`;
				const label = `${s.toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
				})}`;
				buckets.push({ key, label, avgMs: null });
				const arr = filtered
					.filter((c) => c.createdAt >= s && c.createdAt <= e)
					.map(getFirstResponseMs)
					.filter((ms): ms is number => ms !== null);
				buckets[buckets.length - 1].avgMs = arr.length
					? arr.reduce((a, x) => a + x, 0) / arr.length
					: null;
			}
		} else {
			// year: last 12 months, bucket by month
			for (let i = 11; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const start = new Date(d);
				const end = new Date(
					d.getFullYear(),
					d.getMonth() + 1,
					0,
					23,
					59,
					59,
					999
				);
				const key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}`;
				const label = start.toLocaleDateString(undefined, { month: "short" });
				const arr = filtered
					.filter((c) => c.createdAt >= start && c.createdAt <= end)
					.map(getFirstResponseMs)
					.filter((ms): ms is number => ms !== null);
				const avg = arr.length
					? arr.reduce((a, x) => a + x, 0) / arr.length
					: null;
				buckets.push({ key, label, avgMs: avg });
			}
		}
		return buckets;
	}, [filtered, timeRange]);

	const maxAvgMs = useMemo(() => {
		return trendBuckets.reduce(
			(m, b) => (b.avgMs && b.avgMs > m ? b.avgMs : m),
			0
		);
	}, [trendBuckets]);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">
					Analytics Dashboard
				</h1>
				<p className="mt-1 text-sm text-gray-600">
					Comprehensive overview of complaint statistics and trends
				</p>
			</div>

			{/* Time Range Selector */}
			<div className="mb-6">
				<Select
					value={timeRange}
					onChange={(e) =>
						setTimeRange(e.target.value as "week" | "month" | "year")
					}
					options={[
						{ value: "week", label: "Last 7 Days" },
						{ value: "month", label: "Last 30 Days" },
						{ value: "year", label: "Last 12 Months" },
					]}
				/>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Complaints
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{totalComplaints}
								</p>
							</div>
							<div className="p-2 bg-blue-100 rounded-full">
								<BarChartIcon className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Resolved</p>
								<p className="text-2xl font-bold text-green-600">
									{resolvedComplaints}
								</p>
							</div>
							<div className="p-2 bg-green-100 rounded-full">
								<CheckCircle className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Pending</p>
								<p className="text-2xl font-bold text-amber-600">
									{pendingComplaints}
								</p>
							</div>
							<div className="p-2 bg-amber-100 rounded-full">
								<Clock className="w-6 h-6 text-amber-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Avg. Response Time
								</p>
								<p className="text-2xl font-bold text-purple-600">
									{averageResponseTime}
								</p>
							</div>
							<div className="p-2 bg-purple-100 rounded-full">
								<TrendingUp className="w-6 h-6 text-purple-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Analytics */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Category Distribution */}
				<Card>
					<CardHeader className="flex items-center space-x-2">
						<PieChartIcon className="w-5 h-5 text-blue-600" />
						<h2 className="text-lg font-semibold">Complaints by Category</h2>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{Object.entries(categoryDistribution).map(([category, count]) => (
								<div key={category} className="flex items-center">
									<div className="w-32 text-sm text-gray-600">
										{getCategoryLabel(category as ComplaintCategory)}
									</div>
									<div className="flex-1">
										<div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="absolute h-full bg-blue-600 rounded-full"
												style={{
													width: `${
														totalComplaints
															? (count / totalComplaints) * 100
															: 0
													}%`,
												}}
											/>
										</div>
									</div>
									<div className="w-12 text-right text-sm text-gray-600">
										{count}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Department Distribution */}
				<Card>
					<CardHeader className="flex items-center space-x-2">
						<BarChartIcon className="w-5 h-5 text-green-600" />
						<h2 className="text-lg font-semibold">Complaints by Department</h2>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{Object.entries(departmentDistribution).map(
								([department, count]) => (
									<div key={department} className="flex items-center">
										<div className="w-32 text-sm text-gray-600">
											{getDepartmentLabel(department as Department)}
										</div>
										<div className="flex-1">
											<div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
												<div
													className="absolute h-full bg-green-600 rounded-full"
													style={{
														width: `${
															totalComplaints
																? (count / totalComplaints) * 100
																: 0
														}%`,
													}}
												/>
											</div>
										</div>
										<div className="w-12 text-right text-sm text-gray-600">
											{count}
										</div>
									</div>
								)
							)}
						</div>
					</CardContent>
				</Card>

				{/* Status Distribution */}
				<Card>
					<CardHeader className="flex items-center space-x-2">
						<AlertCircle className="w-5 h-5 text-purple-600" />
						<h2 className="text-lg font-semibold">Complaints by Status</h2>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{Object.entries(statusDistribution).map(([status, count]) => (
								<div key={status} className="flex items-center">
									<div className="w-32 text-sm text-gray-600">
										{getStatusLabel(status as ComplaintStatus)}
									</div>
									<div className="flex-1">
										<div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="absolute h-full bg-purple-600 rounded-full"
												style={{
													width: `${
														totalComplaints
															? (count / totalComplaints) * 100
															: 0
													}%`,
												}}
											/>
										</div>
									</div>
									<div className="w-12 text-right text-sm text-gray-600">
										{count}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Response Time Trends */}
				<Card>
					<CardHeader className="flex items-center space-x-2">
						<Clock className="w-5 h-5 text-amber-600" />
						<h2 className="text-lg font-semibold">Response Time Trends</h2>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{trendBuckets.map((b, idx) => (
								<div
									key={`${b.key}-${idx}`}
									className="flex items-center gap-3"
								>
									<div className="w-16 text-xs text-gray-600">{b.label}</div>
									<div className="flex-1">
										<div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="absolute h-full bg-amber-500 rounded-full"
												style={{
													width: `${
														maxAvgMs && b.avgMs
															? Math.max(5, (b.avgMs / maxAvgMs) * 100)
															: 0
													}%`,
												}}
											/>
										</div>
									</div>
									<div className="w-20 text-right text-xs text-gray-600">
										{b.avgMs === null
											? "N/A"
											: (() => {
													const minutes = Math.round(b.avgMs! / 60000);
													if (minutes < 60) return `${minutes}m`;
													const hours = Math.floor(minutes / 60);
													const remMin = minutes % 60;
													if (hours < 24) return `${hours}h ${remMin}m`;
													const days = Math.floor(hours / 24);
													const remH = hours % 24;
													return `${days}d ${remH}h`;
											  })()}
									</div>
								</div>
							))}
							{trendBuckets.length === 0 && (
								<div className="p-4 text-center text-gray-500">
									No data in selected range
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AnalyticsPage;
