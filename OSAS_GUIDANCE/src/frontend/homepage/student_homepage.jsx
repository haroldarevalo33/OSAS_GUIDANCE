import React, { useState, useEffect } from "react";
import { 
  Squares2X2Icon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  NewspaperIcon 
} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

export default function StudentHome() {
  const [activePage, setActivePage] = useState("Info");
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const [violation, setViolation] = useState("—");
  const [section, setSection] = useState("—");
  const [lastVisit, setLastVisit] = useState("—");
  const [visits, setVisits] = useState(0);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [violationHistory, setViolationHistory] = useState([]);

  const [accountModal, setAccountModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  // Load student from localStorage
  const rawStudent = localStorage.getItem("student");
  let studentData = {};
  try {
    studentData = rawStudent ? JSON.parse(rawStudent) : {};
  } catch {
    studentData = {};
  }

  const studentNumber = studentData.student_number || null;
  const fallbackName = studentData.student_name || "Student";

  // News state
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Fetch news every 60s when News tab is active
  useEffect(() => {
    if (activePage !== "News") return;

    let intervalId;

    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/news");
        const data = await res.json();
        if (data.status === "ok") setNewsArticles(data.articles);
        else setNewsArticles([]);
      } catch (err) {
        console.error("Error fetching news:", err);
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews(); // initial fetch
    intervalId = setInterval(fetchNews, 60000); // re-fetch every 60s

    return () => clearInterval(intervalId); // cleanup
  }, [activePage]);

  // FETCH STUDENT RECORD
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

  // FETCH SUMMARY
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

  // HANDLE PROFILE UPLOAD
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

        setStudentRecord((prev) => ({
          ...prev,
          profile_pic: updatedProfilePic,
        }));

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

  return (
    <div className="w-screen h-screen flex bg-[#eefbe9] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1f2937] text-white flex flex-col py-6 shadow-xl border-r border-gray-800">
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
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="px-4 mt-auto pb-4">
          <button
            onClick={() => {
              Swal.fire({
                title: "Logout",
                text: "Are you sure you want to log out?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, log out",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#16a34a",
                cancelButtonColor: "#d33",
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.fire({
                    title: "Logged out",
                    text: "You have been successfully logged out.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                    position: "center",
                  }).then(() => {
                    localStorage.removeItem("student");
                    window.location.href = "/";
                  });
                }
              });
            }}
            className="flex items-center gap-1 w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all justify-center"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        <header className="w-full h-16 bg-[#1f2937] text-white shadow-md flex items-center justify-between px-6">
          <div></div>
          {/* USER DROPDOWN */}
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
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#1f2937] text-white rounded-xl shadow-xl p-5 z-50 border border-gray-700">
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
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT SECTION */}
        <section className="p-10 overflow-auto">
          {/* INFO DASHBOARD */}
          {activePage === "Info" && (
            <>
              <h2 className="text-4xl font-extrabold text-green-800 mb-10">
                Welcome, {studentRecord?.student_name || fallbackName}!
              </h2>

              <div className="grid grid-cols-4 gap-8">
                {/* VISITS */}
                <div className="p-6 min-h-64 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">📋</span>
                      <h3 className="text-xl font-semibold text-green-700">
                        Guidance Visits
                      </h3>
                    </div>
                    <p className="text-5xl font-extrabold text-green-900 mt-3">
                      {visits}
                    </p>
                  </div>
                  <button
                    onClick={openHistoryModal}
                    className="mt-4 w-full bg-green-600 cursor-pointer text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    View Visit History
                  </button>
                </div>

                {/* LAST VISIT */}
                <div className="p-6 min-h-64 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-xl transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📅</span>
                    <h3 className="text-xl font-semibold text-green-700">
                      Last Visit
                    </h3>
                  </div>
                  <p className="text-3xl font-extrabold text-green-900 mt-4">
                    {lastVisit}
                  </p>
                </div>

                {/* VIOLATION */}
                <div className="p-6 min-h-64 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-xl transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">⚠️</span>
                    <h3 className="text-xl font-semibold text-green-700">
                      Latest Concern
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mt-4 break-words">
                    {violation}
                  </p>
                </div>

                {/* SECTION */}
                <div className="p-6 min-h-64 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-xl transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📌</span>
                    <h3 className="text-xl font-semibold text-green-700">
                      Recommendation
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mt-4 break-words">
                    {section}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* NEWS TAB */}
          {activePage === "News" && (
            <>
              <h2 className="text-4xl font-bold text-green-800 mb-6">Latest News</h2>

              {newsLoading ? (
                <p className="text-gray-700">Loading news...</p>
              ) : newsArticles.length === 0 ? (
                <p className="text-gray-700">No news available at the moment.</p>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {newsArticles.map((article, idx) => (
                    <a
                      key={idx}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white p-6 rounded-2xl shadow-md border-2 border-green-600 hover:shadow-xl transition"
                    >
                      <h3 className="font-bold text-xl text-green-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        Source: {article.source}
                      </p>
                      <p className="text-sm text-gray-400">Click to read more...</p>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-[100]">
          <div className="w-[550px] bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Visit History
            </h2>

            <div className="max-h-80 overflow-auto border rounded-lg p-3 bg-gray-50">
              {violationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No visit history found.
                </p>
              ) : (
                violationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg shadow mb-3 border"
                  >
                    <p className="font-semibold">{item.predicted_violation}</p>
                    <p className="text-sm text-gray-600">
                      Section: {item.predicted_section}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {item.violation_date || "—"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryModalOpen(false)}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
