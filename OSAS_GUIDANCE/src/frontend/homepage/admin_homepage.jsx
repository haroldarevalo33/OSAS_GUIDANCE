import React, { useState, useEffect, useCallback } from "react";
import {ChartBarIcon,NewspaperIcon,MagnifyingGlassIcon,PencilSquareIcon,ArrowRightOnRectangleIcon,UserGroupIcon,UserCircleIcon,DocumentPlusIcon, XMarkIcon, EyeIcon, TrashIcon} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import {LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,BarChart, Bar, PieChart, Pie, Cell, Legend} from "recharts";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminHome() {
  const [activePage, setActivePage] = useState("trends");
  const [query, setQuery] = useState("");
  const [rssItems, setRssItems] = useState([]);
  const [loadingRss, setLoadingRss] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
const [showModalMonthly, setShowModalMonthly] = useState(false);
const [showModalCourse, setShowModalCourse] = useState(false);
const [showModalSection, setShowModalSection] = useState(false);
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // default current year
const [years, setYears] = useState([]);

{/*downloadFullReport*/}
const downloadFullReport = () => {
  const doc = new jsPDF("p", "mm", "a4"); // portrait, mm, A4

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14; // normal margin
  const maxLineWidth = pageWidth - margin * 2;

  // ================= TITLE =================
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("Guidance Analytics Report", margin, 20);

  // ================= USE SELECTED YEAR =================
  const reportYear = selectedYear; // <- fix here

  // Filtered data
  const filteredLineData = lineData.filter(d => d.year === selectedYear);
  const filteredCourseData = courseData.filter(d => d.year === selectedYear);
  const filteredSectionData = sectionData.filter(d => d.year === selectedYear);

  // ================= DATA SUMMARIES =================
  const totalCases = filteredLineData.reduce((sum, item) => sum + item.cases, 0);
  const totalStudents = filteredCourseData.reduce((sum, item) => sum + item.value, 0);
  const totalSectionCases = filteredSectionData.reduce((sum, item) => sum + item.value, 0);

  // ================= GENERATE DYNAMIC PARAGRAPHS =================
  const paragraphs = [];

  paragraphs.push(
    `This report presents a comprehensive overview of guidance-related analytics for the academic year ${reportYear}. ` +
    `It encompasses detailed information on behavioral cases, student distribution across courses, and section-specific case counts. ` +
    `The purpose of this report is to provide data-driven insights to assist guidance personnel and administrative staff in monitoring trends, identifying areas requiring intervention, and implementing measures that support student welfare and a positive learning environment.`
  );

  // Monthly Behavioral Cases Analysis
  if (filteredLineData.length > 0) {
    const peakMonth = filteredLineData.reduce((prev, curr) => (curr.cases > prev.cases ? curr : prev));
    const lowestMonth = filteredLineData.reduce((prev, curr) => (curr.cases < prev.cases ? curr : prev));

    paragraphs.push(
      `Throughout the year, a total of ${totalCases} behavioral cases were recorded. ` +
      `The highest incidence was observed in ${peakMonth.month} with ${peakMonth.cases} reported cases, ` +
      `while the lowest occurred in ${lowestMonth.month}, with ${lowestMonth.cases} cases. ` +
      `These trends help identify critical periods where focused guidance and preventive strategies are necessary.`
    );
  }

  // Course distribution analysis
  if (filteredCourseData.length > 0) {
    const topCourse = filteredCourseData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev));
    paragraphs.push(
      `In terms of student enrollment, the institution recorded a total of ${totalStudents} students across all courses. ` +
      `Notably, the course '${topCourse.course}' had the highest enrollment, with ${topCourse.value} students. ` +
      `Understanding course enrollment distribution aids in resource allocation, program planning, and targeted guidance initiatives.`
    );
  }

  // Section-wise cases analysis
  if (filteredSectionData.length > 0) {
    const topSection = filteredSectionData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev));
    paragraphs.push(
      `Section-wise analysis revealed that section '${topSection.section}' recorded the highest number of behavioral cases at ${topSection.value}, ` +
      `contributing to a cumulative total of ${totalSectionCases} cases across all sections. ` +
      `Identifying sections with elevated cases allows for targeted counseling, intervention programs, and monitoring strategies.`
    );
  }

  // Suggestions
  paragraphs.push(
    `Based on the data analyzed, it is recommended to implement proactive measures including regular counseling sessions, awareness campaigns, and structured peer support programs. ` +
    `Special attention should be given during peak months to mitigate potential risks. ` +
    `Additionally, continuous monitoring and timely reporting of behavioral trends are encouraged to enhance student well-being and maintain a safe academic environment.`
  );

  // ================= ADD PARAGRAPHS =================
  doc.setFont("times", "normal");
  doc.setFontSize(12);

  let cursorY = 30;
  paragraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, maxLineWidth);
    lines.forEach((line) => {
      if (cursorY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += 7;
    });
    cursorY += 5;
  });

  // ================= TABLES =================
  const tables = [
    { title: "Monthly Behavioral Cases", data: filteredLineData.map(d => [d.month, d.cases]), head: ["Month", "Cases"], color: [22, 163, 74] },
    { title: "Students by Course", data: filteredCourseData.map(d => [d.course, d.value]), head: ["Course", "Students"], color: [234, 179, 8] },
    { title: "Cases per Section", data: filteredSectionData.map(d => [d.section, d.value]), head: ["Section", "Cases"], color: [139, 92, 246] },
  ];

  tables.forEach((table) => {
    if (cursorY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont("times", "bold");
    doc.text(table.title, margin, cursorY);
    cursorY += 5;

    autoTable(doc, {
      startY: cursorY,
      head: [table.head],
      body: table.data,
      theme: "grid",
      headStyles: { fillColor: table.color },
      styles: { font: "times" },
    });

    cursorY = doc.lastAutoTable.finalY + 10;
  });

  // ================= SAVE PDF =================
  doc.save(`Guidance_Analytics_Report_${reportYear}.pdf`);
};

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
  
