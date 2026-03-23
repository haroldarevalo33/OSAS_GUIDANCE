

import React, { useState, useEffect } from "react";
import {Squares2X2Icon, UserCircleIcon, ArrowRightOnRectangleIcon, NewspaperIcon, DocumentCheckIcon, BellIcon, BookOpenIcon, Bars3Icon, XMarkIcon,} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

export default function StudentHome() {
  // Page + data states
  const [activePage, setActivePage] = useState("Info");
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Small states
  const [violation, setViolation] = useState("—");
  const [section, setSection] = useState("—");
  const [lastVisit, setLastVisit] = useState("—");
  const [visits, setVisits] = useState(0);

  // Modals / previews
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [violationHistory, setViolationHistory] = useState([]);
  const [accountModal, setAccountModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  // Good moral / notifications
  const [goodMoralRequested, setGoodMoralRequested] = useState(false);
  const [goodMoralApproved, setGoodMoralApproved] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null); // for modal

  // Rules preview
  const [currentRules, setCurrentRules] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Responsive sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // News
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // load student from localstorage
  const rawStudent = localStorage.getItem("student");
  let studentData = {};
  try {
    studentData = rawStudent ? JSON.parse(rawStudent) : {};
  } catch {
    studentData = {};
  }
  const studentNumber = studentData.student_number || null;
  const fallbackName = studentData.student_name || "Student";
  

  // ---------------------------
  // Effects: fetch news (when News active)
  useEffect(() => {
    if (activePage !== "News") return;
    let intervalId;
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/news");
        const data = await res.json();
        if (data.status === "ok") setNewsArticles(data.articles || []);
        else setNewsArticles([]);
      } catch (err) {
        console.error("Error fetching news:", err);
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
    intervalId = setInterval(fetchNews, 60000);
    return () => clearInterval(intervalId);
  }, [activePage]);

  // Fetch student record
  useEffect(() => {
    if (!studentNumber) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:5000/students/by-number/${studentNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile_pic && !data.profile_pic.startsWith("http")) {
          data.profile_pic = `http://localhost:5000/uploads/${data.profile_pic}`;
        }
        setStudentRecord(data);
        setLoading(false);
        localStorage.setItem(
          "student",
          JSON.stringify({ ...studentData, profile_pic: data.profile_pic })
        );
      })
      .catch(() => setLoading(false));
  }, [activePage, studentNumber]);

  // Fetch summary
  useEffect(() => {
    if (!studentNumber) return;
    async function fetchSummary() {
      try {
        const res = await fetch(
          `http://localhost:5000/violations/summary/${studentNumber}`
        );
        const data = await res.json();
        setViolation(data.predicted_violation ?? "—");
        setSection(data.predicted_section ?? "—");
        setLastVisit(data.violation_date ?? "—");
        setVisits(data.visits ?? 0);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSummary();
  }, [studentNumber]);

  // History modal loader
  async function openHistoryModal() {
    try {
      const res = await fetch(
        `http://localhost:5000/violations/history/${studentNumber}`
      );
      const data = await res.json();
      setViolationHistory(data || []);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }

  // Profile upload
  async function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const res = await fetch(
        `http://localhost:5000/students/${studentNumber}/profile-pic`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (res.ok) {
        setAccountModal(false);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Profile Updated Successfully!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        const updatedProfilePic = data.profile_pic
          ? `http://localhost:5000/uploads/${data.profile_pic}`
          : studentRecord?.profile_pic;

        setStudentRecord((prev) => ({ ...prev, profile_pic: updatedProfilePic }));
        localStorage.setItem(
          "student",
          JSON.stringify({ ...studentData, profile_pic: updatedProfilePic })
        );
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: data.message || "Update Failed",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Unable to update profile picture",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  }

  const getProfileImage = () => {
    if (profilePreview) return profilePreview;
    if (studentRecord?.profile_pic) {
      if (studentRecord.profile_pic.startsWith("http")) return studentRecord.profile_pic;
      return `http://localhost:5000/uploads/${studentRecord.profile_pic}`;
    }
    return null;
  };

 
  // Fetch rules file from backend on mount
  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch("http://localhost:5000/file/list");
        const data = await res.json();
        const rulesFile = (data.files || []).find((f) => f.file_type === "rules");
        if (rulesFile) {
          setCurrentRules({
            name: rulesFile.original,
            url: `http://localhost:5000/file/download/${rulesFile.stored}`,
          });
        } else {
          setCurrentRules(null);
        }
      } catch (err) {
        console.error("Error fetching rules:", err);
        setCurrentRules(null);
      }
          }
    fetchRules();
  }, []);
// -------------------
// Fetch Good Moral file from backend
// -------------------
const [currentGoodMoral, setCurrentGoodMoral] = useState(null);

useEffect(() => {
  const fetchGoodMoralFile = async () => {
    try {
      const studentNumber = "123456"; // palitan ng actual student number
      const res = await fetch(`http://localhost:5000/good-moral/history?student_number=${studentNumber}`);
      if (!res.ok) throw new Error("Failed to fetch history");

      const data = await res.json();

      // Filter approved requests
      const approved = data.filter(r => r.status === "Approved");

      if (approved.length > 0) {
        const latest = approved[0]; // latest approved
        setCurrentGoodMoral({
          name: latest.filename_original,
          url: `http://localhost:5000/good-moral/download/${latest.request_id}`,
        });
      }
    } catch (err) {
      console.error("Error fetching Good Moral file:", err);
    }
  };

  fetchGoodMoralFile();
}, []);
// -------------------------
// Good Moral Functions
// -------------------------

const API_BASE = "http://localhost:5000"; // <-- Flask backend URL

// =========================
// SUBMIT REQUEST
// =========================
const submitGoodMoralRequest = async (file) => {
  try {
    if (!studentNumber) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Student number is missing",
      });
      return;
    }

    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a file to upload",
      });
      return;
    }

    const formData = new FormData();
    formData.append("student_number", studentNumber);
    formData.append("certificate_file", file);

    const res = await fetch(`${API_BASE}/good-moral/request`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to submit request");
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Good Moral request submitted",
      showConfirmButton: false,
      timer: 2000,
    });

    // Immediately fetch latest request after submit
    fetchLatestGoodMoral();

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Something went wrong",
    });
  }
};

