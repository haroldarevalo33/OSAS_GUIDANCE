import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon, Squares2X2Icon, UserCircleIcon, ArrowRightOnRectangleIcon, NewspaperIcon, DocumentCheckIcon, BellIcon, BookOpenIcon, Bars3Icon, XMarkIcon,} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

export default function StudentHome() {
  // Page + data states
  const [activePage, setActivePage] = useState("Info");
  const [studentRecord, setStudentRecord] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [password, setPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [originalPasswordHash, setOriginalPasswordHash] = useState("");
  

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
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [savedProfilePic, setSavedProfilePic] = useState(null);
  const [tempProfilePic, setTempProfilePic] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null); // SAVED (used by header)

  // Good moral
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRevoked, setIsRevoked] = useState(false);
  const [hasShownRevokeAlert, setHasShownRevokeAlert] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [canSubmit,setCanSubmit] = useState(false);

  // notifications
  const [currentGoodMoral, setCurrentGoodMoral] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [checkedNotifications, setCheckedNotifications] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);

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


const isPasswordMatch = password === confirmPassword;
const isPasswordValid = password && confirmPassword && isPasswordMatch;

// GET All Student Manage Account
const handleSaveChanges = async () => {
  try {
    if (!studentNumber) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: "Student number is missing",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      return;
    }

    const isPasswordMatch = password === confirmPassword;

    if (password && password.trim() !== "") {
      const strength = getPasswordStrength(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      // ================= CONFIRM PASSWORD =================
      if (!isPasswordMatch) {
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "warning",
          title: "Passwords do not match",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      // ================= SPECIAL CHARACTER =================
      if (!hasSpecial) {
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "warning",
          title: "Password must contain special characters",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      // ================= WEAK PASSWORD =================
      if (strength.label === "Weak") {
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "warning",
          title: "Password is too weak",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      // ================= SAME PASSWORD CHECK =================
      //  REMOVED FRONTEND HASH CHECK (WRONG APPROACH)
      // Backend na ang magva-validate nito (correct & secure)
    }

    // ================= PAYLOAD =================
    const payload = {
      student_number: studentNumber,
      student_name: studentName,
      email,
      phone,
      course: selectedCourse,
    };

    if (password && password.trim() !== "") {
      payload.password = password;
    }

    const res = await fetch("http://127.0.0.1:5000/students/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: data.message || "Update failed",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Updated Successfully",
      showConfirmButton: false,
      timer: 1500,
    });

    const updatedProfile =
      studentRecord?.profile_pic || studentProfile;

    setStudentRecord((prev) => ({
      ...prev,
      student_name: studentName,
      email,
      phone,
      course: selectedCourse,
    }));

    setStudentProfile(updatedProfile);
    setIsEditing(false);

    setPassword("");
    setConfirmPassword("");

    localStorage.setItem(
      "student",
      JSON.stringify({
        student_number: studentNumber,
        profile_pic: updatedProfile,
        student_name: studentName,
      })
    );

  } catch (err) {
    console.error("Update error:", err);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "Server error",
      showConfirmButton: false,
      timer: 1500,
    });
  }
};
// =========================
// PASSWORD STRENGTH CHECK
// =========================
const getPasswordStrength = (password) => {
  let score = 0;

  if (!password) {
    return { label: "", color: "text-gray-400" };
  }

  // length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // lowercase + uppercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  // numbers
  if (/\d/.test(password)) score++;

  // special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) {
    return { label: "Weak", color: "text-red-500" };
  } else if (score === 3 || score === 4) {
    return { label: "Medium", color: "text-yellow-500" };
  } else {
    return { label: "Strong", color: "text-green-600" };
  }
};

