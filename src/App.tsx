// React import not necessary with new JSX transform
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ComplaintsProvider } from "./contexts/ComplaintsContext";

// Layouts
import AuthLayout from "./components/layout/AuthLayout";
import AppLayout from "./components/layout/AppLayout";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import HelpPage from "./pages/HelpPage";
import AdminManagementPage from "./pages/AdminManagementPage";
import UserManagementPage from "./pages/UserManagementPage";

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<ComplaintsProvider>
					<Routes>
						{/* Public routes */}
						<Route path="/" element={<HomePage />} />
						<Route element={<AuthLayout />}>
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />
						</Route>

						{/* Protected routes */}
						<Route element={<AppLayout />}>
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/new-complaint" element={<NewComplaintPage />} />
							<Route path="/analytics" element={<AnalyticsPage />} />
							<Route
								path="/admin-management"
								element={<AdminManagementPage />}
							/>
							<Route path="/user-management" element={<UserManagementPage />} />
							<Route path="/profile" element={<ProfilePage />} />
							<Route path="/settings" element={<ProfilePage />} />
							<Route path="/help" element={<HelpPage />} />
						</Route>

						{/* 404 */}
						<Route path="*" element={<NotFoundPage />} />
					</Routes>
				</ComplaintsProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
