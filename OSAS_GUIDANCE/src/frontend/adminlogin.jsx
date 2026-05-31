import React, { useState, useEffect } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {

  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

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

  return (

    <div className="relative w-screen h-screen overflow-hidden">

      {/* BACKGROUND */}
      <img
        src="./cvsu-naic.jpg.jpg"
        alt="Campus"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-green-900/50 backdrop-blur-[6px]" />

      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full z-30 bg-black/20 backdrop-blur-md border-b border-white/10">
      </header>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex items-center justify-center h-full px-5">

        {/* GLASS CARD */}
        <div className="w-full max-w-[430px] bg-white/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-7 md:p-10 text-center">

          {/* LOGO */}
          <img
            src="/Cavite_State_University_(CvSU).png"
            alt="CvSU Logo"
            className="w-16 md:w-20 h-16 md:h-20 mx-auto mb-4 object-contain"
          />

          {/* SCHOOL */}
          <p className="text-green-200 mt-1 text-sm md:text-base">
            Cavite State University Naic
          </p>

          {/* SYSTEM */}
          <h2 className="text-white text-2xl md:text-2xl font-bold mb-2">
            Guidance Services System
          </h2>

          {/* WELCOME */}
          <p className="text-white/85 text-lg md:text-xl font-semibold mb-8">
            Welcome, ADMIN
          </p>

          {/* BUTTON */}
          <button
            onClick={() => navigate("/admin-login2")}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition duration-300 shadow-lg"
          >
            <ShieldCheckIcon className="w-5 h-5"/>
            LOGIN ADMIN ACCOUNT
          </button>

        </div>

      </div>

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

    </div>

  );
}