useEffect(() => {
  if (!studentNumber) return;

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/students/full/${studentNumber}`
      );

      const data = await res.json();

      if (res.ok && data) {
        setStudentName(data.student_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setSelectedCourse(data.course || "");

        setPassword("");
      } else {
        console.warn(data.message || "Failed to fetch student data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  fetchData();
}, [studentNumber]);

// ==========================
// FETCH STUDENT RECORD (PROFILE PIC + DISPLAY)
// ==========================
useEffect(() => {
  if (!studentNumber) {
    setLoading(false);
    return;
  }

  setLoading(true);

  fetch(`http://127.0.0.1:5000/students/by-number/${studentNumber}`)
    .then((res) => res.json())
    .then((data) => {
      const fixedProfile =
        data.profile_pic && !data.profile_pic.startsWith("http")
          ? `http://127.0.0.1:5000/students/uploads/${data.profile_pic}`
          : data.profile_pic;

      setStudentRecord({
        ...data,
        profile_pic: fixedProfile,
      });

  
      setStudentProfile(fixedProfile);

      setLoading(false);

      localStorage.setItem(
        "student",
        JSON.stringify({
          student_number: studentNumber,
          profile_pic: fixedProfile,
          student_name: data.student_name,
        })
      );
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      setLoading(false);
    });
}, [activePage, studentNumber]);
// ==========================
// Fetch summary (AUTO UPDATE)
// ==========================
useEffect(() => {
  if (!studentNumber) return;

  let isMounted = true;

  async function fetchSummary() {
    try {
      const res = await fetch(
        `http://localhost:5000/violations/summary/${studentNumber}`
      );
      const data = await res.json();

      if (!isMounted) return;

      setViolation(data.predicted_violation ?? "—");
      setSection(data.predicted_section ?? "—");
      setLastVisit(data.violation_date ?? "—");
      setVisits(data.visits ?? 0);
    } catch (err) {
      console.error(err);
    }
  }

  fetchSummary();

  const interval = setInterval(fetchSummary, 5000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [studentNumber]);

// ==========================
// MANUAL REFRESH (HISTORY)
// ==========================
const refreshHistory = async () => {
  if (!studentNumber) return;

  try {
    const res = await fetch(
      `http://localhost:5000/violations/history/${studentNumber}`
    );

    const data = await res.json();

    // IMPORTANT FIX: always normalize empty response
    setViolationHistory(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error refreshing history:", err);
    setViolationHistory([]);
  }
};

// ==========================
// History modal loader (AUTO UPDATE while open)
// ==========================
useEffect(() => {
  if (!studentNumber || !historyModalOpen) return;

  let isMounted = true;

  async function fetchHistory() {
    try {
      const res = await fetch(
        `http://localhost:5000/violations/history/${studentNumber}`
      );

      const data = await res.json();

      if (!isMounted) return;

      // IMPORTANT FIX: backend [] = UI reset to empty
      setViolationHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading history:", err);
      setViolationHistory([]);
    }
  }

  fetchHistory();

  const interval = setInterval(fetchHistory, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [studentNumber, historyModalOpen]);

// ==========================
// OPEN MODAL
// ==========================
function openHistoryModal() {
  setHistoryModalOpen(true);

  // instant sync with backend
  refreshHistory();
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

// -------------------------
// Good Moral Functions
// -------------------------
const API_BASE = "http://localhost:5000"; // Flask backend URL

// =========================
// AUTO-FETCH LATEST GOOD MORAL
// =========================
useEffect(() => {
  if (!studentNumber) return;

  let interval;

  const fetchGoodMoralFile = async () => {
    try {
      const res = await fetch(`${API_BASE}/good-moral/history?student_number=${studentNumber}`);
      const data = await res.json();

      const totalViolations = Number(data.violation_count) || 0;
      setViolationsCount(totalViolations);

      const latest = data.history?.[0] || null;

      const revoked =
        latest?.status === "Rejected" &&
        (latest?.remarks || "").toLowerCase().includes("auto-revoked");

      setIsRevoked(revoked);
      setCanSubmit(!revoked);

      setStudentRecord(prev => ({
        ...prev,
        lastGoodMoralRequest: latest,
      }));

      // Unified revoke / violations alert (only once)
      if (
        (revoked || totalViolations >= 3) &&
        activePage === "GoodMoral" &&
        !hasShownRevokeAlert
      ) {
        Swal.fire({
          icon: "warning",
          title: revoked ? "Access Revoked" : "You've Reached 3 Violations",
          text: revoked
            ? "Your Good Moral has been revoked due to multiple violations."
            : "You cannot submit a Good Moral request until your violations are cleared.",
        }).then(() => {
          // Redirect to Info page after user clicks OK
          setActivePage("Info");
        });

        setHasShownRevokeAlert(true);
        setCanSubmit(false);
      }

      if (latest?.status === "Approved" && !revoked) {
        setCurrentGoodMoral({
          name: latest.filename_original || "Good Moral Certificate",
          url: `${API_BASE}/good-moral/download/${latest.request_id}`,
        });
      } else {
        setCurrentGoodMoral(null);
      }

    } catch (err) {
      console.error(err);
    }
  };

  fetchGoodMoralFile();

  return () => clearInterval(interval);
}, [studentNumber, activePage, hasShownRevokeAlert]);

// =========================
// FETCH LATEST GOOD MORAL
// =========================
const fetchLatestGoodMoral = async () => {
  if (!studentNumber) return;

  try {
    const res = await fetch(`${API_BASE}/good-moral/history?student_number=${studentNumber}`);
    const data = await res.json();

    const totalViolations = Number(data.violation_count) || 0;
    setViolationsCount(totalViolations);

    const latest = data.history?.[0] || null;

    const revoked =
      latest?.status === "Rejected" &&
      (latest?.remarks || "").toLowerCase().includes("auto-revoked");

    setIsRevoked(revoked);
    setCanSubmit(!revoked && totalViolations < 3);

    setStudentRecord(prev => ({
      ...prev,
      lastGoodMoralRequest: latest,
    }));

    // =============================
    // SINGLE ALERT LOGIC (REVOKE OR 3 VIOLATIONS)
    // =============================
    if (
      (revoked || totalViolations >= 3) &&
      activePage === "GoodMoral" &&
      !hasShownRevokeAlert
    ) {
      Swal.fire({
        icon: "warning",
        title: revoked ? "Access Revoked" : "You've Reached 3 Violations",
        text: revoked
          ? "Your Good Moral has been revoked due to multiple violations."
          : "You cannot submit a Good Moral request until your violations are cleared.",
      }).then(() => {
        // Redirect to Info page after user clicks OK
        setActivePage("Info");
      });

      setHasShownRevokeAlert(true);
      setCanSubmit(false);
    }

    // =============================
    // CURRENT GOOD MORAL FILE
    // =============================
    if (latest?.status === "Approved" && !revoked) {
      setCurrentGoodMoral({
        name: latest.filename_original || "Good Moral Certificate",
        url: `${API_BASE}/good-moral/download/${latest.request_id}`,
      });
    } else {
      setCurrentGoodMoral(null);
    }

  } catch (err) {
    console.error("Fetch error:", err);
  }
};
// =========================
// SUBMIT GOOD MORAL REQUEST
// =========================
const submitGoodMoralRequest = async (file) => {
  if (!studentNumber) {
    Swal.fire({ icon: "error", title: "Error", text: "Student number is missing" });
    return;
  }
  if (!file) {
    Swal.fire({ icon: "error", title: "Error", text: "Please select a file to upload" });
    return;
  }

  try {
    const formData = new FormData();
    formData.append("student_number", studentNumber);
    formData.append("certificate_file", file);

    const res = await fetch(`${API_BASE}/good-moral/request`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 403) {
        await Swal.fire({
          icon: "warning",
          title: "Access Denied",
          text: data.message || "You have reached 3 violations.",
          confirmButtonText: "OK",
        });
        setActivePage("Info");
        return;
      }
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

    await fetchLatestGoodMoral();

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
// AUTO-FETCH ON PAGE LOAD
// =========================
useEffect(() => {
  if (!studentNumber) return;
  fetchLatestGoodMoral();
}, [studentNumber]);

// =========================
// LIGHT POLLING FOR REAL-TIME UPDATES
// =========================
useEffect(() => {
  if (!studentNumber) return;

  const interval = setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchLatestGoodMoral();
    }
  }, 1000);

  return () => clearInterval(interval);
}, [studentNumber]);
// =========================
// Constants
// =========================
const POLL_INTERVAL = 5000;
// =========================
// Fetch unread notification count (backend-based)
// =========================
const fetchUnreadCount = async (overrideLocal = false) => {
  if (!studentNumber) return;

  try {
    const res = await fetch(
      `${API_BASE}/good-moral/student/notifications/unread-count?student_number=${studentNumber}`
    );
    const data = await res.json();

    if (overrideLocal || data.unread_count > badgeCount) {
      setBadgeCount(data.unread_count);
    }
  } catch (err) {
    console.error("Error fetching unread count:", err);
  }
};

// =========================
// Fetch notifications + Good Moral history
// =========================
const fetchNotifications = async () => {
  if (!studentNumber) return;

  try {
    const [notifRes, historyRes] = await Promise.all([
      fetch(`${API_BASE}/good-moral/student/notifications?student_number=${studentNumber}`),
      fetch(`${API_BASE}/good-moral/history?student_number=${studentNumber}`)
    ]);

    const notifData = notifRes.ok ? await notifRes.json() : { notifications: [] };
    const historyData = historyRes.ok ? await historyRes.json() : { history: [] };

    const normalize = (n, isHistory = false) => {
      if (n.status !== "Approved" && n.status !== "Rejected") return null;

      return {
        request_id: n.request_id,
        status: n.status,
        message: isHistory
          ? n.status === "Approved"
            ? "Your Good Moral request has been approved."
            : n.remarks?.toLowerCase().includes("auto-revoked")
            ? "Your Good Moral has been revoked due to multiple violations."
            : "Your Good Moral request has been rejected."
          : n.message,
        is_read: n.is_read || false,
        requested_at: n.requested_at,
        is_deleted: n.is_deleted || false
      };
    };

    const newNotifs = Array.isArray(notifData.notifications)
      ? notifData.notifications.map(n => normalize(n)).filter(Boolean)
      : [];

    const fullHistory = Array.isArray(historyData.history)
      ? historyData.history.map(r => normalize(r, true)).filter(Boolean)
      : [];

    const merged = [...notifications, ...fullHistory, ...newNotifs];

    const updated = merged
      .map(n => {
        const local = notifications.find(
          l => l.request_id === n.request_id && l.requested_at === n.requested_at
        );
        return {
          ...n,
          is_read: local?.is_read ?? n.is_read,
          is_deleted: local?.is_deleted ?? n.is_deleted
        };
      })
      .filter((n, index, arr) =>
        index === arr.findIndex(m =>
          m.request_id === n.request_id &&
          m.status === n.status &&
          m.message === n.message &&
          m.requested_at === n.requested_at
        )
      )
      .filter(n => !n.is_deleted)
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    setNotifications(updated);
    setBadgeCount(updated.filter(n => !n.is_read).length);

    fetchUnreadCount();
  } catch (err) {
    console.error("Error fetching notifications/history:", err);
  }
};

// =========================
// SELECT LOGIC
// =========================
const toggleSelect = (note) => {
  const exists = checkedNotifications.find(
    (n) =>
      n.request_id === note.request_id &&
      n.requested_at === note.requested_at
  );

  if (exists) {
    setCheckedNotifications(prev =>
      prev.filter(
        (n) =>
          !(
            n.request_id === note.request_id &&
            n.requested_at === note.requested_at
          )
      )
    );
  } else {
    setCheckedNotifications(prev => [...prev, note]);
  }
};

const handleSelectAll = () => {
  if (isSelectAll) {
    setCheckedNotifications([]);
  } else {
    setCheckedNotifications(notifications);
  }
  setIsSelectAll(!isSelectAll);
};

// auto sync select all
useEffect(() => {
  if (notifications.length === 0) {
    setIsSelectAll(false);
    return;
  }

  if (checkedNotifications.length === notifications.length) {
    setIsSelectAll(true);
  } else {
    setIsSelectAll(false);
  }
}, [checkedNotifications, notifications]);

// =========================
// Select Deleted
// =========================
const handleDeleteSelected = async () => {
  if (checkedNotifications.length === 0) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Delete ${checkedNotifications.length} selected notification(s)?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  });

  if (!result.isConfirmed) return;

  try {
    for (let note of checkedNotifications) {
      await deleteNotification(note.request_id, note.requested_at);
    }

    setCheckedNotifications([]);
    setIsSelectAll(false);

    Swal.fire({
      title: "Deleted!",
      text: "Selected notifications have been deleted.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });

  } catch (err) {
    console.error("Bulk delete error:", err);

    Swal.fire({
      title: "Error!",
      text: "Failed to delete selected notifications.",
      icon: "error",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }
};

// =========================
// Mark notification as read
// =========================
const markAsRead = async (note) => {
  setNotifications(prev => {
    const updated = prev.map(n =>
      n.request_id === note.request_id && n.requested_at === note.requested_at
        ? { ...n, is_read: true }
        : n
    );
    setBadgeCount(updated.filter(n => !n.is_read).length);
    return updated;
  });

  try {
    await fetch(`${API_BASE}/good-moral/student/notifications/close/${note.request_id}`, {
      method: "PATCH"
    });
    fetchUnreadCount();
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
  }
};

// =========================
// Open / Close
// =========================
const openNotification = async (note) => {
  setSelectedNotification(note);
  if (!note.is_read) await markAsRead(note);
};

const closeNotification = (note) => {
  if (!note) return;
  setSelectedNotification(null);
  if (!note.is_read) markAsRead(note);
};

// =========================
// Delete (existing)
// =========================
const deleteNotification = async (request_id, requested_at) => {
  try {
    await fetch(`${API_BASE}/good-moral/student/notifications/${request_id}`, {
      method: "DELETE",
    });

    setNotifications(prev => {
      const updated = prev.filter(
        n => !(n.request_id === request_id && n.requested_at === requested_at)
      );
      setBadgeCount(updated.filter(n => !n.is_read).length);
      return updated;
    });

    fetchUnreadCount();

    if (
      selectedNotification?.request_id === request_id &&
      selectedNotification?.requested_at === requested_at
    ) {
      setSelectedNotification(null);
    }

    Swal.fire({
      title: "Deleted!",
      text: "Notification has been deleted.",
      icon: "success",
      timer: 2300,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
      timerProgressBar: true,
    });

  } catch (err) {
    console.error("Failed to delete notification:", err);

    Swal.fire({
      title: "Error!",
      text: "Failed to delete notification.",
      icon: "error",
      timer: 1000,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
      timerProgressBar: true,
    });
  }
};

// =========================
// Polling
// =========================
useEffect(() => {
  if (!studentNumber) return;

  fetchNotifications();
  fetchUnreadCount(false);

  const intervalId = setInterval(() => {
    fetchNotifications();
    fetchUnreadCount(false);
  }, POLL_INTERVAL);

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

        {/* Badge: show only on desktop if there are unread notifications */}
        {notifications.filter(n => !n.is_read).length > 0 && (
          <span className="hidden md:inline-flex bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.filter(n => !n.is_read).length}
          </span>
        )}
      </button>

        <button
            onClick={() => setActivePage("ManageAccount")}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activePage === "ManageAccount" ? "bg-green-600" : "hover:bg-gray-700/60"
            }`}
          >
            <UserCircleIcon className="w-5 h-5" />
            <span className="font-medium">Account Settings</span>
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
            <button
              onClick={() => {
                setActivePage("Notifications");
                setSidebarOpen(false);
              }}
              className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg ${
                activePage === "Notifications" ? "bg-green-600" : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <BellIcon className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
              </div>

              {/* Badge: show only unread notifications */}
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActivePage("ManageAccount");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${
                activePage === "ManageAccount" ? "bg-green-600" : "hover:bg-white/10"
              }`}
            >
              <UserCircleIcon className="w-5 h-5" />
              <span className="font-medium">Account Settings</span>
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
              {studentProfile ? (
                <img
                  src={studentProfile}
                  alt="user"
                  className="w-10 h-10 rounded-full object-cover border border-gray-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                  {studentRecord?.student_name
                    ? studentRecord.student_name
                        .trim()
                        .split(" ")
                        .slice(0, 10)
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                    : "S"}
                </div>
              )}
            </div>

            {accountModal && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1f2937] text-white rounded-xl shadow-xl p-5 z-50 border border-gray-700">
                <div className="flex flex-col items-center">

                  <div className="relative">
                     {studentProfile ? (
                <img
                  src={studentProfile}
                  alt="user"
                  className="w-10 h-10 rounded-full object-cover border border-gray-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                  {studentRecord?.student_name
                    ? studentRecord.student_name
                        .trim()
                        .split(" ")
                        .slice(0, 10)
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                    : "S"}
                </div>
              )}
            </div>

                  <p className="mt-3 text-lg text-white">
                    Hi, <span className="font-bold">{studentRecord?.student_name || "—"}</span>
                  </p>

                  <p className="text-sm text-gray-300 mb-1">
                    {studentRecord?.student_number}
                  </p>

                  <p className="text-sm text-gray-300 mb-1">
                    {studentRecord?.course || "—"}
                  </p>

                </div>
              </div>
            )}
          </div>
        </header>

        {/*Dashboard*/}
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
          {/* ====================== */}
            {/* Global Loading Spinner */}
            {/* ====================== */}
            {loading && (
              <div className="fixed bottom-10 right-10 flex flex-col items-center justify-center z-50">
                <div className="relative">
                  {/* Large professional green spinner */}
                  <div className="animate-spin rounded-full h-28 w-28 border-t-4 border-b-4 border-green-600 shadow-lg"></div>
                </div>
                <p className="text-green-700 mt-4 text-lg font-semibold text-center">
                  Loading...
                </p>
              </div>
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
        {/* =========================
            GOOD MORAL COMPONENT
        ========================= */}
        {activePage === "GoodMoral" && (
          <div className="flex flex-col items-center w-full relative min-h-[400px]">

            {/* Title */}
            <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6 text-center">
            Good Moral Certificate
            </h2>

            {/* Revoke Banner */}
            {isRevoked && (
              <div className="w-full max-w-lg bg-red-100 border border-red-600 text-red-800 p-4 rounded-xl mb-6 text-center font-semibold">
                Your Good Moral Certificate has been revoked due to multiple violations.
              </div>
            )}

            {/* Request Form / Status */}
            {!studentRecord?.lastGoodMoralRequest ||
            studentRecord?.lastGoodMoralRequest?.status === "Rejected" ? (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600 w-full max-w-md text-center">

                {studentRecord?.lastGoodMoralRequest?.status === "Rejected" && (
                  <p className="text-red-700 font-medium mb-4">
                    Remarks: {studentRecord?.lastGoodMoralRequest?.remarks || "Your previous request was rejected."}
                  </p>
                )}

                <p className="text-gray-700 mb-4">
                  Request your Good Moral Certificate here.
                </p>

                {/* Submit Button */}
                <div className="text-center mt-4">
                <button
                  onClick={submitGoodMoralRequest}
                  disabled={isRevoked && violationsCount >= 3} // only block if revoked **and** >=3 violations
                  className={`bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 ${
                    isRevoked && violationsCount >= 3 ? "opacity-50 cursor-not-allowed hover:bg-green-600" : ""
                  }`}
                  title={
                    isRevoked && violationsCount >= 3
                      ? "Your Good Moral request has been revoked due to multiple violations."
                      : ""
                  }
                >
                  {studentRecord?.lastGoodMoralRequest?.status === "Rejected" ? "Submit Again" : "Request Good Moral"}
                </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600">

                {/* Status & Remarks */}
                <div className="mb-4">
                  <p className="text-green-600 font-semibold">
                    Status: {isRevoked ? "Rejected" : studentRecord?.lastGoodMoralRequest?.status || "Pending"}
                  </p>

                  {studentRecord?.lastGoodMoralRequest?.status === "Pending" && !isRevoked && (
                    <p className="text-yellow-700 font-medium">
                      Waiting for admin approval...
                    </p>
                  )}

                  {(studentRecord?.lastGoodMoralRequest?.status === "Rejected" || isRevoked) && (
                    <p className="text-red-700 font-medium">
                      Remarks: {studentRecord?.lastGoodMoralRequest?.remarks || (isRevoked ? "Auto-revoked due to multiple violations." : "Your request was rejected.")}
                    </p>
                  )}
                </div>

              {/* Approved Good Moral File Preview */}
                {currentGoodMoral && !isRevoked && (
                  <div className="border rounded-lg p-4 flex flex-col gap-3 shadow-sm bg-gray-50 mt-4">
                    <p className="text-gray-800 font-semibold truncate">
                      {(() => {
                        const name = currentGoodMoral.name || "Good Moral Certificate";
                        const parts = name.split(".");
                        if (parts.length === 1) return name; // no extension
                        const extension = parts.pop(); // remove last item
                        const baseName = parts.join("."); // join rest safely
                        return (
                          <>
                            {baseName}
                            {extension && <span className="font-bold">.{extension}</span>}
                          </>
                        );
                      })()}
                    </p>
                    <div className="w-full border rounded overflow-hidden h-64 mb-2">
                      <iframe
                        src={currentGoodMoral?.url}
                        className="w-full h-full"
                        title={currentGoodMoral?.name || "Good Moral Certificate Preview"}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => window.open(currentGoodMoral?.url, "_blank")}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        View File
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel Pending Request */}
                {studentRecord?.lastGoodMoralRequest?.status === "Pending" && !isRevoked && (
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
                          fetch(`${API_BASE}/good-moral/request/${studentRecord.lastGoodMoralRequest.request_id}`, { method: "DELETE" })
                            .then(res => {
                              if (res.ok) {
                                Swal.fire({
                                  toast: true,
                                  position: "top-end",
                                  icon: "success",
                                  title: "Request cancelled!",
                                  showConfirmButton: false,
                                  timer: 500,
                                });
                                setTimeout(() => window.location.reload(), 500);
                              } else {
                                Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Failed to cancel request", showConfirmButton: false, timer: 1500 });
                              }
                            })
                            .catch(() => {
                              Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Failed to cancel request", showConfirmButton: false, timer: 1500 });
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
            {/* ======================== MANAGE ACCOUNT ========================= */}
                    {activePage === "ManageAccount" && (
                      <div className="w-full p-4 md:p-6">

                        {/* ================= HEADER ================= */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-6">

                       {/* LEFT HEADER (HIGHER + CLEAN POSITION) */}
                          <div className="text-left -mt-4 md:-mt-6">

                            <h2 className="text-2xl md:text-4xl font-bold text-green-800 leading-tight">
                              Manage Account
                            </h2>

                            <p className="text-gray-500 mt-1 text-sm md:text-base">
                              View and manage your account details
                            </p>

                          </div>

                          {/* RIGHT BUTTON (FIXED: compact + responsive) */}
                          <div className="flex justify-start md:justify-end w-full md:w-auto">
                            <button
                              onClick={() => setIsEditing(!isEditing)}
                              className="flex items-center justify-center gap-1 
                                        bg-green-600 hover:bg-green-700 
                                        text-white text-sm md:text-base
                                        px-4 py-2 rounded-full shadow-md
                                        w-auto min-w-[90px]"
                            >
                              
                              <span className="truncate">
                                {isEditing ? "Cancel" : "Edit"}
                              </span>
                            </button>
                          </div>

                        </div>

                        {/* ================= CONTENT CARD ================= */}
                        <div className="bg-green-50 p-4 md:p-6 rounded-2xl shadow-inner">

                          {/* PROFILE PIC */}
                            <div className="flex flex-col items-center mb-8">
                              <div className="relative">

                                {(() => {
                                  const getInitials = (name) => {
                                    if (!name) return "S";

                                    return name
                                      .trim()
                                      .split(/\s+/) // handles multiple spaces
                                      .map(word => word[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 3);
                                  };

                                  const initials = getInitials(studentRecord?.student_name);

                                  return (
                                    <img
                                      src={
                                        studentRecord?.profile_pic
                                          ? studentRecord.profile_pic
                                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              initials
                                            )}&bold=true&length=3`
                                      }
                                      alt="Profile"
                                      className="w-28 h-28 md:w-44 md:h-44 rounded-full object-cover border-4 border-green-300 shadow-xl"
                                    />
                                  );
                                })()}
                              {/* UPLOAD */}
                               {isEditing && (
                               <label className="text-2xl absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-full cursor-pointer shadow-lg">
                                  +
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;

                                      const formData = new FormData();
                                      formData.append("profile_pic", file);

                                      try {
                                        const res = await fetch(
                                          `http://127.0.0.1:5000/students/${studentNumber}/profile-pic`,
                                          { method: "POST", body: formData }
                                        );

                                        const data = await res.json();

                                        if (res.ok) {
                                          setStudentRecord(prev => ({
                                            ...prev,
                                            profile_pic: data.profile_pic
                                          }));
                                        } else {
                                          alert(data.message || "Upload failed");
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert("Server error");
                                      }
                                    }}
                                  />
                                </label>
                              )}

                            </div>

                            <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">
                              {isEditing ? "Click plus icon to change profile picture" : "Profile Picture"}
                            </p>

                          </div>

                          {/* ================= FIELDS ================= */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                            {/* NAME */}
                            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200">
                              <p className="text-sm text-gray-500">Student Name</p>

                              {isEditing ? (
                                <input
                                  value={studentName}
                                  onChange={(e) => setStudentName(e.target.value)}
                                  className="w-full border p-2 rounded-lg mt-2"
                                />
                              ) : (
                                <p className="text-lg md:text-xl font-bold text-green-900 truncate">
                                  {studentName || "No Name"}
                                </p>
                              )}
                            </div>

                            {/* EMAIL */}
                            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200">
                              <p className="text-sm text-gray-500">Email</p>

                              {isEditing ? (
                                <input
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full border p-2 rounded-lg mt-2"
                                />
                              ) : (
                                <p className="text-lg md:text-xl font-bold text-green-900 truncate">
                                  {email || "No Email"}
                                </p>
                              )}
                            </div>

                            {/* PHONE */}
                            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200">
                              <p className="text-sm text-gray-500">Phone</p>

                              {isEditing ? (
                                <input
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full border p-2 rounded-lg mt-2"
                                />
                              ) : (
                                <p className="text-lg md:text-xl font-bold text-green-900 truncate">
                                  {phone || "No Phone"}
                                </p>
                              )}
                            </div>

                          {/* COURSE */}
                            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                              <p className="text-sm text-gray-500">Course</p>

                              {isEditing ? (
                                <select
                                  value={selectedCourse}
                                  onChange={(e) => setSelectedCourse(e.target.value)}
                                  className="w-full mt-2 border border-gray-300 rounded-lg p-2 text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-gray-600"
                                >
                                  <option value="">-- Select Course --</option>

                                  <option value="BS Information Technology">
                                    BS Information Technology
                                  </option>

                                  <option value="BS Computer Science">
                                    BS Computer Science
                                  </option>

                                  <option value="BS Business Management">
                                    BS Business Management
                                  </option>

                                  <option value="Bachelor of Secondary Education">
                                    Bachelor of Secondary Education
                                  </option>

                                  <option value="Bachelor of Elementary Education">
                                    Bachelor of Elementary Education
                                  </option>

                                  <option value="BS Hospitality Management (formerly BS Hotel and Restaurant Management)">
                                    BS Hospitality Management (formerly BS Hotel and Restaurant Management)
                                  </option>

                                  <option value="BS Fisheries">
                                    BS Fisheries
                                  </option>

                                  <option value="Basic Seaman Training Course">
                                    Basic Seaman Training Course
                                  </option>
                                </select>
                              ) : (
                                <p className="text-lg md:text-xl font-bold text-green-900 truncate">
                                  {selectedCourse || "No Course"}
                                </p>
                              )}
                            </div>
                             {/* PASSWORD */}
                                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200 md:col-span-2">

                                  <p className="text-sm text-gray-500">Password</p>

                                  {isEditing ? (
                                    <>
                                      {/* PASSWORD INPUT */}
                                      <div className="relative mt-2">
                                        <input
                                          type={showPassword ? "text" : "password"}
                                          value={password}
                                          onChange={(e) => setPassword(e.target.value)}
                                          placeholder="Enter new password"
                                          autoComplete="new-password"
                                          className="w-full p-2 border rounded-lg text-green-900 pr-10"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => setShowPassword(!showPassword)}
                                          className="absolute right-3 top-2.5 text-gray-500 hover:text-green-700"
                                        >
                                          {showPassword ? (
                                            <EyeSlashIcon className="w-5 h-5" />
                                          ) : (
                                            <EyeIcon className="w-5 h-5" />
                                          )}
                                        </button>
                                      </div>

                                      {/* CONFIRM PASSWORD */}
                                      <div className="relative mt-3">
                                        <input
                                          type={showConfirmPassword ? "text" : "password"}
                                          value={confirmPassword}
                                          onChange={(e) => setConfirmPassword(e.target.value)}
                                          placeholder="Confirm password"
                                          className="w-full p-2 border rounded-lg text-green-900 pr-10"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                          className="absolute right-3 top-2.5 text-gray-500 hover:text-green-700"
                                        >
                                          {showConfirmPassword ? (
                                            <EyeSlashIcon className="w-5 h-5" />
                                          ) : (
                                            <EyeIcon className="w-5 h-5" />
                                          )}
                                        </button>
                                      </div>

                                      {/* VALIDATIONS */}
                                      {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs mt-1 text-red-500 font-semibold">
                                          Passwords do not match
                                        </p>
                                      )}

                                      {confirmPassword && password === confirmPassword && password && (
                                        <p className="text-xs mt-1 text-green-600 font-semibold">
                                          Passwords match
                                        </p>
                                      )}

                                      {password && (
                                        <p className={`text-xs mt-2 font-semibold ${getPasswordStrength(password).color}`}>
                                          {getPasswordStrength(password).label} password
                                        </p>
                                      )}

                                      {password && !/[!@#$%^&*(),.?":{}|<>]/.test(password) && (
                                        <p className="text-xs mt-1 text-red-500 font-semibold">
                                          Must include a special character (!@#$ etc.)
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <div className="mt-2">
                                      <p className="text-lg md:text-xl font-bold text-green-900 tracking-widest break-all">
                                        {password ? "•".repeat(Math.min(password.length, 12)) : "••••••••"}
                                      </p>

                                      {password && (
                                        <p className={`text-xs mt-1 font-semibold ${getPasswordStrength(password).color}`}>
                                          {getPasswordStrength(password).label} password
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <p className="text-xs text-gray-400 mt-1">
                                    Password must include uppercase, numbers, and special characters
                                  </p>
                                </div>

                                {/* ================= SAVE BUTTON ================= */}
                                {isEditing && (
                                  <div className="mt-6 flex justify-end">
                                    <button
                                      onClick={handleSaveChanges}
                                      disabled={
                                        password &&
                                        password.trim() !== "" &&
                                        password !== confirmPassword
                                      }
                                      className={`w-full md:w-auto px-5 py-2 rounded-full text-sm md:text-base text-white transition
                                        ${
                                          password &&
                                          password.trim() !== "" &&
                                          password !== confirmPassword
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-green-700 hover:bg-green-800"
                                        }`}
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                )}

                        </div>
                        </div>
                      </div>
                    )}
                  {/* ======================== NOTIFICATIONS PAGE ========================= */}
                  {activePage === "Notifications" && (
                    <div className="w-full">
                      <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6">
                        Notifications
                      </h2>

                      {notifications.length === 0 ? (
                        <p className="text-gray-700 text-center">
                          No notifications at the moment.
                        </p>
                      ) : (
                        <>
                          {/* ===== TOP CONTROLS ===== */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelectAll}
                                onChange={handleSelectAll}
                                className="w-5 h-5 cursor-pointer"
                              />
                              <span className="text-gray-700 font-medium">Select All</span>
                            </div>

                            {checkedNotifications.length > 0 && (
                              <button
                                onClick={handleDeleteSelected}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                              >
                                Delete Selected ({checkedNotifications.length})
                              </button>
                            )}
                          </div>

                          {/* ===== LIST ===== */}
                          <div className="space-y-4">
                            {notifications.map((note) => {
                              const { request_id, message, status, is_read } = note;
                              const isOpened = is_read;

                              // Border & dot colors
                              let borderColor = "border-gray-300";
                              let dotColor = "bg-gray-400";

                              if (!isOpened) {
                                if (status === "Approved") {
                                  borderColor = "border-green-600";
                                  dotColor = "bg-green-600";
                                } else if (status === "Rejected") {
                                  borderColor = "border-red-600";
                                  dotColor = "bg-red-600";
                                }
                              }

                              const isChecked = checkedNotifications.some(
                                (n) =>
                                  n.request_id === note.request_id &&
                                  n.requested_at === note.requested_at
                              );

                              const handleOpen = async () => {
                                setSelectedNotification(note);

                                if (!note.is_read) {
                                  await openNotification(note);
                                }
                              };

                              return (
                                <div
                                  key={request_id + note.requested_at}
                                  onClick={handleOpen}
                                   className={`cursor-pointer p-4 bg-white rounded-2xl shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform duration-200 ${
                                    isChecked
                                      ? "border-black border-2"
                                      : `border-2 ${borderColor}`
                                  }`}
                                >
                                  {/* LEFT */}
                                  <div className="flex items-center space-x-3">
                                    
                                    {/* CHECKBOX */}
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={() => toggleSelect(note)}
                                      className="w-4 h-4 cursor-pointer"
                                    />

                                    <span className={`w-3 h-3 rounded-full ${dotColor}`}></span>
                                    <p className="font-semibold text-gray-800">{message}</p>
                                  </div>

                                  {/* RIGHT */}
                                  <div className="flex items-center space-x-2">
                                    <p className="text-gray-600 font-medium">{status}</p>
                                    {!isOpened && (
                                      <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ======================== MODAL FOR SELECTED NOTIFICATION ========================= */}
                  {selectedNotification && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="bg-white rounded-3xl p-8 w-[95%] max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative animate-fadeIn">
                        
                        {/* X BUTTON */}
                        <button
                          onClick={async () => {
                            if (!selectedNotification) return;
                            await closeNotification(selectedNotification);
                          }}
                          className="absolute top-4 right-5 text-gray-500 hover:text-red-500 text-2xl font-bold"
                        >
                          ✕
                        </button>

                        {/* HEADER */}
                        {(() => {
                          let iconBg = "bg-gray-100";
                          let contentBg = "bg-gray-50";
                          let textColor = "text-gray-700";

                          if (selectedNotification.status === "Approved") {
                            iconBg = "bg-green-100";
                            contentBg = "bg-green-50";
                            textColor = "text-green-700";
                          } else if (selectedNotification.status === "Rejected") {
                            iconBg = "bg-red-100";
                            contentBg = "bg-red-50";
                            textColor = "text-red-700";
                          }

                          return (
                            <>
                              <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 flex items-center justify-center rounded-full text-2xl ${iconBg}`}>
                                  🔔
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                  Notification Details
                                </h3>
                              </div>

                              <div className={`${contentBg} p-6 rounded-2xl mb-6`}>
                                <p className="text-gray-800 text-lg font-semibold mb-3">
                                  {selectedNotification.message}
                                </p>
                                <p className={`text-base font-semibold ${textColor}`}>
                                  Status: {selectedNotification.status}
                                </p>
                              </div>
                            </>
                          );
                        })()}

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={async () => {
                              await deleteNotification(
                                selectedNotification.request_id,
                                selectedNotification.requested_at
                              );
                              setSelectedNotification(null);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </main>
              </div>

           {/* HISTORY MODAL */}
            {historyModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

                <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6">

                  <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                    📜 Visit History
                  </h2>

                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {violationHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-10">
                        No visit history found.
                      </p>
                    ) : (
                      violationHistory.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedHistory(item);
                            setHistoryModalOpen(false);
                            setDetailModalOpen(true);
                          }}
                          className="p-4 bg-gray-200 hover:bg-green-100 rounded-xl border border-gray-300 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                        >
                          <p className="font-semibold text-gray-900">
                            {item.predicted_violation}
                          </p>

                          <p className="text-sm text-gray-700">
                            Section: <span className="font-medium">{item.predicted_section}</span>
                          </p>

                          <p className="text-xs text-gray-600 mt-1">
                            Last Visit Date: {item.violation_date || "—"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setHistoryModalOpen(false)}
                    className="mt-6 w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl transition"
                  >
                    Close
                  </button>

                </div>
              </div>
            )}

            {/* DETAIL MODAL */}
            {detailModalOpen && selectedHistory && (
              <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

                <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-6">

                  <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                    🔍 Visit Details
                  </h2>

                  <div className="space-y-4 text-gray-700">

                    <div className="p-3 bg-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">Violation</p>
                      <p className="font-semibold">{selectedHistory.predicted_violation}</p>
                    </div>

                    <div className="p-3 bg-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">Section</p>
                      <p className="font-semibold">{selectedHistory.predicted_section}</p>
                    </div>

                   <div className="p-3 bg-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">Last Visit Date</p>
                      <p className="font-semibold">
                        {selectedHistory.violation_date || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      setHistoryModalOpen(true); 
                    }}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl transition"
                  >
                    ← Back
                  </button>

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
