import React, { useState, useEffect, useCallback } from "react";
import {ChartBarIcon,NewspaperIcon,MagnifyingGlassIcon,PencilSquareIcon,ArrowRightOnRectangleIcon,UserGroupIcon,UserCircleIcon,DocumentPlusIcon, XMarkIcon, EyeIcon, TrashIcon} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";



export default function AdminHome() {
  const [activePage, setActivePage] = useState("trends");
  const [query, setQuery] = useState("");
  const [rssItems, setRssItems] = useState([]);
  const [loadingRss, setLoadingRss] = useState(false);

  // sa taas ng AdminHome component
const [predictedViolation, setPredictedViolation] = useState("");
const [predictedSection, setPredictedSection] = useState("");
  // Upload File State
const [currentGoodMoral, setCurrentGoodMoral] = useState(null);
const [currentRules, setCurrentRules] = useState(null);

  // Violation form state
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseYearSection, setCourseYearSection] = useState("");
  const [gender, setGender] = useState("");
  const [violationText, setViolationText] = useState("");
  const [violationDate, setViolationDate] = useState("");
  const [showViolationModal, setShowViolationModal] = useState(false);
  

  // auto-filled student info fetched from /student?query=
  const [studentInfo, setStudentInfo] = useState(null);
  const [autoFetchLoading, setAutoFetchLoading] = useState(false);

  // For Search → View modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Store violations fetched from backend
  const [violations, setViolations] = useState([]);
  //dropdown
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  //filtered
   const [filterCategory, setFilterCategory] = useState("all"); // all, name, id, course, date, violation 
   const [predictiveText, setPredictiveText] = useState(""); // top-3 text from model
   const [standardText, setStandardText] = useState(""); // Default value is an empty string
   const [showViolationDetailsModal, setShowViolationDetailsModal] = useState(false);
   const [currentViolation, setCurrentViolation] = useState(null);

   //request view list
  const [showRequestList, setShowRequestList] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([
  // Dummy data for now
  { student_number: "202210221", section: "Section 8", violation: "Late Submission", status: "Pending" },
  { student_number: "202210225", section: "Section 3", violation: "Absent", status: "Pending" },
]);
const [selectedRequest, setSelectedRequest] = useState(null);
   
// Function to generate a DOCX for a specific violation
const downloadViolationDoc = (violation) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Violation Report", bold: true, size: 28 }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Student Name: ${violation.student_name}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Student ID: ${violation.student_id}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Course/Year/Section: ${violation.course_year_section}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Gender: ${violation.gender}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Section: ${violation.predicted_section || "—"}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Violation: ${violation.predicted_violation || "—"}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Admin Note: ${violation.violation_text}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${violation.formattedDate || "—"}`, size: 24 }),
            ],
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${violation.student_id}_violation.docx`);
  });
};

useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest("header")) {
      setShowAccountDropdown(false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);
  
// STATES
const [lineData, setLineData] = useState([]);
const [sectionData, setSectionData] = useState([]);
const chartColors = ["#10b981", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6"];
const [sections, setSections] = useState([]); // to track unique section names for bars/legend

// FETCH CHART DATA
useEffect(() => {
  fetch("/violations")
    .then((res) => res.json())
    .then((data) => {
      // 1️⃣ LINE CHART (Monthly Cases)
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthlyCounts = months.map((m, i) => ({
        month: m,
        cases: data.filter((v) => {
          const d = new Date(v.violation_date);
          return !isNaN(d) && d.getMonth() === i;
        }).length,
      }));
      setLineData(monthlyCounts);

      // 2️⃣ SECTION CHART (Case count per section)
      const sectionCounts = {};
      data.forEach((v) => {
        const sec = v.predicted_section && v.predicted_section !== "—" ? v.predicted_section : "Unknown";
        sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
      });

      // Convert to array for Recharts
      const sectionArray = Object.keys(sectionCounts).map((sec) => ({
        section: sec,
        value: sectionCounts[sec],
      }));

      setSectionData(sectionArray);
      setSections(Object.keys(sectionCounts)); // store unique section names
    })
    .catch((err) => console.error("Failed to fetch violations:", err));
}, []);


  //email
const [profilePicPreview, setProfilePicPreview] = useState(null);
const [user, setUser] = useState({ name: "", email: "", profile_pic:"" });

// Upload file to backend and return display info
const uploadFile = async (file, fileType) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);

    // Upload file to backend
    const res = await fetch("http://localhost:5000/file/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Server returned error:", res.status, text);
      throw new Error(`Upload failed: ${res.status}`);
    }

    const data = await res.json();

    // Prepare the file for display (immediate UI feedback)
    const displayFile = {
      id: data.file_id,
      name: file.name,
      fileType: fileType,
      stored: data.stored,
      original: data.original,
      url: `http://localhost:5000/file/download/${data.stored}`, // Backend URL for download
    };

    console.log("UPLOAD SUCCESS:", displayFile);

    // Show SweetAlert2 success toast
    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "File uploaded successfully!",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      timerProgressBar: true,
    });

    // Optionally refresh the file list after upload
    await listFiles();

    return displayFile;
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert(`File upload failed: ${err.message}`);
    return null;
  }
};


// Function to list all uploaded files
const listFiles = async () => {
  try {
    const res = await fetch("http://localhost:5000/file/list");
    if (!res.ok) {
      const text = await res.text();
      console.error("Error fetching file list:", res.status, text);
      return;
    }

    const data = await res.json();
    if (data.status !== "success") {
      console.error("Backend error:", data.message);
      return;
    }

    const files = data.files;
    displayFiles(files); // Display the files in the UI
  } catch (err) {
    console.error("Error fetching file list:", err);
  }
};

// Function to display the files
const displayFiles = (files) => {
  const fileListContainer = document.getElementById("file-list");
  if (!fileListContainer) return;

  fileListContainer.innerHTML = ""; // Clear the current list

  files.forEach((file) => {
    const fileElement = document.createElement("div");
    fileElement.classList.add("file-item");
    fileElement.innerHTML = `
      <p><strong>${file.original}</strong> (${file.size_bytes} bytes)</p>
      <a href="${file.path || file.url}" download>Download</a>
    `;
    fileListContainer.appendChild(fileElement);
  });
};

