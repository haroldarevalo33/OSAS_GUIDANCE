import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

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
  // Check empty fields
  if (
    !studentNumber ||
    !studentName ||
    !email ||
    !phone ||
    !selectedCourse ||
    !password ||
    !confirmPassword
  ) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: "Please fill out all fields",
    });
    return;
  }

  // STUDENT NAME (NO SPECIAL CHARS)
if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(password)) {
  Swal.fire({
    icon: "error",
    title: "Invalid Password",
    text: "Password must contain letters, numbers, and at least 1 special character",
  });
  return;
}

  // PHONE (NUMBERS ONLY)
  if (!/^[0-9]+$/.test(phone)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Phone Number",
      text: "Numbers only",
    });
    return;
  }

  // Student Number Validation: must be exactly 9 digits
  if (!/^\d{9}$/.test(studentNumber)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Student Number",
      text: "Student number must be exactly 9 digits.",
    });
    return;
  }

  // CvSU Email Validation
  const cvsuEmailRegex = /^nc(\.[a-zA-Z]+){1,3}@cvsu\.edu\.ph$/;
  const normalizedEmail = email.toLowerCase();

  if (!cvsuEmailRegex.test(normalizedEmail)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Email",
      text: "Only CvSU Email Account (e.g., nc.example@cvsu.edu.ph) are allowed.",
    });
    return;
  }

if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(password)) {
  Swal.fire({
    icon: "error",
    title: "Weak Password",
    text: "Password must contain letters, numbers, and at least 1 special character",
  });
  return;
}
  // Password Match
  if (password !== confirmPassword) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "Password and Confirm Password do not match.",
    });
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: data.message,
        confirmButtonColor: "#22c55e",
      }).then(() => navigate("/student_login"));
    } else {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: data.message || "Something went wrong",
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Could not connect to backend",
    });
  }
}

  return (
    <div className="w-screen h-screen bg-gray-900 flex overflow-hidden">

      {/* LEFT SIDE */}
      <div className="w-full md:w-[55%] h-full flex flex-col items-center justify-start pt-16 md:pt-5 p-6 md:p-8 text-center bg-white overflow-auto">

        {/* LOGO */}
        <img
          src="/cvsu-logo.png"
          alt="School Logo"
          className="w-20 md:w-28 h-20 md:h-28 mb-1"
        />

        <h2 className="text-base md:text-xl font-medium">
          Cavite State University Naic
        </h2>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          Guidance Student Record
        </h1>

        {/* ICON */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-18 h-18 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
          </div>

          <p className="text-xl font-bold text-gray-800 -mt-1">
            Create Student Account
          </p>
        </div>

        {/* FORM */}
        <div className="w-full max-w-xs space-y-3 text-left">

          <label className="text-gray-700 font-medium">Student Number</label>
          <input
            type="text"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="Enter your Student Number"
            className="border p-3 rounded-full w-full focus:ring-2 focus:ring-green-500"
          />

          <label className="text-gray-700 font-medium">Student Name</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="First / Middle / Last Name"
            className="border p-3 rounded-full w-full focus:ring-2 focus:ring-green-500"
          />

          <label className="text-gray-700 font-medium">CvSU Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nc.example@cvsu.edu.ph"
            className="border p-3 rounded-full w-full focus:ring-2 focus:ring-green-500"
          />

          <label className="text-gray-700 font-medium">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="border p-3 rounded-full w-full focus:ring-2 focus:ring-green-500"
          />

          {/* COURSE */}
          <label className="font-semibold">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full"
          >
            <option value="">-- Select a Course --</option>
            {courses.map((course, i) => (
              <option key={i} value={course}>
                {course}
              </option>
            ))}
          </select>

          {/* PASSWORD */}
            <div className="space-y-1">
              <label className="text-gray-700 font-medium block">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="border p-3 rounded-full w-full pr-10 focus:ring-2 focus:ring-green-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* PASSWORD HINT */}
              <p className="text-xs text-gray-500">
                Password must contain letters, numbers, and at least 1 special character
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1">
              <label className="text-gray-700 font-medium block">
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="border p-3 rounded-full w-full focus:ring-2 focus:ring-green-500"
              />
            </div>
          {/* BUTTON */}
          <button
            onClick={handleRegister}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold"
          >
            Register
          </button>

          <p className="text-center text-gray-600 mb-10">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/student_login")}
              className="text-green-600 font-semibold cursor-pointer hover:underline"
            >
              Login here
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
            Cavite State University - Naic (CvSU) is required by law to process your
            personal information and sensitive personal information in order to
            safeguard academic freedom, uphold your right to quality education,
            and protect your right to data privacy in conformity with Republic Act
            No. 10173.
          </p>

          <div
            className="absolute bottom-10 right-10 text-5xl font-bold tracking-widest uppercase transition-all duration-1000"
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