// =========================
// FETCH LATEST REQUEST
// =========================
const fetchLatestGoodMoral = async () => {
  if (!studentNumber) return;

  try {
    const res = await fetch(`${API_BASE}/good-moral/history?student_number=${studentNumber}`);
    const requests = await res.json();

    setStudentRecord((prev) => {
      const latest = requests.length > 0 ? requests[0] : null;

      // Avoid unnecessary re-render if same request
      if (prev.lastGoodMoralRequest?.request_id === latest?.request_id) {
        return prev;
      }

      return { ...prev, lastGoodMoralRequest: latest };
    });

  } catch (err) {
    console.error("Fetch error:", err);
  }
};


// =========================
// AUTO FETCH ON PAGE LOAD
// =========================
useEffect(() => {
  if (!studentNumber) return;

  // Same style as student record fetch
  fetchLatestGoodMoral();

}, [studentNumber]);

// =========================
// OPTIONAL LIGHT POLLING
// =========================
useEffect(() => {
  if (!studentNumber) return;

  const interval = setInterval(() => {
    // Only fetch if tab is active (low-spec friendly)
    if (document.visibilityState === "visible") {
      fetchLatestGoodMoral();
    }
  }, 1000); // every 10s, adjust if needed

  return () => clearInterval(interval);

}, [studentNumber]);

// -----------------------
// FETCH NOTIFICATIONS + HISTORY
// -----------------------
const POLL_INTERVAL = 5000; // 5 seconds

