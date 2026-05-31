import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

export default function AdminLogin2() {

  const words = ["TRUTH", "EXCELLENCE", "SERVICE", "EQUALITY"];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {

    setLoading(true);

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
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {

        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: data.message,
          confirmButtonColor: "#22c55e",
        }).then(() => {

          localStorage.setItem("token", data.token);

          localStorage.setItem(
            "admin",
            JSON.stringify(data.admin)
          );

          navigate("/admin_homepage", {
            replace: true,
          });

        });

        return;
      }

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

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Could not connect to backend",
      });

    } finally {

      setLoading(false);

    }
  };

  return (

<div className="relative min-h-screen w-full overflow-hidden flex">

  {/* BACKGROUND */}
  <img
    src="./cvsu-naic.jpg.jpg"
    alt="background"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* OVERLAY */}
  <div className="absolute inset-0 bg-green-950/55 backdrop-blur-[5px]" />

  {/* ANIMATED WORDS */}
  <div
    key={index}
    className={`absolute
      bottom-4 right-4
      sm:bottom-6 sm:right-6
      md:bottom-10 md:right-10
      text-white/60
      text-2xl md:text-5xl
      font-bold
      tracking-[4px] md:tracking-[8px]
      uppercase
      z-20
      pointer-events-none
      ${fade ? "slideRight" : "fadeOnly"}
    `}
  >
    {words[index]}
  </div>

  <style>{`

    @keyframes slideRight{

      from{
        opacity:0;
        transform:translateX(-80px);
      }

      to{
        opacity:.65;
        transform:translateX(0);
      }

    }

    @keyframes fadeOnly{

      from{
        opacity:.65;
      }

      to{
        opacity:0;
      }

    }

    .slideRight{
      animation:slideRight 1.5s ease-out forwards;
    }

    .fadeOnly{
      animation:fadeOnly 1s ease-out forwards;
    }

  `}</style>

  {/* CENTER */}
  <div className="relative z-10 flex items-center justify-center w-full min-h-screen px-4 sm:px-6 py-6">

    {/* CARD */}
    <div className="
      w-full
      max-w-md
      sm:max-w-lg
      bg-white/15
      backdrop-blur-2xl
      border border-white/20
      rounded-3xl
      shadow-2xl
      p-5 sm:p-8
    ">

      {/* HEADER */}
      <div className="flex flex-col items-center text-center">

        <img
          src="/Cavite_State_University_(CvSU).png"
          alt="CvSU"
          className="w-16 h-16 sm:w-20 sm:h-20 mb-3"
        />

        <h2 className="text-green-200 text-xs sm:text-sm md:text-base">

          Cavite State University Naic

        </h2>

        <h1 className="
          text-white
          text-xl
          sm:text-2xl
          md:text-3xl
          font-bold
          mt-1
        ">
          Guidance Services System
        </h1>

        <div className="mt-5 flex flex-col items-center">

          <img
            src="/admin.png"
            alt="admin"
            className="w-10 h-10 sm:w-12 sm:h-12 brightness-0 invert"
          />

          <p className="
            text-white
            text-sm
            sm:text-lg
            font-semibold
            mt-2
          ">
            Login Admin Account
          </p>

        </div>

      </div>

      {/* FORM */}
      <div className="mt-6 space-y-4">

        <input
          type="email"
          placeholder="Enter your CvSU Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="
            w-full
            rounded-full
            bg-white/85
            px-5
            py-3
            text-sm sm:text-base
            outline-none
            placeholder:text-gray-500
          "
        />

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="
              w-full
              rounded-full
              bg-white/85
              px-5
              py-3
              pr-14
              text-sm sm:text-base
              outline-none
            "
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-gray-600
            "
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5"/>
            ) : (
              <EyeIcon className="w-5 h-5"/>
            )}
          </button>

        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`
            w-full
            py-3
            rounded-full
            font-semibold
            text-sm sm:text-base
            text-white
            transition-all
            flex items-center justify-center gap-2
            ${
              loading
              ? "bg-green-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
            }
          `}
        >

          {loading ? (
            <>
              <div className="
                w-5 h-5
                border-2
                border-white
                border-t-transparent
                rounded-full
                animate-spin
              "></div>

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