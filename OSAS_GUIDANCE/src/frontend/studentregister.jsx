import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

 const API = import.meta.env.VITE_API_URL;

export default function StudentRegister() {
  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Input states
  const [studentNumber, setStudentNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ================= Course List =================
  const courses = [
    "Bachelor of Elementary Education",
    "Bachelor of Secondary Education",
    "BS Business Management",
    "BS Computer Science",
    "BS Fisheries",
    "BS Hospitality Management (formerly BS Hotel and Restaurant Management)",
    "BS Information Technology",
    "Basic Seaman Training Course"
  ];

  // Word fade effect
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

 // =========================
// Handle registration
// =========================
const handleRegister = async () => {

  if (loading) return; // prevent double click

  setLoading(true);

  try {

    // EMPTY FIELDS
    if (
      !studentNumber ||
      !studentName ||
      !email ||
      !phone ||
      !selectedCourse ||
      !password ||
      !confirmPassword
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill out all fields",
      });
      return;
    }

    // PASSWORD VALIDATION
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;

    if (!passwordRegex.test(password)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Password",
        text: "Password must contain letters, numbers, and at least 1 special character",
      });
      return;
    }

    // PHONE VALIDATION
    if (!/^\d+$/.test(phone)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Numbers only",
      });
      return;
    }

    if (phone.length !== 11) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Phone number must be exactly 11 digits",
      });
      return;
    }

    // STUDENT NUMBER
    if (!/^\d{9}$/.test(studentNumber)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Student Number",
        text: "Student number must be exactly 9 digits.",
      });
      return;
    }

    // EMAIL VALIDATION
    const normalizedEmail = email.trim().toLowerCase();

    const cvsuEmailRegex =
      /^([a-zA-Z]+(\.[a-zA-Z]+){1,3})@cvsu\.edu\.ph$/;

    if (!cvsuEmailRegex.test(normalizedEmail)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Only CvSU Email Account are allowed.",
      });
      return;
    }

    // PASSWORD MATCH
    if (password !== confirmPassword) {
      await Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "Password and Confirm Password do not match.",
      });
      return;
    }

    // API REQUEST
    const res = await fetch(`${API}/students/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_number: studentNumber,
        student_name: studentName,
        email: normalizedEmail,
        phone,
        course: selectedCourse,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    await Swal.fire({
      icon: "success",
      title: "Registration Successful",
      text: data.message,
      confirmButtonColor: "#22c55e",
    });

    navigate("/student_login");

  } catch (err) {

    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: err.message || "Could not connect to backend",
    });

  } finally {

    setLoading(false);

  }
};

return (
  <div className="relative w-screen h-screen overflow-hidden flex">

    {/* BACKGROUND */}
    <img
      src="./cvsu-naic.jpg.jpg"
      className="absolute inset-0 w-full h-full object-cover"
    />

    {/* OVERLAY */}
    <div className="absolute inset-0 bg-green-900/50 backdrop-blur-[6px]" />

  {/* LOWER RIGHT WORDS */}
        <div
          key={index}
          className={`absolute bottom-6 right-6 md:bottom-10 md:right-10
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
    {/* CENTER WRAPPER (RESPONSIVE COMPACT) */}
    <div className="relative z-10 flex items-center justify-center w-full min-h-screen px-3 py-2">

      {/* GLASS CARD (SLIGHTLY SMALLER HEIGHT) */}
      <div className="
        w-full 
        max-w-[400px] 
        bg-white/20 
        backdrop-blur-2xl 
        border border-white/20 
        rounded-2xl 
        shadow-xl 
        p-4
        max-h-[92vh]
        overflow-hidden
      ">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-2">

          <img
            src="/Cavite_State_University_(CvSU).png"
            className="w-18 h-17 mb-1"
          />

          <h2 className="text-green-200 text-sm font-medium">
            Cavite State University Naic
          </h2>

          <h1 className="text-white text-xl font-bold mb-1">
            Guidance Services System
          </h1>

          <div className="flex flex-col items-center mb-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-9 h-9 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            </div>

            <p className="text-white font-bold text-m">
              Create Student Account
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-2">

          <input
            className="w-full p-2 rounded-full bg-white/80 outline-none text-sm"
            placeholder="Student Number"
            type="number"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
          />

          <input
            className="w-full p-2 rounded-full bg-white/80 text-sm"
            placeholder="First Name / Middle Initial / Last Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            className="w-full p-2 rounded-full bg-white/80 text-sm"
            placeholder="CvSU Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />

          <input
            className="w-full p-2 rounded-full bg-white/80 text-sm"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="number"
          />

          <select
            className="w-full p-2 rounded-full bg-white/80 text-sm"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {courses.map((c, i) => (
              <option key={i}>{c}</option>
            ))}
          </select>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 rounded-full bg-white/80 pr-10 text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* PASSWORD HINT */}
        <div className="mt-2 flex items-start gap-2 text-[10px] text-white/80">
          <div className="mt-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="leading-snug">
            Password must contain{" "}
            <span className="text-green-300 font-medium">letters</span>,{" "}
            <span className="text-green-300 font-medium">numbers</span>, and{" "}
            <span className="text-yellow-300 font-medium">1 special character</span>
          </p>
        </div>


          {/* CONFIRM PASSWORD */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full p-2 rounded-full bg-white/80 pr-10 text-sm"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2 text-gray-600"
            >
              {showConfirm ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>
        {/* BUTTON */}
          <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full mt-2 text-white py-2 rounded-full font-semibold text-sm
          flex items-center justify-center gap-2 transition-all
          ${loading
            ? "bg-green-500 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Registering...
            </>
          ) : (
            "REGISTER"
          )}
        </button>

        <p className="text-center text-white text-xs mt-1">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/student_login")}
            className="text-green-300 font-bold cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
    </div>
    );
    }