useEffect(() => {
  const fetchSavedFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/file/list");
      if (!res.ok) return;

      const data = await res.json();
      if (data.status !== "success") return;

      // Assign previously uploaded files to state
      const goodMoralFile = data.files.find(f => f.file_type === "good_moral");
      const rulesFile = data.files.find(f => f.file_type === "rules");

      if (goodMoralFile) {
        setCurrentGoodMoral({
          name: goodMoralFile.original,
          url: `http://localhost:5000/file/download/${goodMoralFile.stored}`,
        });
      }

      if (rulesFile) {
        setCurrentRules({
          name: rulesFile.original,
          url: `http://localhost:5000/file/download/${rulesFile.stored}`,
        });
      }
    } catch (err) {
      console.error("Error fetching saved files:", err);
    }
  };

  fetchSavedFiles();
}, []);

//fetch user
useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/admin/me?admin_id=1"); 
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();

        // Adjust the profile_pic URL to include /admin if needed
        const profilePicUrl = data.profile_pic.includes("/admin/uploads/")
          ? data.profile_pic
          : data.profile_pic.replace("/uploads/", "/admin/uploads/");

        setUser({
          id: data.id,
          name: data.name || "Admin",
          email: data.email || "",
          profile_pic: profilePicUrl,
        });
      } catch (err) {
        console.error(err);
      }
    }

    fetchUser();
  }, []);

  if (!user) return <p>Loading...</p>;


//delete
async function handleDeleteViolation(v) {
  // Confirmation modal (center)
  Swal.fire({
    title: "Delete Violation",
    text: `Are you sure you want to delete the violation for ${v.student_name}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#16a34a",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/violations/${v.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // Show success toast in top-right
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Violation deleted successfully",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });

          // Remove from state immediately
          setViolations((prev) => prev.filter((vi) => vi.id !== v.id));
        } else {
          const data = await res.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data?.message || "Delete failed",
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete violation",
        });
      }
    }
  });
}


//handle file
const handlePreviewFile = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "pdf" || ["jpg","jpeg","png"].includes(ext)) {
      setPreviewFile(file); // opens modal below
    } else if (ext === "doc" || ext === "docx") {
      Swal.fire({
        icon: "info",
        title: "Preview not available",
        text: "DOC/DOCX files cannot be previewed. You can download them instead.",
        confirmButtonText: "Download",
      }).then(() => {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const closePreview = () => setPreviewFile(null);
  const [previewFile, setPreviewFile] = useState(null);

  const menuItems = [
    { id: "trends", label: "View Trends", icon: ChartBarIcon },
    { id: "records", label: "Students Record", icon: UserGroupIcon},
    { id: "search", label: "Students Violation", icon: MagnifyingGlassIcon },
    { id: "violation", label: "Encode Violation", icon: PencilSquareIcon },
    { id: "uploadFileFormat", label: "Upload File Format", icon: DocumentPlusIcon }, // updated icon
    { id: "news", label: "News Management", icon: NewspaperIcon },
    
  ];
  // ------------------ Fetch News ------------------
  useEffect(() => {
    if (activePage === "news") fetchRss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  async function fetchRss() {
    setLoadingRss(true);
    try {
      const res = await fetch("http://localhost:5000/api/news");
      const data = await res.json();
      if (data.status === "ok") setRssItems(data.articles || []);
      else setRssItems([]);
    } catch (err) {
      console.error("Fetch error:", err);
      setRssItems([]);
    } finally {
      setLoadingRss(false);
    }
  }

  // ------------------ Fetch Violations ------------------
  useEffect(() => {
    fetchViolations();
  }, []);

  async function fetchViolations() {
    try {
      const res = await fetch("http://localhost:5000/violations");
      const data = await res.json();
      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching violations:", err);
      setViolations([]);
    }
  }

  // ------------------ Logout ------------------
  function handleLogout() {
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
          timer: 1200,
          showConfirmButton: false,
        }).then(() => (window.location.href = "/"));
      }
    });
  }
async function handleSubmitViolation() {
  // Check if all fields are filled out
  if (!studentName || !studentId || !courseYearSection || !gender || !violationText || !violationDate) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill out all fields before submitting.",
    });
    return;
  }

  // Convert YYYY-MM-DD → MM/DD/YY for formatting
  const parts = violationDate.split("-");
  const formattedDate = `${parts[1]}/${parts[2]}/${parts[0].slice(-2)}`; // "MM/DD/YY"

  try {
    // ---------------- Prediction Call ----------------
    const predictRes = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: violationText }),
    });
    const predictData = await predictRes.json();

    // Log the prediction data for debugging
    console.log('Prediction Response:', predictData);

    if (!predictRes.ok) {
      Swal.fire({
        icon: "error",
        title: "Prediction Failed",
        text: predictData?.error || "Could not predict violation.",
      });
      return;
    }

    // ---------------- Build Payload ----------------
    const newViolation = {
      student_name: studentName,
      student_id: parseInt(studentId, 10),
      course_year_section: courseYearSection,
      gender,
      violation_text: violationText,
      violation_date: formattedDate,
      predicted_violation: (predictData.predicted_violation !== null && predictData.predicted_violation !== undefined)
        ? predictData.predicted_violation : "No predicted violation", // Check if not null or undefined
      predicted_section: (predictData.predicted_section !== null && predictData.predicted_section !== undefined)
        ? predictData.predicted_section : "No predicted section", // Check if not null or undefined
      predictive_text: (predictData.predictive_text !== null && predictData.predictive_text !== undefined)
        ? predictData.predictive_text : "No predictive text available", // Check for null/undefined
      standard_text: (predictData.standard_text !== null && predictData.standard_text !== undefined)
        ? predictData.standard_text : "No standard violation text available", // Check for null/undefined
    };

    // ---------------- Submit to Backend ----------------
    const res = await fetch("http://localhost:5000/violations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newViolation),
    });
    const data = await res.json();

    // Handle successful submission
    if (res.ok) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Violation submitted successfully",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      setShowViolationModal(false);  // Close the modal
      // Reset fields
      setStudentName("");
      setStudentId("");
      setCourseYearSection("");
      setGender("");
      setViolationText("");
      setViolationDate("");
      setStudentInfo(null);

      await fetchViolations(); // Refresh the list of violations
    } else {
      // Handle error when submission fails
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data?.message || "Submission failed.",
      });
    }
  } catch (err) {
    // Handle any unexpected errors
    console.error(err);
    Swal.fire({ icon: "error", title: "Error", text: "Failed to submit violation." });
  }
}




  // ------------------ View Student Info (opens modal) ------------------
  function viewStudentInfo(student) {

    setSelectedStudent(student);
    setShowStudentModal(true);
  }


 useEffect(() => {
  const q = (studentId || studentName || "").toString().trim();
  if (!q || q.length < 2) {
    setStudentInfo(null);
    return;
  }

  let isCancelled = false;
  const timer = setTimeout(async () => {
    setAutoFetchLoading(true);
    try {
      const queryParam = encodeURIComponent(q);
      const res = await fetch(`http://localhost:5000/students/student?query=${queryParam}`);
      const data = await res.json(); // always JSON

      if (!isCancelled) {
        // Only fill if student found
        if (data.student) {
          setStudentInfo(data.student);
          setStudentName(prev => prev || data.student.student_name || "");
          setStudentId(prev => prev || String(data.student.student_id || ""));
        } else {
          setStudentInfo(null); // silent if not found
        }
      }
    } catch (err) {
      console.error("Auto-fetch student error:", err);
      if (!isCancelled) setStudentInfo(null); // silent on error
    } finally {
      if (!isCancelled) setAutoFetchLoading(false);
    }
  }, 450);

  return () => {
    isCancelled = true;
    clearTimeout(timer);
  };
}, [studentId, studentName]);


  // ------------------ Derived: group violations by student id for quick lookups ------------------
  const violationsByStudent = React.useMemo(() => {
    const map = {};
    for (const v of violations) {
      const id = v.student_id ?? "unknown";
      if (!map[id]) map[id] = [];
      map[id].push(v);
    }
    return map;
  }, [violations]);