const fetchNotifications = async () => {
  if (!studentNumber) return;

  try {
    //  Fetch new notifications
    const notifRes = await fetch(
      `http://localhost:5000/good-moral/student/notifications?student_number=${studentNumber}`,
      { headers: { Accept: "application/json" } }
    );
    if (!notifRes.ok) throw new Error(`Failed to fetch notifications: ${notifRes.status}`);
    const notifData = await notifRes.json();

    const newNotifs = Array.isArray(notifData)
      ? notifData.map(n => ({
          request_id: n.request_id,
          status: n.status,
          message: n.message,
          is_new: true,
          requested_at: n.requested_at,
        }))
      : [];

    // Fetch full history (all requests)
    const historyRes = await fetch(
      `http://localhost:5000/good-moral/history?student_number=${studentNumber}`,
      { headers: { Accept: "application/json" } }
    );
    if (!historyRes.ok) throw new Error(`Failed to fetch history: ${historyRes.status}`);
    const historyData = await historyRes.json();

    const fullHistory = Array.isArray(historyData)
      ? historyData.map(r => ({
          request_id: r.request_id,
          status: r.status,
          message:
            r.status === "Pending"
              ? "Your Good Moral request is pending."
              : r.status === "Approved"
              ? "Your Good Moral request has been approved."
              : "Your Good Moral request has been rejected.",
          is_new: false, // already seen
          requested_at: r.requested_at,
        }))
      : [];

    // Merge notifications with history: notifications take precedence (is_new = true)
    const merged = [...fullHistory.filter(h => !newNotifs.some(n => n.request_id === h.request_id)), ...newNotifs];

    // Update state
    setNotifications(merged);
  } catch (err) {
    console.error("Error fetching notifications/history:", err);
  }
};

// -----------------------
// Polling on mount
// -----------------------
useEffect(() => {
  if (!studentNumber) return;

  fetchNotifications(); // initial fetch
  const intervalId = setInterval(fetchNotifications, POLL_INTERVAL);

  return () => clearInterval(intervalId);
}, [studentNumber]);


  // ---------------------------
  // Render
  return (
    <div className="min-h-screen flex bg-[#eefbe9]">

      {/* SIDEBAR - desktop */}
      <aside className="hidden md:flex md:w-64 bg-[#1f2937] text-white flex-col py-6 shadow-xl border-r border-gray-800">
        <div className="flex items-center gap-3 px-4 mb-8">
          <img
            src="/cvsu-logo.png"
            alt="logo"
            className="w-11 h-11 rounded-md object-cover border border-gray-700"
          />
          <div>
            <h1 className="text-lg font-semibold">GUIDANCE OFFICE</h1>
            <p className="text-xs text-gray-300">CvSU — Student</p>
          </div>
        </div>

        <nav className="px-3 flex-1 space-y-2">
          <button
            onClick={() => setActivePage("Info")}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "Info" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
            <span className="font-medium">Student Dashboard</span>
          </button>

          <button
            onClick={() => setActivePage("News")}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "News" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <NewspaperIcon className="w-5 h-5" />
            <span className="font-medium">News</span>
          </button>

          <button
            onClick={() => setActivePage("GoodMoral")}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "GoodMoral" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <DocumentCheckIcon className="w-5 h-5" />
            <span className="font-medium">Good Moral</span>
          </button>

          <button
            onClick={() => setActivePage("Rules")}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "Rules" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <BookOpenIcon className="w-5 h-5" />
            <span className="font-medium">Rules & Regulations</span>
          </button>

          <button
            onClick={() => setActivePage("Notifications")}
            className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "Notifications" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5" />
              <span className="font-medium">Notifications</span>
            </div>
            {notifications.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </button>
        </nav><br></br>

    {/* DESKTOP LOGOUT BUTTON */}
    <div className="px-4 pb-6 mt-auto">
      <button
        onClick={() => {
      Swal.fire({
        title: "Logout",
        text: "Are you sure you want to log out?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Logout",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {

          // SUCCESS TOAST BAGO MAG-REDIRECT
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Logged out successfully",
            showConfirmButton: false,
            timer: 500,
            timerProgressBar: true,
          });

          // DELAY REDIRECT
          setTimeout(() => {
            localStorage.removeItem("student");
            window.location.href = "/";
          }, 500);
        }
      });
    }}
    className="
      flex items-center justify-center gap-3 
      w-full py-3
      bg-red-600 text-white 
      rounded-lg shadow-md 
      hover:bg-red-700 
      transition-all select-none
    "
  >
    <ArrowRightOnRectangleIcon className="w-6 h-6" />
    <span className="text-base font-semibold">Logout</span>
  </button>
