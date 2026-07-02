const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// Authenticated API fetch wrapper
// ----------------------------------------------------
const apiFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    const userId = localStorage.getItem('study_current_user_id');
    if (userId) {
        headers['X-User-Id'] = userId;
    }
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return fetch(url, {
        ...options,
        headers
    });
};

const formatPomoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ----------------------------------------------------
// Inline SVG Icons Component Map
// ----------------------------------------------------
const Icons = {
    Play: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3"/></svg>
    ),
    Pause: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    ),
    Plus: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    ),
    Trash: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    ),
    Clock: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    Flame: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
    ),
    Graduation: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
    ),
    ArrowLeft: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    ),
    Check: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
    ),
    X: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    ),
    FileText: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
    ),
    FileEdit: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
    ),
    RotateCcw: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
    ),
    RotateCw: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
    ),
    Settings: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    ),
    ListVideo: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><polygon points="16 12 22 15 16 18 16 12"/></svg>
    ),
    Video: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
    ),
    Download: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    ),
    CheckCircle: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    AlertCircle: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ),
    Info: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    ),
    User: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
    Unlock: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
    ),
    LogOut: ({ size = 20, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    )
};

// Initialize YouTube Player API global trigger
if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function App() {
    // ----------------------------------------------------
    // User Authentication States
    // ----------------------------------------------------
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('study_current_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [selectedUserForLogin, setSelectedUserForLogin] = useState(null);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinError, setPinError] = useState('');
    
    // PIN Recovery States
    const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
    const [recoveryQuestion, setRecoveryQuestion] = useState('');
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [recoveredPin, setRecoveredPin] = useState('');
    const [recoveryMode, setRecoveryMode] = useState('question'); // 'question', 'success'

    // Registration Form States
    const [regName, setRegName] = useState('');
    const [regPin, setRegPin] = useState('');
    const [regQuestion, setRegQuestion] = useState('What was the name of your first pet?');
    const [regAnswer, setRegAnswer] = useState('');

    // Settings Profile Edit States
    const [settingsName, setSettingsName] = useState('');
    const [settingsPin, setSettingsPin] = useState('');
    const [settingsQuestion, setSettingsQuestion] = useState('');
    const [settingsAnswer, setSettingsAnswer] = useState('');

    // Deletion states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmPin, setDeleteConfirmPin] = useState('');
    const [deleteConfirmAnswer, setDeleteConfirmAnswer] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // ----------------------------------------------------
    // Core App View Navigation States
    // ----------------------------------------------------
    const [view, setView] = useState(() => {
        const loggedIn = localStorage.getItem('study_current_user_id');
        if (loggedIn) {
            return localStorage.getItem('study_current_view') || 'dashboard';
        }
        return 'user_select';
    });
    const [selectedCourseId, setSelectedCourseId] = useState(() => {
        const id = localStorage.getItem('study_current_course_id');
        return id ? parseInt(id) : null;
    });
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ streak_days: 0, total_seconds_watched: 0, completed_courses: 0 });
    
    // Notification Banner State
    const [notification, setNotification] = useState(null);

    // Modal State (Element 2)
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [creatorStep, setCreatorStep] = useState(1); // 1: Name course, 2: Add videos
    const [courseName, setCourseName] = useState('');
    const [creationType, setCreationType] = useState('playlist'); // 'playlist', 'individual'
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [individualUrls, setIndividualUrls] = useState(['']);
    const [isSavingCourse, setIsSavingCourse] = useState(false);

    // Pomodoro Timer State (Retention feature)
    const [pomoTime, setPomoTime] = useState(1500); // 25 mins
    const [pomoRunning, setPomoRunning] = useState(false);
    const [pomoMode, setPomoMode] = useState('work'); // 'work', 'break'
    const [isPomoModalOpen, setIsPomoModalOpen] = useState(false);

    // Fetch initial user list or dashboard data
    useEffect(() => {
        if (!currentUser) {
            fetchUsersList();
            setView('user_select');
        } else {
            fetchCourses();
            fetchStats();
        }
    }, [currentUser]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // User Operations
    const fetchUsersList = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Error fetching users list:", err);
        }
    };

    const handleCreateProfileSubmit = async (e) => {
        e.preventDefault();
        if (!regName.trim() || !regPin.trim() || !regAnswer.trim()) {
            showNotification("Please fill in all fields", "error");
            return;
        }
        if (regPin.length !== 4 || !regPin.match(/^\d+$/)) {
            showNotification("PIN must be exactly 4 digits", "error");
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: regName,
                    pin: regPin,
                    security_question: regQuestion,
                    security_answer: regAnswer
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification(`Profile for ${data.name} created!`);
                // Clear fields
                setRegName('');
                setRegPin('');
                setRegAnswer('');
                
                // Refresh list and go back
                fetchUsersList();
                setView('user_select');
            } else {
                showNotification(data.detail || "Failed to create profile", "error");
            }
        } catch (err) {
            showNotification("Connection error", "error");
        }
    };

    const handleKeypadPress = async (num) => {
        if (enteredPin.length >= 4) return;
        
        const newPin = enteredPin + num;
        setEnteredPin(newPin);
        setPinError('');
        
        if (newPin.length === 4) {
            // Trigger auto-submit login
            try {
                const res = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: selectedUserForLogin.id,
                        pin: newPin
                    })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showNotification(`Logged in as ${selectedUserForLogin.name}`);
                    
                    // Set login states
                    localStorage.setItem('study_current_user_id', selectedUserForLogin.id);
                    localStorage.setItem('study_current_user', JSON.stringify(selectedUserForLogin));
                    localStorage.setItem('study_current_view', 'dashboard');
                    
                    setCurrentUser(selectedUserForLogin);
                    setSelectedUserForLogin(null);
                    setEnteredPin('');
                    setView('dashboard');
                } else {
                    setPinError("Incorrect PIN. Please try again.");
                    setEnteredPin('');
                }
            } catch (err) {
                setPinError("Connection error. Try again.");
                setEnteredPin('');
            }
        }
    };

    const handleLogout = () => {
        // Clear variables
        localStorage.removeItem('study_current_user_id');
        localStorage.removeItem('study_current_user');
        localStorage.removeItem('study_current_view');
        localStorage.removeItem('study_current_course_id');
        localStorage.removeItem('study_current_video_id');
        
        setCurrentUser(null);
        setSelectedUserForLogin(null);
        setEnteredPin('');
        setUsers([]);
        setView('user_select');
        showNotification("Logged out successfully");
    };

    const handleForgotPinClick = async () => {
        try {
            const res = await fetch(`/api/users/${selectedUserForLogin.id}/question`);
            const data = await res.json();
            if (res.ok) {
                setRecoveryQuestion(data.security_question);
                setRecoveryAnswer('');
                setRecoveryError('');
                setRecoveredPin('');
                setRecoveryMode('question');
                setIsRecoveryOpen(true);
            }
        } catch (e) {
            showNotification("Failed to fetch security question", "error");
        }
    };

    const handleRecoverySubmit = async () => {
        if (!recoveryAnswer.trim()) {
            setRecoveryError("Answer cannot be empty");
            return;
        }

        try {
            const res = await fetch('/api/users/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: selectedUserForLogin.id,
                    security_answer: recoveryAnswer
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRecoveredPin(data.pin);
                setRecoveryMode('success');
                setRecoveryError('');
            } else {
                setRecoveryError(data.detail || "Incorrect answer");
            }
        } catch (err) {
            setRecoveryError("Connection error. Please try again.");
        }
    };

    // Settings Update profile operations
    const openProfileSettings = async () => {
        try {
            const res = await apiFetch(`/api/users/${currentUser.id}/question`);
            const data = await res.json();
            if (res.ok) {
                setSettingsName(currentUser.name);
                setSettingsPin('');
                setSettingsQuestion(data.security_question);
                setSettingsAnswer('');
                setView('profile_settings');
                localStorage.setItem('study_current_view', 'profile_settings');
            }
        } catch (e) {
            showNotification("Failed to open settings", "error");
        }
    };

    const handleUpdateProfileSubmit = async (e) => {
        e.preventDefault();
        if (!settingsName.trim() || !settingsPin.trim() || !settingsAnswer.trim()) {
            showNotification("Please fill in all fields to apply changes", "error");
            return;
        }
        if (settingsPin.length !== 4 || !settingsPin.match(/^\d+$/)) {
            showNotification("PIN must be exactly 4 digits", "error");
            return;
        }

        try {
            const res = await apiFetch('/api/users/update', {
                method: 'POST',
                body: JSON.stringify({
                    name: settingsName,
                    pin: settingsPin,
                    security_question: settingsQuestion,
                    security_answer: settingsAnswer
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification("Profile updated successfully!");
                const updatedUser = { id: currentUser.id, name: data.name };
                localStorage.setItem('study_current_user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
                setView('dashboard');
                localStorage.setItem('study_current_view', 'dashboard');
            } else {
                showNotification(data.detail || "Failed to update profile", "error");
            }
        } catch (err) {
            showNotification("Connection error", "error");
        }
    };

    const handleDeleteProfile = async () => {
        if (!deleteConfirmPin.trim() || !deleteConfirmAnswer.trim() || !deleteConfirmText.trim()) {
            setDeleteError("All confirmation fields are required.");
            return;
        }
        if (deleteConfirmText.trim() !== "DELETE") {
            setDeleteError("Confirmation text must be exactly 'DELETE'.");
            return;
        }
        
        try {
            const res = await apiFetch('/api/users/delete', {
                method: 'POST',
                body: JSON.stringify({
                    pin: deleteConfirmPin,
                    security_answer: deleteConfirmAnswer
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification("Account permanently deleted. Hope to see you again!");
                setIsDeleteModalOpen(false);
                
                // Complete clean logout
                localStorage.removeItem('study_current_user_id');
                localStorage.removeItem('study_current_user');
                localStorage.removeItem('study_current_view');
                localStorage.removeItem('study_current_course_id');
                localStorage.removeItem('study_current_video_id');
                
                setCurrentUser(null);
                setSelectedUserForLogin(null);
                setEnteredPin('');
                setView('user_select');
            } else {
                setDeleteError(data.detail || "Authentication failed. Incorrect PIN or security answer.");
            }
        } catch (err) {
            setDeleteError("Connection error. Account deletion failed.");
        }
    };

    // Course App Operations
    const fetchCourses = async () => {
        try {
            const res = await apiFetch('/api/courses');
            if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 422) {
                handleLogout();
                return;
            }
            const data = await res.json();
            setCourses(data);
            
            const completed = data.filter(c => c.total_videos > 0 && c.completed_videos === c.total_videos).length;
            setStats(prev => ({ ...prev, completed_courses: completed }));
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await apiFetch('/api/stats');
            if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 422) {
                handleLogout();
                return;
            }
            const data = await res.json();
            setStats(prev => ({
                ...prev,
                streak_days: data.streak_days || 0,
                total_seconds_watched: data.total_seconds_watched || 0
            }));
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    // Pomodoro logic
    useEffect(() => {
        let timer = null;
        if (pomoRunning && pomoTime > 0) {
            timer = setInterval(() => {
                setPomoTime(prev => prev - 1);
            }, 1000);
        } else if (pomoTime === 0) {
            setPomoRunning(false);
            if (pomoMode === 'work') {
                showNotification("Great work! Time for a short break.", "info");
                setPomoTime(300); // 5 mins break
                setPomoMode('break');
            } else {
                showNotification("Break's over! Let's get back to studying.", "info");
                setPomoTime(1500); // 25 mins work
                setPomoMode('work');
            }
        }
        return () => clearInterval(timer);
    }, [pomoRunning, pomoTime, pomoMode]);

    const handleCreateCourseSubmit = async () => {
        if (!courseName.trim()) {
            showNotification("Please enter a course name", "error");
            return;
        }

        setIsSavingCourse(true);
        try {
            let res, data;
            if (creationType === 'playlist') {
                if (!playlistUrl.trim()) {
                    showNotification("Please enter a playlist URL or ID", "error");
                    setIsSavingCourse(false);
                    return;
                }
                res = await apiFetch('/api/courses/import-playlist', {
                    method: 'POST',
                    body: JSON.stringify({ name: courseName, youtube_url: playlistUrl })
                });
            } else {
                const urls = individualUrls.filter(u => u.trim() !== '');
                if (urls.length === 0) {
                    showNotification("Please add at least one video URL", "error");
                    setIsSavingCourse(false);
                    return;
                }
                res = await apiFetch('/api/courses/import-individual', {
                    method: 'POST',
                    body: JSON.stringify({ name: courseName, video_urls: urls })
                });
            }

            data = await res.json();
            if (res.ok && data.success) {
                showNotification(`Successfully created course: ${data.name}`);
                fetchCourses();
                setCourseName('');
                setPlaylistUrl('');
                setIndividualUrls(['']);
                setIsCreatorOpen(false);
                setCreatorStep(1);
            } else {
                showNotification(data.detail || "Failed to create course", "error");
            }
        } catch (err) {
            showNotification("Network error occurred", "error");
        } finally {
            setIsSavingCourse(false);
        }
    };

    const handleDeleteCourse = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this course? All progress and offline downloads will be removed.")) {
            return;
        }

        try {
            const res = await apiFetch(`/api/courses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showNotification("Course deleted successfully");
                fetchCourses();
                if (selectedCourseId === id) {
                    setView('dashboard');
                    setSelectedCourseId(null);
                }
            }
        } catch (err) {
            showNotification("Error deleting course", "error");
        }
    };

    const handleSelectCourse = (id) => {
        setSelectedCourseId(id);
        setView('viewer');
        localStorage.setItem('study_current_view', 'viewer');
        localStorage.setItem('study_current_course_id', id);
    };

    // Sub-view renders
    const renderUserSelect = () => (
        <div className="user-portal-container glass-panel">
            <h2 className="portal-title">FocusLocus</h2>
            <p className="portal-subtitle">Select your profile to begin studying</p>
            
            <div className="users-grid">
                {users.map(u => (
                    <div 
                        key={u.id} 
                        className="user-card glass-panel" 
                        onClick={() => {
                            setSelectedUserForLogin(u);
                            setEnteredPin('');
                            setPinError('');
                            setView('user_pin_entry');
                        }}
                    >
                        <div className="user-avatar">{u.name[0]}</div>
                        <div className="user-name">{u.name}</div>
                    </div>
                ))}
                
                <div 
                    className="user-card glass-panel create-user-card" 
                    onClick={() => {
                        setRegName('');
                        setRegPin('');
                        setRegAnswer('');
                        setView('user_register');
                    }}
                >
                    <div className="user-avatar create-avatar">+</div>
                    <div className="user-name" style={{ color: 'var(--text-muted)' }}>Add Profile</div>
                </div>
            </div>
            
            {users.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No profiles found. Click "Add Profile" to create one!
                </p>
            )}
        </div>
    );

    const renderUserRegister = () => (
        <div className="user-portal-container glass-panel" style={{ maxWidth: '480px' }}>
            <h3 className="modal-title">Create Profile</h3>
            <form onSubmit={handleCreateProfileSubmit} style={{ textAlign: 'left' }}>
                <div className="form-group">
                    <label className="form-label">Profile Name</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Your name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">4-Digit Security PIN</label>
                    <input 
                        type="password" 
                        maxLength="4"
                        className="form-input" 
                        placeholder="PIN (4 digits)"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/\D/g,''))}
                        required
                    />
                </div>

                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <label className="form-label">PIN Recovery Security Question (Free Recovery)</label>
                    <select 
                        className="form-input" 
                        value={regQuestion}
                        onChange={(e) => setRegQuestion(e.target.value)}
                        style={{ background: '#090d16', color: 'var(--text-main)' }}
                    >
                        <option>What was the name of your first pet?</option>
                        <option>What is your mother's maiden name?</option>
                        <option>What city were you born in?</option>
                        <option>What was your favorite book growing up?</option>
                        <option>What is the model of your first car?</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Security Answer</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Your answer"
                        value={regAnswer}
                        onChange={(e) => setRegAnswer(e.target.value)}
                        required
                    />
                </div>

                <div className="modal-buttons" style={{ marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setView('user_select')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Create Profile
                    </button>
                </div>
            </form>
        </div>
    );

    const renderUserPinEntry = () => (
        <div className="user-portal-container glass-panel pin-lock-card">
            <button 
                className="viewer-nav-btn" 
                onClick={() => setView('user_select')} 
                style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}
            >
                <Icons.ArrowLeft size={16} /> Back
            </button>

            <div className="user-avatar" style={{ margin: '0 auto 1rem auto', width: '72px', height: '72px', fontSize: '1.75rem' }}>
                {selectedUserForLogin?.name[0]}
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selectedUserForLogin?.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter your 4-digit PIN</p>

            <div className="pin-display-dots">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`pin-dot ${enteredPin.length > i ? 'filled' : ''}`} />
                ))}
            </div>

            {pinError && (
                <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                    {pinError}
                </p>
            )}

            {/* Circular Keypad */}
            <div className="keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString())}>
                        {num}
                    </button>
                ))}
                <button 
                    className="keypad-btn action-btn" 
                    onClick={() => setEnteredPin(enteredPin.slice(0, -1))}
                >
                    ⌫
                </button>
                <button className="keypad-btn" onClick={() => handleKeypadPress('0')}>
                    0
                </button>
                <button 
                    className="keypad-btn action-btn" 
                    onClick={() => setEnteredPin('')}
                >
                    C
                </button>
            </div>

            <button 
                className="btn btn-secondary" 
                style={{ marginTop: '2rem', padding: '0.4rem 1rem', fontSize: '0.75rem', border: 'none', background: 'transparent', color: 'var(--accent-blue)' }}
                onClick={handleForgotPinClick}
            >
                Forgot PIN? (Free Recovery)
            </button>

            {/* PIN Recovery Modal */}
            {isRecoveryOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ width: '400px' }}>
                        <h3 className="modal-title">PIN Recovery</h3>
                        
                        {recoveryMode === 'question' ? (
                            <div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Security Question:
                                </p>
                                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                                    "{recoveryQuestion}"
                                </p>
                                
                                <div className="form-group">
                                    <label className="form-label">Your Security Answer</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Enter answer"
                                        value={recoveryAnswer}
                                        onChange={(e) => setRecoveryAnswer(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRecoverySubmit()}
                                        autoFocus
                                    />
                                </div>

                                {recoveryError && (
                                    <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                                        {recoveryError}
                                    </p>
                                )}

                                <div className="modal-buttons">
                                    <button className="btn btn-secondary" onClick={() => setIsRecoveryOpen(false)}>
                                        Close
                                    </button>
                                    <button className="btn btn-primary" onClick={handleRecoverySubmit}>
                                        Verify Answer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '1rem' }}>
                                    ✓ Answer Verified!
                                </p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    Your profile security PIN is:
                                </p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.2em', margin: '1rem 0' }}>
                                    {recoveredPin}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Write it down and enter it in the keypad screen to log in.
                                </p>
                                <div className="modal-buttons" style={{ marginTop: '2rem' }}>
                                    <button className="btn btn-primary" onClick={() => setIsRecoveryOpen(false)}>
                                        Go Back to Keypad
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderProfileSettings = () => (
        <div className="settings-container glass-panel">
            <div className="settings-header">
                <h3 className="font-heading" style={{ fontSize: '1.25rem' }}>Profile Settings</h3>
                <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => {
                        setView('dashboard');
                        localStorage.setItem('study_current_view', 'dashboard');
                    }}
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="user-profile-summary">
                <div className="user-avatar">{currentUser?.name[0]}</div>
                <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{currentUser?.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User ID: #{currentUser?.id}</p>
                </div>
            </div>

            <form onSubmit={handleUpdateProfileSubmit}>
                <div className="settings-group">
                    <h4 className="settings-group-title">Personal Settings</h4>
                    <div className="form-group">
                        <label className="form-label">Profile Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">New 4-Digit PIN</label>
                        <input 
                            type="password" 
                            maxLength="4"
                            className="form-input" 
                            placeholder="Enter new 4-digit PIN"
                            value={settingsPin}
                            onChange={(e) => setSettingsPin(e.target.value.replace(/\D/g,''))}
                            required
                        />
                    </div>
                </div>

                <div className="settings-group">
                    <h4 className="settings-group-title">Recovery Settings (Free recovery question)</h4>
                    <div className="form-group">
                        <label className="form-label">Security Question</label>
                        <select 
                            className="form-input" 
                            value={settingsQuestion}
                            onChange={(e) => setSettingsQuestion(e.target.value)}
                            style={{ background: '#090d16', color: 'var(--text-main)' }}
                        >
                            <option>What was the name of your first pet?</option>
                            <option>What is your mother's maiden name?</option>
                            <option>What city were you born in?</option>
                            <option>What was your favorite book growing up?</option>
                            <option>What is the model of your first car?</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Security Answer</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Enter new answer"
                            value={settingsAnswer}
                            onChange={(e) => setSettingsAnswer(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleLogout}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Icons.LogOut size={16} /> Log Out
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-danger" 
                            onClick={() => {
                                setDeleteConfirmPin('');
                                setDeleteConfirmAnswer('');
                                setDeleteConfirmText('');
                                setDeleteError('');
                                setIsDeleteModalOpen(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#7f1d1d', border: '1px solid #dc2626', color: '#fca5a5' }}
                        >
                            <Icons.Trash size={16} /> Delete Profile
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Save Settings
                    </button>
                </div>
            </form>

            {/* Delete Account Verification Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ width: '420px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <h3 className="modal-title" style={{ color: 'var(--accent-red)' }}>⚠️ Permanent Account Deletion</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.4', textAlign: 'left' }}>
                            This action is <strong>irreversible</strong>. Deleting your profile will permanently wipe all courses, notes, statistics, and offline downloads from your disk.
                        </p>
                        
                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label className="form-label">Confirm with your 4-Digit PIN</label>
                            <input 
                                type="password" 
                                maxLength="4"
                                className="form-input" 
                                placeholder="Enter PIN"
                                value={deleteConfirmPin}
                                onChange={(e) => setDeleteConfirmPin(e.target.value.replace(/\D/g,''))}
                            />
                        </div>

                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label className="form-label">Security Question: "{settingsQuestion}"</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Your security answer"
                                value={deleteConfirmAnswer}
                                onChange={(e) => setDeleteConfirmAnswer(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label className="form-label">Type "DELETE" to confirm</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Type DELETE"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                        </div>

                        {deleteError && (
                            <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600, textAlign: 'left' }}>
                                {deleteError}
                            </p>
                        )}

                        <div className="modal-buttons" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteProfile}
                                style={{ background: 'var(--accent-red)', color: 'white' }}
                            >
                                Permanently Delete Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMainContent = () => (
        view === 'dashboard' ? (
            <Dashboard 
                courses={courses} 
                stats={stats} 
                onSelectCourse={handleSelectCourse} 
                onDeleteCourse={handleDeleteCourse}
                onAddClick={() => setIsCreatorOpen(true)}
            />
        ) : (
            <CourseViewer 
                courseId={selectedCourseId} 
                onBack={() => { 
                    setView('dashboard'); 
                    localStorage.setItem('study_current_view', 'dashboard');
                    localStorage.removeItem('study_current_course_id');
                    localStorage.removeItem('study_current_video_id');
                    fetchCourses(); 
                    fetchStats(); 
                }}
                showNotification={showNotification}
            />
        )
    );

    return (
        <div className="app-container">
            {notification && (
                <div className={`app-notification glass-panel`}>
                    <Icons.Info size={18} style={{ color: 'var(--primary)' }} />
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header / Top Navigation Bar (Visible only when logged in) */}
            {currentUser && (
                <header className="glass-panel" style={{ padding: '1rem 2rem', borderRadius: '16px' }}>
                    <div className="brand-section">
                        <div className="logo-icon">🚀</div>
                        <div>
                            <h1 className="brand-title">FocusLocus</h1>
                            <p className="brand-subtitle">Smart Course Workspace</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        {/* Pomodoro widget */}
                        <div className={`pomodoro-widget glass-panel ${pomoRunning ? 'pomodoro-active' : ''}`}>
                            <Icons.Clock size={16} style={{ color: pomoRunning ? 'var(--accent-red)' : 'var(--text-muted)' }} />
                            <span className="pomo-time">{formatPomoTime(pomoTime)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                ({pomoMode})
                            </span>
                            <button className="pomo-btn" onClick={() => setPomoRunning(!pomoRunning)}>
                                {pomoRunning ? <Icons.Pause size={14} /> : <Icons.Play size={14} />}
                            </button>
                            <button className="pomo-btn" onClick={() => setIsPomoModalOpen(true)}>
                                <Icons.Settings size={14} />
                            </button>
                        </div>

                        {/* Learning Streak */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                                🔥 <strong style={{ color: '#f97316' }}>{stats.streak_days}d</strong> Streak
                            </span>
                        </div>

                        {/* User Profile avatar dropdown */}
                        <div 
                            className="user-avatar" 
                            style={{ 
                                cursor: 'pointer', 
                                width: '38px', 
                                height: '38px', 
                                fontSize: '0.9rem', 
                                margin: 0, 
                                border: view === 'profile_settings' ? '2px solid var(--accent-blue)' : 'none' 
                            }}
                            onClick={openProfileSettings}
                            title="Profile Settings"
                        >
                            {currentUser.name[0]}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Application Body */}
            <main>
                {view === 'user_select' && renderUserSelect()}
                {view === 'user_register' && renderUserRegister()}
                {view === 'user_pin_entry' && renderUserPinEntry()}
                {view === 'profile_settings' && renderProfileSettings()}
                {(view === 'dashboard' || view === 'viewer') && renderMainContent()}
            </main>

            {/* Floating Plus Button (Element 2) */}
            {view === 'dashboard' && currentUser && (
                <button className="btn-floating-add" onClick={() => setIsCreatorOpen(true)}>
                    <Icons.Plus size={28} />
                </button>
            )}

            {/* Course Creator Step-by-Step Popups (Element 2 Requirements) */}
            {isCreatorOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        {creatorStep === 1 ? (
                            <div>
                                <h3 className="modal-title">Create New Course</h3>
                                <div className="form-group">
                                    <label className="form-label">Course Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Advanced Machine Learning"
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setCreatorStep(2)}
                                        autoFocus
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    Would you like to proceed and import videos for this course?
                                </p>
                                <div className="modal-buttons">
                                    <button className="btn btn-secondary" onClick={() => setIsCreatorOpen(false)}>
                                        No (Cancel)
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => {
                                            if (!courseName.trim()) {
                                                showNotification("Course name cannot be empty", "error");
                                            } else {
                                                setCreatorStep(2);
                                            }
                                        }}
                                    >
                                        Yes (Proceed)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="modal-title">Import Videos: {courseName}</h3>
                                
                                <div className="layout-options">
                                    <button 
                                        className={`opt-btn ${creationType === 'playlist' ? 'active' : ''}`}
                                        onClick={() => setCreationType('playlist')}
                                    >
                                        <Icons.ListVideo size={20} />
                                        <span>YouTube Playlist</span>
                                    </button>
                                    <button 
                                        className={`opt-btn ${creationType === 'individual' ? 'active' : ''}`}
                                        onClick={() => setCreationType('individual')}
                                    >
                                        <Icons.Video size={20} />
                                        <span>Individual Videos</span>
                                    </button>
                                </div>

                                {creationType === 'playlist' ? (
                                    <div className="form-group">
                                        <label className="form-label">YouTube Playlist URL or ID</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="https://www.youtube.com/playlist?list=..."
                                            value={playlistUrl}
                                            onChange={(e) => setPlaylistUrl(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label className="form-label">Video URLs</label>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                                                onClick={() => setIndividualUrls([...individualUrls, ''])}
                                            >
                                                + Add URL
                                            </button>
                                        </div>
                                        <div className="dynamic-inputs">
                                            {individualUrls.map((url, idx) => (
                                                <div className="input-row" key={idx}>
                                                    <input 
                                                        type="text" 
                                                        className="form-input" 
                                                        placeholder={`Video URL #${idx + 1}`}
                                                        value={url}
                                                        onChange={(e) => {
                                                            const newUrls = [...individualUrls];
                                                            newUrls[idx] = e.target.value;
                                                            setIndividualUrls(newUrls);
                                                        }}
                                                    />
                                                    {individualUrls.length > 1 && (
                                                        <button 
                                                            className="btn-remove-row"
                                                            onClick={() => {
                                                                setIndividualUrls(individualUrls.filter((_, i) => i !== idx));
                                                            }}
                                                        >
                                                            <Icons.Trash size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Center Buttons (Requirements) */}
                                <div className="bottom-center-buttons">
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => setCreatorStep(1)}
                                        disabled={isSavingCourse}
                                    >
                                        Back
                                    </button>
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={() => {
                                            setIsCreatorOpen(false);
                                            setCreatorStep(1);
                                            setCourseName('');
                                        }}
                                        disabled={isSavingCourse}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleCreateCourseSubmit}
                                        disabled={isSavingCourse}
                                    >
                                        {isSavingCourse ? "Saving..." : "Save Course"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pomodoro Settings Modal */}
            {isPomoModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ width: '380px' }}>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icons.Clock size={20} style={{ color: 'var(--primary)' }} />
                            Pomodoro Timer Settings
                        </h3>
                        <div className="pomodoro-modal">
                            <div className={`pomo-circle ${pomoRunning ? 'running' : 'paused'}`}>
                                <span className="pomo-circle-time">{formatPomoTime(pomoTime)}</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setPomoTime(1500);
                                        setPomoMode('work');
                                        setPomoRunning(false);
                                    }}
                                >
                                    25m Work
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setPomoTime(300);
                                        setPomoMode('break');
                                        setPomoRunning(false);
                                    }}
                                >
                                    5m Break
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                                <button 
                                    className={`btn ${pomoRunning ? 'btn-danger' : 'btn-primary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setPomoRunning(!pomoRunning)}
                                >
                                    {pomoRunning ? "Pause Timer" : "Start Timer"}
                                </button>
                            </div>
                        </div>
                        <div className="modal-buttons" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsPomoModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------
// Component: Dashboard
// ----------------------------------------------------
function Dashboard({ courses, stats, onSelectCourse, onDeleteCourse, onAddClick }) {
    const formatHours = (secsStr) => {
        const secs = parseInt(secsStr || '0');
        if (secs === 0) return "0 min";
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins} min`;
        const hrs = (mins / 60).toFixed(1);
        return `${hrs} hrs`;
    };

    return (
        <div>
            {/* Stats Row */}
            <div className="stats-banner">
                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper purple">
                        <Icons.Graduation size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Courses</span>
                        <span className="stat-value">{courses.length}</span>
                    </div>
                </div>

                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper orange">
                        <Icons.Flame size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Study Streak</span>
                        <span className="stat-value">{stats.streak_days} days</span>
                    </div>
                </div>

                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper blue">
                        <Icons.Clock size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Time Spent</span>
                        <span className="stat-value">{formatHours(stats.total_seconds_watched)}</span>
                    </div>
                </div>
            </div>

            {/* Courses Section */}
            <div className="dashboard-title-row">
                <h2>My Courses</h2>
            </div>

            {courses.length === 0 ? (
                <div className="empty-dashboard" onClick={onAddClick} style={{ cursor: 'pointer' }}>
                    <div className="empty-icon">📚</div>
                    <h3 className="empty-text-title">Create your first course</h3>
                    <p className="empty-text-desc">
                        Click the floating <strong style={{ color: 'var(--primary)' }}>+</strong> button or click here to add a YouTube playlist and start your study journey!
                    </p>
                </div>
            ) : (
                <div className="grid-courses">
                    {courses.map(course => {
                        const totalVideos = course.total_videos || 0;
                        const completedVideos = course.completed_videos || 0;
                        const progressPct = totalVideos > 0 
                            ? Math.round((completedVideos / totalVideos) * 100)
                            : 0;
                        const isComplete = totalVideos > 0 && completedVideos === totalVideos;

                        return (
                            <div 
                                key={course.id} 
                                className="course-card glass-panel" 
                                onClick={() => onSelectCourse(course.id)}
                            >
                                {/* Thumbnail */}
                                <div 
                                    className="course-thumbnail"
                                    style={{ 
                                        backgroundImage: course.videos && course.videos.length > 0 
                                            ? `url(${course.videos[0].thumbnail_url})` 
                                            : `url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500)`
                                    }}
                                >
                                    <span className={`course-badge ${isComplete ? 'badge-complete' : 'badge-progress'}`}>
                                        {isComplete ? "Completed" : "In Progress"}
                                    </span>
                                </div>

                                <div className="course-card-content">
                                    <div>
                                        <h3 className="course-title">{course.name}</h3>
                                        <div className="course-meta">
                                            <span>📹 {totalVideos} videos</span>
                                            <span>
                                                {course.is_offline_ready ? (
                                                    <span className="offline-badge-tag">Offline Available</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-dark)' }}>Online Only</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="course-progress-container">
                                        <div className="progress-header">
                                            <span>Progress</span>
                                            <span className="progress-pct">{progressPct}%</span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    className="delete-course-btn" 
                                    onClick={(e) => onDeleteCourse(course.id, e)}
                                    title="Delete Course"
                                >
                                    <Icons.Trash size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------
// Component: CourseViewer
// ----------------------------------------------------
function CourseViewer({ courseId, onBack, showNotification }) {
    const [course, setCourse] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    
    // Notes module state
    const [isNotesOpen, setIsNotesOpen] = useState(true);
    const [noteContent, setNoteContent] = useState('');
    const [noteSaveStatus, setNoteSaveStatus] = useState('Saved'); // 'Saved', 'Saving', 'Typing'
    
    // Video player state
    const [isOfflinePlayMode, setIsOfflinePlayMode] = useState(false);
    const ytPlayerRef = useRef(null);
    const iframeRef = useRef(null);
    
    const noteTimerRef = useRef(null);
    const videoElementRef = useRef(null); // Ref for HTML5 offline video player

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    // Handle note auto-save debouncing
    useEffect(() => {
        if (activeVideo && noteSaveStatus === 'Typing') {
            setNoteSaveStatus('Saving');
            if (noteTimerRef.current) clearTimeout(noteTimerRef.current);

            noteTimerRef.current = setTimeout(async () => {
                try {
                    const res = await apiFetch(`/api/videos/${activeVideo.id}/note`, {
                        method: 'POST',
                        body: JSON.stringify({ content: noteContent })
                    });
                    if (res.ok) {
                        setNoteSaveStatus('Saved');
                    }
                } catch (err) {
                    setNoteSaveStatus('Failed');
                }
            }, 1000); // 1 sec debounce
        }

        return () => {
            if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
        };
    }, [noteContent, activeVideo]);

    const fetchCourseDetails = async () => {
        try {
            const res = await apiFetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
                if (data.videos && data.videos.length > 0) {
                    // Check if there is a saved video ID in localStorage
                    const savedVideoId = localStorage.getItem('study_current_video_id');
                    let targetVideo = null;
                    if (savedVideoId) {
                        targetVideo = data.videos.find(v => v.id === parseInt(savedVideoId));
                    }
                    if (!targetVideo) {
                        targetVideo = data.videos[0];
                    }
                    
                    setActiveVideo(targetVideo);
                    fetchVideoNote(targetVideo.id);
                    setIsOfflinePlayMode(targetVideo.download_status === 'completed');
                    localStorage.setItem('study_current_video_id', targetVideo.id);
                }
            }
        } catch (err) {
            console.error("Error fetching course details:", err);
        }
    };

    const fetchVideoNote = async (videoId) => {
        try {
            const res = await apiFetch(`/api/videos/${videoId}/note`);
            if (res.ok) {
                const data = await res.json();
                setNoteContent(data.content || '');
                setNoteSaveStatus('Saved');
            }
        } catch (err) {
            console.error("Error fetching video note:", err);
        }
    };

    // Re-initialize player whenever activeVideo or isOfflinePlayMode changes
    useEffect(() => {
        if (isOfflinePlayMode || !activeVideo) {
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch (e) {}
                ytPlayerRef.current = null;
            }
            return;
        }

        let player = null;
        let checkTimer = null;

        const initPlayer = () => {
            if (window.YT && window.YT.Player && iframeRef.current) {
                player = new window.YT.Player(iframeRef.current, {
                    events: {
                        onReady: (event) => {
                            try { event.target.setPlaybackRate(playbackSpeed); } catch(e){}
                        },
                        onStateChange: (event) => {
                            if (event.data === 0) {
                                handleVideoAutoFinish(activeVideo.id);
                            }
                        }
                    }
                });
                ytPlayerRef.current = player;
            } else {
                checkTimer = setTimeout(initPlayer, 100);
            }
        };

        initPlayer();

        return () => {
            if (checkTimer) clearTimeout(checkTimer);
            if (player && player.destroy) {
                try { player.destroy(); } catch (e) {}
            }
            ytPlayerRef.current = null;
        };
    }, [activeVideo, isOfflinePlayMode]);

    // Apply speed changes to active players
    useEffect(() => {
        if (isOfflinePlayMode && videoElementRef.current) {
            videoElementRef.current.playbackRate = playbackSpeed;
        } else if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
            try {
                ytPlayerRef.current.setPlaybackRate(playbackSpeed);
            } catch (e) {
                console.warn("YouTube player rate set failed:", e);
            }
        }
    }, [playbackSpeed, isOfflinePlayMode, activeVideo]);

    const selectVideo = (video) => {
        if (noteSaveStatus === 'Saving' || noteSaveStatus === 'Typing') {
            apiFetch(`/api/videos/${activeVideo.id}/note`, {
                method: 'POST',
                body: JSON.stringify({ content: noteContent })
            });
        }
        
        setActiveVideo(video);
        fetchVideoNote(video.id);
        setIsOfflinePlayMode(video.download_status === 'completed');
        setPlaybackSpeed(1);
        localStorage.setItem('study_current_video_id', video.id);
    };

    const handleVideoAutoFinish = (id) => {
        toggleVideoCompleted(id, true);
        showNotification("Video Finished! Progress updated.");
    };

    const toggleVideoCompleted = async (id, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const res = await apiFetch(`/api/videos/${id}/toggle-complete`, {
                method: 'POST',
                body: JSON.stringify({ completed: newStatus })
            });

            if (res.ok) {
                setCourse(prev => {
                    const updatedVideos = prev.videos.map(v => 
                        v.id === id ? { ...v, completed: newStatus ? 1 : 0 } : v
                    );
                    const completedCount = updatedVideos.filter(v => v.completed === 1).length;
                    
                    if (completedCount === updatedVideos.length) {
                        triggerConfettiCelebration();
                    }
                    
                    return {
                        ...prev,
                        videos: updatedVideos,
                        completed_videos: completedCount
                    };
                });
            }
        } catch (err) {
            console.error("Error toggling completion status:", err);
        }
    };

    const triggerConfettiCelebration = () => {
        if (window.confetti) {
            window.confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
        showNotification("🎉 Course Completed! Incredible job!");
    };

    // Toggle local video download task
    const toggleOfflineMode = async (video) => {
        if (video.download_status === 'completed') {
            setIsOfflinePlayMode(!isOfflinePlayMode);
            showNotification(isOfflinePlayMode ? "Switched to Online mode" : "Switched to local Offline stream");
            return;
        }

        if (video.download_status === 'downloading') {
            showNotification("Download is already running in background", "info");
            return;
        }

        try {
            showNotification("Starting background video download...", "info");
            const res = await apiFetch(`/api/videos/${video.id}/download`, { method: 'POST' });
            if (res.ok) {
                setCourse(prev => ({
                    ...prev,
                    videos: prev.videos.map(v => 
                        v.id === video.id ? { ...v, download_status: 'downloading', download_progress: 0 } : v
                    )
                }));
                pollDownloadProgress();
            }
        } catch (err) {
            showNotification("Failed to start download", "error");
        }
    };

    // Poll download updates
    const pollDownloadProgress = () => {
        const interval = setInterval(async () => {
            try {
                const res = await apiFetch(`/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                    
                    if (activeVideo) {
                        const refreshedActive = data.videos.find(v => v.id === activeVideo.id);
                        if (refreshedActive) {
                            setActiveVideo(refreshedActive);
                            if (refreshedActive.download_status === 'completed' && !isOfflinePlayMode) {
                                setIsOfflinePlayMode(true);
                                showNotification(`Offline file ready for: ${refreshedActive.title}`);
                            }
                        }
                    }

                    const stillDownloading = data.videos.some(v => v.download_status === 'downloading');
                    if (!stillDownloading) {
                        clearInterval(interval);
                    }
                }
            } catch (e) {
                clearInterval(interval);
            }
        }, 3000);
    };

    useEffect(() => {
        if (course && course.videos && course.videos.some(v => v.download_status === 'downloading')) {
            pollDownloadProgress();
        }
    }, [course]);

    const mediaPlay = () => {
        if (isOfflinePlayMode && videoElementRef.current) {
            videoElementRef.current.play();
        } else if (ytPlayerRef.current && ytPlayerRef.current.playVideo) {
            ytPlayerRef.current.playVideo();
        }
    };

    const mediaPause = () => {
        if (isOfflinePlayMode && videoElementRef.current) {
            videoElementRef.current.pause();
        } else if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
            ytPlayerRef.current.pauseVideo();
        }
    };

    const mediaForward = () => {
        if (isOfflinePlayMode && videoElementRef.current) {
            videoElementRef.current.currentTime = Math.min(
                videoElementRef.current.duration || 0, 
                videoElementRef.current.currentTime + 10
            );
        } else if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && ytPlayerRef.current.seekTo) {
            const curr = ytPlayerRef.current.getCurrentTime();
            ytPlayerRef.current.seekTo(curr + 10, true);
        }
    };

    const mediaBackward = () => {
        if (isOfflinePlayMode && videoElementRef.current) {
            videoElementRef.current.currentTime = Math.max(0, videoElementRef.current.currentTime - 10);
        } else if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && ytPlayerRef.current.seekTo) {
            const curr = ytPlayerRef.current.getCurrentTime();
            ytPlayerRef.current.seekTo(Math.max(0, curr - 10), true);
        }
    };

    if (!course || !activeVideo) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <p>Loading course modules...</p>
            </div>
        );
    }

    const totalVideos = course.videos ? course.videos.length : 0;
    const completedVideos = course.videos ? course.videos.filter(v => v.completed === 1).length : 0;
    const progressPct = totalVideos > 0 
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

    const formatDuration = (secs) => {
        if (!secs) return "0:00";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Nav row & Progress */}
            <div className="glass-panel viewer-top-bar">
                <button className="viewer-nav-btn" onClick={onBack}>
                    <Icons.ArrowLeft size={16} />
                    <span>Dashboard</span>
                </button>

                <div style={{ flexGrow: 1, maxWidth: '400px', margin: '0 2rem' }}>
                    <div className="progress-header" style={{ marginBottom: '0.25rem' }}>
                        <span className="font-heading" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Course Progress</span>
                        <span className="progress-pct" style={{ fontSize: '0.8rem' }}>{progressPct}% Completed</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {completedVideos === totalVideos ? (
                        <span className="badge-complete" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            🏆 Completed
                        </span>
                    ) : (
                        <span className="badge-progress" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {completedVideos} / {totalVideos} Modules
                        </span>
                    )}
                </div>
            </div>

            <div className="course-viewer-layout">
                {/* Main Video Section */}
                <div className="viewer-main">
                    
                    {/* Centered Video Frame (Online / Offline support) */}
                    <div className="video-wrapper">
                        {isOfflinePlayMode ? (
                            <video 
                                key={activeVideo.id}
                                ref={videoElementRef}
                                src={`/api/videos/play/${activeVideo.id}?user_id=${localStorage.getItem('study_current_user_id')}`} 
                                className="offline-video-player"
                                controls
                                onEnded={() => handleVideoAutoFinish(activeVideo.id)}
                            />
                        ) : (
                            <iframe 
                                key={activeVideo.id}
                                ref={iframeRef}
                                src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?enablejsapi=1&rel=0&modestbranding=1`}
                                title={activeVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        )}
                    </div>

                    {/* Custom Player Controls */}
                    <div className="glass-panel controls-bar">
                        
                        {/* Play/Seek Buttons */}
                        <div className="playback-controls">
                            <button className="btn-ctrl" onClick={mediaBackward} title="Backward 10s">
                                <Icons.RotateCcw size={16} />
                            </button>
                            <button className="btn-ctrl" onClick={mediaPause} title="Pause">
                                <Icons.Pause size={16} />
                            </button>
                            <button className="btn-ctrl" onClick={mediaPlay} title="Play">
                                <Icons.Play size={16} />
                            </button>
                            <button className="btn-ctrl" onClick={mediaForward} title="Forward 10s">
                                <Icons.RotateCw size={16} />
                            </button>
                        </div>

                        {/* Playback Speeds */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Speed:</span>
                            <div className="speed-selector-group">
                                {[0.5, 1, 1.5, 2, 3].map(spd => (
                                    <button 
                                        key={spd}
                                        className={`btn-speed ${playbackSpeed === spd ? 'active' : ''}`}
                                        onClick={() => setPlaybackSpeed(spd)}
                                    >
                                        {spd}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Offline download toggle & note button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div className="offline-toggle-container">
                                <span>Offline Stream</span>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={isOfflinePlayMode}
                                        disabled={activeVideo.download_status !== 'completed'}
                                        onChange={() => {
                                            setIsOfflinePlayMode(!isOfflinePlayMode);
                                            showNotification(!isOfflinePlayMode ? "Switched to offline local video" : "Switched to YouTube online stream");
                                        }}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px' }}
                                onClick={() => setIsNotesOpen(!isNotesOpen)}
                            >
                                <Icons.FileText size={15} />
                                <span>Notes</span>
                            </button>
                        </div>
                    </div>

                    {/* Openable and Closable Note-Making region */}
                    {isNotesOpen && (
                        <div className="glass-panel notes-container">
                            <div className="notes-header">
                                <span className="notes-title">
                                    <Icons.FileEdit size={16} style={{ color: 'var(--primary)' }} />
                                    Study Notes: <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.25rem' }}>{activeVideo.title}</span>
                                </span>
                                <button className="notes-close-btn" onClick={() => setIsNotesOpen(false)}>
                                    <Icons.X size={16} />
                                </button>
                            </div>
                            <textarea 
                                className="notes-textarea" 
                                placeholder="Jot down formulas, ideas, timestamps, or code blocks here... (Auto-saves automatically)"
                                value={noteContent}
                                onChange={(e) => {
                                    setNoteContent(e.target.value);
                                    setNoteSaveStatus('Typing');
                                }}
                            />
                            <div className="notes-footer">
                                <span>Note is private to this video</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {noteSaveStatus === 'Saved' && <span style={{ color: 'var(--accent-emerald)' }}>● Saved</span>}
                                    {noteSaveStatus === 'Saving' && <span style={{ color: 'var(--accent-blue)' }}>○ Saving...</span>}
                                    {noteSaveStatus === 'Typing' && <span style={{ color: 'var(--text-muted)' }}>Typing...</span>}
                                    {noteSaveStatus === 'Failed' && <span style={{ color: 'var(--accent-red)' }}>✕ Auto-save failed</span>}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Section */}
                <div className="sidebar-panel">
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <h3 className="font-heading" style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Course Modules
                        </h3>
                        
                        <div className="video-list-container">
                            {course.videos.map(video => {
                                const isActive = video.id === activeVideo.id;
                                return (
                                    <div 
                                        key={video.id} 
                                        className={`video-item ${isActive ? 'active' : ''} ${video.completed ? 'completed' : ''}`}
                                        onClick={() => selectVideo(video)}
                                    >
                                        {/* Completed toggle checkbox */}
                                        <div 
                                            className="video-item-checkbox"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVideoCompleted(video.id, video.completed === 1);
                                            }}
                                        >
                                            <Icons.Check size={12} style={{ color: video.completed ? 'var(--accent-emerald)' : 'transparent' }} />
                                        </div>

                                        <div 
                                            className="video-item-thumbnail" 
                                            style={{ backgroundImage: `url(${video.thumbnail_url})` }}
                                        />

                                        <div className="video-item-details">
                                            <h4 className="video-item-title" title={video.title}>{video.title}</h4>
                                            <div className="video-item-meta">
                                                <span>⏱ {formatDuration(video.duration)}</span>
                                                
                                                {/* Download Button / Badge */}
                                                <span 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleOfflineMode(video);
                                                    }}
                                                    title={
                                                        video.download_status === 'completed' 
                                                            ? 'Downloaded! Click to toggle stream mode.'
                                                            : video.download_status === 'downloading'
                                                            ? 'Downloading video stream...'
                                                            : 'Download for offline viewing'
                                                    }
                                                >
                                                    {video.download_status === 'none' && (
                                                        <Icons.Download size={12} className="badge-dl-none" />
                                                    )}
                                                    {video.download_status === 'downloading' && (
                                                        <span className="badge-dl-progress font-heading">
                                                            ⬇ {video.download_progress}%
                                                        </span>
                                                    )}
                                                    {video.download_status === 'completed' && (
                                                        <Icons.CheckCircle size={12} className="badge-dl-complete" />
                                                    )}
                                                    {video.download_status === 'failed' && (
                                                        <Icons.AlertCircle size={12} className="badge-dl-failed" />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {!isNotesOpen && (
                        <button className="btn-open-notes glass-panel" onClick={() => setIsNotesOpen(true)}>
                            <Icons.FileEdit size={14} style={{ color: 'var(--primary)' }} />
                            <span>Write Study Notes</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Render root element
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
