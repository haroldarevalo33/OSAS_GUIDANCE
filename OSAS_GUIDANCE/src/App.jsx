import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./frontend/landingpage";
import LandingPage2 from "./frontend/landingpage2";
import AdminLogin from "./frontend/adminlogin";
import AdminLogin2 from "./frontend/adminlogin2";
import StudentRegister from "./frontend/studentregister";
import StudentLogin from "./frontend/studentlogin";
import StudentHome from "./frontend/homepage/student_homepage";
import AdminHome from "./frontend/homepage/admin_homepage";
import ProtectedRoute from "./frontend/protected_route";

export default function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/student-auth" element={<LandingPage2 />} />
        <Route path="/student_register" element={<StudentRegister />} />
        <Route path="/student_login" element={<StudentLogin />} />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-login2" element={<AdminLogin2 />} />

        {/* PROTECTED */}
        <Route
          path="/student_homepage"
          element={
            <ProtectedRoute>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route path="/admin_homepage" element={<AdminHome />} />

      </Routes>
    </Router>
  );
}