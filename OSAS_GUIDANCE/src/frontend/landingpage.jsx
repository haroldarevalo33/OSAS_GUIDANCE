import React, { useState, useEffect } from "react";
import {UserIcon, ShieldCheckIcon, XMarkIcon} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {

  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showModal, setShowModal] = useState(true);

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

      {/* MAIN CARD */}
      <div className="relative z-10 flex items-center justify-center h-full px-5">

        <div className="w-full max-w-[420px] bg-white/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-7 md:p-10 text-center">

          <img
            src="/Cavite_State_University_(CvSU).png"
            alt="CvSU Logo"
            className="w-16 md:w-20 h-16 md:h-20 mx-auto mb-4 object-contain"
          />

          <p className="text-green-200 mt-1 text-lg">
            Cavite State University Naic
          </p>

          <h2 className="text-white text-2xl md:text-2xl font-bold mb-8">
            Guidance Services System
          </h2>

          <div className="space-y-4">

            <button
              onClick={() => navigate("/student-auth")}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition duration-300"
            >
              <UserIcon className="w-5 h-5" />
              STUDENT
            </button>

            <button
              onClick={() => navigate("/admin-login")}
              className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-full transition duration-300"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              ADMIN
            </button>

          </div>

        </div>

      </div>

      {/* MODAL */}
      {showModal && (

        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-5 animate-overlay">

          <div className="relative w-full max-w-[650px] bg-gray-200 border border-white/20 rounded-3xl shadow-2xl p-6 md:p-8 animate-drop">

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-black/60 hover:text-black transition"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>

            <h2 className="text-black text-xl md:text-3xl font-bold mb-6 text-center">
              Data Privacy Notice
            </h2>

            <p className="text-black leading-relaxed text-sm md:text-lg text-align">

              Cavite State University - Naic (CvSU) is required by law to
              process your personal information and sensitive personal
              information in order to safeguard academic freedom, uphold
              your right to quality education, and protect your right to
              data privacy in conformity with Republic Act No. 10173.

            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition duration-300"
            >
              I UNDERSTAND
            </button>

          </div>

        </div>

      )}

        {/* LOWER RIGHT WORDS */}
        <div
          key={index}
          className={`absolute bottom-6 right-6 md:bottom-10 md:right-10
          text-white/70 text-2xl md:text-5xl font-bold tracking-[8px]
          uppercase z-20 ${fade ? "slideRight" : "fadeOnly"}`}
        >
          {words[index]}
        </div>

      {/* CUSTOM ANIMATIONS */}
      <style>{`

        @keyframes dropIn {

          0%{
            opacity:0;
            transform:translateY(-90px) scale(.90);
          }

          100%{
            opacity:1;
            transform:translateY(0) scale(1);
          }

        }

        @keyframes overlayFade {

          from{
            opacity:0;
          }

          to{
            opacity:1;
          }

        }

        .animate-drop{
          animation:dropIn .65s cubic-bezier(.22,1,.36,1);
        }

        .animate-overlay{
          animation:overlayFade .45s ease-out;
        }

      `}</style>

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
        animation:slideRight 2s ease-out forwards;
      }

      .fadeOnly{
        animation:fadeOnly 1.5s ease-out forwards;
      }

      `}</style>

    </div>
  );
}