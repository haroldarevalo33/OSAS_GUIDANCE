import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon,} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_URL;

export default function StudentLogin() {
  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [studentNumberForgot, setStudentNumberForgot] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

   useEffect(() => {
   
       setFade(true);
   
       const interval = setInterval(() => {
   
         setFade(false);
   
         setTimeout(() => {
   
           setIndex((prev) => (prev + 1) % words.length);
           setFade(true);
   
         }, 1000);
   
       }, 3000);
   
       return () => clearInterval(interval);
   
     }, []);
  // ======================
  // LOGIN WITH SPINNER
  // ======================
  const handleLogin = async () => {
    if (!studentNumber || !password) {
      return Swal.fire("Warning", "Fill all fields", "warning");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/students/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_number: studentNumber,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("student", JSON.stringify(data.student));
        localStorage.setItem("token", data.token);

        Swal.fire("Login Success", "Student Login Successfully", "success").then(() => {
          navigate("/student_homepage");
        });
      } else {
        Swal.fire("Error", data.message || "Invalid credentials", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentNumberChange = (e) => {
  const value = e.target.value;

  // remove non-numbers
  const onlyNumbers = value.replace(/[^0-9]/g, "");

  setStudentNumber(onlyNumbers);
};

  // ======================
  // FORGOT PASSWORD FIXED
  // ======================
  const handleForgotPassword = async () => {
    if (!studentNumberForgot || !newPass || !confirmPass) {
      return Swal.fire("Missing", "Fill all fields", "warning");
    }

    if (newPass !== confirmPass) {
      return Swal.fire("Error", "Password mismatch", "error");
    }

    const special = /[!@#$%^&*(),.?":{}|<>]/;
    if (!special.test(newPass)) {
      return Swal.fire("Error", "Add special character", "error");
    }
      setForgotLoading(true);

    try {
      const res = await fetch(`${API}/students/forgot-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_number: studentNumberForgot,
          new_password: newPass,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", data.message, "success");
        setShowForgotModal(false);

        setStudentNumberForgot("");
        setNewPass("");
        setConfirmPass("");
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch {
      Swal.fire("Error", "Server error", "error");
        } finally {
    setForgotLoading(false);
  }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">

      {/* BACKGROUND */}
      <img
        src="./cvsu-naic.jpg.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-green-900/50 backdrop-blur-[5px]" />

      {/* LOWER RIGHT WORDS */}
          <div
            key={index}
            className={`absolute bottom-6 right-6 md:bottom-5 md:right-10
            text-white/70 text-2xl md:text-5xl font-bold tracking-[8px]
            uppercase z-20 ${fade ? "slideRight" : "fadeOnly"}`}
          >
            {words[index]}
          </div>
     {/* ANIMATIONS */}
      <style>{`

      @keyframes slideRight {

        from{
          opacity:0;
          transform:translateX(-80px);
        }

        to{
          opacity:.65;
          transform:translateX(0);
        }

      }

      @keyframes fadeOnly {

        from{
          opacity:.65;
        }

        to{
          opacity:0;
        }

      }

      .slideRight{
        animation:slideRight 1.8s ease-out forwards;
      }

      .fadeOnly{
        animation:fadeOnly 1.2s ease-out forwards;
      }

      `}</style>

      {/* LOGIN CARD */}
      <div className="relative z-10 flex items-center justify-center h-full px-5">

        <div className="w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">

          {/* HEADER */}
          <div className="flex flex-col items-center mb-4">

            <img
              src="/Cavite_State_University_(CvSU).png"
              className="w-20 h-18 mb-2"
            />

            <h2 className="text-green-200 text-sm font-semibold uppercase">
              Cavite State University Naic
            </h2>

            <h1 className="text-white text-2xl font-bold mb-2">
              Guidance Services System
            </h1>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 text-white mb-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>

            <p className="text-white text-xl font-bold">
              Student Login
            </p>
          </div>

        <input
          className="w-full mb-3 p-3 rounded-full bg-white/80"
          placeholder="Student Number"
          value={studentNumber}
          onChange={handleStudentNumberChange}
          inputMode="numeric"
          pattern="[0-9]*"
        />
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-3 rounded-full bg-white/80 pr-10"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          {/* FORGOT */}
          <p
            onClick={() => setShowForgotModal(true)}
            className="text-green-300 text-sm text-right mb-4 cursor-pointer"
          >
            Forgot Password?
          </p>

          {/* LOGIN BUTTON WITH SPINNER */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            )}

            {loading ? "Logging in..." : "LOGIN"}
          </button>

          {/* REGISTER */}
          <p className="text-white/80 mt-4 text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/student_register")}
              className="text-green-300 cursor-pointer font-semibold"
            >
              Register
            </span>
          </p>
        </div>
      </div>

     {/* FORGOT MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-80">

            <h2 className="font-bold mb-4 text-center">Reset Password</h2>

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Student Number"
              value={studentNumberForgot}
              onChange={(e) => setStudentNumberForgot(e.target.value)}
            />

            {/* NEW PASS */}
            <div className="relative mb-2">
              <input
                type={showNewPass ? "text" : "password"}
                className="w-full border p-2 rounded pr-10"
                placeholder="New Password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-2">
                {showNewPass ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-700" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-700" />
                  )}
              </button>
            </div>

            {/* CONFIRM PASS */}
            <div className="relative mb-3">
              <input
                type={showConfirmPass ? "text" : "password"}
                className="w-full border p-2 rounded pr-10"
                placeholder="Confirm Password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-2">
               {showConfirmPass ? (
                  <EyeSlashIcon className="w-5 h-5 text-gray-700" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>

            <div className="flex justify-between">

              <button
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="px-3 py-1 bg-green-600 text-white rounded flex items-center justify-center min-w-[90px]"
              >
                {forgotLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Submit"
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}