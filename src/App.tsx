/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, AlertTriangle, CheckCircle2, Clock, MapPin, 
  Upload, Shield, FileText, BarChart3, Users, Send, 
  Search, Bell, LogIn, LogOut, ChevronRight, RefreshCw, 
  Filter, Plus, UserPlus, FileEdit, HelpCircle, Phone, Mail, Check,
  Camera, ArrowRight, Activity, Trash2, CheckCircle, Mic, MicOff,
  Volume2, VolumeX, Sparkles, X, MessageSquare, Settings, Compass,
  Star, Download, Share2, Award, ListFilter, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { 
  User, Department, Complaint, ComplaintStatus, 
  SeverityLevel, AIAnalysisResult, Notification, Officer
} from './types';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import InteractiveMap from './components/InteractiveMap';
// @ts-ignore
import logo from './logo.png';
// @ts-ignore
import charminarHero from './charminar_hero.png';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  // Global API states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Navigation
  const [activeNav, setActiveNav] = useState<'dashboard' | 'lodge' | 'my-complaints' | 'track' | 'road-explorer' | 'ward-health' | 'ai-assistant' | 'notifications' | 'settings'>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedComplaintDetails, setSelectedComplaintDetails] = useState<{ complaint: Complaint, history: any[] } | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [searchGlobal, setSearchGlobal] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState<Toast | null>(null);

  const [activeView, setActiveView] = useState<'landing' | 'login'>('landing');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  // Lodge Complaint Form states
  const [lodgeTitle, setLodgeTitle] = useState('');
  const [lodgeDescription, setLodgeDescription] = useState('');
  const [lodgeImage, setLodgeImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [customSeverity, setCustomSeverity] = useState<SeverityLevel>('Medium');
  const [customDepartment, setCustomDepartment] = useState('');

  // Location details
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);
  const [showLodgeMiniMap, setShowLodgeMiniMap] = useState(false);
  const [stateName, setStateName] = useState('Telangana');
  const [districtName, setDistrictName] = useState('Hyderabad');
  const [wardNo, setWardNo] = useState('Ward 12 - Mehdipatnam');
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');

  // Before & After images mock
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);

  // Citizen Rating and Feedback states
  const [citizenRating, setCitizenRating] = useState(0);
  const [citizenFeedbackText, setCitizenFeedbackText] = useState('');

  // Voice Dictation (Web Speech API) states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auth Form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState<'citizen' | 'officer' | 'admin'>('citizen');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState('My Fingerprint Scanner');

  // Floating AI Chatbot overlay states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hello! I am your CivicAI digital assistant. How can I help you route, track or lodge a civic complaint today?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Statistics calculation for Dashboard
  const categoryCounts = complaints.reduce((acc: Record<string, number>, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const resolutionChartData = departments.map(dept => {
    const deptComplaints = complaints.filter(c => c.departmentId === dept.id);
    const resolvedComplaints = deptComplaints.filter(c => c.status === 'Resolved');
    
    let avgHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, curr) => {
        const duration = (new Date(curr.updatedAt).getTime() - new Date(curr.createdAt).getTime()) / (1000 * 60 * 60);
        return acc + Math.max(0.5, duration);
      }, 0);
      avgHours = Number((totalHours / resolvedComplaints.length).toFixed(1));
    } else {
      const fallbackHours: Record<string, number> = {
        'dept-roads': 28.5,
        'dept-sanitation': 12.0,
        'dept-water': 16.5,
        'dept-electrical': 6.8
      };
      avgHours = fallbackHours[dept.id] || 24.0;
    }
    
    return {
      name: dept.name.split('Wing')[0] || dept.name,
      hours: avgHours
    };
  });

  const stats = React.useMemo(() => {
    const total = complaints.length;
    const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Verified').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const rejected = complaints.filter(c => c.status === 'Rejected').length;
    return { total, inProgress, resolved, pending, rejected };
  }, [complaints]);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Initial load
  useEffect(() => {
    fetchDepartments();
    fetchComplaints();
    fetchOfficers();
    
    const savedUser = localStorage.getItem('civiq_user');
    const savedToken = localStorage.getItem('civiq_token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setAuthToken(savedToken);
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  // Fetch complaint details
  useEffect(() => {
    if (selectedComplaintId) {
      fetchComplaintDetails(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data);
    } catch (e) {
      console.error('Failed to load departments', e);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      setComplaints(data);
    } catch (e) {
      console.error('Failed to load complaints', e);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch('/api/officers');
      const data = await res.json();
      setOfficers(data);
    } catch (e) {
      console.error('Failed to load officers', e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  const fetchComplaintDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedComplaintDetails(data);
      }
    } catch (e) {
      showToast('Failed to load complaint logs', 'error');
    }
  };

  // Auth Handlers
  const handleDirectAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          role: authRole,
          name: authName,
          phone: authPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem('civiq_user', JSON.stringify(data.user));
        localStorage.setItem('civiq_token', data.token);
        
        // Reset forms
        setAuthEmail('');
        setAuthName('');
        setAuthPhone('');
        setOtpSentMessage(null);
        setActiveNav('dashboard');
        
        showToast(`Welcome back, ${data.user.name}! Authenticated successfully.`, 'success');
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err) {
      showToast('Network error during authentication', 'error');
    }
  };

  const triggerSandboxAccount = (role: 'citizen' | 'officer' | 'admin') => {
    let email = 'citizen@civiq.gov';
    if (role === 'officer') email = 'officer@civiq.gov';
    if (role === 'admin') email = 'admin@civiq.gov';
    
    setAuthEmail(email);
    setAuthRole(role);
    setAuthMode('login');
    showToast(`Quick-selected standard ${role} sandbox credentials. Click Log In to enter!`, 'info');
  };

  const handleLogOut = () => {
    localStorage.removeItem('civiq_user');
    localStorage.removeItem('civiq_token');
    setCurrentUser(null);
    setAuthToken(null);
    showToast('Logged out successfully', 'info');
  };

  // Image Upload Evidence Picker
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLodgeImage(reader.result as string);
      setAiAnalysis(null); // Clear previous runs
    };
    reader.readAsDataURL(file);
  };

  // AI Assistant vision scanning
  const handleRunAIScan = async () => {
    if (!lodgeImage) {
      showToast('Please capture or select a complaint image first', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: lodgeImage,
          description: lodgeDescription
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiAnalysis(data);

        // Always auto-populate form from AI response
        setCustomCategory(data.category);
        setCustomSeverity(data.severity);
        setCustomDepartment(data.department);

        // Auto-map AI output to our local auto-routing subcategories
        const subLow = (data.subcategory || '').toLowerCase();
        const catLow = (data.category || '').toLowerCase();
        if (subLow.includes('pothole') || subLow.includes('road') || catLow.includes('road')) {
          setCustomSubcategory('Pothole');
        } else if (subLow.includes('garbage') || subLow.includes('trash') || subLow.includes('waste') || subLow.includes('sanitation') || catLow.includes('waste') || catLow.includes('sanitation')) {
          setCustomSubcategory('Garbage Overflow');
        } else if (subLow.includes('water') || subLow.includes('drain') || subLow.includes('leak') || subLow.includes('flood') || subLow.includes('sewer') || subLow.includes('waterlogging') || catLow.includes('water') || catLow.includes('sewer')) {
          setCustomSubcategory('Waterlogging');
        } else if (subLow.includes('light') || subLow.includes('wire') || subLow.includes('electric') || subLow.includes('streetlight') || catLow.includes('electric') || catLow.includes('streetlight')) {
          setCustomSubcategory('Broken Streetlight');
        } else {
          setCustomSubcategory('Other');
        }

        if (!lodgeTitle) {
          setLodgeTitle(`${data.subcategory || 'Civic Grievance'} reported near ${address || 'my neighborhood'}`);
        }
        showToast('AI scan complete — category auto-detected and routed!', 'success');
      } else {
        showToast(data.error || 'AI analysis timed out', 'error');
      }
    } catch (e) {
      showToast('AI analysis route failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubcategoryChange = (sub: string) => {
    setCustomSubcategory(sub);
    if (sub === 'Pothole') {
      setCustomCategory('Road Infrastructure');
      setCustomDepartment('GHMC Engineering Wing (Roads & Drains)');
    } else if (sub === 'Garbage Overflow') {
      setCustomCategory('Solid Waste & Sanitation');
      setCustomDepartment('GHMC Health & Sanitation Wing');
    } else if (sub === 'Waterlogging') {
      setCustomCategory('Water Supply & Sewerage');
      setCustomDepartment('Hyderabad Water Board (HMWSSB)');
    } else if (sub === 'Broken Streetlight') {
      setCustomCategory('Electricity & Streetlights');
      setCustomDepartment('GHMC Electrical Wing (Streetlighting)');
    } else if (sub === 'Other') {
      setCustomCategory('Other');
      setCustomDepartment('');
    } else {
      setCustomCategory('');
      setCustomDepartment('');
    }
  };

  // Geolocate via GPS
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setAddress(data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        } catch {
          setAddress(`Telangana Grid Coords [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
        }
        setIsLocating(false);
        showToast('GPS Coordinates updated!', 'success');
      },
      () => {
        setIsLocating(false);
        showToast('Failed to retrieve device location coordinates. Please try manual entry.', 'error');
      }
    );
  };

  // Web Speech API dictation
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';

    rec.onstart = () => {
      setIsListening(true);
      showToast('Listening... Speak now.', 'info');
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setLodgeDescription(prev => prev ? `${prev.trim()} ${text.trim()}` : text.trim());
      showToast('Speech successfully transcribed!', 'success');
    };

    rec.onerror = () => {
      showToast('Error capturing audio. Please try again.', 'error');
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Submit new complaint to backend
  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!lodgeTitle) {
      showToast('Please provide a summary title', 'error');
      return;
    }
    if (!lodgeImage) {
      showToast('An image is required to back the complaint', 'error');
      return;
    }

    try {
      const payload = {
        userId: currentUser.id,
        userName: currentUser.name,
        title: lodgeTitle,
        description: lodgeDescription,
        category: customCategory || aiAnalysis?.category || 'General',
        subcategory: customSubcategory || aiAnalysis?.subcategory || 'Unclassified',
        severity: customSeverity || aiAnalysis?.severity || 'Medium',
        latitude: latitude || 17.3850,
        longitude: longitude || 78.4867,
        address: address || `${streetName}, ${landmark}, ${wardNo}, ${districtName}, ${stateName}`,
        aiConfidence: aiAnalysis?.confidence || 80,
        aiSummary: aiAnalysis?.summary || 'Standard grievance registration',
        imageUrl: lodgeImage,
        departmentName: customDepartment || aiAnalysis?.department || ''
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Complaint lodged successfully: ID ${data.complaint.complaintId}`, 'success');
        
        // Reset complaint forms
        setLodgeTitle('');
        setLodgeDescription('');
        setLodgeImage(null);
        setAiAnalysis(null);
        setLatitude(null);
        setLongitude(null);
        setAddress('');
        setCustomCategory('');
        setCustomSubcategory('');
        setCustomDepartment('');
        
        // Reload complaints list
        fetchComplaints();
        
        // Track the newly created complaint
        setSelectedComplaintId(data.complaint.id);
        setActiveNav('track');
      } else {
        showToast(data.error || 'Failed to lodge complaint', 'error');
      }
    } catch (err) {
      showToast('Connection to registration server failed', 'error');
    }
  };

  // Submit Feedback / Review
  const handleSubmitFeedback = async () => {
    if (!selectedComplaintId) return;
    showToast(`Feedback submitted successfully with rating: ${citizenRating} Stars!`, 'success');
    setCitizenRating(0);
    setCitizenFeedbackText('');
    fetchComplaintDetails(selectedComplaintId);
  };

  // Floating AI Chat assistant submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMsg = chatQuery;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatQuery('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am facing connectivity issues. Please try again.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error contacting assistant server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Filter complaints for viewing list
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || c.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-main-bg text-primary-text font-sans flex antialiased animate-fade-in">
      
      {/* Toast notifications banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg max-w-md border animate-fade-in ${
          toast.type === 'success' ? 'bg-[#E8F6EC] text-[#2E8B57] border-[#C9DEBE]' :
          toast.type === 'error' ? 'bg-[#FDECEC] text-[#DC2626] border-[#FCA5A5]' :
          'bg-[#EAF2FF] text-[#3B82F6] border-[#BFDBFE]'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 mr-3 text-[#2E8B57] shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 mr-3 text-[#DC2626] shrink-0" />}
          {toast.type === 'info' && <Clock className="w-5 h-5 mr-3 text-[#3B82F6] shrink-0" />}
          <div className="text-sm font-semibold">{toast.message}</div>
        </div>
      )}

      {currentUser && activeView === 'dashboard' ? (
        // ==========================================
        // PERSISTENT SIDEBAR LAYOUT (LOGGED IN STATES)
        // ==========================================
        <div className="flex w-full min-h-screen">
          
          {/* Left Sidebar (280px wide) */}
          <aside className="w-[280px] bg-white border-r border-default-border flex flex-col justify-between shrink-0 h-screen sticky top-0">
            <div>
              {/* Emblem & Portal Branding */}
              <div className="p-6 border-b border-dividers flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="CivicAI Emblem" 
                  className="h-12 w-12 object-contain shrink-0" 
                />
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-primary-text leading-tight">CivicAI</h1>
                  <p className="text-[11px] text-secondary-text font-medium uppercase tracking-wider">National Grievance Grid</p>
                  <p className="text-[9px] text-primary-hover font-semibold mt-0.5 leading-none">GoI digital network</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-1.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'lodge', label: 'Lodge Complaint', icon: FileEdit },
                  { id: 'my-complaints', label: 'My Complaints', icon: FileText },
                  { id: 'track', label: 'Track Complaint', icon: Clock },
                  { id: 'road-explorer', label: 'Road Explorer', icon: Compass },
                  { id: 'ward-health', label: 'Ward Health', icon: Activity },
                  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
                  { id: 'notifications', label: 'Notifications', icon: Bell, badgeCount: notifications.filter(n => !n.isRead).length },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(item => {
                  const IconComp = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id as any);
                        if (item.id === 'my-complaints') {
                          setStatusFilter('All');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        isActive 
                          ? 'bg-surface-green text-primary-text border-l-4 border-primary-green' 
                          : 'text-secondary-text hover:bg-hover-bg hover:text-primary-text'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-primary-hover' : 'text-muted-text'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar bottom CTA and user details */}
            <div className="p-4 border-t border-dividers space-y-4">
              <button
                onClick={() => setActiveNav('lodge')}
                className="w-full bg-primary-green hover:bg-primary-hover text-white font-bold text-xs py-3 px-4 rounded-[12px] shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Lodge New Grievance
              </button>

              <button
                onClick={() => setActiveView('landing')}
                className="w-full bg-[#EEF8E8] hover:bg-[#EEF8E8]/75 border border-[#C3E39D] text-[#437132] font-bold text-xs py-2 px-4 rounded-[12px] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180 text-[#569140]" />
                Back to Landing Page
              </button>

              <div className="bg-section-bg rounded-xl p-3 flex items-center justify-between border border-default-border">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary-text truncate">{currentUser.name}</p>
                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-primary-hover">{currentUser.role} Account</p>
                </div>
                <button 
                  onClick={handleLogOut}
                  className="text-muted-text hover:text-secondary-text p-1.5 rounded-lg hover:bg-hover-bg transition"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main workspace container (Right) */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Top Navigation Bar (72px height) */}
            <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
              
              {/* Search container */}
              <div className="w-96 relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Search grievance ID, ward, or department..."
                  value={searchGlobal}
                  onChange={(e) => {
                    setSearchGlobal(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Actions & Profiles */}
              <div className="flex items-center space-x-4">
                
                {/* Language Picker */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="en">English (ENG)</option>
                  <option value="hi">हिंदी (HIN)</option>
                  <option value="te">తెలుగు (TEL)</option>
                </select>

                {/* Notifications trigger */}
                <button 
                  onClick={() => setActiveNav('notifications')}
                  className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
                  )}
                </button>

                {/* Vertical Separator */}
                <span className="h-6 w-px bg-slate-200"></span>

                {/* Profile display */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name[0]}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{currentUser.email}</p>
                  </div>
                </div>

              </div>
            </header>

            {/* Dynamic Page Container */}
            <main className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-6">
              
              {activeNav === 'dashboard' && (
                <div className="space-y-6">
                  <div className="rounded-2xl p-8 relative overflow-hidden border border-[#E3ECD9]" style={{ backgroundImage: 'linear-gradient(135deg, #F5FAF2 0%, #EAF6E3 45%, #CFE8C3 100%)' }}>
                    <div className="absolute right-0 bottom-0 opacity-8 hidden lg:block select-none pointer-events-none w-[600px] h-[200px]">
                      <svg width="600" height="200" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Fading Background Grid / Map lines */}
                        <path d="M50 190 H600 M100 160 H600 M150 130 H600 M200 100 H600" stroke="#6FB555" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
                        <path d="M300 0 V200 M400 0 V200 M500 0 V200" stroke="#6FB555" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />

                        {/* Faint Birds & Clouds */}
                        <path d="M 320 40 Q 325 35 330 40 Q 335 35 340 40" stroke="#569140" strokeWidth="1.2" fill="none" />
                        <path d="M 450 30 Q 455 25 460 30 Q 465 25 470 30" stroke="#569140" strokeWidth="1.2" fill="none" />
                        <path d="M 380 20 C 390 20, 395 10, 410 10 C 420 10, 425 20, 435 20 Z" fill="#EEF8E8" opacity="0.3" />

                        {/* Hussain Sagar Buddha Statue */}
                        <g fill="#437132" opacity="0.8">
                          {/* Pedestal */}
                          <rect x="250" y="180" width="30" height="20" rx="1" fill="#437132" />
                          <path d="M 245 190 C 245 182, 285 182, 285 190 Z" fill="#569140" />
                          {/* Buddha Silhouette */}
                          <path d="M 257 180 C 257 155, 262 138, 265 138 C 268 138, 273 155, 273 180 Z" fill="#437132" />
                          <circle cx="265" cy="133" r="6" fill="#437132" />
                          <circle cx="265" cy="133" r="10" stroke="#6FB555" strokeWidth="1" fill="none" opacity="0.5" />
                        </g>

                        {/* Telangana High Court */}
                        <g fill="#569140" opacity="0.7">
                          <rect x="290" y="140" width="80" height="60" rx="2" />
                          {/* Domes */}
                          <path d="M 315 140 C 315 125, 345 125, 345 140 Z" fill="#437132" />
                          <circle cx="330" cy="125" r="3" fill="#437132" />
                          <path d="M 295 140 C 295 132, 305 132, 305 140 Z" fill="#437132" />
                          <path d="M 355 140 C 355 132, 365 132, 365 140 Z" fill="#437132" />
                          {/* Pillars */}
                          <line x1="310" y1="150" x2="310" y2="200" stroke="#FCFDFB" strokeWidth="2" />
                          <line x1="320" y1="150" x2="320" y2="200" stroke="#FCFDFB" strokeWidth="2" />
                          <line x1="340" y1="150" x2="340" y2="200" stroke="#FCFDFB" strokeWidth="2" />
                          <line x1="350" y1="150" x2="350" y2="200" stroke="#FCFDFB" strokeWidth="2" />
                        </g>

                        {/* Telangana Secretariat */}
                        <g fill="#437132" opacity="0.9">
                          <rect x="380" y="110" width="100" height="90" rx="3" />
                          {/* Main grand dome */}
                          <path d="M 410 110 C 410 90, 450 90, 450 110 Z" fill="#437132" />
                          <rect x="427" y="80" width="6" height="30" fill="#D8B34B" />
                          {/* Windows & arches */}
                          <rect x="390" y="130" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="410" y="130" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="438" y="130" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="458" y="130" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="390" y="165" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="410" y="165" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="438" y="165" width="12" height="20" rx="1" fill="#FCFDFB" />
                          <rect x="458" y="165" width="12" height="20" rx="1" fill="#FCFDFB" />
                        </g>

                        {/* Charminar (Primary focal point) */}
                        <g fill="#437132" opacity="0.95">
                          {/* Main structure base */}
                          <rect x="490" y="80" width="80" height="120" rx="3" />
                          {/* Central archway cutout */}
                          <path d="M 510 200 C 510 145, 550 145, 550 200 Z" fill="#FCFDFB" />
                          {/* Minarets */}
                          <rect x="480" y="30" width="12" height="170" rx="1" fill="#437132" />
                          <rect x="568" y="30" width="12" height="170" rx="1" fill="#437132" />
                          {/* Minarets behind */}
                          <rect x="498" y="45" width="8" height="155" rx="1" fill="#569140" opacity="0.6" />
                          <rect x="554" y="45" width="8" height="155" rx="1" fill="#569140" opacity="0.6" />
                          {/* Domes */}
                          <path d="M 478 30 C 478 20, 494 20, 494 30 Z" fill="#D8B34B" />
                          <path d="M 566 30 C 566 20, 582 20, 582 30 Z" fill="#D8B34B" />
                          {/* Balconies and details */}
                          <rect x="475" y="70" width="110" height="5" fill="#D8B34B" />
                          <rect x="475" y="110" width="110" height="5" fill="#569140" />
                          {/* Small decorative domes on roof */}
                          <circle cx="510" cy="80" r="4" fill="#569140" />
                          <circle cx="530" cy="80" r="5" fill="#D8B34B" />
                          <circle cx="550" cy="80" r="4" fill="#569140" />
                        </g>

                        {/* Cyber Towers (modern skyline) */}
                        <g fill="#6FB555" opacity="0.4">
                          <rect x="575" y="70" width="20" height="130" rx="2" />
                          <rect x="580" y="80" width="10" height="110" fill="#FCFDFB" />
                        </g>

                        {/* Decorative elements */}
                        <circle cx="230" cy="190" r="10" fill="#6FB555" opacity="0.5" />
                        <rect x="228" y="195" width="4" height="10" fill="#437132" opacity="0.5" />
                        <circle cx="285" cy="192" r="8" fill="#6FB555" opacity="0.5" />
                        <rect x="283" y="197" width="4" height="8" fill="#437132" opacity="0.5" />
                        {/* Pathway */}
                        <path d="M 200 200 L 265 198 L 330 200" stroke="#EDF2EA" strokeWidth="3" opacity="0.8" />
                        {/* Location Pin */}
                        <path d="M 530 115 C 530 105, 520 95, 510 95 C 500 95, 490 105, 490 115 C 490 128, 510 150, 510 150 C 510 150, 530 128, 530 115 Z" fill="#D8B34B" opacity="0.9" />
                        <circle cx="510" cy="115" r="6" fill="#FCFDFB" />
                      </svg>
                    </div>

                    <div className="max-w-2xl space-y-3.5 relative z-10">
                      <span className="bg-[#EEF8E8] text-[#437132] border border-[#C9DEBE] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                        Digital India Redressal Initiative
                      </span>
                      <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-[#27322B]">
                        Accelerating Grievance Redressal with Vision Intelligence
                      </h2>
                      <p className="text-xs text-[#5F6B63] leading-relaxed font-medium">
                        Welcome to CivicAI — the unified national smart grievance dashboard. Snap and submit public infrastructure concerns, leakages, or electrical faults. The AI engine parses categories, assigns coordinates, and notifies field personnel instantly.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button 
                          onClick={() => setActiveNav('lodge')}
                          className="bg-[#D8B34B] hover:bg-[#C89D30] text-white font-extrabold text-xs px-5 py-2.5 rounded-[12px] shadow-sm transition cursor-pointer"
                        >
                          Submit Grievance
                        </button>
                        <button 
                          onClick={() => setActiveNav('track')}
                          className="bg-white border border-[#6FB555] hover:bg-[#F5FAF2] text-[#569140] font-bold text-xs px-5 py-2.5 rounded-[12px] transition cursor-pointer"
                        >
                          Track Action Logs
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                      { label: 'Total Complaints', value: stats.total, color: 'text-[#27322B]', bg: 'bg-white', icon: FileText, change: '+12%', up: true, changeColor: 'text-[#2E8B57]' },
                      { label: 'In Progress', value: stats.inProgress, color: 'text-[#D97706]', bg: 'bg-white', icon: Clock, change: 'Running', up: true, changeColor: 'text-[#D97706]' },
                      { label: 'Resolved', value: stats.resolved, color: 'text-[#2E8B57]', bg: 'bg-white', icon: CheckCircle2, change: '94% Rate', up: true, changeColor: 'text-[#2E8B57]' },
                      { label: 'Rejected', value: stats.rejected, color: 'text-[#DC2626]', bg: 'bg-white', icon: AlertTriangle, change: 'Vetted', up: false, changeColor: 'text-[#8B948C]' },
                      { label: 'Resolution Rate', value: `${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 100}%`, color: 'text-[#6FB555]', bg: 'bg-white', icon: Activity, change: 'Optimal', up: true, changeColor: 'text-[#6FB555]' }
                    ].map((card, idx) => {
                      const IconComp = card.icon;
                      return (
                        <div key={idx} className={`${card.bg} border border-[#E3ECD9] rounded-[18px] p-5 hover:shadow-sm hover:bg-[#F5FAF2]/40 transition duration-200 flex flex-col justify-between`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-[#5F6B63] uppercase tracking-wider">{card.label}</span>
                            <IconComp className={`w-5 h-5 ${card.color}`} />
                          </div>
                          <div className="mt-4">
                            <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`text-[10px] font-bold ${card.changeColor}`}>
                                {card.change}
                              </span>
                              <span className="text-[10px] text-[#8B948C]">status validation</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Core Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Recent Complaints Table */}
                    <div className="lg:col-span-8 bg-white border border-default-border rounded-[18px] shadow-sm p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-bold text-primary-text">Recent Grievances</h3>
                          <p className="text-xs text-secondary-text">Live feed of reported municipal grievances across GHMC zones</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-default-border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-secondary-text focus:outline-none"
                          >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-dividers">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-section-bg border-b border-dividers text-secondary-text font-bold uppercase tracking-wider">
                              <th className="p-3.5">ID</th>
                              <th className="p-3.5">Category</th>
                              <th className="p-3.5">Department</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5">Date</th>
                              <th className="p-3.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dividers font-medium">
                            {filteredComplaints.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-muted-text">
                                  No complaints matched the criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredComplaints.map(item => (
                                <tr key={item.id} className="hover:bg-hover-bg transition-colors">
                                  <td className="p-3.5 font-bold text-primary-text">{item.complaintId}</td>
                                  <td className="p-3.5 text-secondary-text">{item.category}</td>
                                  <td className="p-3.5 text-muted-text truncate max-w-48">{item.address || 'Central'}</td>
                                  <td className="p-3.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.status === 'Resolved' ? 'bg-[#E8F6EC] text-[#2E8B57] border border-[#C9DEBE]' :
                                      item.status === 'Rejected' ? 'bg-[#FDECEC] text-[#DC2626] border border-[#FCA5A5]' :
                                      item.status === 'In Progress' ? 'bg-[#FFF4E5] text-[#D97706] border border-[#F5E8B8]' :
                                      'bg-[#EAF2FF] text-[#3B82F6] border border-[#BFDBFE]'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-muted-text">{new Date(item.createdAt).toLocaleDateString()}</td>
                                  <td className="p-3.5 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedComplaintId(item.id);
                                        setActiveNav('track');
                                      }}
                                      className="text-primary-green hover:text-primary-hover hover:bg-surface-green p-1.5 rounded-lg transition cursor-pointer"
                                      title="Track log details"
                                    >
                                      <Search className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sidebar components */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* AI Insights Card */}
                      <div className="bg-[#EEF8E8] border border-[#D6E9CB] rounded-[18px] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-[#2E5A2E] uppercase flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#6FB555] animate-pulse" /> AI Prediction Alert
                          </span>
                          <span className="bg-[#D8B34B] text-[10px] font-bold text-white px-2.5 py-0.5 rounded">
                            Confidence: 94%
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <AlertTriangle className="w-12 h-12 text-[#D8B34B] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-[#2E5A2E]">Rainfall Anomaly Alert</h4>
                            <p className="text-[11px] text-[#4A5C4A] mt-1 leading-relaxed">
                              Based on past weather history and current open sewerage complaints, Ward 12 is at high risk of waterlogging.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveNav('ward-health')}
                          className="w-full bg-[#6FB555] hover:bg-[#569140] text-white font-bold text-xs py-2.5 px-3 rounded-[12px] transition cursor-pointer"
                        >
                          View Analytics
                        </button>
                      </div>

                      {/* Nearby Map Card */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Nearby Civic Grievances</h4>
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Live Map</span>
                        </div>
                        <div className="h-48 rounded-lg overflow-hidden border border-slate-100 relative">
                          <InteractiveMap 
                            complaints={complaints}
                            selectedComplaintId={selectedComplaintId}
                            onSelectComplaint={(id) => {
                              setSelectedComplaintId(id);
                              setActiveNav('track');
                            }}
                            interactiveMode="view"
                            height="h-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-1">
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>Roads</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Sanitation</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Water</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            <span>Electric</span>
                          </div>
                        </div>
                      </div>

                      {/* Government Announcements */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" /> Government Announcements
                        </h4>
                        <div className="space-y-3">
                          {[
                            { title: 'Swachh Bharat Cleanliness Drive', desc: 'Central audit inspectors to visit Hyderabad zones starting July 15th.', date: '3 days ago' },
                            { title: 'Monsoon Safety Mandate', desc: 'Drains & flood control systems set on high status guidelines.', date: '1 week ago' },
                            { title: 'Streetlight LED Upgrade Scheme', desc: 'State electrical division to replace 1,500 halogen streetlights.', date: '2 weeks ago' }
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1 hover:bg-slate-100 transition-colors">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[11px] font-bold text-slate-900">{item.title}</h5>
                                <span className="text-[9px] text-slate-400">{item.date}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* PAGE 2: LODGE COMPLAINT VIEW */}
              {activeNav === 'lodge' && (
                <div className="space-y-6">
                  
                  {/* Breadcrumb Header */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="cursor-pointer hover:text-slate-600" onClick={() => setActiveNav('dashboard')}>Dashboard</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span className="text-blue-600">Lodge Complaint</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Register Official Grievance</h2>
                    <p className="text-xs text-slate-500">Provide details, media, and location to route your concern automatically.</p>
                  </div>

                  <form onSubmit={handleLodgeComplaint} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column Form inputs */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Section 1: Complaint Details */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Grievance Description</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grievance Title</label>
                            <input 
                              type="text" 
                              required
                              value={lodgeTitle}
                              onChange={(e) => setLodgeTitle(e.target.value)}
                              placeholder="Brief summary (e.g., Broken water pipe causing floods near Main Road)"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Category</label>
                              <select 
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                              >
                                <option value="">-- Select Category --</option>
                                <option value="Road Infrastructure">Road Infrastructure</option>
                                <option value="Solid Waste & Sanitation">Solid Waste & Sanitation</option>
                                <option value="Water Supply & Sewerage">Water Supply & Sewerage</option>
                                <option value="Electricity & Streetlights">Electricity & Streetlights</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subcategory Type</label>
                              <select 
                                value={customSubcategory}
                                onChange={(e) => handleSubcategoryChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                              >
                                <option value="">-- Select Incident Type --</option>
                                <option value="Pothole">Pothole / Road Defect</option>
                                <option value="Garbage Overflow">Garbage Dump Overflow</option>
                                <option value="Waterlogging">Waterlogging / Drainage Leakage</option>
                                <option value="Broken Streetlight">Broken Streetlight / Electric issue</option>
                                <option value="Other">Other (Manual Routing)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-slate-700 uppercase">Detailed Description</label>
                              <button
                                type="button"
                                onClick={toggleSpeechRecognition}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                  isListening 
                                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-blue-600" />}
                                <span>{isListening ? 'Stop Listening' : 'Dictate'}</span>
                              </button>
                            </div>
                            <textarea 
                              required
                              value={lodgeDescription}
                              onChange={(e) => setLodgeDescription(e.target.value)}
                              placeholder="Please provide full details of the civic issue, including severity, impact, and other surrounding context..."
                              rows={4}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Location Selector */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Incident Location</h3>
                          <button
                            type="button"
                            onClick={handleGeolocate}
                            disabled={isLocating}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            {isLocating ? 'Locating...' : 'Fetch Device GPS'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Province</label>
                            <input 
                              type="text" 
                              value={stateName}
                              onChange={(e) => setStateName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">District</label>
                            <input 
                              type="text" 
                              value={districtName}
                              onChange={(e) => setDistrictName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ward / Zone</label>
                            <input 
                              type="text" 
                              value={wardNo}
                              onChange={(e) => setWardNo(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street / Locality</label>
                            <input 
                              type="text" 
                              value={streetName}
                              onChange={(e) => setStreetName(e.target.value)}
                              placeholder="e.g. Metro Pillar 32, Road No 4"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Landmark</label>
                            <input 
                              type="text" 
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              placeholder="e.g. Near HDFC Bank ATM"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {address && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-700">Mappable Location Coordinates</p>
                              <p className="mt-0.5 text-slate-500 leading-relaxed">{address}</p>
                            </div>
                          </div>
                        )}

                        <div className="h-64 rounded-lg overflow-hidden border border-slate-200 relative">
                          <InteractiveMap 
                            complaints={[]}
                            selectedComplaintId={null}
                            onSelectComplaint={() => {}}
                            interactiveMode="pin"
                            pinnedLat={latitude}
                            pinnedLng={longitude}
                            onPinSelect={(lat, lng, addr) => {
                              setLatitude(lat);
                              setLongitude(lng);
                              setAddress(addr);
                              showToast('Location coordinates pinned successfully!', 'success');
                            }}
                            height="h-full"
                          />
                        </div>
                      </div>

                      {/* Section 3: Evidence Upload */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Upload Image Evidence</h3>
                        
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition">
                          <Upload className="w-10 h-10 text-slate-400 mb-3" />
                          <p className="text-xs font-bold text-slate-700">Drag & drop files here, or click to browse</p>
                          <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or JPEG up to 10MB</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-file-input"
                          />
                          <label 
                            htmlFor="image-file-input"
                            className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                          >
                            Browse Files
                          </label>
                        </div>

                        {lodgeImage && (
                          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img 
                                src={lodgeImage} 
                                alt="Evidence Preview" 
                                className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">grievance_evidence_img.png</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Uploaded & Ready</p>
                                <div className="w-32 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-emerald-500 h-full w-full"></div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setLodgeImage(null); setAiAnalysis(null); }}
                              className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {lodgeImage && !aiAnalysis && (
                          <button
                            type="button"
                            onClick={handleRunAIScan}
                            disabled={isAnalyzing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Analyzing Image with Gemini Vision...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Run Gemini AI Vision Router
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Right Column AI panel */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* AI Scan Routing Details */}
                      {aiAnalysis && (
                        <div className="bg-[#EEF8E8] border border-[#D6E9CB] rounded-[18px] p-5 space-y-4">
                          <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#2E5A2E] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4.5 h-4.5 text-[#2E8B57]" /> AI Auto Router Active
                          </span>
                          
                          <div className="space-y-3.5 pt-3 border-t border-[#D6E9CB]">
                            <div>
                              <p className="text-[10px] text-[#4A5C4A] uppercase font-bold">Detected Category</p>
                              <p className="text-xs font-bold mt-0.5 text-[#27322B]">{aiAnalysis.category}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#4A5C4A] uppercase font-bold">Assigned Department</p>
                              <p className="text-xs font-bold mt-0.5 text-[#D97706]">{aiAnalysis.department}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] text-[#4A5C4A] uppercase font-bold">Priority Status</p>
                                <p className={`text-xs font-bold mt-0.5 ${
                                  aiAnalysis.severity === 'Critical' || aiAnalysis.severity === 'High' ? 'text-[#DC2626]' : 'text-[#3B82F6]'
                                }`}>{aiAnalysis.severity}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#4A5C4A] uppercase font-bold">Confidence Score</p>
                                <p className="text-xs font-bold mt-0.5 text-[#2E8B57]">{aiAnalysis.confidence}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Department Routing details info */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">Routing Information</h4>
                        
                        {customDepartment ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800">Target Agency</p>
                                <p className="text-slate-500 mt-0.5">{customDepartment}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Users className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800">Assigned Ward Supervisor</p>
                                <p className="text-slate-500 mt-0.5">Automated Field Dispatch</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800">Expected Response SLA</p>
                                <p className="text-slate-500 mt-0.5">24 - 48 working hours</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Select an incident subcategory to view automated routing targets.</p>
                        )}
                      </div>

                      {/* Emergency Hotline */}
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center space-x-2 text-red-900 font-bold">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h4 className="text-xs uppercase tracking-wider">Emergency Hazards</h4>
                        </div>
                        <p className="text-[11px] text-red-800 leading-relaxed">
                          Is this an active life safety hazard, such as live hanging electrical wires sparking or open structural cave-ins? Report directly to central emergency control room:
                        </p>
                        <a 
                          href="tel:100" 
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-3 rounded-lg transition inline-flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-4 h-4" /> Call National Emergency (100)
                        </a>
                      </div>

                      {/* Action Triggers */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 px-4 rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Submit Grievance Complaint
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showToast('Grievance draft saved successfully!', 'info');
                            setActiveNav('dashboard');
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-lg transition cursor-pointer"
                        >
                          Save Draft Profile
                        </button>
                      </div>

                    </div>
                  </form>
                </div>
              )}

              {/* PAGE 3: TRACK COMPLAINT VIEW */}
              {activeNav === 'track' && (
                <div className="space-y-6">
                  
                  {/* Select Dropdown to pick complaint */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">Track Municipal Grievance</h2>
                        <p className="text-xs text-slate-500">Monitor resolution timelines, officer remarks, and before/after verification logs</p>
                      </div>
                      
                      <div className="w-full sm:w-72">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Grievance</label>
                        <select
                          value={selectedComplaintId || ''}
                          onChange={(e) => setSelectedComplaintId(e.target.value || null)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                        >
                          <option value="">-- Choose Active Complaint --</option>
                          {complaints.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.complaintId} - {item.title.substring(0, 35)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {selectedComplaintId && selectedComplaintDetails ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Timeline & Steps */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* Grievance Header details */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Active Investigation</span>
                              <h3 className="text-lg font-bold text-slate-955 mt-1">{selectedComplaintDetails.complaint.complaintId} — {selectedComplaintDetails.complaint.title}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">Registered on {new Date(selectedComplaintDetails.complaint.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => showToast('PDF Grievance summary generated successfully!', 'success')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => showToast('Status share link copied to clipboard!', 'success')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition cursor-pointer"
                                title="Share status link"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs leading-relaxed text-slate-600">
                            <span className="font-bold text-slate-800">Description:</span> {selectedComplaintDetails.complaint.description || 'No detailed description provided.'}
                          </div>
                        </div>

                        {/* 5-Stage Stepper timeline details */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Redressal Process Flow</h4>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative">
                            {[
                              { label: 'Lodged', status: 'Pending', desc: 'Complaint registered' },
                              { label: 'Verified', status: 'Verified', desc: 'Field verified' },
                              { label: 'In Progress', status: 'In Progress', desc: 'Action dispatched' },
                              { label: 'Resolved', status: 'Resolved', desc: 'Work certified' },
                              { label: 'Validated', status: 'Validated', desc: 'Citizen confirmed' }
                            ].map((step, idx) => {
                              const complaintStatus = selectedComplaintDetails.complaint.status;
                              let statusState: 'completed' | 'current' | 'future' = 'future';

                              const statusMap: Record<ComplaintStatus, number> = {
                                'Pending': 0,
                                'Verified': 1,
                                'In Progress': 2,
                                'Resolved': 3,
                                'Rejected': -1
                              };

                              const currentStatusIdx = statusMap[complaintStatus] ?? 0;

                              if (idx < currentStatusIdx) {
                                statusState = 'completed';
                              } else if (idx === currentStatusIdx) {
                                statusState = 'current';
                              } else if (idx === 4 && complaintStatus === 'Resolved') {
                                statusState = 'current';
                              }

                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center text-center relative z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                                    statusState === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow' :
                                    statusState === 'current' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow' :
                                    'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    {statusState === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-800 mt-2">{step.label}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{step.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Government Response Logs vertical Timeline */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Official Action Timeline</h4>
                          
                          <div className="space-y-6 relative border-l border-slate-100 pl-6 ml-3">
                            {selectedComplaintDetails.history.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No official action records logged yet.</p>
                            ) : (
                              selectedComplaintDetails.history.map((log, idx) => (
                                <div key={idx} className="relative space-y-1 hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                                  <span className="absolute -left-9.5 top-1 bg-white border-2 border-blue-600 rounded-full w-3.5 h-3.5"></span>
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">Officer Note</span>
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-900">Status updated to: {log.status}</h5>
                                  <p className="text-xs text-slate-600 leading-relaxed italic">"{log.remarks}"</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Logged by: {log.updatedBy}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Checklist validation items & Before/After Images */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Validation Checks</h4>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Quality Inspected</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              {[
                                { label: 'AI classification check verified', passed: true },
                                { label: 'Assigned supervisor response received', passed: true },
                                { label: 'Site evidence photo logged successfully', passed: true },
                                { label: 'Resolution certification approved', passed: selectedComplaintDetails.complaint.status === 'Resolved' }
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  {item.passed ? (
                                    <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                                  )}
                                  <span className={item.passed ? 'text-slate-700 font-medium' : 'text-slate-400'}>{item.label}</span>
                                </div>
                              ))}
                            </div>

                            {/* Side-by-side Before/After media cards */}
                            {showBeforeAfter && (
                              <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Before & After Work Verification</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <img 
                                      src={selectedComplaintDetails.complaint.imageUrl} 
                                      alt="Before" 
                                      className="h-24 w-full object-cover rounded-lg border border-slate-200"
                                    />
                                    <p className="text-[9px] text-center font-bold text-slate-500">Before (Logged)</p>
                                  </div>
                                  <div className="space-y-1">
                                    {selectedComplaintDetails.complaint.status === 'Resolved' ? (
                                      <div className="relative">
                                        <img 
                                          src={selectedComplaintDetails.complaint.imageUrl} 
                                          alt="After" 
                                          className="h-24 w-full object-cover rounded-lg border border-slate-200"
                                        />
                                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                          <Check className="w-8 h-8 text-emerald-600 bg-white/95 rounded-full p-1 border-2 border-emerald-500 shadow" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-24 w-full bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-200 text-center p-2">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Awaiting Action</span>
                                      </div>
                                    )}
                                    <p className="text-[9px] text-center font-bold text-slate-500">After (Inspected)</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right Column details */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* AI Summary metrics card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-400">AI Routing Summary</span>
                            <span className="bg-slate-800 text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded">Vetted</span>
                          </div>
                          
                          <div className="space-y-3 text-xs pt-1 border-t border-slate-800">
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">Recommended Department</p>
                              <p className="text-white font-medium mt-0.5">{selectedComplaintDetails.complaint.category}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Severity level</p>
                                <p className="text-white font-bold mt-0.5">{selectedComplaintDetails.complaint.severity}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">AI confidence</p>
                                <p className="text-emerald-400 font-bold mt-0.5">{selectedComplaintDetails.complaint.aiConfidence}%</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">AI Overview</p>
                              <p className="text-slate-400 mt-0.5 leading-relaxed">{selectedComplaintDetails.complaint.aiSummary}</p>
                            </div>
                          </div>
                        </div>

                        {/* Citizen feedback review stars */}
                        {selectedComplaintDetails.complaint.status === 'Resolved' && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">Grievance Validation</h4>
                            
                            <div className="space-y-3">
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Our records indicate that this issue has been resolved. Please rate the service quality and confirm:
                              </p>

                              <div className="flex space-x-1.5 justify-center py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setCitizenRating(star)}
                                    className="text-slate-300 hover:text-amber-500 transition cursor-pointer"
                                  >
                                    <Star className={`w-6 h-6 ${star <= citizenRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                  </button>
                                ))}
                              </div>

                              <textarea
                                value={citizenFeedbackText}
                                onChange={(e) => setCitizenFeedbackText(e.target.value)}
                                placeholder="Any feedback or validation remarks for the municipal board..."
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                              />

                              <button
                                onClick={handleSubmitFeedback}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 px-3 rounded-lg transition cursor-pointer"
                              >
                                Submit Validation logs
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto shadow-sm">
                      <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-sm font-bold text-slate-700">No grievance selected</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Please choose one of your active complaints from the dropdown at the top of the tracker to view audit trails, department updates, and resolution checklist logs.
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* OTHER TABS PLACEHOLDERS */}
              {!['dashboard', 'lodge', 'track'].includes(activeNav) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto shadow-sm space-y-4">
                  <Activity className="w-12 h-12 mx-auto text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">{activeNav.replace('-', ' ')} Module</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This section is pre-configured to utilize the central **CivicAI** government-wide API framework. Real-time data sync processes will activate once the deployment pipelines are established.
                  </p>
                  <button 
                    onClick={() => setActiveNav('dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}

            </main>
          </div>

        </div>
      ) : activeView === 'landing' ? (
        // CIVICAI LANDING PAGE (LOGGED OUT)
        <div className="w-full min-h-screen bg-[#FCFDFB] flex flex-col font-sans">
          {/* Header / Navigation Bar */}
          <header className="h-[80px] border-b border-[#EDF2EA] bg-white px-6 md:px-12 flex justify-between items-center z-20 shrink-0">
            <div className="flex items-center gap-3">
              {currentUser && (
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="bg-[#EEF8E8] hover:bg-[#EEF8E8]/80 text-[#437132] p-2 rounded-xl transition cursor-pointer flex items-center justify-center border border-[#C3E39D] shadow-sm mr-1"
                  title="Back to Dashboard"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 text-[#569140]" />
                </button>
              )}
              <img src={logo} alt="CivicAI Logo" className="h-12 w-12 object-contain" />
              <div>
                <span className="text-xl font-bold tracking-tight text-[#27322B] block leading-tight">CiviqAI</span>
                <span className="text-[10px] text-[#5F6B63] font-semibold uppercase tracking-wider block">Smart Grievances. Stronger Cities.</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-8">
              {['Home', 'About Us', 'Features', 'How It Works', 'Departments', 'Contact'].map((link, idx) => (
                <a 
                  key={idx} 
                  href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} 
                  className={`text-sm font-semibold hover:text-[#569140] transition ${idx === 0 ? 'text-[#569140] border-b-2 border-[#569140] pb-1' : 'text-[#5F6B63]'}`}
                >
                  {link}
                </a>
              ))}
            </nav>

             <div className="flex items-center gap-4">
              {currentUser ? (
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="bg-[#6FB555] hover:bg-[#569140] text-white font-bold text-sm px-5 py-2.5 rounded-[10px] shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Activity className="w-4 h-4" />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { setActiveView('login'); setAuthMode('login'); }}
                    className="border border-[#6FB555] hover:bg-[#F5FAF2] text-[#569140] font-bold text-sm px-5 py-2 rounded-[10px] transition cursor-pointer"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => { setActiveView('login'); setAuthMode('register'); }}
                    className="bg-[#6FB555] hover:bg-[#569140] text-white font-bold text-sm px-5 py-2 rounded-[10px] shadow-sm transition cursor-pointer"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Hero Section Container */}
          <main className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 md:px-12 py-12 relative overflow-hidden">
              
              {/* Left Column Text Content */}
              <div className="lg:col-span-6 space-y-6 z-10 max-w-xl">
                <span className="bg-[#EEF8E8] text-[#437132] border border-[#C9DEBE] px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-block">
                  🌱 AI-Powered Grievance Redressal for a Better Tomorrow
                </span>
                
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#27322B]">
                  Report. Track. Resolve.<br />
                  <span className="text-[#569140]">Together for a Better City.</span>
                </h1>
                
                <p className="text-sm md:text-base text-[#5F6B63] leading-relaxed font-medium">
                  CiviqAI is an AI-powered platform that helps citizens report civic issues, track their status in real-time, and ensures transparent and timely resolution by the right authorities.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => { setActiveView('login'); setAuthMode('login'); }}
                    className="bg-[#569140] hover:bg-[#437132] text-white font-extrabold text-sm px-6 py-3.5 rounded-[12px] shadow-md transition cursor-pointer flex items-center gap-2"
                  >
                    <FileEdit className="w-4 h-4" />
                    Lodge a Complaint
                  </button>
                  <button 
                    onClick={() => { setActiveView('login'); setAuthMode('login'); }}
                    className="bg-white border border-[#E3ECD9] hover:bg-[#F5FAF2] text-[#27322B] font-extrabold text-sm px-6 py-3.5 rounded-[12px] shadow-sm transition cursor-pointer flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-[#569140]" />
                    Track Complaint
                  </button>
                </div>

                {/* Social Proof Avatars */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#EDF2EA]">
                  <div className="flex -space-x-2">
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar 1" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar 2" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar 3" />
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#569140] flex items-center justify-center text-[10px] text-white font-extrabold">2K+</div>
                  </div>
                  <span className="text-xs text-[#5F6B63] font-semibold">Join 2,000+ citizens making our city better every day.</span>
                </div>
              </div>

              {/* Right Column: Charminar Image */}
              <div className="lg:col-span-6 relative h-[320px] lg:h-[450px] rounded-2xl overflow-hidden shadow-sm border border-[#EDF2EA]">
                <img 
                  src={charminarHero} 
                  alt="Hyderabad Heritage Charminar" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FCFDFB] via-[#FCFDFB]/40 to-transparent" />
              </div>
            </div>

            {/* Features Container */}
            <div className="px-6 md:px-12 pb-12">
              <div className="bg-white border border-[#E3ECD9] rounded-[24px] p-8 shadow-sm space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-[11px] text-[#569140] font-extrabold uppercase tracking-widest block">Our Features</span>
                  <h2 className="text-2xl font-black text-[#27322B] tracking-tight">Everything you need for a better tomorrow</h2>
                  <div className="w-12 h-1 bg-[#569140] mx-auto rounded-full mt-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                  {[
                    { title: 'Easy Reporting', desc: 'Report issues in seconds with photo, location and easy steps.', icon: Camera, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'AI Verification', desc: 'AI verifies and categorizes complaints for faster processing.', icon: Sparkles, color: 'text-[#569140]', bg: 'bg-[#EEF8E8]' },
                    { title: 'Real-time Tracking', desc: 'Track your complaint status in real-time, every step of the way.', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { title: 'Right Department', desc: 'Automatically assign to the right department for faster resolution.', icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                    { title: 'Notifications', desc: 'Get instant updates via notifications and emails about your complaint.', icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { title: 'Transparency', desc: 'Transparent system with analytics and public insights.', icon: BarChart3, color: 'text-[#569140]', bg: 'bg-[#EEF8E8]' }
                  ].map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                      <div key={idx} className="border border-[#EDF2EA] rounded-xl p-5 hover:shadow-md hover:border-[#C9DEBE] transition duration-200 flex flex-col justify-start text-center space-y-3 bg-[#FCFDFB]">
                        <div className={`w-10 h-10 rounded-lg ${feat.bg} flex items-center justify-center mx-auto shrink-0`}>
                          <Icon className={`w-5 h-5 ${feat.color}`} />
                        </div>
                        <h4 className="font-bold text-xs text-[#27322B]">{feat.title}</h4>
                        <p className="text-[10px] text-[#5F6B63] leading-relaxed font-medium">{feat.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#F8FCF6] border border-[#E3ECD9] rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 text-xs font-bold text-[#5F6B63]">
                  <div className="flex items-center gap-2 text-[#437132]">
                    <CheckCircle className="w-4 h-4 text-[#569140]" />
                    Building smarter cities with citizens at the heart of change.
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#569140]" /> Secure</span>
                    <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#569140]" /> Transparent</span>
                    <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-[#569140]" /> Accountable</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#569140]" /> AI-Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        // ==========================================
        // MODERN GOVERNMENT AUTH PORTAL (LOGGED OUT)
        // ==========================================
        <div className="min-h-screen w-full flex flex-col justify-between bg-[#FCFDFB] animate-fade-in">
          
          {/* Top Seal Header */}
          <div className="bg-slate-950 text-white py-2.5 px-6 border-b border-slate-800 text-[10px] flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-500">GOVERNMENT OF TELANGANA</span>
              <span className="text-slate-700">|</span>
              <span>Unified Municipal Grievance Grid</span>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="text-white hover:text-[#6FB555] font-bold cursor-pointer text-[10px] uppercase transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
              <button 
                onClick={() => setActiveView('landing')} 
                className="text-[#6FB555] hover:text-[#569140] font-bold cursor-pointer text-[10px] uppercase transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Main Auth Container */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <div className="bg-white border border-[#E3ECD9] rounded-[28px] shadow-2xl shadow-emerald-950/5 overflow-hidden w-full max-w-5xl flex flex-col lg:flex-row min-h-[620px]">
              
              {/* Left Column: Mission branding values (55% Width) */}
              <div className="lg:w-[55%] bg-gradient-to-b from-[#4F8A45] to-[#437132] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden shrink-0">
                
                {/* Hyderabad skyline watermark (opacity 5-10%) */}
                <svg className="absolute bottom-0 left-0 w-full h-40 opacity-[0.08] pointer-events-none select-none" viewBox="0 0 800 200" fill="currentColor">
                  <path d="M 100 200 L 100 80 L 120 80 L 120 50 L 110 50 L 110 20 L 120 20 L 120 10 L 130 10 L 130 20 L 140 20 L 140 50 L 130 50 L 130 80 L 210 80 L 210 50 L 200 50 L 200 20 L 210 20 L 210 10 L 220 10 L 220 20 L 230 20 L 230 50 L 220 50 L 220 80 L 240 80 L 240 200 Z" />
                  <rect x="140" y="100" width="60" height="100" rx="30" />
                  <path d="M 300 200 L 300 110 L 320 90 L 380 90 L 400 110 L 400 200 Z" />
                  <circle cx="350" cy="140" r="20" />
                  <path d="M 460 200 L 460 60 L 480 40 L 520 40 L 540 60 L 540 200 Z" />
                  <path d="M 580 200 L 580 90 H 700 V 200 Z" />
                  <rect x="600" y="110" width="10" height="20" />
                  <rect x="620" y="110" width="10" height="20" />
                  <rect x="640" y="110" width="10" height="20" />
                  <rect x="660" y="110" width="10" height="20" />
                </svg>

                {/* Faint Logo Watermark in bottom-right */}
                <div className="absolute -right-10 -bottom-10 opacity-[0.04] pointer-events-none select-none">
                  <Building2 className="w-80 h-80 text-white" />
                </div>

                <div className="space-y-12 relative z-10">
                  {/* Logo */}
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white p-1 rounded-xl flex items-center justify-center shadow-lg">
                      <img src={logo} alt="CivicAI Logo" className="w-10 h-10 object-contain rounded-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-white">CivicAI</h2>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-[#C3E39D]">Grievance Network System</p>
                    </div>
                  </div>

                  {/* Heading & Description */}
                  <div className="space-y-6 pr-4">
                    <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Empowering Citizens with Smart Vision Governance.
                    </h3>
                    <p className="text-sm text-white/80 leading-relaxed font-medium">
                      Capture infrastructure issues instantly with AI-powered verification, smart categorization, and real-time grievance tracking. CivicAI helps citizens and government departments resolve issues faster through intelligent automation.
                    </p>
                  </div>
                </div>

                {/* Subtext Grid */}
                <div className="relative z-10 pt-12 text-[10px] text-white/60 font-bold flex gap-4">
                  <span>✓ Smart Dispatch</span>
                  <span>✓ Vision Verification</span>
                  <span>✓ 100% Transparent</span>
                </div>
              </div>

              {/* Right Column: Secure Form inputs (45% Width) */}
              <div className="lg:w-[45%] p-8 sm:p-12 flex flex-col justify-between bg-white shrink-0">
                
                {/* Content wrapper */}
                <div className="space-y-8 my-auto">
                  
                  {/* Mode Select Header (Tabs) */}
                  <div className="flex border-b border-slate-100 pb-3">
                    <button 
                      onClick={() => { setAuthMode('login'); setOtpSentMessage(null); }}
                      className={`font-extrabold text-xs tracking-wider uppercase transition-all pb-3 mr-6 cursor-pointer border-b-2 ${
                        authMode !== 'register' 
                          ? 'border-[#437132] text-[#437132]' 
                          : 'border-transparent text-[#9CA3AF]'
                      }`}
                    >
                      Grievance Login
                    </button>
                    <button 
                      onClick={() => { setAuthMode('register'); setOtpSentMessage(null); }}
                      className={`font-extrabold text-xs tracking-wider uppercase transition-all pb-3 cursor-pointer border-b-2 ${
                        authMode === 'register' 
                          ? 'border-[#437132] text-[#437132]' 
                          : 'border-transparent text-[#9CA3AF]'
                      }`}
                    >
                      Register Profile
                    </button>
                  </div>

                  {/* Headings */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-[#27322B] text-xl tracking-tight">Secure Gateway Portal</h3>
                    <p className="text-xs text-[#5F6B63]">
                      Authenticate securely to access the CivicAI grievance management platform.
                    </p>
                  </div>

                  {/* Profile Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-[#27322B] uppercase tracking-wider">Select Profile:</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'citizen', title: 'Citizen', icon: Users, email: 'citizen@civiq.gov' },
                        { id: 'officer', title: 'Officer', icon: Shield, email: 'officer@civiq.gov' },
                        { id: 'admin', title: 'Admin', icon: Building2, email: 'admin@civiq.gov' }
                      ].map((role) => {
                        const Icon = role.icon;
                        const isSelected = authRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => {
                              setAuthRole(role.id as any);
                              setAuthEmail(role.email);
                              setAuthPassword('password123'); // Preset password for seamless sandbox testing
                              showToast(`Loaded pre-seeded credentials for ${role.title}!`, 'info');
                            }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-[14px] border text-center transition-all duration-200 cursor-pointer hover:border-[#6FB555]/60 hover:-translate-y-[1px] ${
                              isSelected
                                ? 'bg-[#EEF8E8] border-[#6FB555] shadow-sm shadow-[#6FB555]/15'
                                : 'bg-white border-[#E3ECD9]'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#437132]' : 'text-[#8B948C]'}`} />
                            <span className={`text-[11px] font-extrabold ${isSelected ? 'text-[#27322B]' : 'text-[#8B948C]'}`}>
                              {role.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LOGIN FORM */}
                  {authMode === 'login' && (
                    <form onSubmit={handleDirectAuth} className="space-y-4">
                      {/* Email address field */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-[#8B948C] w-4 h-4" />
                          <input 
                            type="email" 
                            required
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="e.g. citizen@civiq.gov"
                            className="w-full bg-white border border-[#D9E7D2] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password field */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Password</label>
                          <button type="button" className="text-[10px] font-extrabold text-[#5F6B63] hover:text-[#437132] transition-colors">
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 text-[#8B948C] w-4 h-4" />
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-[#D9E7D2] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-[#8B948C] hover:text-[#27322B] transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Submit & Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button 
                          type="submit"
                          className="w-full bg-[#6FB555] hover:bg-[#569140] text-white font-extrabold text-xs py-3 px-4 rounded-[14px] shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          Log In
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            setAuthEmail('');
                            setAuthPassword('');
                          }}
                          className="w-full bg-white border border-[#6FB555] text-[#569140] hover:bg-[#EEF8E8]/50 font-extrabold text-xs py-2.5 px-4 rounded-[14px] transition-all flex items-center justify-center cursor-pointer"
                        >
                          Reset Form
                        </button>
                      </div>
                    </form>
                  )}

                  {/* REGISTER CITIZEN PROFILE STATE */}
                  {authMode === 'register' && (
                    <form onSubmit={handleDirectAuth} className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Full Legal Name</label>
                        <input 
                          type="text" 
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Rajesh Patil"
                          className="w-full bg-white border border-[#D9E7D2] rounded-xl px-3 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="rajesh@email.com"
                          className="w-full bg-white border border-[#D9E7D2] rounded-xl px-3 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                        />
                      </div>

                      {/* Phone & Password row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Mobile Number</label>
                          <input 
                            type="tel" 
                            required
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="+91 99999 88888"
                            className="w-full bg-white border border-[#D9E7D2] rounded-xl px-3 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-[#27322B] uppercase">Password</label>
                          <input 
                            type="password" 
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Create Password"
                            className="w-full bg-white border border-[#D9E7D2] rounded-xl px-3 py-2.5 text-xs text-[#27322B] placeholder-[#8B948C] focus:outline-none focus:border-[#6FB555] focus:ring-4 focus:ring-[#6FB555]/10 transition-all"
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="space-y-2 pt-2">
                        <button 
                          type="submit"
                          className="w-full bg-[#6FB555] hover:bg-[#569140] text-white font-extrabold text-xs py-3 px-4 rounded-[14px] shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Register Profile
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="w-full bg-white border border-[#6FB555] text-[#569140] hover:bg-[#EEF8E8]/50 font-extrabold text-xs py-2.5 px-4 rounded-[14px] transition-all flex items-center justify-center cursor-pointer"
                        >
                          Already have an account? Log In
                        </button>
                      </div>
                    </form>
                  )}

                </div>

                {/* Bottom Trust Badges Section */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-6 border-t border-slate-100 text-[10px] text-[#5F6B63] font-bold">
                  <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#6FB555]" /> Secure Authentication</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#6FB555]" /> Government Verified</div>
                  <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#6FB555]" /> AI Powered Grid</div>
                  <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#6FB555]" /> Encrypted Session</div>
                </div>

              </div>

            </div>
          </div>

          {/* National footer band */}
          <div className="bg-slate-950 text-slate-500 py-4 px-6 border-t border-slate-800 text-[10px] text-center shrink-0">
            © 2026 CivicAI National Grievance Grid. Powered by Central Digital Infrastructure Authority.
          </div>

        </div>
      )}

      {/* Floating AI chatbot widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button 
            onClick={() => setChatOpen(true)}
            className="bg-[#569140] hover:bg-[#437132] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center cursor-pointer animate-pulse"
            title="AI Chatbot Assistant"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-80 h-96 bg-white border border-[#E3ECD9] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="bg-[#569140] text-white p-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">CivicAI Assistant</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FCF6] text-[11px] leading-relaxed">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-xl max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-[#569140] text-white' 
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 border border-slate-200 p-2.5 rounded-xl flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI routing query...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Query Form */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200 flex gap-2 shrink-0 bg-white">
              <input 
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask about water leaks, road repairs..."
                className="flex-1 bg-slate-50 border border-[#E3ECD9] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#6FB555]"
              />
              <button 
                type="submit"
                className="bg-[#569140] hover:bg-[#437132] text-white px-3 py-1.5 rounded-lg flex items-center justify-center transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