</div>
     </aside>

      {/* Sidebar drawer for mobile */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
        {/* overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* drawer */}
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-[#1f2937] text-white p-6 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src="/cvsu-logo.png" className="w-10 h-10 rounded-md border" />
              <div>
                <div className="font-bold">GUIDANCE OFFICE</div>
                <div className="text-xs text-gray-300">CvSU — Student</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded hover:bg-white/10">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            <button onClick={() => { setActivePage("Info"); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${activePage === "Info" ? "bg-green-600" : "hover:bg-white/10"}`}>
              <Squares2X2Icon className="w-5 h-5" />
              <span className="font-medium">Student Dashboard</span>
            </button>
            <button onClick={() => { setActivePage("News"); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${activePage === "News" ? "bg-green-600" : "hover:bg-white/10"}`}>
              <NewspaperIcon className="w-5 h-5" />
              <span className="font-medium">News</span>
            </button>
            <button onClick={() => { setActivePage("GoodMoral"); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${activePage === "GoodMoral" ? "bg-green-600" : "hover:bg-white/10"}`}>
              <DocumentCheckIcon className="w-5 h-5" />
              <span className="font-medium">Good Moral</span>
            </button>
            <button onClick={() => { setActivePage("Rules"); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${activePage === "Rules" ? "bg-green-600" : "hover:bg-white/10"}`}>
              <BookOpenIcon className="w-5 h-5" />
              <span className="font-medium">Rules & Regulations</span>
            </button>
            <button onClick={() => { setActivePage("Notifications"); setSidebarOpen(false); }} className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg ${activePage === "Notifications" ? "bg-green-600" : "hover:bg-white/10"}`}>
              <div className="flex items-center gap-3">
                <BellIcon className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
              </div>
              {notifications.length > 0 && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>}
            </button>
          </nav><br></br>

          {/* MOBILE LOGOUT BUTTON */}
          <div className="px-4 pb-6 mt-auto">
            <button
              onClick={() => {
                Swal.fire({
                  title: "Logout",
                  text: "Are you sure you want to log out?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Logout",
                  cancelButtonText: "Cancel",
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                }).then((result) => {
                  if (result.isConfirmed) {

                    // SUCCESS TOAST BAGO MAG-REDIRECT
                    Swal.fire({
                      toast: true,
                      position: "top-end",
                      icon: "success",
                      title: "Logged out successfully",
                      showConfirmButton: false,
                      timer: 1500,
                      timerProgressBar: true,
                    });

                    // DELAY REDIRECT
                    setTimeout(() => {
                      localStorage.removeItem("student");
                      window.location.href = "/";
                    }, 1500);
                  }
                });
              }}

              className="
                flex items-center justify-center gap-3 
                w-full py-3
                bg-red-600 text-white 
                rounded-lg shadow-md 
                hover:bg-red-700 
                transition-all select-none
              "
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              <span className="text-base font-semibold">Logout</span>
            </button>
          </div>

        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="w-full h-16 bg-[#1f2937] text-white shadow-md flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* mobile burger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded hover:bg-white/10"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="hidden md:block ml-0">
              {/* placeholder so header spacing matches desktop */}
            </div>
          </div>

          {/* Right: user avatar */}
          <div className="relative">
            <div
              onClick={() => setAccountModal(!accountModal)}
              className="cursor-pointer flex items-center gap-2 p-2 rounded-full hover:bg-gray-700/40"
            >
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt="user"
                  className="w-10 h-10 rounded-full object-cover border border-gray-400"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-white" />
              )}
            </div>

            {accountModal && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1f2937] text-white rounded-xl shadow-xl p-5 z-50 border border-gray-700">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {getProfileImage() ? (
                      <img
                        src={getProfileImage()}
                        className="w-20 h-20 rounded-full border border-gray-400 object-cover"
                        alt="pfp"
                      />
                    ) : (
                      <UserCircleIcon className="w-20 h-20 text-gray-400" />
                    )}
                    <label className="absolute bottom-0 right-0 bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700">
                      +
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfileUpload}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-lg text-white">
                    Hi, <span className="font-bold">{studentRecord?.student_name || fallbackName}</span>
                  </p>
                  <p className="text-sm text-gray-300 mb-1">
                    {studentData.student_number}
                  </p>
                  <p className="text-sm text-gray-300 mb-1">
                    {studentRecord?.course || "—"}
                  </p>

                  <button className="w-full bg-green-600 text-white cursor-pointer py-2 rounded-lg hover:bg-green-700 mt-3">
                    Manage Account
                  </button>

                  {/* Account logout (confirmation) */}
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: "Logout",
                        text: "Are you sure you want to log out?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Logout",
                        cancelButtonText: "Cancel",
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3085d6",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          localStorage.removeItem("student");
                          setAccountModal(false);
                          window.location.href = "/";
                        }
                      });
                    }}
                    className="w-full mt-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-4 md:p-10">
          {/* INFO */}
          {activePage === "Info" && (
            <>
              <h2 className="text-3xl md:text-4xl font-extrabold text-green-800 mb-6 md:mb-10">
                Welcome, {studentRecord?.student_name || fallbackName}!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">📋</span>
                      <h3 className="text-xl font-semibold text-green-700">
                        Guidance Visits
                      </h3>
                    </div>
                    <p className="text-4xl md:text-5xl font-extrabold text-green-900 mt-3">
                      {visits}
                    </p>
                  </div>
                  <button onClick={openHistoryModal} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    View Visit History
                  </button>
                </div>

                <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📅</span>
                    <h3 className="text-xl font-semibold text-green-700">Last Visit</h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-extrabold text-green-900 mt-4">{lastVisit}</p>
                </div>

                <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">⚠️</span>
                    <h3 className="text-xl font-semibold text-green-700">Latest Concern</h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-green-900 mt-4">{violation}</p>
                </div>

                <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📌</span>
                    <h3 className="text-xl font-semibold text-green-700">Recommendation</h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-green-900 mt-4">{section}</p>
                </div>
              </div>
            </>
          )}

          {/* NEWS */}
          {activePage === "News" && (
            <>
              <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6">Latest News</h2>
              {newsLoading ? (
                <p className="text-gray-700">Loading news...</p>
              ) : newsArticles.length === 0 ? (
                <p className="text-gray-700">No news available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {newsArticles.map((article, idx) => (
                    <a key={idx} href={article.link} target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-2xl shadow-md border-2 border-green-600">
                      <h3 className="font-bold text-xl text-green-900 mb-2">{article.title}</h3>
                      <p className="text-sm text-gray-500 mb-1">Source: {article.source}</p>
                      <p className="text-sm text-gray-400">Click to read more...</p>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
     {/* Good Moral */}
      {activePage === "GoodMoral" && (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6 text-center">
            Good Moral Certificate
          </h2>

          {/* If student has not requested yet */}
          {!studentRecord?.lastGoodMoralRequest ? (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600 w-full max-w-md text-center">
              <p className="text-gray-700 mb-4">
                Request your Good Moral Certificate here.
              </p>
              <button
                onClick={submitGoodMoralRequest}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Request Good Moral
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600">

              {/* Status & Remarks */}
              <div className="mb-4">
                <p className="text-gray-700 font-semibold">
                  Status: {studentRecord?.lastGoodMoralRequest.status || "Pending"}
                </p>
                {studentRecord?.lastGoodMoralRequest.status === "Rejected" && (
                  <p className="text-red-700 font-medium">
                    Remarks: {studentRecord?.lastGoodMoralRequest.remarks || "No remarks"}
                  </p>
                )}
                {studentRecord?.lastGoodMoralRequest.status === "Pending" && (
                  <p className="text-yellow-700 font-medium">
                    Waiting for admin approval...
                  </p>
                )}
              </div>

              {/* ============================= */}
              {/* Approved Good Moral File Box */}
              {/* ============================= */}
              {studentRecord?.lastGoodMoralRequest.status === "Approved" && (
                <>
                  {/* If we have currentGoodMoral state (from fetch) */}
                  {currentGoodMoral ? (
                    <div className="border rounded-lg p-4 flex flex-col gap-3 shadow-sm bg-gray-50">

                      {/* File Name with extension in bold */}
                      <p className="text-gray-800 font-semibold truncate">
                        {(() => {
                          const parts = currentGoodMoral.name.split(".");
                          const ext = parts.length > 1 ? parts.pop() : "";
                          const nameOnly = parts.join(".");
                          return (
                            <>
                              {nameOnly}
                              {ext && <span className="font-bold">.{ext}</span>}
                            </>
                          );
                        })()}
                      </p>

                      {/* Scrollable PDF/Doc Preview */}
                      <div className="w-full border rounded overflow-hidden h-64 mb-2">
                        <iframe
                          src={currentGoodMoral.url}
                          className="w-full h-full"
                          title="Good Moral Certificate Preview"
                        />
                      </div>

                      {/* View File button at bottom-right */}
                      <div className="flex justify-end mt-auto">
                        <button
                          onClick={() => window.open(currentGoodMoral.url, "_blank")}
                          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                        >
                          View File
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* If autofill PDF is available without fetching state */
                    <div className="border rounded-lg p-4 flex flex-col gap-3 shadow-sm bg-gray-50 mt-4">
                      <iframe
                        src={`http://localhost:5000/good-moral/download/${studentRecord.lastGoodMoralRequest.request_id}`}
                        className="w-full h-64"
                        title="Good Moral Certificate"
                      ></iframe>
                      <div className="flex justify-end mt-2">
                        <a
                          href={`http://localhost:5000/good-moral/download/${studentRecord.lastGoodMoralRequest.request_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                            View File
                          </button>
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

                {/* Cancel request button (only Pending) */}
                    {studentRecord?.lastGoodMoralRequest.status === "Pending" && (
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: "Are you sure?",
                            text: "Do you want to cancel your Good Moral request?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#3085d6",
                            cancelButtonColor: "#d33",
                            confirmButtonText: "Yes, cancel it!",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              const BACKEND_URL = "http://localhost:5000";
                              fetch(`${BACKEND_URL}/good-moral/request/${studentRecord.lastGoodMoralRequest.request_id}`, {
                                method: "DELETE",
                              })
                                .then((res) => {
                                  if (res.ok) {
                                    Swal.fire({
                                      toast: true,
                                      position: "top-end",
                                      icon: "success",
                                      title: "Request cancelled!",
                                      showConfirmButton: false,
                                      timer: 500,
                                    });
                                    setTimeout(() => {
                                      window.location.reload();
                                    }, 500);
                                  } else {
                                    Swal.fire({
                                      toast: true,
                                      position: "top-end",
                                      icon: "error",
                                      title: "Failed to cancel request",
                                      showConfirmButton: false,
                                      timer: 1500,
                                    });
                                  }
                                })
                                .catch(() => {
                                  Swal.fire({
                                    toast: true,
                                    position: "top-end",
                                    icon: "error",
                                    title: "Failed to cancel request",
                                    showConfirmButton: false,
                                    timer: 1500,
                                  });
                                });
                            }
                          });
                        }}
                        className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          {/* RULES */}
          {activePage === "Rules" && (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-4 text-center">CvSU Rules and Regulations</h2>

              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border w-full max-w-md">
                {currentRules ? (
                  <div className="flex flex-col gap-4">
                    {/* file header with icon + filename (NOT clickable) */}
                  <div className="flex items-center gap-3 rounded-xl p-3 bg-gray-50 shadow w-full">
                      {(() => {
                        const ext = (currentRules.name || "").split(".").pop().toLowerCase();
                        switch (ext) {
                          case "pdf": return <span className="text-red-600 text-3xl">📄</span>;
                          case "doc":
                          case "docx": return <span className="text-blue-600 text-3xl">📝</span>;
                          case "jpg":
                          case "jpeg":
                          case "png": return <span className="text-green-600 text-3xl">🖼️</span>;
                          default: return <span className="text-gray-600 text-3xl">📁</span>;
                        }
                      })()}

                      {/* filename with truncated name but visible extension */}
                      {(() => {
                        const nameParts = currentRules.name?.split(".") || ["File"];
                        const ext = nameParts.pop(); // pdf, docx, etc
                        const baseName = nameParts.join("."); // actual name
                        return (
                          <div className="flex gap-1 items-center max-w-[200px] md:max-w-[300px]">
                            <span className="truncate font-semibold text-green-800" title={currentRules.name}>
                              {baseName}
                            </span>
                            <span className="font-semibold text-green-600">.{ext}</span>
                          </div>
                        );
                      })()}
                    </div>


                    {/* preview square */}
                    <div className="border rounded-xl h-64 md:h-72 overflow-auto flex items-center justify-center p-2 bg-white shadow-inner">
                      {currentRules.url && currentRules.name.endsWith(".pdf") ? (
                        <embed src={currentRules.url} type="application/pdf" className="w-full h-full" />
                      ) : (
                        <img src={currentRules?.url} className="max-h-full object-contain" alt="rules" />
                      )}
                    </div>

                    {/* view button */}
                    <a href={currentRules.url} target="_blank" rel="noreferrer" className="bg-yellow-500 text-white px-5 py-2 rounded-xl text-center hover:bg-yellow-600 transition shadow w-full">
                      View File
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 text-lg">⚠️ No Rules and Regulations found.</div>
                )}
              </div>
            </div>
          )}
          
         {/*Notifications*/}
          {activePage === "Notifications" && (
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6">
                Notifications
              </h2>

              {notifications.length === 0 ? (
                <p className="text-gray-700">No notifications at the moment.</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map(note => {
                    const { request_id, message, status, is_new } = note;

                    let borderColor = "border-gray-400";
                    let dotColor = "bg-gray-400";

                    if (status === "Approved") {
                      borderColor = "border-green-600";
                      dotColor = "bg-green-600";
                    } else if (status === "Rejected") {
                      borderColor = "border-red-600";
                      dotColor = "bg-red-600";
                    } else if (status === "Pending") {
                      borderColor = "border-yellow-500";
                      dotColor = "bg-yellow-500";
                    }

                    return (
                      <div
                        key={request_id}
                        className={`p-4 bg-white rounded-2xl shadow-md border-2 ${borderColor} flex items-center justify-between`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${dotColor}`}></span>
                          <p className="font-semibold">{message}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <p className="text-gray-600 font-medium">{status}</p>

                          {is_new && (
                            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Visit History</h2>
            <div className="max-h-80 overflow-auto border rounded-lg p-3 bg-gray-50">
              {violationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No visit history found.</p>
              ) : (
                violationHistory.map((item, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg shadow mb-3 border">
                    <p className="font-semibold">{item.predicted_violation}</p>
                    <p className="text-sm text-gray-600">Section: {item.predicted_section}</p>
                    <p className="text-sm text-gray-600">Date: {item.violation_date || "—"}</p>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setHistoryModalOpen(false)} className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded shadow-lg bg-white/90 flex flex-col">
            <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg">✕</button>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {previewFile.name.endsWith(".pdf") ? (
                <embed src={previewFile.url} type="application/pdf" className="w-full min-h-[500px]" />
              ) : (
                <img src={previewFile.url} className="max-w-full max-h-[80vh] object-contain" alt="preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
