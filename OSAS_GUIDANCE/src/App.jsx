import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./frontend/landingpage";
import LandingPage2 from "./frontend/landingpage2";
import AdminLogin from "./frontend/adminlogin";
import AdminLogin2 from "./frontend/adminlogin2"; 
import StudentRegister from "./frontend/studentregister"; 
import StudentLogin from "./frontend/studentlogin"; 
import StudentHome from "./frontend/homepage/student_homepage"; 
import AdminHome from "./frontend/homepage/admin_homepage"; 

export default function App() {

  const student = JSON.parse(localStorage.getItem("student"));

  return (
    <Router>
      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Student Auth */}
        <Route path="/student-auth" element={<LandingPage2 />} />
        <Route path="/student_register" element={<StudentRegister />} />
        <Route path="/student_login" element={<StudentLogin />} />

        {/* Admin */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-login2" element={<AdminLogin2 />} />

        {/* STUDENT PROTECTED */}
        <Route
          path="/student_homepage"
          element={
            student ? (
              <StudentHome />
            ) : (
              <Navigate to="/student_login" replace />
            )
          }
        />

        {/* ADMIN UNPROTECTED */}
        <Route
          path="/admin_homepage"
          element={<AdminHome />}
        />

      </Routes>
    </Router>
  );
}