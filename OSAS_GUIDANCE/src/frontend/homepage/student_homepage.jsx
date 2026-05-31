import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon, Squares2X2Icon, UserCircleIcon, ArrowRightOnRectangleIcon, NewspaperIcon, DocumentCheckIcon, BellIcon, BookOpenIcon, Bars3Icon, XMarkIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, FlagIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const API = import.meta.env.VITE_API_URL;

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

  // Counseling
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  //Psychological Exam Request
  const [concernPurpose, setConcernPurpose] = useState("");
  const [psyRequests, setPsyRequests] = useState([]);
  const hasPsyPending = psyRequests?.some(r => r.status === "Pending");


// EXIT INTERVIEW STATES
const [exitPreferredDate, setExitPreferredDate] = useState("");
const [exitPreferredTime, setExitPreferredTime] = useState("");
const [exitRequests, setExitRequests] = useState([]);
const [exitLoading, setExitLoading] = useState(false);
const [hasExitPending, setHasExitPending] = useState(false);
  

  

  // Small states
  const [violation, setViolation] = useState("—");
  const [section, setSection] = useState("—");
  const [lastVisit, setLastVisit] = useState("—");
  const [visits, setVisits] = useState(0);
  const [latestSanction, setLatestSanction] = useState(null);

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
  const [studentProfile, setStudentProfile] = useState(null); 

  // Good moral
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRevoked, setAutoRevoked] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [hasShownRevokeAlert, setHasShownRevokeAlert] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [canSubmit,setCanSubmit] = useState(false);
  const [loadingGoodMoral, setLoadingGoodMoral] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // notifications
  const [currentGoodMoral, setCurrentGoodMoral] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [checkedNotifications, setCheckedNotifications] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);

  // Rules preview
  const [currentRules, setCurrentRules] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Update Info
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [deletingProfilePic, setDeletingProfilePic] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
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
        const res = await fetch(`${API}/api/news`);
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
    // START LOADING
    setSavingChanges(true);

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

      setSavingChanges(false); // FIX: stop loading
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

        setSavingChanges(false); // FIX
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

        setSavingChanges(false); // FIX
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

        setSavingChanges(false); // FIX
        return;
      }
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

    const res = await fetch(`${import.meta.env.VITE_API_URL}/students/update`, {
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

      setSavingChanges(false); // FIX
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

  } finally {
    // SAFETY NET (IMPORTANT)
    setSavingChanges(false);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/students/full/${studentNumber}`);
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

  fetch(`${import.meta.env.VITE_API_URL}/students/by-number/${studentNumber}`)
    .then((res) => res.json())
    .then((data) => {
      const fixedProfile = data.profile_pic || null;

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


const handleDeleteProfilePic = async () => {
  Swal.fire({
    title: "Delete Profile Picture?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      setDeletingProfilePic(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/students/${studentNumber}/profile-pic`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        const updatedRes = await fetch(
          `${import.meta.env.VITE_API_URL}/students/by-number/${studentNumber}`
        );

        const updatedData = await updatedRes.json();

        const fixedProfile = updatedData.profile_pic || null;

        setStudentRecord((prev) => ({
          ...prev,
          ...updatedData,
          profile_pic: fixedProfile,
        }));

        setStudentProfile(fixedProfile);
        setTempProfilePic(null);

        Swal.fire("Deleted!", data.message, "success");
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setDeletingProfilePic(false);
    }
  });
};
// ==========================
// Fetch summary (AUTO UPDATE)
// ==========================
useEffect(() => {
  if (!studentNumber) return;

  let isMounted = true;

  async function fetchSummary() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/violations/summary/${studentNumber}`
      );
      const data = await res.json();

      if (!isMounted) return;

      setViolation(data.predicted_violation ?? "—");
      setSection(data.predicted_section ?? "—");
      setLastVisit(data.violation_date ?? "—");
      setVisits(data.visits ?? 0);
      setLatestSanction(data.sanction ?? "—");

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
   const res = await fetch(`${import.meta.env.VITE_API_URL}/violations/history/${studentNumber}`);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/violations/history/${studentNumber}`);
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
        `${import.meta.env.VITE_API_URL}/students/${studentNumber}/profile-pic`,
            {
              method: "POST",
              body: formData
            }
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
          ? `${import.meta.env.VITE_API_URL}/uploads/${data.profile_pic}`
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
      return `${import.meta.env.VITE_API_URL}/uploads/${studentRecord.profile_pic}`;
    }
    return null;
  };

 
  // Fetch rules file from backend on mount
  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/file/list`);
        const data = await res.json();
        const rulesFile = (data.files || []).find((f) => f.file_type === "rules");
        if (rulesFile) {
          setCurrentRules({
            name: rulesFile.original,
            url: rulesFile.url,
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

  const API_BASE = import.meta.env.VITE_API_URL;

// =========================
// FETCH LATEST GOOD MORAL
// =========================
const fetchLatestGoodMoral = async () => {

  if (!studentNumber) return;

  try {

    const res = await fetch(
      `${API_BASE}/good-moral/history?student_number=${studentNumber}`
    );

    const data = await res.json();

    const latest = data.history?.[0] || null;

    // BACKEND SOURCE OF TRUTH
    const autoRevoked =
      data.auto_revoked || false;

    setIsRevoked(autoRevoked);
    setCanSubmit(!autoRevoked);

    setStudentRecord(prev => ({
      ...prev,
      lastGoodMoralRequest: latest,
    }));

    // =========================
    // SINGLE REVOKE ALERT
    // =========================
    if (
      autoRevoked &&
      activePage === "GoodMoral" &&
      !hasShownRevokeAlert
    ) {

      Swal.fire({
        icon: "warning",
        title: "Access Revoked",
        text:
          "Your Good Moral request is blocked due to violation sanction level."
      }).then(() => {

        setActivePage("Info");

      });

      setHasShownRevokeAlert(true);
      setCanSubmit(false);
    }

    // =========================
    // APPROVED FILE
    // =========================
    if (
      latest?.status === "Approved" &&
      !autoRevoked
    ) {

      setCurrentGoodMoral({
        name:
          latest.filename_original ||
          "Good Moral Certificate",

        url:
          `${API_BASE}/good-moral/download/${latest.request_id}`
      });

    } else {

      setCurrentGoodMoral(null);

    }

  } catch (err) {

    console.error(
      "Fetch error:",
      err
    );

  }
};

// =========================
// AUTO FETCH
// =========================
useEffect(() => {

  if (!studentNumber) return;

  fetchLatestGoodMoral();

}, [
  studentNumber,
  activePage,
  hasShownRevokeAlert
]);

// =========================
// SUBMIT GOOD MORAL REQUEST
// =========================
const submitGoodMoralRequest = async (file) => {

  if (!studentNumber) {

    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        "Student number is missing",
    });

    return;
  }

  if (!file) {

    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        "Please select a file to upload",
    });

    return;
  }

  try {

    setLoadingGoodMoral(true);

    const formData =
      new FormData();

    formData.append(
      "student_number",
      studentNumber
    );

    formData.append(
      "certificate_file",
      file
    );

    const res = await fetch(
      `${API_BASE}/good-moral/request`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      if (
        res.status === 403
      ) {

        await Swal.fire({
          icon: "warning",
          title:
            "Access Denied",

          text:
            data.message ||
            "Cannot submit: violation sanction level blocks Good Moral request.",

          confirmButtonText:
            "OK",
        });

        setIsRevoked(true);
        setCanSubmit(false);

        setActivePage("Info");

        return;
      }

      throw new Error(
        data.message ||
        "Failed to submit request"
      );
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title:
        "Good Moral request submitted",
      showConfirmButton: false,
      timer: 2000,
    });

    await fetchLatestGoodMoral();

  } catch (err) {

    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        err.message ||
        "Something went wrong",
    });

  } finally {

    setLoadingGoodMoral(false);

  }
};

// =========================
// LIGHT POLLING
// =========================
useEffect(() => {

  if (!studentNumber) return;

  const interval =
    setInterval(() => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        fetchLatestGoodMoral();

      }

    }, 1000);

  return () =>
    clearInterval(interval);

}, [studentNumber]);
// =========================
// Constants
// =========================
const POLL_INTERVAL = 2000;
// =========================
// Fetch unread notification count
// COMBINED
// =========================
const fetchUnreadCount = async () => {

  if (!studentNumber) return;

  try {

    const res = await fetch(

      `${API_BASE}/notification/student?student_number=${studentNumber}&student_id=${studentNumber}`

    );

    const data = res.ok
      ? await res.json()
      : { notifications: [] };

    const unreadCount =

      Array.isArray(
        data.notifications
      )

        ? data.notifications.filter(

            n =>

              !n.is_read

              &&

              !n.is_deleted

          ).length

        : 0;

    setBadgeCount(
      unreadCount
    );

  }

  catch (err) {

    console.error(
      "Unread count error:",
      err
    );

  }

};

// =========================
// Fetch Notifications
// COMBINED GOOD MORAL + VIOLATIONS
// =========================
const fetchNotifications = async () => {

  if (!studentNumber) return;

  try {

    const response = await fetch(

      `${API_BASE}/notification/student?student_number=${studentNumber}&student_id=${studentNumber}`

    );

    const data = response.ok

      ? await response.json()

      : { notifications: [] };



    const notifications =

      Array.isArray(
        data.notifications
      )

        ? data.notifications.map(

            n => ({

              request_id:

                n.id ||

                n.request_id,

              status:

                n.status ||

                "Notification",

              message:

                n.message ||

                "New notification",

              type:

                n.type ||

                "general",

              is_read:

                n.is_read ||

                false,

              requested_at:

                n.created_at ||

                null,

              is_deleted:

                n.is_deleted ||

                false

            })

          )

        : [];



    const updated =

      notifications

        .filter(
          n => !n.is_deleted
        )

        .sort(

          (
            a,
            b
          ) =>

            new Date(
              b.requested_at || 0
            )

            -

            new Date(
              a.requested_at || 0
            )

        );



    setNotifications(
      updated
    );

    await fetchUnreadCount();

  }

  catch (err) {

    console.error(
      "Error fetching notifications:",
      err
    );

  }

};
// =========================
// SAFE KEY (GOOD MORAL + VIOLATION)
// =========================
const getKey = (note) =>
  `${note.type || "unknown"}_${note.request_id || note.id}_${note.requested_at || note.violation_date}`;

// =========================
// STATE HELPERS (SAFE UPDATE)
// =========================
const updateNotifications = (updater) => {
  setNotifications((prev) => {
    const updated = typeof updater === "function" ? updater(prev) : updater;

    setBadgeCount(updated.filter((n) => !n.is_read).length);
    return updated;
  });
};

// =========================
// SELECT TOGGLE
// =========================
const toggleSelect = (note) => {
  const key = getKey(note);

  const exists = checkedNotifications.some(
    (n) => getKey(n) === key
  );

  if (exists) {
    setCheckedNotifications((prev) =>
      prev.filter((n) => getKey(n) !== key)
    );
  } else {
    setCheckedNotifications((prev) => [...prev, note]);
  }
};

// =========================
// SELECT ALL
// =========================
const handleSelectAll = () => {
  if (isSelectAll) {
    setCheckedNotifications([]);
  } else {
    setCheckedNotifications([...notifications]);
  }
  setIsSelectAll(!isSelectAll);
};

// =========================
// AUTO SYNC SELECT ALL
// =========================
useEffect(() => {
  if (notifications.length === 0) {
    setIsSelectAll(false);
    return;
  }

  setIsSelectAll(
    checkedNotifications.length === notifications.length
  );
}, [checkedNotifications, notifications]);

// =========================
// BULK DELETE (GOOD MORAL + VIOLATION SAFE)
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
    await Promise.all(
      checkedNotifications.map(async (note) => {
        const endpoint =
          note.type === "violation"
            ? `${API_BASE}/violations/student/notifications/${note.request_id}`
            : `${API_BASE}/good-moral/student/notifications/${note.request_id}`;

        await fetch(endpoint, { method: "DELETE" });
      })
    );

    const deletedKeys = new Set(checkedNotifications.map(getKey));

    updateNotifications((prev) =>
      prev.filter((n) => !deletedKeys.has(getKey(n)))
    );

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
// MARK AS READ (FIXED MULTI API)
// =========================
const markAsRead = async (note) => {
  const endpoint =
    note.type === "violation"
      ? `${API_BASE}/violations/student/notifications/close/${note.request_id}`
      : `${API_BASE}/good-moral/student/notifications/close/${note.request_id}`;

  updateNotifications((prev) =>
    prev.map((n) =>
      getKey(n) === getKey(note)
        ? { ...n, is_read: true }
        : n
    )
  );

  try {
    await fetch(endpoint, { method: "PATCH" });
    fetchUnreadCount();
  } catch (err) {
    console.error("Failed mark as read:", err);
  }
};

// =========================
// OPEN NOTIFICATION
// =========================
const openNotification = async (note) => {
  setSelectedNotification(note);

  if (!note.is_read) {
    await markAsRead(note);
  }
};

// =========================
// CLOSE NOTIFICATION
// =========================
const closeNotification = (note) => {
  setSelectedNotification(null);

  if (note && !note.is_read) {
    markAsRead(note);
  }
};
/// =========================
// DELETE SINGLE (CLEAN + SAFE + FIXED)
// =========================
const deleteNotification = async (note) => {
  try {
    if (!note) return;

    const id = typeof note === "object" ? (note.id || note.request_id) : note;
    const type = typeof note === "object" ? note.type : null;

    if (!id) {
      console.error("Missing ID:", note);
      return;
    }

    const endpoint =
      type === "violation"
        ? `${API_BASE}/violations/student/notifications/${id}`
        : `${API_BASE}/good-moral/student/notifications/${id}`;

    const res = await fetch(endpoint, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Delete failed");
    }

    // =========================
    // REMOVE FROM UI (SAFE)
    // =========================
    updateNotifications((prev) =>
      prev.filter((n) => (n.id || n.request_id) !== id)
    );

    setSelectedNotification(null);

    Swal.fire({
      title: "Deleted!",
      text: "Notification deleted successfully.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });

  } catch (err) {
    console.error("Delete error:", err);

    Swal.fire({
      title: "Error!",
      text: "Failed to delete notification.",
      icon: "error",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
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

const navigate = useNavigate();

// LOGOUT FUNCTION
const handleLogout = () => {
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

      // clear auth data
      localStorage.removeItem("student");
      localStorage.removeItem("token");

      // optional: clear session history issue fix
      window.history.replaceState(null, "", "/");

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Logged out successfully",
        showConfirmButton: false,
        timer: 800,
        timerProgressBar: true,
      });

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 400);
    }
  });
};
//-------- COUNSELING REQUEST --------//

const fetchRequests = async () => {

  if (!studentNumber) return;

  try {

    const res = await axios.get(
      `${API}/counseling/history`,
      {
        params: {
          student_number: studentNumber
        }
      }
    );

    const data = Array.isArray(res.data)
      ? res.data
      : [];

    // ALIGN FILE DATA
    const formatted = data.map((r) => ({
      ...r,

      file_url:
        r.file_url ?? null,

      filename_stored:
        r.filename_stored ?? null,

      filename_original:
        r.filename_original ?? null
    }));

    setRequests(formatted);

    console.log(
      "Counseling History:",
      formatted
    );

  } catch (err) {

    console.log(
      "Fetch Requests Error:",
      err?.response?.data || err
    );

    setRequests([]);

    Swal.fire({
      icon: "error",
      title: "Failed to load requests",
      text: "Please try again later"
    });

  }

};


// =========================
// SUBMIT COUNSELING REQUEST
// =========================
const handleSubmit = async () => {

  if (!preferredDate || !preferredTime) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete form",
      text: "Please select date and time"
    });
    return;
  }

  if (loading) return;

  setLoading(true);

  try {

    const formData = new FormData();

    formData.append("student_number", studentNumber);
    formData.append("preferred_date", preferredDate);
    formData.append("preferred_time", preferredTime);

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const res = await axios.post(
      `${API}/counseling/request`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

   Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Request Submitted",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      width: "300px"
    });
    // RESET FIELDS
    setPreferredDate("");
    setPreferredTime("");
    setSelectedFile(null);

    // REFRESH DATA
    await fetchRequests();

  } catch (err) {

    console.log("Submit Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Submission Failed",
      text: err?.response?.data?.message || "Something went wrong"
    });

  } finally {

    setLoading(false);

  }
};

// =========================
// cancel counseling request
// =========================
 const hasPending = requests?.some(r => r.status === "Pending");

const handleCancel = async () => {
  const pendingRequest = requests?.find(
    r => r.status === "Pending"
  );

  if (!pendingRequest) return;

  try {
    setLoading(true);

  await axios.delete(
    `${API}/counseling/request/cancel/${pendingRequest.request_id}`
  );

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Request cancelled",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    await fetchRequests();

  } catch (err) {

    console.log("Delete Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Delete Failed"
    });

  } finally {
    setLoading(false);
  }
};

// =========================
// AUTO LOAD
// =========================
useEffect(() => {
  fetchRequests();

  const interval = setInterval(() => {
    fetchRequests();
  }, 1000); 
  return () => clearInterval(interval);
}, [studentNumber]);

// =========================
// EXIT INTERVIEW REQUEST
// =========================

const fetchExitRequests = async () => {
  if (!studentNumber) return;

  try {
    const res = await axios.get(
      `${API}/exit_request/history`,
      {
        params: { student_number: studentNumber }
      }
    );

    const data = Array.isArray(res.data) ? res.data : [];

    const formatted = data.map((r) => ({
      ...r,
      file_url: r.file_url ?? null,
      filename_stored: r.filename_stored ?? null,
      filename_original: r.filename_original ?? null
    }));

    setExitRequests(formatted);

    const pending = formatted.some((r) => r.status === "Pending");
    setHasExitPending(pending);

    console.log("Exit Request History:", formatted);

  } catch (err) {
    console.log("Fetch Exit Requests Error:", err?.response?.data || err);

    setExitRequests([]);

    Swal.fire({
      icon: "error",
      title: "Failed to load exit requests",
      text: "Please try again later"
    });
  }
};


// =========================
// SUBMIT EXIT REQUEST
// =========================
const handleExitSubmit = async () => {

  if (!exitPreferredDate || !exitPreferredTime) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete form",
      text: "Please select date and time"
    });
    return;
  }

  if (exitLoading) return;
  setExitLoading(true);

  try {
    const formData = new FormData();

    formData.append("student_number", studentNumber);
    formData.append("preferred_date", exitPreferredDate);
    formData.append("preferred_time", exitPreferredTime);

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    await axios.post(
      `${API}/exit_request/request`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Exit request submitted",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      width: "300px"
    });

    // RESET FIELDS
    setExitPreferredDate("");
    setExitPreferredTime("");
    setSelectedFile(null);

    await fetchExitRequests();

  } catch (err) {
    console.log("Submit Exit Request Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Submission Failed",
      text: err?.response?.data?.message || "Something went wrong"
    });

  } finally {
    setExitLoading(false);
  }
};


// =========================
// CANCEL EXIT REQUEST
// =========================
const handleExitCancel = async () => {

  const pendingRequest = exitRequests.find(
    (r) => r.status === "Pending"
  );

  if (!pendingRequest) return;

  try {
    setExitLoading(true);

    await axios.delete(
      `${API}/exit_request/request/cancel/${pendingRequest.request_id}`
    );

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Exit request cancelled",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    await fetchExitRequests();

  } catch (err) {
    console.log("Cancel Exit Request Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Cancel Failed"
    });

  } finally {
    setExitLoading(false);
  }
};


// =========================
// AUTO LOAD EXIT REQUESTS
// =========================
useEffect(() => {
  fetchExitRequests();

  const interval = setInterval(() => {
    fetchExitRequests();
  }, 1000);

  return () => clearInterval(interval);

}, [studentNumber]);
//-------- PSYCHOLOGICAL REQUEST --------//

const fetchPsyRequests = async () => {

  if (!studentNumber) return;

  try {

    const res = await axios.get(
      `${API}/psychological/history`,
      {
        params: {
          student_number: studentNumber
        }
      }
    );

    const data = Array.isArray(res.data)
      ? res.data
      : [];

    // ALIGN FILE DATA
    const formatted = data.map((r) => ({
      ...r,

      file_url:
        r.file_url ?? null,

      filename_stored:
        r.filename_stored ?? null,

      filename_original:
        r.filename_original ?? null
    }));

    // Binago mula setRequests -> setPsyRequests para hindi mag-conflict
    setPsyRequests(formatted);

    console.log(
      "Psychological History:",
      formatted
    );

  } catch (err) {

    console.log(
      "Fetch Psy Requests Error:",
      err?.response?.data || err
    );

    setPsyRequests([]);

    Swal.fire({
      icon: "error",
      title: "Failed to load requests",
      text: "Please try again later"
    });

  }

};
// =========================
// SUBMIT PSYCHOLOGICAL REQUEST
// =========================
const handlePsySubmit = async () => {

  if (!preferredDate || !preferredTime || !concernPurpose) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete form",
      text: "Please select date, time, and state your concern/purpose"
    });
    return;
  }

  if (loading) return;

  setLoading(true);

  try {
    const formData = new FormData();

    
    formData.append("student_number", studentNumber);
    formData.append("preferred_date", preferredDate);
    formData.append("preferred_time", preferredTime);
    formData.append("concern_purpose", concernPurpose); 

    // 2. PINAKAHULI DAPAT PALAGI ANG FILE FIELD
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const res = await axios.post(
      `${API}/psychological/request`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Psychological Request Submitted",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      width: "300px"
    });

    // RESET FIELDS
    setPreferredDate("");
    setPreferredTime("");
    setConcernPurpose(""); 
    setSelectedFile(null);

    // REFRESH DATA
    await fetchPsyRequests();

  } catch (err) {

    console.log("Psy Submit Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Submission Failed",
      text: err?.response?.data?.message || "Something went wrong"
    });

  } finally {
    setLoading(false);
  }
};

// =========================
// CANCEL PSYCHOLOGICAL REQUEST
// =========================
const handlePsyCancel = async () => {
  const pendingRequest = psyRequests?.find(
    r => r.status === "Pending"
  );

  if (!pendingRequest) return;

  try {
    setLoading(true);

    await axios.delete(
      `${API}/psychological/request/cancel/${pendingRequest.request_id}`
    );

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Request cancelled",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    await fetchPsyRequests();

  } catch (err) {

    console.log("Psy Delete Error:", err?.response?.data || err);

    Swal.fire({
      icon: "error",
      title: "Delete Failed"
    });

  } finally {
    setLoading(false);
  }
};

// =========================
// AUTO LOAD
// =========================
useEffect(() => {
  // PINALITAN: Iniba na mula fetchRequests -> fetchPsyRequests para mag-sync sa state mo
  fetchPsyRequests();

  const interval = setInterval(() => {
    fetchPsyRequests();
  }, 1000); 

  return () => clearInterval(interval);
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
            <span className="font-medium">CvSU Handbook</span>
          </button>
           <button
              onClick={() => setActivePage("CounselingRequest")}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
                activePage === "CounselingRequest"
                  ? "bg-green-600"
                  : "hover:bg-gray-700/60"
              }`}
            >
              <CalendarDaysIcon className="w-5 h-5 text-white" />
              <span className="font-medium">Counseling Request</span>
            </button>

            <button
              onClick={() => setActivePage("PsychologicalExamRequest")}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
                activePage === "PsychologicalExamRequest"
                  ? "bg-green-600"
                  : "hover:bg-gray-700/60"
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
              <span className="font-medium">Psych. Exam Request</span>
            </button>
              <button
                onClick={() => setActivePage("exitInterviewRequest")}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  activePage === "exitInterviewRequest"
                    ? "bg-green-600"
                    : "hover:bg-gray-700/60"
                }`}
              >
                <FlagIcon className="w-5 h-5 text-white" />
                <span className="font-medium">Exit Interview Request</span>
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
            onClick={handleLogout}
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
              <span className="font-medium">CvSU Handbook</span>
            </button>
            <button
              onClick={() => {
                setActivePage("CounselingRequest");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${
                activePage === "CounselingRequest"
                  ? "bg-green-600"
                  : "hover:bg-white/10"
              }`}
            >
              <CalendarDaysIcon className="w-5 h-5 text-white" />
              <span className="font-medium">Counseling Request</span>
            </button>
            <button
              onClick={() => {
                setActivePage("PsychologicalExamRequest");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${
                activePage === "PsychologicalExamRequest"
                  ? "bg-green-600"
                  : "hover:bg-white/10"
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
              <span className="font-medium">Psych. Exam Request</span>
            </button>
             <button
              onClick={() => {
                setActivePage("exitInterviewRequest");
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg ${
                activePage === "exitInterviewRequest"
                  ? "bg-green-600"
                  : "hover:bg-white/10"
              }`}
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
              <span className="font-medium">Exit Interview Request</span>
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
            onClick={handleLogout}
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
        <div className="relative flex items-center">

          {/* Avatar Button */}
          <div
            onClick={() => setAccountModal(!accountModal)}
            className="cursor-pointer flex items-center justify-center
                      p-1 sm:p-2 rounded-full hover:bg-gray-700/40
                      transition"
          >
            {studentRecord?.profile_pic ? (
              <img
                src={studentRecord.profile_pic}
                alt="user"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11
                          rounded-full object-cover border border-gray-400"
              />
            ) : (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11
                          rounded-full bg-green-600 text-white
                          flex items-center justify-center font-bold
                          text-sm sm:text-base"
              >
                {studentRecord?.student_name
                  ? studentRecord.student_name
                      .trim()
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                  : "S"}
              </div>
            )}
          </div>

          {/* Dropdown Modal */}
          {accountModal && (
            <div
              className="absolute right-0 top-full mt-2
                        w-[260px] sm:w-72
                        bg-[#1f2937] text-white
                        rounded-xl shadow-xl p-4 sm:p-5
                        z-50 border border-gray-700"
            >

              <div className="flex flex-col items-center text-center">

                {/* Avatar inside modal */}
                <div className="mb-2">
                  {studentRecord?.profile_pic ? (
                    <img
                      src={studentRecord.profile_pic}
                      alt="user"
                      className="w-12 h-12 sm:w-14 sm:h-14
                                rounded-full object-cover border border-gray-400"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14
                                rounded-full bg-green-600 text-white
                                flex items-center justify-center font-bold"
                    >
                      {studentRecord?.student_name
                        ? studentRecord.student_name
                            .trim()
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()
                        : "S"}
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="mt-2 text-base sm:text-lg text-white break-words">
                  Hi,{" "}
                  <span className="font-bold">
                    {studentRecord?.student_name || "—"}
                  </span>
                </p>

                {/* Student Number */}
                <p className="text-xs sm:text-sm text-gray-300 break-words">
                  {studentRecord?.student_number}
                </p>

                {/* Course */}
                <p className="text-xs sm:text-sm text-gray-300 break-words">
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

                {/* TOP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                  {/* GUIDANCE VISITS */}
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

                    <button
                      onClick={openHistoryModal}
                      className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      View Visit History
                    </button>
                  </div>

                  {/* LAST VISIT */}
                  <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">📅</span>
                      <h3 className="text-xl font-semibold text-green-700">
                        Last Visit
                      </h3>
                    </div>

                    <p className="text-2xl md:text-3xl font-extrabold text-green-900 mt-4">
                      {lastVisit}
                    </p>
                  </div>

                  {/* LATEST CONCERN */}
                  <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">⚠️</span>
                      <h3 className="text-xl font-semibold text-green-700">
                        Latest Violation
                      </h3>
                    </div>

                    <p className="text-2xl md:text-3xl font-bold text-green-900 mt-4">
                      {violation}
                    </p>
                  </div>

                  {/* RECOMMENDATION */}
                  <div className="p-6 bg-white border-2 border-green-600 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">📌</span>
                      <h3 className="text-xl font-semibold text-green-700">
                        Latest Section
                      </h3>
                    </div>

                    <p className="text-2xl md:text-3xl font-bold text-green-900 mt-4">
                      {section}
                    </p>
                  </div>

                </div>

             {/* =============================== */}
              {/* LATEST SANCTION BIG CARD */}
              {/* =============================== */}
              <div className="mt-8 md:mt-12">

                <div className="w-full bg-white border-2 border-green-600 rounded-2xl shadow-md p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  {/* LEFT */}
                  <div className="flex items-start gap-4">

                    {/* ICON */}
                    <div className="text-4xl md:text-5xl">
                      ⚖️
                    </div>

                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-green-700">
                        Latest Sanction
                      </h3>

                      <p className="text-sm md:text-base mt-2 text-gray-600">
                        Most recent disciplinary action recorded for this student
                      </p>
                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="bg-green-100 border border-green-600 px-5 py-4 rounded-xl w-full md:w-auto">

                    <p className="text-sm md:text-base font-semibold text-red-600">
                      Current Status
                    </p>

                    <p className="text-xl md:text-3xl font-extrabold text-red-800 mt-1">
                      {latestSanction || "No sanction recorded"}
                    </p>

                  </div>

                </div>

              </div>
              </>
            )}

            {/* ====================== */}
            {/* GLOBAL LOADING SPINNER */}
            {/* ====================== */}
            {loading && (
              <div className="fixed bottom-10 right-10 flex flex-col items-center justify-center z-50">
                <div className="relative">
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
            <div className="flex flex-col items-center w-full relative min-h-[400px] px-4">

              {/* Title */}
              <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-6 text-center">
                Good Moral Certificate
              </h2>

                {isRevoked ? (
                <div className="w-full max-w-lg bg-red-100 border border-red-600 text-red-800 p-4 rounded-xl mb-6 text-center font-semibold">
                  Your Good Moral request is restricted due to violation sanctions.
                </div>
              ) : null}

              {/* REQUEST FORM */}
              {!studentRecord?.lastGoodMoralRequest ||
              studentRecord?.lastGoodMoralRequest?.status === "Rejected" ? (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600 w-full max-w-md mx-4 sm:mx-auto text-center">

                  {studentRecord?.lastGoodMoralRequest?.status === "Rejected" && (
                    <p className="text-red-700 font-medium mb-4">
                      Remarks:{" "}
                      {studentRecord?.lastGoodMoralRequest?.remarks ||
                        "Your previous request was rejected."}
                    </p>
                  )}

                  <p className="text-gray-700 mb-4">
                    Request your Good Moral Certificate here.
                  </p>

                  {/* Submit Button */}
                  <div className="text-center mt-4">
                    <button
                      onClick={submitGoodMoralRequest}
                      disabled={
                        isRevoked ||
                        violationsCount >= 3 ||
                        loadingGoodMoral
                      }
                      className={`flex items-center justify-center gap-2 w-full sm:w-auto mx-auto bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-200 ${
                        isRevoked || violationsCount >= 3 || loadingGoodMoral
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-green-700"
                      }`}
                      title={
                        isRevoked || violationsCount >= 3
                          ? "Blocked due to violation sanction level"
                          : ""
                      }
                    >
                      {loadingGoodMoral ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          {studentRecord?.lastGoodMoralRequest?.status === "Rejected"
                            ? "Submit Again"
                            : "Request Good Moral"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-green-600">

                  {/* Status & Remarks */}
                  <div className="mb-4">
                    <p className="text-green-600 font-semibold">
                      Status:{" "}
                      {isRevoked || violationsCount >= 3
                        ? "Rejected"
                        : studentRecord?.lastGoodMoralRequest?.status || "Pending"}
                    </p>

                    {studentRecord?.lastGoodMoralRequest?.status === "Pending" &&
                      !isRevoked && (
                        <p className="text-yellow-700 font-medium">
                          Waiting for admin approval...
                        </p>
                      )}

                    {(studentRecord?.lastGoodMoralRequest?.status === "Rejected" ||
                      isRevoked) && (
                      <p className="text-red-700 font-medium">
                        Remarks:{" "}
                        {studentRecord?.lastGoodMoralRequest?.remarks ||
                          (isRevoked
                            ? "Auto-revoked due to violation sanction level."
                            : "Your request was rejected.")}
                      </p>
                    )}
                  </div>

                  {/* Approved File */}
                  {currentGoodMoral && !isRevoked && violationsCount < 3 && (
                    <div className="border rounded-lg p-3 sm:p-4 flex flex-col gap-3 shadow-sm bg-gray-50 mt-4 w-full">

                      <p className="text-gray-800 font-semibold break-words text-sm sm:text-base">
                        {(() => {
                          const name = currentGoodMoral.name || "Good Moral Certificate";
                          const parts = name.split(".");
                          if (parts.length === 1) return name;

                          const ext = parts.pop();
                          const base = parts.join(".");

                          return (
                            <>
                              {base}
                              {ext && <span className="font-bold">.{ext}</span>}
                            </>
                          );
                        })()}
                      </p>

                      <div className="w-full border rounded overflow-hidden h-[220px] sm:h-[280px] md:h-[300px]">
                        <iframe
                          src={currentGoodMoral?.url}
                          className="w-full h-full"
                          title="Good Moral Preview"
                        />
                      </div>

                      <button
                        onClick={() => window.open(currentGoodMoral?.url, "_blank")}
                        className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        View File
                      </button>

                    </div>
                  )}

                  {/* CANCEL */}
                  {studentRecord?.lastGoodMoralRequest?.status === "Pending" &&
                    !isRevoked && (
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: "Are you sure?",
                            text: "Cancel request?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Yes",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              setCancelLoading(true);

                              fetch(
                                `${API_BASE}/good-moral/request/${studentRecord.lastGoodMoralRequest.request_id}`,
                                { method: "DELETE" }
                              )
                                .then(() => {
                                  Swal.fire("Cancelled", "", "success");
                                  window.location.reload();
                                })
                                .finally(() => setCancelLoading(false));
                            }
                          });
                        }}
                        disabled={cancelLoading}
                        className={`mt-4 w-full text-white py-2 rounded-lg flex items-center justify-center gap-2 ${
                          cancelLoading
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {cancelLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          "Cancel Request"
                        )}
                      </button>
                    )}
                </div>
              )}
            </div>
          )}
         {/* RULES */}
          {activePage === "Rules" && (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-4 text-center">CvSU Handbook</h2>

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
            {/* COUNSELING */}
            {activePage === "CounselingRequest" && (

              <div className="w-full p-4 md:p-6">

                {/* HEADER */}
                <div className="pb-6">
                  <h2 className="text-2xl md:text-4xl font-bold text-green-800">
                    Counseling Request
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Schedule and track your counseling appointments
                  </p>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                  {/* ===================== LEFT PANEL ===================== */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5
                    h-fit
                    lg:sticky lg:top-4
                    self-start
                  ">

                    <h3 className="text-lg font-semibold mb-4">
                      Submit Request
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>
                        <label className="text-sm font-semibold">Preferred Date</label>
                        <input
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">Preferred Time</label>
                        <input
                          type="time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                    </div>

                    {/* SYSTEM INFO */}
                    <div className="mt-5">
                      <label className="text-sm font-semibold">
                        Latest Violation Information
                      </label>

                      <textarea
                        disabled
                        value={
                          requests[0]
                            ? `Violation: ${requests[0]?.predicted_violation || "—"}
                               Sanction: ${requests[0]?.sanction || "—"}`
                            : "No violation record found"
                        }
                        className="w-full mt-1 p-3 border rounded-lg bg-gray-100 text-sm"
                      />
                    </div>

             {/* BUTTON */}
              <button
                onClick={hasPending ? handleCancel : handleSubmit}
                disabled={
                  loading ||
                  (!hasPending && (!preferredDate || !preferredTime))
                }
                className={`mt-5 px-5 py-3 rounded-lg w-full text-white transition
                  ${
                    loading || (!hasPending && (!preferredDate || !preferredTime))
                      ? "bg-gray-400 cursor-not-allowed opacity-70"
                      : hasPending
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                  }
                `}
              >
                {loading
                  ? "Processing..."
                  : hasPending
                    ? "Cancel Request"
                    : "Submit Request"}
              </button>

              {/* HELPER MESSAGE */}
              {!hasPending && (!preferredDate || !preferredTime) && (
                <p className="text-xs text-red-600 mt-2 font-semibold text-center">
                  Please select a date and time before submitting your request.
                </p>
              )}
              </div>
                  {/* ===================== RIGHT PANEL ===================== */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5

                    h-[70vh] lg:h-[75vh]
                    flex flex-col
                    overflow-hidden
                    self-start
                  ">

                    {/* HEADER */}
                    <h3 className="text-lg font-semibold mb-4 flex-shrink-0">
                      My Appointments
                    </h3>

                    {/* EMPTY STATE */}
                    {requests.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No counseling requests yet
                      </p>
                    )}

                    {/* SCROLL AREA ONLY */}
                    <div className="
                      flex-1
                      min-h-0
                      overflow-y-auto
                      overscroll-contain
                      pr-2
                    ">

                      {requests.map((r) => (
                        <div
                          key={r.request_id}
                          className={`border-l-4 p-4 rounded-lg mb-4 shadow-sm ${
                            r.status === "Pending"
                              ? "border-yellow-500 bg-yellow-50"
                              : r.status === "Approved"
                              ? "border-green-600 bg-green-50"
                              : "border-red-500 bg-red-50"
                          }`}
                        >

                          {/* STATUS */}
                          <div className="flex justify-between items-center">
                            <span className="font-semibold flex items-center gap-2">
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  r.status === "Pending"
                                    ? "bg-yellow-500"
                                    : r.status === "Approved"
                                    ? "bg-green-600"
                                    : "bg-red-500"
                                }`}
                              />
                              {r.status}
                            </span>
                          </div>

                          {/* REQUEST INFO */}
                          <p className="text-sm mt-2">
                            <b>Requested:</b> {r.preferred_date} {r.preferred_time}
                          </p>

                          {/* VIOLATION */}
                          <div className="mt-4 border rounded-lg bg-white p-3">
                            <h4 className="font-semibold text-red-700 mb-2">
                              Latest Violation
                            </h4>

                            <p className="text-sm">
                              <b>Violation:</b> {r.predicted_violation || "—"}
                            </p>

                            <p className="text-sm">
                              <b>Sanction:</b> {r.sanction || "—"}
                            </p>

                            <p className="text-sm">
                              <b>Date:</b> {r.violation_date || "—"}
                            </p>
                          </div>

                          {/* PENDING */}
                          {r.status === "Pending" && (
                            <p className="text-xs text-yellow-700 mt-3">
                              Waiting for admin approval...
                            </p>
                          )}

                          {/* APPROVED */}
                          {r.status === "Approved" && (
                            <div className="mt-4">

                              <p className="text-sm text-green-700 font-semibold mb-3">
                                Approved Schedule: {r.admin_set_date} {r.admin_set_time}
                              </p>

                              {r.file_url ? (
                                <div>

                                  <p className="text-sm font-semibold mb-2">
                                    Approved Attachment
                                  </p>

                                  <iframe
                                    src={r.file_url}
                                    title="PDF Preview"
                                    className="w-full h-[250px] border rounded-lg bg-white"
                                  />

                                  <div className="flex gap-2 mt-3">
                                    <a
                                      href={r.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex-1 text-center hover:bg-blue-700"
                                    >
                                      Open PDF
                                    </a>
                                  </div>

                                </div>
                              ) : (
                                <p className="mt-3 text-gray-500 italic">
                                  No approved attachment yet.
                                </p>
                              )}

                            </div>
                          )}

                        </div>
                      ))}

                    </div>
                  </div>

                </div>
              </div>
            )}
           {/* Exit Interview Request */}
            {activePage === "exitInterviewRequest" && (
              <div className="w-full p-4 md:p-6">

                {/* HEADER */}
                <div className="pb-6">
                  <h2 className="text-2xl md:text-4xl font-bold text-green-800">
                    Exit Interview Request
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Schedule and track your exit interview appointments
                  </p>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                  {/* ===================== LEFT PANEL ===================== */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5
                    h-fit
                    lg:sticky lg:top-4
                    self-start
                  ">

                    <h3 className="text-lg font-semibold mb-4">
                      Submit Exit Interview Request
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>
                        <label className="text-sm font-semibold">Preferred Date</label>
                        <input
                          type="date"
                          value={exitPreferredDate}
                          onChange={(e) => setExitPreferredDate(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">Preferred Time</label>
                        <input
                          type="time"
                          value={exitPreferredTime}
                          onChange={(e) => setExitPreferredTime(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                    </div>

                    {/* SYSTEM INFO */}
                    <div className="mt-5">
                      <label className="text-sm font-semibold">
                        Latest Violation Information
                      </label>

                      <textarea
                        disabled
                        value={
                          exitRequests[0]
                            ? `Violation: ${exitRequests[0]?.predicted_violation || "—"}
                             Sanction: ${exitRequests[0]?.sanction || "—"}`
                            : "No violation record found"
                        }
                        className="w-full mt-1 p-3 border rounded-lg bg-gray-100 text-sm"
                      />
                    </div>

                    {/* BUTTON */}
                    <button
                      onClick={hasExitPending ? handleExitCancel : handleExitSubmit}
                      disabled={
                        exitLoading ||
                        (!hasExitPending && (!exitPreferredDate || !exitPreferredTime))
                      }
                      className={`mt-5 px-5 py-3 rounded-lg w-full text-white transition
                        ${
                          exitLoading ||
                          (!hasExitPending && (!exitPreferredDate || !exitPreferredTime))
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : hasExitPending
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                        }
                      `}
                    >
                      {exitLoading
                        ? "Processing..."
                        : hasExitPending
                          ? "Cancel Exit Request"
                          : "Submit Exit Request"}
                    </button>

                    {/* HELPER MESSAGE */}
                    {!hasExitPending && (!exitPreferredDate || !exitPreferredTime) && (
                      <p className="text-xs text-red-600 mt-2 font-semibold text-center">
                        Please select a date and time before submitting your exit request.
                      </p>
                    )}
                  </div>

                  {/* ===================== RIGHT PANEL ===================== */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5
                    h-[70vh] lg:h-[75vh]
                    flex flex-col
                    overflow-hidden
                    self-start
                  ">

                    <h3 className="text-lg font-semibold mb-4 flex-shrink-0">
                      My Exit Interview Appointments
                    </h3>

                    {exitRequests.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No exit interview requests yet
                      </p>
                    )}

                    <div className="
                      flex-1
                      min-h-0
                      overflow-y-auto
                      overscroll-contain
                      pr-2
                    ">

                      {exitRequests.map((r) => (
                        <div
                          key={r.request_id}
                          className={`border-l-4 p-4 rounded-lg mb-4 shadow-sm ${
                            r.status === "Pending"
                              ? "border-yellow-500 bg-yellow-50"
                              : r.status === "Approved"
                              ? "border-green-600 bg-green-50"
                              : "border-red-500 bg-red-50"
                          }`}
                        >

                          {/* STATUS */}
                          <div className="flex justify-between items-center">
                            <span className="font-semibold flex items-center gap-2">
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  r.status === "Pending"
                                    ? "bg-yellow-500"
                                    : r.status === "Approved"
                                    ? "bg-green-600"
                                    : "bg-red-500"
                                }`}
                              />
                              {r.status}
                            </span>
                          </div>

                          {/* REQUEST INFO */}
                          <p className="text-sm mt-2">
                            <b>Requested:</b> {r.preferred_date} {r.preferred_time}
                          </p>

                          {/* VIOLATION */}
                          <div className="mt-4 border rounded-lg bg-white p-3">
                            <h4 className="font-semibold text-red-700 mb-2">
                              Latest Violation
                            </h4>

                            <p className="text-sm">
                              <b>Violation:</b> {r.predicted_violation || "—"}
                            </p>

                            <p className="text-sm">
                              <b>Sanction:</b> {r.sanction || "—"}
                            </p>

                            <p className="text-sm">
                              <b>Date:</b> {r.violation_date || "—"}
                            </p>
                          </div>

                          {/* PENDING */}
                          {r.status === "Pending" && (
                            <p className="text-xs text-yellow-700 mt-3">
                              Waiting for admin approval...
                            </p>
                          )}

                          {/* APPROVED */}
                          {r.status === "Approved" && (
                            <div className="mt-4">

                              <p className="text-sm text-green-700 font-semibold mb-3">
                                Approved Schedule: {r.admin_set_date} {r.admin_set_time}
                              </p>

                              {r.file_url ? (
                                <div>
                                  <p className="text-sm font-semibold mb-2">
                                    Approved Attachment
                                  </p>

                                  <iframe
                                    src={r.file_url}
                                    title="PDF Preview"
                                    className="w-full h-[250px] border rounded-lg bg-white"
                                  />

                                  <div className="flex gap-2 mt-3">
                                    <a
                                      href={r.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex-1 text-center hover:bg-blue-700"
                                    >
                                      Open PDF
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-3 text-gray-500 italic">
                                  No approved attachment yet.
                                </p>
                              )}

                            </div>
                          )}

                        </div>
                      ))}

                    </div>
                  </div>

                </div>
              </div>
            )}
           {/* PSYCHOLOGICAL EXAM SCHEDULING */}
            {activePage === "PsychologicalExamRequest" && (

              <div className="w-full p-4 md:p-6">

                {/* HEADER */}
                <div className="pb-6">
                  <h2 className="text-2xl md:text-4xl font-bold text-green-800">
                    Psychological Exam Scheduling
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Schedule and track your psychological examination request
                  </p>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                  {/* LEFT PANEL */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5
                    h-fit
                    lg:sticky lg:top-4
                    self-start
                  ">

                    <h3 className="text-lg font-semibold mb-4">
                      Submit Request
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>
                        <label className="text-sm font-semibold">
                          Preferred Date
                        </label>

                        <input
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Preferred Time
                        </label>

                        <input
                          type="time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg"
                        />
                      </div>

                    </div>

                    {/* CONCERN / PURPOSE */}
                    <div className="mt-5">

                      <label className="text-sm font-semibold">
                        Concern / Purpose
                      </label>

                      <textarea
                        rows={5}
                        value={concernPurpose}
                        onChange={(e) => setConcernPurpose(e.target.value)}
                        placeholder="Enter your concern or purpose for psychological examination..."
                        className="w-full mt-1 p-3 border rounded-lg text-sm resize-none"
                      />

                    </div>

                 {/* BUTTON */}
                    <button
                        onClick={hasPsyPending ? handlePsyCancel : handlePsySubmit}
                        disabled={
                          loading ||
                          (!hasPsyPending &&
                            (!preferredDate || !preferredTime || !concernPurpose))
                        }
                        className={`mt-5 px-5 py-3 rounded-lg w-full text-white transition
                          ${
                            loading ||
                            (!hasPsyPending &&
                              (!preferredDate || !preferredTime || !concernPurpose))
                              ? "bg-gray-400 cursor-not-allowed"
                              : hasPsyPending
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }
                        `}
                      >
                        {loading
                          ? "Processing..."
                          : hasPsyPending
                          ? "Cancel Request"
                          : "Submit Request"}
                      </button>
                      {!hasPsyPending &&
                          (!preferredDate || !preferredTime || !concernPurpose) && (
                            <p className="text-sm text-red-500 mt-2 text-center font-semibold">
                              Please complete date, time, and concern before submitting
                            </p>
                        )}
                      </div>

                  {/* RIGHT PANEL */}
                  <div className="
                    bg-white border rounded-xl shadow-md p-5
                    h-[70vh] lg:h-[75vh]
                    flex flex-col
                    overflow-hidden
                    self-start
                  ">

                    <h3 className="text-lg font-semibold mb-4 flex-shrink-0">
                      My Requests
                    </h3>

                    {/* Binago mula requests.length -> psyRequests.length */}
                    {psyRequests.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No psychological exam requests yet
                      </p>
                    )}

                    {/* SCROLL */}
                    <div className="
                      flex-1
                      min-h-0
                      overflow-y-auto
                      overscroll-contain
                      pr-2
                    ">

                      {/* Binago mula requests.map -> psyRequests.map */}
                      {psyRequests.map((r) => (

                        <div
                          key={r.request_id}
                          className={`border-l-4 p-4 rounded-lg mb-4 shadow-sm ${
                            r.status === "Pending"
                              ? "border-yellow-500 bg-yellow-50"
                              : r.status === "Approved"
                              ? "border-green-600 bg-green-50"
                              : "border-red-500 bg-red-50"
                          }`}
                        >

                          {/* STATUS */}
                          <div className="flex justify-between items-center">

                            <span className="font-semibold flex items-center gap-2">

                              <span
                                className={`w-3 h-3 rounded-full ${
                                  r.status === "Pending"
                                    ? "bg-yellow-500"
                                    : r.status === "Approved"
                                    ? "bg-green-600"
                                    : "bg-red-500"
                                }`}
                              />

                              {r.status}

                            </span>

                          </div>

                          {/* REQUEST INFO */}
                          <p className="text-sm mt-2">
                            <b>Requested:</b> {r.preferred_date} {r.preferred_time}
                          </p>

                          {/* PURPOSE */}
                          <div className="mt-4 border rounded-lg bg-white p-3">

                            <h4 className="font-semibold text-blue-700 mb-2">
                              Concern / Purpose
                            </h4>

                            <p className="text-sm whitespace-pre-wrap">
                              {r.concern_purpose || "—"}
                            </p>

                          </div>

                          {/* PENDING */}
                          {r.status === "Pending" && (
                            <p className="text-xs text-yellow-700 mt-3">
                              Waiting for admin approval...
                            </p>
                          )}

                          {/* APPROVED */}
                          {r.status === "Approved" && (

                            <div className="mt-4">

                              <p className="text-sm text-green-700 font-semibold mb-3">
                                Approved Schedule:
                                {" "}
                                {r.admin_set_date}
                                {" "}
                                {r.admin_set_time}
                              </p>

                              {r.file_url ? (

                                <div>

                                  <p className="text-sm font-semibold mb-2">
                                    Approved Attachment
                                  </p>

                                  <iframe
                                    src={r.file_url}
                                    title="PDF Preview"
                                    className="w-full h-[250px] border rounded-lg bg-white"
                                  />

                                  <div className="flex gap-2 mt-3">

                                    <a
                                      href={r.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex-1 text-center hover:bg-blue-700"
                                    >
                                      Open PDF
                                    </a>

                                  </div>

                                </div>

                              ) : (

                                <p className="mt-3 text-gray-500 italic">
                                  No approved attachment yet.
                                </p>

                              )}

                            </div>

                          )}

                        </div>

                      ))}

                    </div>

                  </div>

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
                  <div className="relative group">

                    {(() => {
                      const getInitials = (name) => {
                        if (!name) return "S";

                        return name
                          .trim()
                          .split(/\s+/)
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 5);
                      };

                      const initials = getInitials(studentRecord?.student_name);
                      const displayPic = studentRecord?.profile_pic;

                      return (
                        <>
                          {/* PROFILE IMAGE */}
                          <img
                            src={
                              displayPic
                                ? displayPic
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    initials
                                  )}&bold=true&length=5`
                            }
                            alt="Profile"
                            className={`w-28 h-28 md:w-44 md:h-44 rounded-full object-cover border-4 border-green-300 shadow-xl transition duration-300 ${
                              uploadingProfilePic ? "opacity-60" : ""
                            }`}
                          />

                          {/* LOADING OVERLAY ON AVATAR */}
                          {uploadingProfilePic && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* DARK HOVER OVERLAY */}
                    {isEditing && !uploadingProfilePic && (
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition duration-300"></div>
                    )}

                  {/* TRASH ICON */}
                    {isEditing && (
                      <div
                        onClick={!deletingProfilePic ? handleDeleteProfilePic : undefined}
                        className={`absolute inset-0 flex items-center justify-center transition z-20 ${
                          deletingProfilePic
                            ? "cursor-not-allowed opacity-100"
                            : "opacity-0 group-hover:opacity-100 cursor-pointer"
                        }`}
                      >
                        <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm hover:scale-110 transition">

                          {deletingProfilePic ? (
                            // SPINNER
                            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            // TRASH ICON
                            <Trash2 className="text-white w-8 h-8" />
                          )}

                        </div>
                      </div>
                    )}
                    {/* UPLOAD BUTTON */}
                    {isEditing && (
                      <label className="text-2xl absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-full cursor-pointer shadow-lg z-30">

                        +

                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={uploadingProfilePic}
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append("profile_pic", file);

                            try {
                              setUploadingProfilePic(true);

                              const res = await fetch(
                                `${import.meta.env.VITE_API_URL}/students/${studentNumber}/profile-pic`,
                                {
                                  method: "POST",
                                  body: formData,
                                }
                              );

                              const data = await res.json();

                              if (res.ok) {
                                setStudentRecord((prev) => ({
                                  ...prev,
                                  profile_pic: data.profile_pic,
                                }));

                                setTempProfilePic(null);

                                Swal.fire("Success", "Profile updated", "success");
                              } else {
                                Swal.fire("Error", data.message || "Upload failed", "error");
                              }
                            } catch (err) {
                              console.error(err);
                              Swal.fire("Error", "Server error", "error");
                            } finally {
                              setUploadingProfilePic(false);
                            }
                          }}
                        />
                      </label>
                    )}

                  </div>

                  <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">
                    {isEditing
                      ? "Hover image to delete or click + to change"
                      : "Profile Picture"}
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
                                 {/* STUDENT NUMBER */}
                                      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200">
                                        <p className="text-sm text-gray-500">Student Number</p>

                                        <p className="text-lg md:text-xl font-bold text-green-900 truncate">
                                          {studentNumber || "No Student Number"}
                                        </p>

                                        {/* NOTE */}
                                        <p className="text-xs text-gray-400 mt-2">
                                          This is a unique identifier assigned to each student. It is used for official records, tracking academic data, and ensuring accurate identification within the system. This cannot be modified.
                                        </p>
                                      </div>
                                      {/* PASSWORD */}
                                      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-green-200">

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
                                        savingChanges ||
                                        (password &&
                                          password.trim() !== "" &&
                                          password !== confirmPassword)
                                      }
                                      className={`w-full md:w-auto px-5 py-2 rounded-full text-sm md:text-base text-white transition flex items-center justify-center gap-2
                                        ${
                                          savingChanges ||
                                          (password &&
                                            password.trim() !== "" &&
                                            password !== confirmPassword)
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-green-700 hover:bg-green-800"
                                        }`}
                                    >
                                      {savingChanges ? (
                                        <>
                                          {/* SPINNER */}
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        "Save Changes"
                                      )}
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
                              const {
                                request_id,
                                message,
                                status,
                                is_read,
                                requested_at
                              } = note;

                              const isOpened = is_read;

                              // =========================
                              // BORDER + DOT COLORS
                              // =========================
                              let borderColor = "border-gray-300";
                              let dotColor = "bg-gray-400";

                              if (!isOpened) {

                                if (status === "Approved") {
                                  borderColor = "border-green-600";
                                  dotColor = "bg-green-600";
                                } 

                                else if (status === "Rejected") {
                                  borderColor = "border-red-600";
                                  dotColor = "bg-red-600";
                                } 

                                else if (status === "Violation") {
                                  borderColor = "border-yellow-500";
                                  dotColor = "bg-yellow-500";
                                } 

                                else if (status === "Resolved") {
                                  borderColor = "border-blue-500";
                                  dotColor = "bg-blue-500";
                                } 

                                else if (status === "Cleared") {
                                  borderColor = "border-emerald-600";
                                  dotColor = "bg-emerald-600";
                                }


                                else if (status === "Pending") {
                                  borderColor = "border-yellow-300";
                                  dotColor = "bg-yellow-400";
                                }
                              }
                              const isChecked = checkedNotifications.some(
                                (n) =>
                                  n.request_id === request_id &&
                                  n.requested_at === requested_at
                              );

                              const handleOpen = async () => {
                                setSelectedNotification(note);

                                if (!note.is_read) {
                                  await openNotification(note);
                                }
                              };

                              return (
                                <div
                                  key={(request_id || "") + (requested_at || "")}
                                  onClick={handleOpen}
                                  className={`cursor-pointer p-4 bg-white rounded-2xl shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform duration-200 ${
                                    isChecked
                                      ? "border-black border-2"
                                      : `border-2 ${borderColor}`
                                  }`}
                                >
                                  {/* LEFT */}
                                  <div className="flex items-center space-x-3">

                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={() => toggleSelect(note)}
                                      className="w-4 h-4 cursor-pointer"
                                    />

                                    <span className={`w-3 h-3 rounded-full ${dotColor}`}></span>

                                    <p className="font-semibold text-gray-800">
                                      {message}
                                    </p>
                                  </div>

                                  {/* RIGHT */}
                                  <div className="flex items-center space-x-2">
                                    <p className="text-gray-600 font-medium">
                                      {status}
                                    </p>

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

                 {/* ======================== MODAL ========================= */}
                  {selectedNotification && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">

                      <div className="bg-white rounded-3xl p-8 w-[95%] max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative animate-fadeIn">

                        {/* CLOSE */}
                        <button
                          onClick={async () => {

                            if (!selectedNotification) return;

                            await closeNotification(
                              selectedNotification
                            );

                          }}
                          className="absolute top-4 right-5 text-gray-500 hover:text-red-500 text-2xl font-bold"
                        >
                          ✕
                        </button>


                        {/* HEADER */}
                        {(() => {

                          let icon = "🔔";

                          let iconBg = "bg-gray-100";
                          let contentBg = "bg-gray-50";
                          let textColor = "text-gray-700";

                          if (selectedNotification.status === "Approved") {

                            icon = "✅";
                            iconBg = "bg-green-100";
                            contentBg = "bg-green-50";
                            textColor = "text-green-700";

                          }

                          else if (
                            selectedNotification.status === "Rejected"
                          ) {

                            icon = "❌";
                            iconBg = "bg-red-100";
                            contentBg = "bg-red-50";
                            textColor = "text-red-700";

                          }

                          else if (
                            selectedNotification.status === "Violation"
                          ) {

                            icon = "⚠️";
                            iconBg = "bg-yellow-100";
                            contentBg = "bg-yellow-50";
                            textColor = "text-yellow-700";

                          }

                          else if (
                            selectedNotification.status === "Resolved"
                          ) {

                            icon = "🛠️";
                            iconBg = "bg-blue-100";
                            contentBg = "bg-blue-50";
                            textColor = "text-blue-700";

                          }

                          else if (
                            selectedNotification.status === "Cleared"
                          ) {

                            icon = "🎉";
                            iconBg = "bg-emerald-100";
                            contentBg = "bg-emerald-50";
                            textColor = "text-emerald-700";

                          }

                          return (

                            <>

                              {/* TOP */}
                              <div className="flex items-center gap-4 mb-6">

                                <div
                                  className={`w-14 h-14 flex items-center justify-center rounded-full text-2xl ${iconBg}`}
                                >
                                  {icon}
                                </div>

                                <h3 className="text-2xl font-bold text-gray-800">
                                  Notification Details
                                </h3>

                              </div>


                              {/* CONTENT */}
                              <div
                                className={`${contentBg} p-6 rounded-2xl mb-6`}
                              >

                                <p className="text-gray-800 text-lg font-semibold mb-4">

                                  {selectedNotification.message}

                                </p>


                                <div className="space-y-3">

                                  <p className={`font-semibold ${textColor}`}>

                                    Status:
                                    {" "}
                                    {selectedNotification.status}

                                  </p>

                                  {selectedNotification.type === "violation" && (

                                    <>
                                      <p className="text-gray-700">

                                        <strong>Violation:</strong>

                                        {" "}

                                        {selectedNotification.status}

                                      </p>

                                      {selectedNotification.sanction && (

                                        <p className="text-gray-700">

                                          <strong>Sanction:</strong>

                                          {" "}

                                          {selectedNotification.sanction}

                                        </p>

                                      )}

                                    </>

                                  )}

                                </div>

                              </div>

                            </>

                          );

                        })()}


                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={async () => {
                              await deleteNotification(selectedNotification);
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
                        <div className="mt-2">
                          <span className="text-xs font-semibold text-red-600">
                            Sanction:
                          </span>
                          <span className="text-xs font-bold text-red-700 ml-1">
                            {item.sanction || "—"}
                          </span>
                        </div>

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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-500">Sanction</p>
                      <p className="font-bold text-red-700">
                        {selectedHistory.sanction || "No sanction recorded"}
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