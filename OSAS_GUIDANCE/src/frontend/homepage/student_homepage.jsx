import React, { useState, useEffect } from "react";
import { Squares2X2Icon, UserCircleIcon, ArrowRightOnRectangleIcon, NewspaperIcon, DocumentCheckIcon, BellIcon, BookOpenIcon} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";

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

  // Good Moral / Notifications state
  const [goodMoralRequested, setGoodMoralRequested] = useState(false);
  const [goodMoralApproved, setGoodMoralApproved] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  //Preview Rules and Regulations
  const [currentRules, setCurrentRules] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

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

    fetchNews();
    intervalId = setInterval(fetchNews, 60000);

    return () => clearInterval(intervalId);
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

 // Use the global object
  const downloadPDF = () => {
  const element = document.getElementById("goodmoral-certificate");
  if (!element) return;

  setLoading(true);

  const opt = {
    margin: 0.5,
    filename: "GoodMoralCertificate.pdf",
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: true, ignoreElements: (el) => el.tagName === 'STYLE' },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  setTimeout(() => {
    import("html2pdf.js").then((html2pdf) => {
      html2pdf.default().set(opt).from(element).save().finally(() => setLoading(false));
    });
  }, 100);
};

useEffect(() => {
  async function fetchRules() {
    try {
      const res = await fetch("http://localhost:5000/file/list");
      const data = await res.json();

      // find RULES file only
      const rulesFile = data.files.find(f => f.file_type === "rules");

      if (rulesFile) {
        setCurrentRules({
          name: rulesFile.original,
          url: `http://localhost:5000/file/download/${rulesFile.stored}`
        });
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
    }
  }

  fetchRules();
}, []);


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

          {/* GOOD MORAL PAGE */}
        {activePage === "GoodMoral" && (
          <div className="flex flex-col items-center mt-8">
            <h2 className="text-4xl font-bold text-green-800 mb-8 text-center">
              Good Moral Certificate
            </h2>

          {!goodMoralRequested ? (
          <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-green-600 w-full max-w-md text-center">
            <p className="text-gray-700 mb-6">
              Request your Good Moral Certificate here.
            </p>
            <button
              onClick={() => {
                setGoodMoralRequested(true);
                setGoodMoralApproved(true);
                setNotifications(prev => [
                  ...prev,
                  { type: "Good Moral", status: "Approved" },
                ]);

                Swal.fire({
                  toast: true,                // small toast
                  position: "top-end",        // top-right corner
                  icon: "success",            // success icon
                  title: "Good Moral request submitted",
                  showConfirmButton: false,   // no "OK" button
                  timer: 2000,                // disappears after 2 seconds
                  timerProgressBar: true,     // shows progress bar
                });
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Request Good Moral
            </button>

              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* PDF Container */}
                <div
                  id="goodmoral-certificate"
                  className="bg-white p-10 rounded-2xl shadow-md border-2 border-green-600 w-full max-w-lg"
                  style={{ textAlign: "center" }} // center all text horizontally
                >
                  {/* Logo */}
                  <img
                    src="/cvsu-logo.png"
                    alt="CvSU Logo"
                    className="mx-auto w-24 h-24 mb-6"
                  />

                  {/* Certificate Heading */}
                  <h3 className="text-2xl font-bold text-green-700 mb-6">
                    Certificate of Good Moral
                  </h3>

                  {/* Certificate Body */}
                  <p className="text-gray-700 mb-4">
                    This is to certify that{" "}
                    <span className="font-semibold">{studentRecord?.student_name || fallbackName}</span>{" "}
                    of student number{" "}
                    <span className="font-semibold">{studentNumber}</span>{" "}
                    has demonstrated good moral character.
                  </p>
                  <p className="mt-6 text-gray-700">
                    Issued by CvSU Guidance Office.
                  </p>
                </div>

                {/* Download Button - HINDI kasama sa PDF */}
                {goodMoralApproved && (
                  <button
                    onClick={downloadPDF}
                    className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                  >
                    Download PDF
                  </button>
                )}
              </div>
            )}
          </div>
        )}
         {/*rules and regulations*/}
          {activePage === "Rules" && (
            <div className="flex flex-col items-center">

              <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">
                CvSU Rules and Regulations
              </h2>

              {/* CARD CONTAINER */}
              <div className="bg-white p-6 rounded-2xl shadow-md border w-[420px]">

                {currentRules ? (
                  <div className="flex flex-col gap-4">

                    {/* FILE HEADER — REMOVED BLACK BOX LINE, FILENAME NOT CLICKABLE */}
                    <div className="flex items-center gap-3 rounded-xl p-4 bg-gray-50 shadow">

                      {/* File Icon */}
                      {(() => {
                        const ext = currentRules.name.split(".").pop().toLowerCase();
                        switch (ext) {
                          case "pdf": return <span className="text-red-600 text-4xl">📄</span>;
                          case "doc":
                          case "docx": return <span className="text-blue-600 text-4xl">📝</span>;
                          case "jpg":
                          case "jpeg":
                          case "png": return <span className="text-green-600 text-4xl">🖼️</span>;
                          default: return <span className="text-gray-600 text-4xl">📁</span>;
                        }
                      })()}

                      {/* Filename (NOT CLICKABLE ANYMORE) */}
                      <span className="font-semibold text-green-800">
                        {currentRules.name}
                      </span>
                    </div>

                    {/* PREVIEW AREA (square) */}
                    <div className="mt-1 border rounded-xl h-[300px] overflow-auto flex items-center justify-center p-2 bg-white shadow-inner">
                      {currentRules.name.endsWith(".pdf") ? (
                        <embed
                          src={currentRules.url}
                          type="application/pdf"
                          className="w-full h-full"
                        />
                      ) : (
                        <img
                          src={currentRules.url}
                          className="max-h-full object-contain"
                        />
                      )}
                    </div>

                    {/* View File button */}
                    <a
                      href={currentRules.url}
                      target="_blank"
                      className="bg-yellow-500 text-white px-5 py-2 rounded-xl text-center hover:bg-yellow-600 transition shadow w-full"
                    >
                      View File
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 text-lg">
                    ⚠️ No Rules and Regulations found.
                  </div>
                )}
              </div>
            </div>
          )}



          {/* NOTIFICATIONS PAGE */}
          {activePage === "Notifications" && (
            <div>
              <h2 className="text-4xl font-bold text-green-800 mb-6">Notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-gray-700">No notifications at the moment.</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((note, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl shadow-md border-2 border-green-600">
                      <p className="font-semibold">{note.type}</p>
                      <p className="text-gray-600">Status: {note.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