// ===================== STATE =====================
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(false);

// Modal state
const [showModal, setShowModal] = useState(false);

// Form state/
const [studentNumber, setStudentNumber] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [course, setCourse] = useState("");
const [enrollmentInfo, setEnrollmentInfo] = useState("");

// Modals for viewing, editing, deleting
const [viewStudent, setViewStudent] = useState(null);
const [deleteStudent, setDeleteStudent] = useState(null);

// ===================== ADD STUDENT =====================
const handleAddStudent = () => {
  if (!studentName || !studentNumber || !email) {
    alert("Please fill all required fields");
    return;
  }

  setLoading(true);

  setTimeout(() => {
    const newStudent = {
      id: students.length + 1, // or use uuid()
      student_name: studentName,
      student_number: studentNumber,
      email,
      phone,
      course,
      enrollment_info: enrollmentInfo,
    };

    setStudents([...students, newStudent]);

    // Clear form and close modal
    setStudentName("");
    setStudentNumber("");
    setEmail("");
    setPhone("");
    setCourse("");
    setEnrollmentInfo("");
    setShowModal(false);
    setLoading(false);
  }, 300);
};


// ===================== DELETE STUDENT =====================
const handleDeleteStudent = (student) => {
  setDeleteStudent(student);
};

const handleConfirmDelete = async () => {
  if (!deleteStudent) return;

  try {
    // DELETE request sa backend
    const res = await fetch(`http://localhost:5000/students/${deleteStudent.id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete student");

    // Update front-end state
    setStudents((prev) =>
      prev.filter((s) => Number(s.id) !== Number(deleteStudent.id))
    );

    setDeleteStudent(null);

    // SweetAlert2 toast success
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Student deleted successfully",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Failed to delete student!",
    });
  }
};

// ===================== VIEW STUDENT =====================
const handleViewStudent = (student) => {
  setViewStudent(student);
};


const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/students/all"); // adjust URL
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      Swal.fire("Error", "Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === "records") {
      fetchStudents();
    }
  }, [activePage]);

  
  // STATES

const [filteredStudents, setFilteredStudents] = useState([]);

// Recalculate filtered students when query or filter changes
useEffect(() => {
  const q = query.trim().toLowerCase();

  const result = students.filter((s) => {
    const name = (s.student_name || "").toLowerCase();
    const id = String(s.student_number || "");
    const course = (s.course || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const phone = String(s.phone || "");

    switch (filterCategory) {
      case "name": return name.includes(q);
      case "id": return id.includes(q);
      case "course": return course.includes(q);
      case "email": return email.includes(q);
      case "phone": return phone.includes(q);
      case "all":
      default:
        return (
          name.includes(q) ||
          id.includes(q) ||
          course.includes(q) ||
          email.includes(q) ||
          phone.includes(q)
        );
    }
  });

  setFilteredStudents(result);
}, [query, filterCategory, students]);


// Recalculate filtered students when query or filter changes
useEffect(() => {
  const q = query.trim().toLowerCase();

  const result = students.filter((s) => {
    const name = (s.student_name || "").toLowerCase();
    const id = String(s.student_number || "");
    const course = (s.course || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const phone = String(s.phone || "");

    switch (filterCategory) {
      case "name": return name.includes(q);
      case "id": return id.includes(q);
      case "course": return course.includes(q);
      case "email": return email.includes(q);
      case "phone": return phone.includes(q);
      case "all":
      default:
        return (
          name.includes(q) ||
          id.includes(q) ||
          course.includes(q) ||
          email.includes(q) ||
          phone.includes(q)
        );
    }
  });

  setFilteredStudents(result);
}, [query, filterCategory, students]);

//request view list
const handleApprove = (req) => {
  alert(`Approved ${req.student_number}`);
  setPendingRequests(prev => prev.filter(r => r.student_number !== req.student_number));
  setShowRequestDetails(false);
};

const handleReject = (req) => {
  alert(`Rejected ${req.student_number}`);
  setPendingRequests(prev => prev.filter(r => r.student_number !== req.student_number));
  setShowRequestDetails(false);
};

  // ------------------ Render ------------------
  return (
    <div className="w-screen h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1f2937] text-white flex flex-col py-6 shadow-xl border-r border-gray-800">
        <div className="flex items-center gap-3 px-4 mb-8">
          <img
            src="/cvsu-logo.png"
            alt="logo"
            className="w-11 h-11 rounded-md object-cover shadow-sm border border-gray-700"
          />
          <div>
            <h1 className="text-lg font-semibold">GUIDANCE OFFICE</h1>
            <p className="text-xs text-gray-300">CvSU — Admin</p>
          </div>
        </div>

        <nav className="px-3 flex-1">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all ${
                    activePage === item.id ? "bg-green-600 shadow-inner" : "hover:bg-gray-700/60"
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-4 mt-auto pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
 
     <main className="flex-1 flex flex-col">
     {/* Updated Header with Account Dropdown */}
      <header className="w-full h-16 bg-[#1f2937] text-white shadow-md flex items-center justify-between px-6 relative">
        <div></div>

      {/* USER ICON (TOP RIGHT) */}
  <div className="relative">

  {user.profile_pic && user.profile_pic !== "default.png" ? (
    <img
      src={
        typeof user.profile_pic === "string"
          ? user.profile_pic
          : URL.createObjectURL(user.profile_pic)
        }
      alt="Profile"
      className="w-10 h-10 rounded-full object-cover cursor-pointer"
      onClick={() => setShowAccountDropdown((prev) => !prev)}
      onError={(e) => {
        e.target.src = ""; // clear broken image
        setUser((prev) => ({ ...prev, profile_pic: null })); // fallback to icon
      }}
    />
  ) : (
    <UserCircleIcon
      className="w-10 h-10 text-gray-300 cursor-pointer"
      onClick={() => setShowAccountDropdown((prev) => !prev)}
    />
  )}

  {/* DROPDOWN */}
  {showAccountDropdown && (
    <div
      id="account-dropdown"
      className="absolute right-0 mt-2 w-64 bg-[#1f2937] text-white rounded-xl shadow-lg overflow-hidden z-50"
    >
      <div className="p-4 flex flex-col items-center space-y-2">

        {/* DROPDOWN PROFILE PREVIEW */}
        <div className="relative">
          {profilePicPreview ||
          (user.profile_pic && user.profile_pic !== "default.png") ? (
            <img
              src={
                profilePicPreview ||
                (typeof user.profile_pic === "string"
                  ? user.profile_pic
                  : URL.createObjectURL(user.profile_pic))
              }
              alt="Profile"
              className="rounded-full w-16 h-16 object-cover"
              onError={(e) => {
                e.target.src = "";
                setUser((prev) => ({ ...prev, profile_pic: null }));
              }}
            />
          ) : (
            <UserCircleIcon className="w-16 h-16 text-gray-400" />
          )}

          {/* UPLOAD BUTTON */}
          <label className="absolute bottom-0 right-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 border-2 border-white">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                setProfilePicPreview(URL.createObjectURL(file));

                const formData = new FormData();
                formData.append("profile_pic", file);
                formData.append("admin_id", user.id);

                try {
                  const res = await fetch(
                    "http://localhost:5000/admin/upload_profile",
                    { method: "POST", body: formData }
                  );

                  const data = await res.json();
                  if (res.ok) {
                    setUser((prev) => ({
                      ...prev,
                      profile_pic: data.profile_pic,
                    }));
                  }
                } catch (err) {
                  console.error("Upload error:", err);
                }
              }}
            />
            <span className="text-white text-sm font-bold">+</span>
          </label>
        </div>
            {/* Email */}
            <p className="font-bold">Hi, Admin!</p>
            <p className="text-sm text-gray-300">{user.email}</p>
          </div>
          </div>
                )}
          </div>
        </header>
        <section className="p-8 overflow-auto h-[calc(100vh-4rem)]">
          <h2 className="text-3xl font-bold text-gray-700 mb-6">
            {activePage === "trends" && "Behavioral Trends"}
            {activePage === "records" && "Students Records"}
            {activePage === "search" && "Students Violation"}
            {activePage === "violation" && "Encode Violation (NLP)"}
            {activePage === "uploadFileFormat" && "Upload File Format"}
            {activePage === "news" && "News Management"}
          </h2>

    {/* Trends */}
      {activePage === "trends" && (
        <div className="space-y-8">

          {/* LINE CHART */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Monthly Behavioral Case Trends
            </h3>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#16a34a"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* BAR CHART */}
<div className="bg-white p-6 rounded-xl shadow-lg">
  <h3 className="text-xl font-semibold text-gray-700 mb-4">
    Case Count Per Section
  </h3>

  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={sectionData} barCategoryGap="30%">
      <CartesianGrid stroke="#e5e7eb" />
      <XAxis dataKey="section" />
      <YAxis />
      <Tooltip />

      {/* Centered legend */}
      <Legend
        verticalAlign="bottom"
        align="center"
        height={60} // adjust spacing if needed
        content={() => (
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {sectionData.map((entry, index) => (
              <div key={entry.section} className="flex items-center gap-1">
                <span
                  className="w-4 h-4 block"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                ></span>
                <span className="text-gray-700">{entry.section}</span>
              </div>
            ))}
          </div>
        )}
      />

      {/* Single Bar with per-cell colors */}
      <Bar dataKey="value">
        {sectionData.map((entry, index) => (
          <Cell
            key={entry.section}
            fill={chartColors[index % chartColors.length]}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

            {/* PIE CHART */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Case Distribution by Section
              </h3>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={sectionData}
                    dataKey="value"
                    nameKey="section"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {sectionData.map((entry, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
            )}

          {/* News */}
          {activePage === "news" && (
            <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
              {loadingRss && <p>Loading news…</p>}
              {!loadingRss && rssItems.length === 0 && <p>No news to show.</p>}
              {!loadingRss &&
                rssItems.map((item, idx) => (
                  <div key={idx} className="border-b pb-6 last:border-b-0">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-green-600 hover:underline"
                    >
                      {item.title || "No title"}
                    </a>
                    {item.source && (
                      <p className="text-sm text-gray-400 mt-1">Source: {item.source}</p>
                    )}
                  </div>
                ))}
            </div>
          )}

  {/* Search Students */}
{activePage === "search" && (
  <div className="space-y-6">

    {/* Search Section (Side) */}
    <div className="flex items-center space-x-4 w-full p-4">

      {/* Search Input */}
      <div className="flex items-center space-x-2 w-3/8">
        {/* Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M5 11a6 6 0 1112 0 6 6 0 01-12 0z"
          />
        </svg>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student..."
          className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Category Dropdown */}
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="all">All</option>
        <option value="name">Name</option>
        <option value="id">ID</option>
        <option value="course">Course</option>
        <option value="violation">Violation</option>
        <option value="gender">Gender</option>
        <option value="date">Date</option>
      </select>
    </div>

    {/* TABLE */}
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            {(filterCategory === "all" || filterCategory === "id") && <th className="py-3 px-4">Student Number</th>}
            {(filterCategory === "all" || filterCategory === "name") && <th className="py-3 px-4">Student Name</th>}
            {(filterCategory === "all" || filterCategory === "gender") && <th className="py-3 px-4">Gender</th>}
            {(filterCategory === "all" || filterCategory === "course") && <th className="py-3 px-4">Course/Year/Section</th>}
            {(filterCategory === "all" || filterCategory === "date") && <th className="py-3 px-4">Date</th>}
            {(filterCategory === "all" || filterCategory === "violation") && <th className="py-3 px-4">Violation</th>}
            <th className="py-3 px-10">Actions</th>
          </tr>
        </thead>

        <tbody>
          {(() => {
            const filtered = violations.filter((v) => {
              const q = (query || "").toLowerCase();
              if (!q) return true;

              const studentName = (v.student_name || "").toLowerCase();
              const studentId = String(v.student_id || "");
              const course = (v.course_year_section || "").toLowerCase();
              const violationText = (v.violation_text || "").toLowerCase();
              const dateStr = v.violation_date
                ? new Date(v.violation_date).toLocaleDateString("en-US")
                : "";
              const gender = v.gender?.toLowerCase() || "";

              switch (filterCategory) {
                case "name":
                  return studentName.includes(q);
                case "id":
                  return studentId.includes(q);
                case "course":
                  return course.includes(q);
                case "violation":
                  return violationText.includes(q);
                case "date":
                  return dateStr.includes(q);
                case "gender":
                  return gender.includes(q); // Searching gender filter
                case "all":
                default:
                  return (
                    studentName.includes(q) ||
                    studentId.includes(q) ||
                    course.includes(q) ||
                    violationText.includes(q) ||
                    dateStr.includes(q) ||
                    gender.includes(q)
                  );
              }
            });

            if (filtered.length === 0) {
              return (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No results found. Type to search...
                  </td>
                </tr>
              );
            }

            const formatDate = (dateStr) => {
              if (!dateStr) return "";
              const date = new Date(dateStr);
              const mm = String(date.getMonth() + 1).padStart(2, "0");
              const dd = String(date.getDate()).padStart(2, "0");
              const yy = String(date.getFullYear()).slice(-2);
              return `${mm}/${dd}/${yy}`;
            };

            return filtered.map((v, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                {(filterCategory === "all" || filterCategory === "id") && <td className="py-3 px-4">{v.student_id}</td>}
                {(filterCategory === "all" || filterCategory === "name") && <td className="py-3 px-4">{v.student_name}</td>}
                {(filterCategory === "all" || filterCategory === "gender") && <td className="py-3 px-4">{v.gender}</td>}
                {(filterCategory === "all" || filterCategory === "course") && <td className="py-3 px-4">{v.course_year_section}</td>}
                {(filterCategory === "all" || filterCategory === "date") && <td className="py-3 px-4">{formatDate(v.violation_date)}</td>}
                {(filterCategory === "all" || filterCategory === "violation") && <td className="py-3 px-4">{v.violation_text}</td>}

                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentViolation(v); // Set the clicked violation details
                        setShowViolationDetailsModal(true); // Open modal
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteViolation(v)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* Modal for Viewing Violation Details */}
{showViolationDetailsModal && currentViolation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black opacity-50"></div>

    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 z-10 overflow-y-auto max-h-[80vh]">
      <button
        onClick={() => setShowViolationDetailsModal(false)}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
      >
        ✕
      </button>

      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Violation Details</h3>

      <div className="space-y-4">
        {/* Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
            <p className="text-lg text-gray-900">{currentViolation.student_name}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
            <p className="text-lg text-gray-900">{currentViolation.student_id}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course/Year/Section</label>
            <p className="text-lg text-gray-900">{currentViolation.course_year_section}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
            <p className="text-lg text-gray-900">{currentViolation.gender}</p>
          </div>
        </div>

        {/* Violation Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Violation</label>
            <input
              type="text"
              value={currentViolation.predicted_violation || "—"}
              readOnly
              className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-green-500 text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
            <input
              type="text"
              value={currentViolation.predicted_section || "—"}
              readOnly
              className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-green-500 text-lg"
            />
          </div>
        </div>

        {/* Admin Note */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Violation Text (Admin Note)</label>
          <textarea
            value={currentViolation.violation_text || "No violation text available."}
            readOnly
            className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 resize-none"
            rows={4}
          />
        </div>

        {/* Standard Model Text */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Standard Model-Generated Text</label>
          <textarea
            value={currentViolation.standard_text || "No standard violation text available."}
            readOnly
            className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 resize-none"
            rows={4}
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
          <input
            type="text"
            value={currentViolation.violation_date || "—"}
            readOnly
            className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-green-500 text-lg"
          />
        </div>
      </div>

      {/* Actions: Close (red) + Download */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={() => setShowViolationDetailsModal(false)}
          className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Close
        </button>

        <button
          onClick={async () => {
            const doc = new Document({
              sections: [
                {
                  properties: {},
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Student Violation Record", bold: true, size: 28 })] }),
                    new Paragraph({ children: [new TextRun("")] }),
                    new Paragraph({ children: [new TextRun(`Student Name: ${currentViolation.student_name}`)] }),
                    new Paragraph({ children: [new TextRun(`Student ID: ${currentViolation.student_id}`)] }),
                    new Paragraph({ children: [new TextRun(`Course/Year/Section: ${currentViolation.course_year_section}`)] }),
                    new Paragraph({ children: [new TextRun(`Gender: ${currentViolation.gender}`)] }),
                    new Paragraph({ children: [new TextRun(`Violation: ${currentViolation.predicted_violation || "—"}`)] }),
                    new Paragraph({ children: [new TextRun(`Section: ${currentViolation.predicted_section || "—"}`)] }),
                    new Paragraph({ children: [new TextRun(`Admin Note: ${currentViolation.violation_text || "—"}`)] }),
                    new Paragraph({ children: [new TextRun(`Standard Model Text: ${currentViolation.standard_text || "—"}`)] }),
                    new Paragraph({ children: [new TextRun(`Date: ${currentViolation.violation_date || "—"}`)] }),
                  ],
                },
              ],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${currentViolation.student_name}_Violation.docx`);
          }}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Download as DOCX
        </button>
      </div>
    </div>
  </div>
)}


    {/* Encode Violation Section */}
    {activePage === "violation" && (
      <div className="space-y-4">
        {/* Button to open modal */}
        <div className="mb-6">
          <button
            onClick={() => setShowViolationModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Encode New Violation
          </button>
        </div>

        {/* Violation Modal for Submission */}
        {showViolationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Full-screen solid black overlay */}
            <div className="absolute inset-0 bg-black opacity-70"></div>

            {/* Modal content */}
            <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10 overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => {
                  setShowViolationModal(false);
                  setStudentInfo(null);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>

              <h3 className="text-2xl font-semibold text-gray-700 mb-6">Encode Student Violation</h3>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student full name"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                  <input
                    type="number"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course/Year/Section</label>
                  <input
                    type="text"
                    value={courseYearSection}
                    onChange={(e) => setCourseYearSection(e.target.value)}
                    placeholder="Enter Course/Year/Section"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Violation Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Interview Text</label>
                <textarea
                  value={violationText}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setViolationText(value);

                    if (value.trim() !== "") {
                      try {
                        const res = await fetch("http://127.0.0.1:5000/predict", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: value }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPredictedViolation(data.predicted_violation || "—");
                          setPredictedSection(data.predicted_section || "—");
                          setPredictiveText(data.predictive_text || "—");
                          setStandardText(data.standard_text || "No standard violation text available.");
                        }
                      } catch (err) {
                        console.error("Prediction error:", err);
                        setPredictedViolation("—");
                        setPredictedSection("—");
                        setPredictiveText("—");
                        setStandardText("No standard violation text available.");
                      }
                    } else {
                      setPredictedViolation("—");
                      setPredictedSection("—");
                      setPredictiveText("—");
                      setStandardText("No standard violation text available.");
                    }
                  }}
                  placeholder="Write interview details or violation text…"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={5}
                />
              </div>

              {/* Display Predicted Violation & Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Predicted Violation</label>
                  <input
                    type="text"
                    readOnly
                    value={predictedViolation || "—"}
                    className="w-full p-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Predicted Section</label>
                  <input
                    type="text"
                    readOnly
                    value={predictedSection || "—"}
                    className="w-full p-2 border rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* Display Predictive Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Predictive Text (Top-3)</label>
                <textarea
                  value={predictiveText || "—"}
                  readOnly
                  className="w-full p-2 border rounded-lg bg-gray-100 resize-none"
                  rows={3}
                />
              </div>

              {/* Display Standard Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Model-Generated Text</label>
                <textarea
                  value={standardText || "No standard violation text available."}
                  readOnly
                  className="w-full p-2 border rounded-lg bg-gray-100 resize-none"
                  rows={3}
                />
              </div>

              {/* Date (auto-filled to current date) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={violationDate}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  onChange={(e) => setViolationDate(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowViolationModal(false);
                    setStudentInfo(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitViolation}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Violation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Violation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {violations.length === 0 ? (
            <p className="text-gray-500 col-span-full">No violation records yet.</p>
          ) : (
          violations.map((v, idx) => {
        // Format violation date to MM/DD/YY
        const date = new Date(v.violation_date);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const yy = String(date.getFullYear()).slice(-2);
        const formattedDate = `${mm}/${dd}/${yy}`;

      return (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => {
            // Pass formattedDate with the violation
            setCurrentViolation({ ...v, formattedDate });
            setShowViolationDetailsModal(true); // Open modal
          }}
        >
          <p className="font-semibold text-gray-700 text-lg mb-2">
            {v.student_name} (Number: {v.student_id})
          </p>
          <p className="text-gray-600 mb-1">Gender: {v.gender}</p>
          <p className="text-gray-600 mb-1">CYS: {v.course_year_section}</p>

          {/* DESCRIPTION (truncated to prevent overflow) */}
          <p className="text-gray-600 mb-1 truncate" title={v.violation_text}>
            Admin Note: {v.violation_text}
          </p>

          {/* SECTION */}
          <p className="text-gray-600 mb-1">Section: {v.predicted_section || "—"}</p>

          {/* VIOLATION */}
          <p className="text-gray-600 mb-2">Violation: {v.predicted_violation || "—"}</p>

          <p className="text-sm text-gray-400">Date: {formattedDate}</p>
        </div>
      );
    })

      )}
    </div>

  {/* Modal for Viewing Violation Details */}
{showViolationDetailsModal && currentViolation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Full-screen solid black overlay */}
    <div className="absolute inset-0 bg-black opacity-70"></div>

    {/* Modal content */}
    <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10 overflow-y-auto max-h-[90vh]">
      <button
        onClick={() => setShowViolationDetailsModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
      >
        ✕
      </button>

      <h3 className="text-2xl font-semibold text-gray-700 mb-6">Violation Details</h3>

      <div className="space-y-4">
        {/* Display Student Info in a Formal Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <p className="text-gray-700">{currentViolation.student_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <p className="text-gray-700">{currentViolation.student_id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course/Year/Section</label>
            <p className="text-gray-700">{currentViolation.course_year_section}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <p className="text-gray-700">{currentViolation.gender}</p>
          </div>
        </div>

        {/* Display Violation Info (Editable or Read-Only Fields) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Violation</label>
            <input
              type="text"
              value={currentViolation.predicted_violation || "—"}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <input
              type="text"
              value={currentViolation.predicted_section || "—"}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
        </div>

        {/* Violation Text (Admin Note) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Violation Text (Admin Note)</label>
          <textarea
            value={currentViolation.violation_text || "No violation text available."}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100 resize-none"
            rows={3}
          />
        </div>

        {/* Standard Model-Generated Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Standard Model-Generated Text</label>
          <textarea
            value={currentViolation.standard_text || "No standard violation text available."}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100 resize-none"
            rows={3}
          />
        </div>

        {/* Date (Editable) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="text"
            value={currentViolation.formattedDate || "—"}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100"
          />
        </div>
      </div>
<div className="flex justify-end gap-2 mt-6">
  <button
    onClick={() => downloadViolationDoc(currentViolation)}
    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
  >
    Download as DOCX
  </button>

<button
  onClick={() => setShowViolationDetailsModal(false)}
  className="px-4 py-2 rounded-lg border border-red-500 text-white bg-red-500 hover:bg-red-600 transition-colors"
>
  Close
</button>

</div>

    </div>
  </div>
)}

  </div>
)}

   {/* ===== Upload File Section ===== */}
{activePage === "uploadFileFormat" && (
  <div className="flex flex-col items-center space-y-6">

    {/* SIDE-BY-SIDE WRAPPER */}
    <div className="w-full flex justify-center gap-6">

      {/* Good Moral Certificate */}
      <div className="bg-white shadow rounded-lg p-6 w-[500px] flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-center">Good Moral Certificate</h3>

        {/* View Request List Button with notification */}
        <button
          className="relative bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 self-end"
          onClick={() => setShowRequestList(true)}
        >
          View Request List
          {pendingRequests.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {pendingRequests.length}
            </span>
          )}
        </button>

        {/* File Display */}
        {currentGoodMoral ? (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 border p-2 rounded">
              <div className="flex items-center gap-3">
                {(() => {
                  const ext = currentGoodMoral.name?.split(".").pop().toLowerCase();
                  switch (ext) {
                    case "pdf": return <span className="text-red-600 text-5xl">📄</span>;
                    case "doc":
                    case "docx": return <span className="text-blue-600 text-5xl">📝</span>;
                    case "jpg":
                    case "jpeg":
                    case "png": return <span className="text-green-600 text-5xl">🖼️</span>;
                    default: return <span className="text-gray-600 text-5xl">📁</span>;
                  }
                })()}
                <span
                  className="truncate font-medium cursor-pointer hover:underline"
                  onClick={() => setPreviewFile(currentGoodMoral)}
                >
                  {currentGoodMoral.name || "Uploaded File"}
                </span>
              </div>
              <div className="mt-2 border rounded-lg h-64 overflow-auto flex items-center justify-center p-2 w-full">
                {currentGoodMoral.name.endsWith(".pdf") ? (
                  <embed src={currentGoodMoral.url} type="application/pdf" className="w-full h-full" />
                ) : (
                  <img src={currentGoodMoral.url} className="w-full h-auto object-contain" />
                )}
              </div>
            </div>

            {/* Change File Button */}
            <label className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors cursor-pointer self-start mt-2">
              Change File
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setCurrentGoodMoral({ name: file.name, file });

                  const uploaded = await uploadFile(file, "good_moral");
                  if (uploaded?.url) {
                    setCurrentGoodMoral((prev) => ({ ...prev, url: uploaded.url }));
                  }
                }}
              />
            </label>
          </div>
        ) : (
          <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-green-500 transition-colors text-center">
            <span className="text-6xl mb-2">📁</span>
            <span className="text-gray-500 mb-2">Click here to upload</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                setCurrentGoodMoral({ name: file.name, file });

                const uploaded = await uploadFile(file, "good_moral");
                if (uploaded?.url) {
                  setCurrentGoodMoral((prev) => ({ ...prev, url: uploaded.url }));
                }
              }}
            />
            <span className="text-sm text-gray-400">Allowed: PDF, DOC, DOCX, JPG, PNG</span>
          </label>
        )}
      </div>

      {/* ===== CVSU Rules & Regulations ===== */}
      <div className="bg-white shadow rounded-lg p-6 w-[500px] flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-center">CVSU Rules and Regulations</h3>
        {currentRules ? (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 border p-2 rounded">
              <div className="flex items-center gap-3">
                {(() => {
                  const ext = currentRules.name?.split(".").pop().toLowerCase();
                  switch (ext) {
                    case "pdf": return <span className="text-red-600 text-5xl">📄</span>;
                    case "doc":
                    case "docx": return <span className="text-blue-600 text-5xl">📝</span>;
                    case "jpg":
                    case "jpeg":
                    case "png": return <span className="text-green-600 text-5xl">🖼️</span>;
                    default: return <span className="text-gray-600 text-5xl">📁</span>;
                  }
                })()}
                <span
                  className="truncate font-medium cursor-pointer hover:underline"
                  onClick={() => setPreviewFile(currentRules)}
                >
                  {currentRules.name}
                </span>
              </div>
              <div className="mt-2 border rounded-lg h-64 overflow-auto flex items-center justify-center p-2 w-full">
                {currentRules.name.endsWith(".pdf") ? (
                  <embed src={currentRules.url} type="application/pdf" className="w-full h-full" />
                ) : (
                  <img src={currentRules.url} className="w-full h-auto object-contain" />
                )}
              </div>
            </div>

            <label
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors cursor-pointer self-start mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              Change File
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setCurrentRules({ name: file.name, file });

                  const uploaded = await uploadFile(file, "rules");
                  if (uploaded?.url) {
                    setCurrentRules((prev) => ({ ...prev, url: uploaded.url }));
                  }
                }}
              />
            </label>
          </div>
        ) : (
          <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors text-center">
            <span className="text-6xl mb-2">📁</span>
            <span className="text-gray-500 mb-2">Click here to upload</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                setCurrentRules({ name: file.name, file });

                const uploaded = await uploadFile(file, "rules");
                if (uploaded?.url) {
                  setCurrentRules((prev) => ({ ...prev, url: uploaded.url }));
                }
              }}
            />
            <span className="text-sm text-gray-400">Allowed: PDF, DOC, DOCX, JPG, PNG</span>
          </label>
        )}
      </div>
    </div>

    {/* ===== Fullscreen File Preview ===== */}
    {previewFile && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-5xl max-h-[90vh] rounded shadow-lg bg-white/90 flex flex-col">

          <button
            onClick={() => setPreviewFile(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg transition-colors z-10"
          >
            ✕
          </button>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            {previewFile.name.endsWith(".pdf") ? (
              <embed src={previewFile.url} type="application/pdf" className="w-full min-h-[500px] md:min-h-[600px]" />
            ) : (
              <img src={previewFile.url} className="max-w-full max-h-[80vh] object-contain" />
            )}
          </div>
        </div>
      </div>
    )}

    {/* ===== REQUEST LIST MODAL ===== */}
    {showRequestList && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-3xl max-h-[80vh] rounded shadow-lg bg-white flex flex-col">

          <button
            onClick={() => setShowRequestList(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            ✕
          </button>

          <h3 className="text-xl font-semibold text-center mt-4">Pending Requests</h3>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {pendingRequests.length === 0 ? (
              <p className="text-center text-gray-500">No pending requests</p>
            ) : (
              pendingRequests.map((req, idx) => (
                <button
                  key={idx}
                  className="w-full text-left border p-2 rounded hover:bg-gray-100"
                  onClick={() => {
                    setSelectedRequest(req);
                    setShowRequestDetails(true);
                  }}
                >
                  Student Number: {req.student_number}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    {/* ===== REQUEST DETAILS MODAL ===== */}
    {showRequestDetails && selectedRequest && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-2xl max-h-[70vh] rounded shadow-lg bg-white flex flex-col p-4">

          <button
            onClick={() => setShowRequestDetails(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            ✕
          </button>

          <h3 className="text-lg font-semibold mb-4">Request Details</h3>

          <div className="space-y-2">
            <p><strong>Student Number:</strong> {selectedRequest.student_number}</p>
            <p><strong>Section:</strong> {selectedRequest.section}</p>
            <p><strong>Violation:</strong> {selectedRequest.violation}</p>
            <p><strong>Status:</strong> {selectedRequest.status}</p>

            {selectedRequest.status === "Pending" && (
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  onClick={() => handleApprove(selectedRequest)}
                >
                  Approve
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => handleReject(selectedRequest)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

  </div>
)}
         {/*========== Student Records ================= */}
                {activePage === "records" && (
                  <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-xl font-semibold text-gray-700">Student Records</h3>

                    {/* Search Input + Category */}
                    <div className="flex items-center space-x-2 max-w-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-4.35-4.35M5 11a6 6 0 1112 0 6 6 0 01-12 0z"
                        />
                      </svg>

                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search student..."
                        className="w-full pl-2 pr-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />

                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All</option>
                        <option value="name">Name</option>
                        <option value="id">ID</option>
                        <option value="course">Course</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>

                    {/* Students Table */}
                    <div className="overflow-x-auto border rounded">
                      <table className="min-w-full text-left">
                        <thead className="bg-gray-200 text-gray-700">
                          <tr>
                            {(filterCategory === "all" || filterCategory === "id") && <th className="px-4 py-2">ID</th>}
                            {(filterCategory === "all" || filterCategory === "name") && <th className="px-4 py-2">Student Name</th>}
                            {(filterCategory === "all" || filterCategory === "id") && <th className="px-4 py-2">Student Number</th>}
                            {(filterCategory === "all" || filterCategory === "email") && <th className="px-4 py-2">Email</th>}
                            {(filterCategory === "all" || filterCategory === "phone") && <th className="px-4 py-2">Phone Number</th>}
                            {(filterCategory === "all" || filterCategory === "course") && <th className="px-4 py-2">Course</th>}
                            <th className="px-4 py-2">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-gray-500">
                                No students found.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((s) => (
                              <tr key={s.id} className="border-b last:border-b-0">
                                {(filterCategory === "all" || filterCategory === "id") && <td className="py-3 px-4">{s.id}</td>}
                                {(filterCategory === "all" || filterCategory === "name") && <td className="py-3 px-4">{s.student_name}</td>}
                                {(filterCategory === "all" || filterCategory === "id") && <td className="py-3 px-4">{s.student_number}</td>}
                                {(filterCategory === "all" || filterCategory === "email") && <td className="py-3 px-4">{s.email}</td>}
                                {(filterCategory === "all" || filterCategory === "phone") && <td className="py-3 px-4">{s.phone}</td>}
                                {(filterCategory === "all" || filterCategory === "course") && <td className="py-3 px-4">{s.course}</td>}
                                <td className="py-3 px-4 flex gap-2">
                                  <button
                                    onClick={() => setViewStudent(s)}
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <EyeIcon className="w-4 h-4" /> View
                                  </button>
                                  <button
                                    onClick={() => setDeleteStudent(s)}
                                    className="text-red-600 hover:underline flex items-center gap-1"
                                  >
                                    <TrashIcon className="w-4 h-4" /> Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* View Modal */}
                    {viewStudent && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-black opacity-70"
                          onClick={() => handleViewStudent(null)}
                        ></div>
                        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-10">
                          <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                            onClick={() => handleViewStudent(null)}
                          >
                            <XMarkIcon className="w-6 h-6" />
                          </button>
                          <h3 className="text-lg font-semibold mb-4">Student Details</h3>
                          <p><strong>Name:</strong> {viewStudent.student_name}</p>
                          <p><strong>Number:</strong> {viewStudent.student_number}</p>
                          <p><strong>Email:</strong> {viewStudent.email}</p>
                          <p><strong>Phone:</strong> {viewStudent.phone}</p>
                          <p><strong>Course:</strong> {viewStudent.course}</p>
                        </div>
                      </div>
                    )}

                    {/* Delete Modal */}
                    {deleteStudent && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-black opacity-70"
                          onClick={() => handleDeleteStudent(null)}
                        ></div>
                        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm p-6 z-10">
                          <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                            onClick={() => handleDeleteStudent(null)}
                          >
                            <XMarkIcon className="w-6 h-6" />
                          </button>
                          <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                          <p>
                            Are you sure you want to delete <strong>{deleteStudent.id}</strong>?
                          </p>
                          <div className="mt-4 flex justify-end gap-2">
                            <button
                              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                              onClick={() => handleDeleteStudent(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                              onClick={handleConfirmDelete}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

            </section>
              </main>
            </div>
          );
         }
