import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

export default function StudentLogin() {
  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // ==================
  // LOGIN STATES
  // ==================
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");

  // ==================
  // FORGOT PASSWORD STATES (FIXED)
  // ==================
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [studentNumberForgot, setStudentNumberForgot] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFade(true);
      }, 500);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // ==================
  // LOGIN
  // ==================
  const handleLogin = async () => {
    if (!studentNumber || !password) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please enter both student number and password",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/students/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_number: studentNumber,
          password: password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.setItem(
          "student",
          JSON.stringify({
            student_number: data.student.student_number,
            student_name: data.student.student_name,
          })
        );

        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: data.message,
          confirmButtonColor: "#22c55e",
        }).then(() => {
          navigate("/student_homepage");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Invalid credentials",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Unable to connect to server",
      });
    }
  };
// ==================
// FORGOT PASSWORD (FINAL FIXED)
// ==================
const handleForgotPassword = async () => {
  if (!studentNumber || !newPass || !confirmPass) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please complete all fields",
    });
    return;
  }

  if (newPass.trim() !== confirmPass.trim()) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "New password and confirm password do not match",
    });
    return;
  }

  // REQUIRE at least 1 special character
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

  if (!specialCharRegex.test(newPass)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Password",
      text: "Password must contain at least 1 special character",
    });
    return;
  }

  if (newPass.length < 6) {
    Swal.fire({
      icon: "error",
      title: "Weak Password",
      text: "Password must be at least 6 characters",
    });
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:5000/students/forgot-password",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_number: studentNumber,
          new_password: newPass,
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: data.message,
        confirmButtonColor: "#22c55e",
      });

      setShowForgotModal(false);
      setStudentNumber("");
      setNewPass("");
      setConfirmPass("");
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Reset failed",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Cannot connect to backend",
    });
  }
};

return (
<div className="w-screen h-screen bg-gray-900 flex overflow-visible">
  {showForgotModal && (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">

      <div className="bg-white p-6 rounded-lg w-80 shadow-lg animate-fadein">

        {/* HEADER */}
        <div className="flex items-center justify-center mb-4 space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7 text-yellow-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a1.71 1.71 0 001.47 2.57h17.42A1.71 1.71 0 0022.18 18L13.71 3.86a1.71 1.71 0 00-2.97 0z"
            />
          </svg>

          <h2 className="text-xl font-bold text-gray-700">
            Reset Password
          </h2>
        </div>

        {/* STUDENT NUMBER */}
        <label className="font-semibold text-gray-700">
          Student Number
        </label>
        <input
          type="text"
          placeholder="Enter student number"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          className="border p-3 rounded-lg w-full mb-3"
        />

         {/* NEW PASSWORD */}
        <label className="font-semibold text-gray-700">
            New Password
          </label>

          <div className="relative mb-3">
            <input
              type={showNewPass ? "text" : "password"}
              placeholder="Enter new password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="border p-3 pr-10 rounded-lg w-full"
            />

            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showNewPass ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

        {/* CONFIRM PASSWORD */}
        <label className="font-semibold text-gray-700">
          Confirm Password
        </label>

        <div className="relative mb-4">
          <input
            type={showConfirmPass ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="border p-3 pr-10 rounded-lg w-full"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPass ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* BUTTONS */}
        <div className="flex justify-between mt-2">

          {/* CANCEL */}
          <button
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setShowForgotModal(false);
              setStudentNumber("");
              setNewPass("");
              setConfirmPass("");
            }}
          >
            Cancel
          </button>

          {/* SUBMIT */}
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            onClick={handleForgotPassword}
          >
            Submit
          </button>

        </div>

      </div>
    </div>
  )}

      {/* LEFT SIDE */}
      <div className="w-full md:w-[55%] h-full flex flex-col items-center justify-center p-6 bg-white">
        <img
          src="/cvsu-logo.png"
          alt="CvSU Logo"
          className="w-24 md:w-32 h-24 md:h-32 mb-4"
        />
        <h2 className="text-base md:text-xl font-medium text-center">
          Cavite State University Naic
        </h2>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Guidance Student Record
        </h1>

        <div className="flex flex-col items-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 text-black mb-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>

          <h2 className="text-2xl font-bold text-black text-center">
            Login Student Account
          </h2>
        </div>

        <div className="w-full max-w-xs space-y-3 text-left">
          <label className="font-medium text-gray-700">Student Number</label>
          <input
            type="number"
            placeholder="Enter your student number"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            className="border p-3 rounded-full w-full"
          />

          <label className="font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-3 rounded-full w-full pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <p
            className="text-sm text-green-600 font-semibold cursor-pointer text-right"
            onClick={() => setShowForgotModal(true)}
          >
            Forgot Password?
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold"
          >
            Login
          </button>

          <p className="text-center text-gray-600 mt-2">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/student_register")}
              className="text-green-600 font-semibold cursor-pointer underline"
            >
              Register here
            </span>
          </p>
        </div>
      </div>
      {/* RIGHT SIDE */}
      <div className="hidden md:block w-[100%] h-full relative">
        <img
          src="./cvsu-background.png"
          alt="Campus"
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 p-10 text-white flex flex-col justify-between">
          <p className="text-2xl leading-relaxed font-semibold text-justify tracking-wide drop-shadow-lg max-w-3xl mx-auto mt-70 animate-fadein">
            Cavite State University - Naic (CvSU) is required by law to process your personal information and sensitive personal information in order to safeguard academic freedom, uphold your right to quality education, and protect your right to data privacy in conformity with Republic Act No. 10173.
          </p>

          <div
            className={`absolute bottom-10 right-10 text-5xl font-bold tracking-widest drop-shadow-md uppercase transition-all duration-1000 ease-in-out`}
            style={{
              opacity: fade ? 0.5 : 1,
              transform: fade ? "translateX(20px)" : "translateX(0)",
            }}
          >
            {words[index]}
          </div>
        </div>
      </div>
    </div>
  );
}