// ================= STATES =================
const [lineData, setLineData] = useState([]);
const [sectionData, setSectionData] = useState([]);
const [courseData, setCourseData] = useState([]);
const [sections, setSections] = useState([]); // unique section names for legend
const chartColors = ["#10b981", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6"];

// ================= FETCH AND PROCESS DATA =================
useEffect(() => {
  let intervalId;

  const fetchViolations = async () => {
    try {
      const res = await fetch("/violations");
      const data = await res.json();

      //  LINE CHART (Monthly Cases with Year)
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthlyCounts = months.map((m, i) => ({
        month: m,
        cases: data.filter((v) => {
          const d = new Date(v.violation_date);
          return !isNaN(d) && d.getMonth() === i && d.getFullYear() === selectedYear;
        }).length,
        year: selectedYear,
      }));
      setLineData(monthlyCounts);

      // SECTION CHART
      const sectionCounts = {};
      data.forEach((v) => {
        const d = new Date(v.violation_date);
        if (isNaN(d) || d.getFullYear() !== selectedYear) return; // filter by selected year

        const sec = v.predicted_section && v.predicted_section !== "—" ? v.predicted_section : "Unknown";
        sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
      });
      const sectionArray = Object.keys(sectionCounts).map((sec) => ({
        section: sec,
        value: sectionCounts[sec],
        year: selectedYear,
      }));
      setSectionData(sectionArray);
      setSections(Object.keys(sectionCounts));

      //  COURSE CHART
      const courseCounts = {};
      data.forEach((v) => {
        const d = new Date(v.violation_date);
        if (isNaN(d) || d.getFullYear() !== selectedYear) return; // filter by selected year
        if (!v.course_year_section) return;

        const course = v.course_year_section.split(" ")[0].toUpperCase().trim();
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      });
      const courseArray = Object.keys(courseCounts).map((course) => ({
        course,
        value: courseCounts[course],
        year: selectedYear,
      }));
      setCourseData(courseArray);

      // UPDATE years list dynamically
      const uniqueYears = Array.from(new Set(data.map((v) => {
        const d = new Date(v.violation_date);
        return !isNaN(d) ? d.getFullYear() : null;
      }).filter(Boolean))).sort((a, b) => b - a);
      setYears(uniqueYears);

    } catch (err) {
      console.error("Failed to fetch violations:", err);
    }
  };

  // initial fetch
  fetchViolations();

  // poll every 5 seconds
  intervalId = setInterval(fetchViolations, 5000);

  // cleanup
  return () => clearInterval(intervalId);

}, [activePage, selectedYear]); // re-fetch when activePage or selectedYear changes
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

      setUser({
        id: data.admin_id,           // fixed key
        name: data.name || "Admin",
        email: data.email || "",
        profile_pic: data.profile_pic,  // backend already returns full URL
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
    { id: "records", label: "Accounts Record", icon: UserGroupIcon},
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
    Swal.fire({ icon: "error", title: "Error", text: "Invalid or Wrong Student Number." });
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


// ----------------- GOOD MORAL FUNCTIONS -----------------
const [currentAdminId] = useState(null);
// Fetch pending requests for admin
const fetchPendingRequests = async () => {
  try {
    const res = await fetch("http://localhost:5000/good-moral/admin/requests?status=Pending");
    const data = await res.json();

    // Map backend response to include proper display fields
    const formatted = data.map((req) => ({
      ...req,
      student_name: req.student_name || "N/A",
      course: req.course || "N/A",
    }));

    setPendingRequests(formatted);
  } catch (err) {
    console.error("Failed to fetch pending requests:", err);
  }
};

const handleApprove = async (request) => {
  try {
    const res = await fetch(`http://localhost:5000/good-moral/process/${request.request_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Approved", admin_id: currentAdminId }),
    });
    const data = await res.json();

    console.log("Approve response:", data);

    // Update frontend immediately
    setSelectedRequest((prev) => ({ ...prev, status: "Approved" }));

    // Refresh pending requests
    fetchPendingRequests();

    // Load file URL if approved
    if (data?.request?.filename_url) {
      setCurrentGoodMoral({
        name: data.request.filename_original,
        url: data.request.filename_url,
      });
    }

    setShowRequestDetails(false);
  } catch (err) {
    console.error("Failed to approve request:", err);
  }
};

const handleReject = async (request) => {
  try {
    const res = await fetch(`http://localhost:5000/good-moral/process/${request.request_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Rejected", admin_id: currentAdminId }),
    });
    const data = await res.json();

    console.log("Reject response:", data);

    setSelectedRequest((prev) => ({ ...prev, status: "Rejected" }));

    fetchPendingRequests();
    setShowRequestDetails(false);
  } catch (err) {
    console.error("Failed to reject request:", err);
  }
};

// Fetch all requests for a student (history)
const fetchStudentRequests = async (studentNumber) => {
  try {
    const res = await fetch(`http://localhost:5000/good-moral/history?student_number=${studentNumber}`);
    const data = await res.json();
    setStudentRequests(data);
  } catch (err) {
    console.error("Failed to fetch student requests:", err);
  }
};

// Automatically fetch pending requests when component mounts
useEffect(() => {
  fetchPendingRequests();
}, []);

// ===================== STATES ===================== //
const [courseFilter, setCourseFilter] = useState("ALL");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [sortOrder, setSortOrder] = useState("ASC");


// ===================== FETCH WHEN FILTERS CHANGE ===================== //
useEffect(() => {
  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams({
        search: query || "",
        course: courseFilter.toUpperCase(),
        startDate: dateFrom || "",
        endDate: dateTo || "",
        sort: sortOrder.toUpperCase(),
      });

      const res = await fetch(`http://localhost:5000/students/records?${params}`);
      const data = await res.json();

      setStudents(data);
      setFilteredStudents(data);

    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  fetchRecords();
}, [query, courseFilter, dateFrom, dateTo, sortOrder]);


// ===================== FETCH WHEN OPENING PAGE ===================== //
useEffect(() => {
  if (activePage !== "records") return;

  const load = async () => {
    const params = new URLSearchParams({
      search: query || "",
      course: courseFilter.toUpperCase(),
      startDate: dateFrom || "",
      endDate: dateTo || "",
      sort: sortOrder.toUpperCase(),
    });

    const res = await fetch(`http://localhost:5000/students/records?${params}`);
    const data = await res.json();

    setStudents(data);
    setFilteredStudents(data);
  };

  load();
}, [activePage]);


// ===================== RESET WHEN LEAVING ===================== //
useEffect(() => {
  if (activePage === "records") return;

  setQuery("");
  setCourseFilter("ALL");
  setDateFrom("");
  setDateTo("");
  setSortOrder("ASC");

  handleViewStudent(null);
  handleDeleteStudent(null);

}, [activePage]);

// ===================== SWEETALERT: VIEW ===================== //
useEffect(() => {
  if (!viewStudent) return;

  Swal.fire({
    title: `<strong>${viewStudent.student_name}</strong>`,
    html: `
      <div style="text-align:left; font-size:16px; line-height:1.6;">
        <p><strong>Student Number:</strong> ${viewStudent.student_number}</p>
        <p><strong>Email:</strong> ${viewStudent.email}</p>
        <p><strong>Phone:</strong> ${viewStudent.phone}</p>
        <p><strong>Course:</strong> ${viewStudent.course}</p>
        <p><strong>Date Registered:</strong> ${
          viewStudent.created_at?.slice(0,10) || "—"
        }</p>
      </div>
    `,
    width: 450,
    confirmButtonText: "Close",
  }).then(() => setViewStudent(null));
}, [viewStudent]);

// ===================== SWEETALERT: DELETE ===================== //
useEffect(() => {
  if (!deleteStudent) return;

  Swal.fire({
    title: "Confirm Delete",
    html: `Are you sure you want to delete <strong>${deleteStudent.student_name}</strong>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  }).then((res) => {
    if (res.isConfirmed) {
      handleConfirmDelete(deleteStudent);

      Swal.fire({
        title: "Deleted!",
        text: `${deleteStudent.student_name} has been removed.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setDeleteStudent(null);
  });
}, [deleteStudent]);

//-----------------Filter Search Violation---------------//
// ========================
// FETCH FILTERED RESULTS
// ========================
const fetchFilteredViolations = async () => {
  try {
    const params = new URLSearchParams();

    // q (search text)
    if (query.trim() !== "") {
      params.append("q", query.trim());
    }

    // course
    if (courseFilter !== "ALL") {
      params.append("course", courseFilter);
    }

    // date range
    if (dateFrom) params.append("startDate", dateFrom);
    if (dateTo) params.append("endDate", dateTo);

    // sort (ASC or DESC)
    params.append("sort", sortOrder);

    const response = await fetch(
      `http://localhost:5000/violations/search?${params.toString()}`
    );

    const data = await response.json();

    setViolations(data); // UPDATE TABLE
  } catch (error) {
    console.error("Filter fetch error:", error);
  }
};
useEffect(() => {
  fetchFilteredViolations();
}, [query, courseFilter, dateFrom, dateTo, sortOrder]);


  // ------------------ Render ------------------
  return (
    <div className="w-screen h-screen flex bg-gray-100 overflow-hidden">

  {/* ================= BURGER BUTTON (MOBILE) ================= */}
  <button
    onClick={() => setSidebarOpen(true)}
    className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-[#1f2937] rounded-md text-white"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
      viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>

  {/* ================= BACKDROP (Mobile Only) ================= */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/40 z-40 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* ================= SIDEBAR ================= */}
  <aside
    className={`
      w-64 bg-[#1f2937] text-white flex flex-col py-6 shadow-xl border-r border-gray-800
      fixed lg:static inset-y-0 left-0 z-50 transform
      transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}
  >


    {/* LOGO */}
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

    {/* MENU */}
    <nav className="px-3 flex-1 overflow-y-auto">
      <div className="flex flex-col space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setSidebarOpen(false); // auto close mobile
              }}
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

    {/* LOGOUT */}
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

  {/* ================= MAIN CONTENT ================= */}
  <main className="flex-1 flex flex-col lg:ml-0 ml-0">

    {/* HEADER */}
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
              e.target.src = "";
              setUser((prev) => ({ ...prev, profile_pic: null }));
            }}
          />
        ) : (
          <UserCircleIcon
            className="w-10 h-10 text-gray-300 cursor-pointer"
            onClick={() => setShowAccountDropdown((prev) => !prev)}
          />
        )}

        {showAccountDropdown && (
          <div
            id="account-dropdown"
            className="absolute right-0 mt-2 w-64 bg-[#1f2937] text-white rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 flex flex-col items-center space-y-2">

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

              <p className="font-bold">Hi, Admin!</p>
              <p className="text-sm text-gray-300">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>

    {/* PAGE CONTENT */}
    <section className="p-8 overflow-auto h-[calc(100vh-4rem)]">
      <h2 className="text-3xl font-bold text-gray-700 mb-6">
        {activePage === "trends" && "Behavioral Trends"}
        {activePage === "records" && "Student Account Records"}
        {activePage === "search" && "Students Violation"}
        {activePage === "violation" && "Encode Violation (NLP)"}
        {activePage === "uploadFileFormat" && "Upload File Format"}
        {activePage === "news" && "News Management"}
      </h2>
      
      {/* Trends */}
        {activePage === "trends" && (
          <div className="space-y-8">
            {/* ================= YEAR DROPDOWN ================= */}
            <div className="flex items-center justify-end space-x-2">
              <label className="font-sans font-medium text-gray-700">Select Year:</label>
              <select
                className="border rounded px-2 py-1 font-sans"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* ================= SUMMARY CARDS ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Behavioral Cases */}
              <div className="relative bg-green-50 border border-green-200 rounded-2xl shadow-md p-6">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-green-600 rounded-l-2xl"></div>
                <div className="pl-4">
                  <p className="text-sm text-gray-600 font-sans">
                    Total Behavioral Cases ({selectedYear})
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-2 font-sans">
                    {lineData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.cases, 0)}
                  </p>
                  <button
                    className="mt-3 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition font-sans"
                    onClick={() => setShowModalMonthly(true)}
                  >
                    View Monthly Cases
                  </button>
                </div>
              </div>

              {/* Total Students by Course */}
              <div className="relative bg-yellow-50 border border-yellow-200 rounded-2xl shadow-md p-6">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-yellow-500 rounded-l-2xl"></div>
                <div className="pl-4">
                  <p className="text-sm text-gray-600 font-sans">
                    Total Students by Course ({selectedYear})
                  </p>
                  <p className="text-3xl font-bold text-yellow-800 mt-2 font-sans">
                    {courseData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.value, 0)}
                  </p>
                  <button
                    className="mt-3 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition font-sans"
                    onClick={() => setShowModalCourse(true)}
                  >
                    View Students by Course
                  </button>
                </div>
              </div>

              {/* Total Cases per Section */}
              <div className="relative bg-purple-50 border border-purple-200 rounded-2xl shadow-md p-6">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-purple-600 rounded-l-2xl"></div>
                <div className="pl-4">
                  <p className="text-sm text-gray-600 font-sans">
                    Total Cases per Section ({selectedYear})
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mt-2 font-sans">
                    {sectionData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.value, 0)}
                  </p>
                  <button
                    className="mt-3 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition font-sans"
                    onClick={() => setShowModalSection(true)}
                  >
                    View Cases per Section
                  </button>
                </div>
              </div>
            </div>

        {/* ================= MAIN GRID (Charts) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LINE CHART */}
            <div className="lg:col-span-2 bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-4 font-sans">
                Monthly Behavioral Case Trends ({selectedYear})
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineData.filter((d) => d.year === selectedYear)}>
                  <CartesianGrid stroke="#d1fae5" />
                  <XAxis dataKey="month" />
                  <YAxis
                    allowDecimals={false} // whole numbers lang
                    domain={[0, (dataMax) => Math.ceil(dataMax)]} // auto-adjust to ceiling ng max value
                    tickFormatter={(value) => Math.floor(value)} // siguraduhin whole number sa ticks
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

              {/* PIE CHART */}
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 text-center font-sans">
                  Course Distribution ({selectedYear})
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={courseData.filter((d) => d.year === selectedYear)}
                      dataKey="value"
                      nameKey="course"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {courseData
                        .filter((d) => d.year === selectedYear)
                        .map((entry, index) => (
                          <Cell
                            key={index}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ================= BAR CHART ================= */}
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 font-sans">
                Case Count Per Section ({selectedYear})
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={sectionData.filter((d) => d.year === selectedYear)}
                  barCategoryGap="30%"
                >
                  <CartesianGrid stroke="#d1fae5" />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={50}
                    content={() => (
                      <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm font-sans">
                        {sectionData
                          .filter((d) => d.year === selectedYear)
                          .map((entry, index) => (
                            <div key={entry.section} className="flex items-center gap-1">
                              <span
                                className="w-3 h-3 block rounded"
                                style={{
                                  backgroundColor:
                                    chartColors[index % chartColors.length],
                                }}
                              ></span>
                              <span className="text-gray-700">{entry.section}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  />
                  <Bar dataKey="value">
                    {sectionData
                      .filter((d) => d.year === selectedYear)
                      .map((entry, index) => (
                        <Cell
                          key={entry.section}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ================= DOWNLOAD BUTTON ================= */}
            <div className="flex justify-end">
              <button
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:bg-green-700 transition font-sans"
                onClick={downloadFullReport}
              >
                Download Report
              </button>
            </div>

            {/* ================= MODALS ================= */}
            {/* Monthly Cases Modal */}
            {showModalMonthly && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative bg-blue-50 rounded-2xl p-6 w-11/12 max-w-2xl max-h-[60vh] overflow-y-auto shadow-xl font-sans">
                  <button
                    className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 font-bold text-xl"
                    onClick={() => setShowModalMonthly(false)}
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-semibold text-green-800 mb-4 text-center">
                    Total Behavioral Cases:{" "}
                    {lineData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.cases, 0)}
                  </h3>
                  <div className="divide-y divide-gray-300">
                    {lineData
                      .filter((d) => d.year === selectedYear)
                      .map((item) => (
                        <div
                          key={item.month}
                          className="flex justify-between py-2 text-green-900 font-medium"
                        >
                          <span>{item.month}</span>
                          <span>{item.cases}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Students by Course Modal */}
            {showModalCourse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative bg-blue-50 rounded-2xl p-6 w-11/12 max-w-2xl max-h-[60vh] overflow-y-auto shadow-xl font-sans">
                  <button
                    className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 font-bold text-xl"
                    onClick={() => setShowModalCourse(false)}
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-semibold text-yellow-800 mb-4 text-center">
                    Total Students by Course:{" "}
                    {courseData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.value, 0)}
                  </h3>
                  <div className="divide-y divide-gray-300">
                    {courseData
                      .filter((d) => d.year === selectedYear)
                      .map((item) => (
                        <div
                          key={item.course}
                          className="flex justify-between py-2 text-yellow-900 font-medium"
                        >
                          <span>{item.course}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cases per Section Modal */}
            {showModalSection && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative bg-blue-50 rounded-2xl p-6 w-11/12 max-w-2xl max-h-[60vh] overflow-y-auto shadow-xl font-sans">
                  <button
                    className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 font-bold text-xl"
                    onClick={() => setShowModalSection(false)}
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-semibold text-purple-800 mb-4 text-center">
                    Total Cases per Section:{" "}
                    {sectionData
                      .filter((d) => d.year === selectedYear)
                      .reduce((sum, item) => sum + item.value, 0)}
                  </h3>
                  <div className="divide-y divide-gray-300">
                    {sectionData
                      .filter((d) => d.year === selectedYear)
                      .map((item) => (
                        <div
                          key={item.section}
                          className="flex justify-between py-2 text-purple-900 font-medium"
                        >
                          <span>{item.section}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
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

            {/* Search Section (Aligned to Backend Filters) */}
              <div className="flex flex-wrap items-center gap-4 w-full p-4 bg-blue-50 rounded-lg shadow">

                {/* Search Input (q) */}
                <div className="flex items-center space-x-2 flex-1 min-w-[250px] bg-white px-3 py-2 rounded-lg shadow-inner border border-blue-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
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
                    placeholder="Search anything (name, id, text...)"
                    className="w-full bg-transparent focus:outline-none text-gray-700"
                  />
                </div>

                {/* Course Filter */}
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="border border-blue-300 rounded-lg px-3 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Courses</option>
                  <option value="BEED">BEED</option>
                  <option value="BSED">BSED</option>
                  <option value="BSBM">BSBM</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSFAS">BSFAS</option>
                </select>

                {/* Date Range */}
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-blue-300 rounded-lg px-3 py-2 bg-white shadow"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-blue-300 rounded-lg px-3 py-2 bg-white shadow"
                />

                {/* Sort ASC / DESC */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-blue-300 rounded-lg px-3 py-2 bg-white shadow"
                >
                  <option value="ASC">A → Z</option>
                  <option value="DESC">Z → A</option>
                </select>
              </div>

            {/* TABLE */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-blue-300">
              <table className="w-full text-left">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {(filterCategory === "all" || filterCategory === "id") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Student Number</th>
                    )}
                    {(filterCategory === "all" || filterCategory === "name") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Student Name</th>
                    )}
                    {(filterCategory === "all" || filterCategory === "gender") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Gender</th>
                    )}
                    {(filterCategory === "all" || filterCategory === "course") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Course/Year/Section</th>
                    )}
                    {(filterCategory === "all" || filterCategory === "date") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Date</th>
                    )}
                    {(filterCategory === "all" || filterCategory === "violation") && (
                      <th className="py-[11px] px-3 text-sm font-semibold">Violation</th>
                    )}
                    <th className="py-[11px] px-6 text-sm font-semibold">Actions</th>
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
                          return gender.includes(q);
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
                      <tr
                        key={idx}
                        className="border-b border-blue-200 last:border-b-0 hover:bg-blue-100 transition"
                      >
                        {(filterCategory === "all" || filterCategory === "id") && (
                          <td className="py-3 px-4">{v.student_id}</td>
                        )}
                        {(filterCategory === "all" || filterCategory === "name") && (
                          <td className="py-3 px-4">{v.student_name}</td>
                        )}
                        {(filterCategory === "all" || filterCategory === "gender") && (
                          <td className="py-3 px-4">{v.gender}</td>
                        )}
                        {(filterCategory === "all" || filterCategory === "course") && (
                          <td className="py-3 px-4">{v.course_year_section}</td>
                        )}
                        {(filterCategory === "all" || filterCategory === "date") && (
                          <td className="py-3 px-4">{formatDate(v.violation_date)}</td>
                        )}
                       {(filterCategory === "all" || filterCategory === "violation") && (
                          <td className="py-3 px-4 w-[280px]">
                            <div
                              className="
                                max-w-[260px]
                                whitespace-nowrap
                                overflow-hidden
                                text-ellipsis
                              "
                              title={v.violation_text}
                            >
                              {v.violation_text}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCurrentViolation(v);
                                setShowViolationDetailsModal(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                            >
                              View
                            </button>

                            <button
                              onClick={() => handleDeleteViolation(v)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
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

        

  {showViolationDetailsModal && currentViolation && (() => {
  const v = currentViolation;

  // ===== DOCX DOWNLOAD FUNCTION ===== //
  const downloadDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Student Violation Record",
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph(""),

            new Paragraph(`Student Name: ${v.student_name}`),
            new Paragraph(`Student ID: ${v.student_id}`),
            new Paragraph(`Course/Year/Section: ${v.course_year_section}`),
            new Paragraph(`Gender: ${v.gender}`),
            new Paragraph(`Violation: ${v.predicted_violation || "—"}`),
            new Paragraph(`Section: ${v.predicted_section || "—"}`),
            new Paragraph(`Admin Note: ${v.violation_text || "—"}`),
            new Paragraph(`Standard Model Text: ${v.standard_text || "—"}`),
            new Paragraph(`Date: ${v.violation_date || "—"}`),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${v.student_name}_Violation.docx`);
  };

  // ===== SWEETALERT POPUP ===== //
  Swal.fire({
    title: `<strong style="font-size:22px;">Violation Details</strong>`,
    width: 750,
    background: "#ffffff",
    showCloseButton: true,
    confirmButtonText: "Close",
    confirmButtonColor: "#d33",

    showDenyButton: true,
    denyButtonText: "Download DOCX",
    denyButtonColor: "#3085d6",

    html: `
      <div style="text-align:left; font-size:15px;">

        <div style="font-size:20px; font-weight:bold; margin-bottom:10px; text-align:center;">
          ${v.student_name}
        </div>

        <hr style="margin:10px 0;">

        <p><b>Student ID:</b> ${v.student_id}</p>
        <p><b>Course/Year/Section:</b> ${v.course_year_section}</p>
        <p><b>Gender:</b> ${v.gender}</p>

        <hr style="margin:10px 0;">

        <p><b>Violation:</b> ${v.predicted_violation || "—"}</p>
        <p><b>Section:</b> ${v.predicted_section || "—"}</p>

        <p style="margin-top:10px;"><b>Admin Note:</b><br>
        ${v.violation_text || "No violation text available."}</p>

        <p style="margin-top:10px;"><b>Standard Model Text:</b><br>
        ${v.standard_text || "No standard violation text available."}</p>

        <p style="margin-top:10px;"><b>Date:</b> ${v.violation_date || "—"}</p>

      </div>
    `,
  }).then((result) => {
    if (result.isDenied) {
      downloadDocx();
    }
  });

  setShowViolationDetailsModal(false);
})()}
{/* ======================= VIOLATION SECTION ======================= */}
{activePage === "violation" && (
  <div className="space-y-4">

    {/* Open Modal Button */}
    <div className="mb-6">
      <button
        onClick={() => setShowViolationModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Encode New Violation
      </button>
    </div>

   {/* ======================= VIOLATION FORM MODAL ======================= */}
{showViolationModal && (
<div className="fixed inset-0 z-[100] flex items-center justify-center">

  {/* Dark Background (NO BLUR) */}+
  <div className="absolute inset-0 bg-black/70"></div>
  

    {/* FORM MODAL */}
      <div
        className="w-full h-full max-w-4xl max-h-[90vh] overflow-y-auto
        bg-[#e8f5e9] border border-green-300 rounded-2xl shadow-2xl
        p-5 relative"
      >
      {/* Close Button */}
      <button
        onClick={() => {
          setShowViolationModal(false);
          setStudentInfo(null);
        }}
        className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl"
      >
        ✕
      </button>

      <h3 className="text-2xl font-semibold text-green-700 mb-6">
        Encode Student Violation
      </h3>

      {/* ================= FORM FIELDS ================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* FIELD */}
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Student Name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student full name"
            className="w-full p-2 border border-green-400 rounded-lg bg-white
              focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Student Number
          </label>
          <input
            type="number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter student number"
            className="w-full p-2 border border-green-400 rounded-lg bg-white
              focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Course/Year/Section
          </label>
          <input
            type="text"
            value={courseYearSection}
            onChange={(e) => setCourseYearSection(e.target.value)}
            placeholder="Enter Course/Year/Section"
            className="w-full p-2 border border-green-400 rounded-lg bg-white
              focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full p-2 border border-green-400 rounded-lg bg-white
              focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

      </div>

      {/* INTERVIEW TEXT */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-700 mb-1">
          Interview Text
        </label>
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
          className="w-full p-2 border border-green-400 rounded-lg bg-white
            focus:ring-2 focus:ring-green-500"
          rows={5}
        />
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Predicted Violation
          </label>
          <input
            type="text"
            readOnly
            value={predictedViolation || "—"}
            className="w-full p-2 border border-green-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-1">
            Predicted Section
          </label>
          <input
            type="text"
            readOnly
            value={predictedSection || "—"}
            className="w-full p-2 border border-green-300 rounded-lg bg-gray-100"
          />
        </div>
      </div>

      {/* Predictive Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-700 mb-1">
          Predictive Text (Top-3)
        </label>
        <textarea
          value={predictiveText || "—"}
          readOnly
          className="w-full p-2 border border-green-300 rounded-lg bg-gray-100 resize-none"
          rows={3}
        />
      </div>

      {/* Standard Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-700 mb-1">
          Standard Model-Generated Text
        </label>
        <textarea
          value={standardText || "No standard violation text available."}
          readOnly
          className="w-full p-2 border border-green-300 rounded-lg bg-gray-100 resize-none"
          rows={3}
        />
      </div>

      {/* Date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-green-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={violationDate}
          onChange={(e) => setViolationDate(e.target.value)}
          className="w-full p-2 border border-green-400 rounded-lg bg-white
            focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setShowViolationModal(false);
            setStudentInfo(null);
          }}
          className="px-4 py-2 rounded-lg border border-green-300 text-green-700 bg-white
            hover:bg-green-50 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmitViolation}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Submit Violation
        </button>
      </div>

    </div>

  </div>
)}

    {/* ======================= VIOLATION CARDS ======================= */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {violations.length === 0 ? (
        <p className="text-gray-500 col-span-full">No violation records yet.</p>
      ) : (
        violations.map((v, idx) => {
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
                setCurrentViolation({ ...v, formattedDate });
                setShowViolationDetailsModal(true);
              }}
            >
              <p className="font-semibold text-gray-700 text-lg mb-2">
                {v.student_name} (Number: {v.student_id})
              </p>
              <p className="text-gray-600 mb-1">Gender: {v.gender}</p>
              <p className="text-gray-600 mb-1">CYS: {v.course_year_section}</p>

              <p className="text-gray-600 mb-1 truncate" title={v.violation_text}>
                Admin Note: {v.violation_text}
              </p>

              <p className="text-gray-600 mb-1">Section: {v.predicted_section || "—"}</p>
              <p className="text-gray-600 mb-2">Violation: {v.predicted_violation || "—"}</p>

              <p className="text-sm text-gray-400">Date: {formattedDate}</p>
            </div>
          );
        })
      )}
    </div>

    {/* ======================= SWEETALERT VIEW DETAILS ======================= */}
    {showViolationDetailsModal && currentViolation && (() => {
      const v = currentViolation;

      const downloadDocx = async () => {
        const doc = new Document({
          sections: [
            {
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Student Violation Record",
                      bold: true,
                      size: 32,
                    }),
                  ],
                }),
                new Paragraph(""),

                new Paragraph(`Student Name: ${v.student_name}`),
                new Paragraph(`Student ID: ${v.student_id}`),
                new Paragraph(`Course/Year/Section: ${v.course_year_section}`),
                new Paragraph(`Gender: ${v.gender}`),
                new Paragraph(`Violation: ${v.predicted_violation}`),
                new Paragraph(`Section: ${v.predicted_section}`),
                new Paragraph(`Admin Note: ${v.violation_text}`),
                new Paragraph(`Standard Model Text: ${v.standard_text}`),
                new Paragraph(`Date: ${v.formattedDate}`),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${v.student_name}_Violation.docx`);
      };

      Swal.fire({
        title: `<strong style="font-size:22px;">Violation Details</strong>`,
        width: 750,
        background: "#ffffff",
        showCloseButton: true,
        confirmButtonText: "Close",
        confirmButtonColor: "#d33",

        showDenyButton: true,
        denyButtonText: "Download DOCX",
        denyButtonColor: "#3085d6",

        html: `
          <div style="text-align:left; font-size:15px;">

            <div style="font-size:20px; font-weight:bold; margin-bottom:10px; text-align:center;">
              ${v.student_name}
            </div>

            <hr style="margin:10px 0;">

            <p><b>Student ID:</b> ${v.student_id}</p>
            <p><b>Course/Year/Section:</b> ${v.course_year_section}</p>
            <p><b>Gender:</b> ${v.gender}</p>

            <hr style="margin:10px 0;">

            <p><b>Violation:</b> ${v.predicted_violation}</p>
            <p><b>Section:</b> ${v.predicted_section}</p>

            <p style="margin-top:10px;"><b>Admin Note:</b><br>
            ${v.violation_text}</p>

            <p style="margin-top:10px;"><b>Standard Model Text:</b><br>
            ${v.standard_text}</p>

            <p style="margin-top:10px;"><b>Date:</b> ${v.formattedDate}</p>

          </div>
        `,
      }).then((result) => {
        if (result.isDenied) downloadDocx();
      });

      setShowViolationDetailsModal(false);
    })()}
  </div>
)}
 
   {/* ===== Upload File Section ===== */}
  {activePage === "uploadFileFormat" && (
  <div className="flex flex-col items-center space-y-6">

    {/* SIDE-BY-SIDE WRAPPER */}
    <div className="w-full flex justify-center gap-6">

      {/* ================== GOOD MORAL CERTIFICATE UI ================== */}
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

        {/* File Upload / Display */}
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

                  const uploaded = await uploadFile(file, "good_moral"); // your existing upload function
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

      {/* ================== FULLSCREEN FILE PREVIEW ================== */}
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

      {/* ================== REQUEST LIST MODAL ================== */}
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
                    {req.student_name} ({req.student_number}) - {req.course || "N/A"}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
   {/* ================== REQUEST DETAILS MODAL ================== */}
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
        <p><strong>Name:</strong> {selectedRequest.student_name}</p>
        <p><strong>Course:</strong> {selectedRequest.course || ""}</p>
        <p><strong>Status:</strong> {selectedRequest.status}</p>

        {/* Approve / Reject Buttons */}
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
                  className="truncate font-medium cursor-pointer hover:underline max-w-xs block"
                  title={currentRules.name}
                  onClick={() => setPreviewFile(currentRules)}
                >
                  {(() => {
                    const parts = currentRules.name.split(".");
                    if (parts.length > 1) {
                      const ext = parts.pop(); // kunin ang extension
                      let name = parts.join("."); // base name
                      if (name.length > 30) name = name.slice(0, 35) + "..."; // mas mahaba na truncate
                      return `${name}.${ext}`;
                    }
                    return currentRules.name;
                  })()}
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
        </div>
        )}

        {/*STUDENT RECORDS*/}
            {activePage === "records" && (
          <div className="bg-[#e8f5e9] p-6 rounded-xl shadow-lg space-y-6 border border-green-300">

            {/* ================= FILTER BAR ================= */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-lg 
            border border-green-300 shadow-sm">

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student..."
                className="flex-1 min-w-[200px] px-3 py-2 border border-green-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-lg bg-white 
                focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Courses</option>
                <option value="BEED">BEED</option>
                <option value="BSED">BSED</option>
                <option value="BSBM">BSBM</option>
                <option value="BSCS">BSCS</option>
                <option value="BSHM">BSHM</option>
                <option value="BSIT">BSIT</option>
                <option value="BSFAS">BSFAS</option>
              </select>

              <div className="flex items-center gap-2">
                <span className="text-green-700 font-medium">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-2 border border-green-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-green-700 font-medium">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-2 border border-green-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-lg bg-white 
                focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="asc">Sort A → Z</option>
                <option value="desc">Sort Z → A</option>
              </select>

            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-x-auto border border-green-300 rounded-lg bg-white">
              <table className="min-w-full text-left">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Student Number</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Date Registered</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-green-700">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-green-200 hover:bg-green-100 transition-colors"
                      >
                        <td className="py-3 px-4">{s.id}</td>
                        <td className="py-3 px-4">{s.student_name}</td>
                        <td className="py-3 px-4">{s.student_number}</td>
                        <td className="py-3 px-4">{s.email}</td>
                        <td className="py-3 px-4">{s.phone}</td>
                        <td className="py-3 px-4">{s.course}</td>
                        <td className="py-3 px-4">
                          {s.created_at ? s.created_at.slice(0, 10) : "—"}
                        </td>

                        <td className="py-3 px-4 flex gap-2 justify-center">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            onClick={() => setViewStudent(s)}
                          >
                            View
                          </button>

                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            onClick={() => setDeleteStudent(s)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

            </section>
              </main>
            </div>
          );
         }