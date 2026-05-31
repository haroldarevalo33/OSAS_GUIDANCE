import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_URL;

export default function AdminLogin2() {
  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Fade-in effect for words
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
  // Handle login
const handleLogin = async () => {

  setLoading(true);

  // CHECK EMPTY FIELDS
  if (!email || !password) {

    setLoading(false);

    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: "Please enter both email and password",
    });

    return;
  }

  try {

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );

    const data = await res.json();

    // SUCCESS LOGIN
    if (res.ok && data.success) {

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: data.message,
        confirmButtonColor: "#22c55e",
      }).then(() => {

        // SAVE TOKEN
        localStorage.setItem(
          "token",
          data.token
        );

        // SAVE ADMIN DATA
        localStorage.setItem(
          "admin",
          JSON.stringify(data.admin)
        );

        setLoading(false);

        // REDIRECT
        navigate("/admin_homepage", {
          replace: true,
        });

      });

      return;
    }

    setLoading(false);

    // INVALID LOGIN
    if (res.status === 401) {

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Incorrect email or password",
      });

    } else {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Something went wrong",
      });

    }

  } catch (err) {

    console.error(err);

    setLoading(false);

    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Could not connect to backend",
    });

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
  {/* CENTER WRAPPER */}
  <div className="relative z-10 flex items-center justify-center w-full min-h-screen px-3 py-2">

    {/* GLASS CARD */}
    <div className="
      w-full
      max-w-[400px]
      bg-white/20
      backdrop-blur-2xl
      border border-white/20
      rounded-2xl
      shadow-xl
      p-5
    ">

      {/* HEADER */}
      <div className="flex flex-col items-center mb-4">

        <img
          src="/Cavite_State_University_(CvSU).png"
          className="w-18 h-17 mb-1"
        />

        <h2 className="text-green-200 text-lg font-medium">
          Cavite State University Naic
        </h2>

        <h1 className="text-white text-2xl font-bold mb-2">
          Guidance Services System
        </h1>

        <div className="flex flex-col items-center">

          <img
              src="/admin.png"
              className="w-10 h-10 mb-1 brightness-0 invert"
            />
          <p className="text-white text-xl font-bold text-base">
            Login Admin Account
          </p>

        </div>

      </div>

      {/* FORM */}
      <div className="space-y-3">

        <input
          type="email"
          placeholder="Enter your CvSU Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="
            w-full
            p-2.5
            rounded-full
            bg-white/80
            outline-none
            text-sm
            placeholder-gray-500
          "
        />

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full
              p-2.5
              rounded-full
              bg-white/80
              pr-10
              text-sm
              outline-none
              placeholder-gray-500
            "
          />

          <button
            type="button"
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

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`
            w-full mt-2
            text-white py-2
            rounded-full
            font-semibold text-sm
            flex items-center justify-center gap-2
            transition-all
            ${loading
              ? "bg-green-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
            }
          `}
        >

          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Logging in...
            </>
          ) : (
            "LOGIN"
          )}

        </button>

      </div>

    </div>

  </div>

</div>
);
}