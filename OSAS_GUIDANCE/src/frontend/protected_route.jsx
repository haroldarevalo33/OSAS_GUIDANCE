import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const student = localStorage.getItem("student");
  const token = localStorage.getItem("token");

  if (!student || !token) {
    return <Navigate to="/student_login" replace />;
  }

  return children;
};

export default ProtectedRoute;