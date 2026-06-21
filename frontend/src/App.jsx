import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Network, 
  MessageSquare, 
  Settings as SettingsIcon, 
  LogOut, 
  Upload, 
  Search, 
  Filter, 
  ArrowRight, 
  Sun, 
  Moon, 
  ChevronRight, 
  User, 
  RefreshCw,
  Clock,
  DollarSign,
  AlertCircle
} from "lucide-react";

// API Base URL
const API_URL = "http://localhost:8000/api";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Demo auto-login
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [summary, setSummary] = useState({
    total_spend: 0,
    flagged_count: 0,
    fraud_caught_count: 0,
    money_saved: 0,
    recent_activity: []
  });
  
  // Settings state
  const [policies, setPolicies] = useState([]);
  const [policyMessage, setPolicyMessage] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ingest upload state
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploadVendor, setUploadVendor] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Meals");
  const [uploadGstin, setUploadGstin] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  // WhatsApp simulation state
  const [waMessages, setWaMessages] = useState([
    { sender: "system", text: "Welcome to FraudLens WhatsApp Intake. Send a receipt description to analyze it." }
  ]);
  const [waText, setWaText] = useState("");
  const [waEmployee, setWaEmployee] = useState("Ishaan Patel");
  const [isWaTyping, setIsWaTyping] = useState(false);

  // Load dashboard and transactions
  const fetchData = async () => {
    try {
      const summaryRes = await fetch(`${API_URL}/dashboard/summary`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
      
      const txsRes = await fetch(`${API_URL}/transactions?status=${statusFilter}&search=${searchQuery}`);
      if (txsRes.ok) {
        const txsData = await txsRes.json();
        setTransactions(txsData);
      }

      const policyRes = await fetch(`${API_URL}/settings/policies`);
      if (policyRes.ok) {
        const policyData = await policyRes.json();
        setPolicies(policyData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchQuery]);

  // Load single transaction details
  useEffect(() => {
    if (selectedTxId) {
      fetch(`${API_URL}/transactions/${selectedTxId}`)
        .then(res => res.json())
        .then(data => setSelectedTx(data))
        .catch(err => console.error(err));
    } else {
      setSelectedTx(null);
    }
  }, [selectedTxId]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Initial set
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Handle Manual Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess("");
    
    const formData = new FormData();
    formData.append("amount", uploadAmount);
    formData.append("vendor_name", uploadVendor);
    formData.append("date_str", uploadDate);
    formData.append("category", uploadCategory);
    formData.append("employee_id", "3"); // Default to Ishaan Patel for demo upload
    if (uploadGstin) formData.append("gstin", uploadGstin);

    try {
      const res = await fetch(`${API_URL}/transactions/upload`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(`Uploaded! Audit Verdict: ${data.verdict}`);
        setUploadAmount("");
        setUploadVendor("");
        setUploadDate("");
        setUploadGstin("");
        fetchData();
        // Redirect to detail view of the newly created tx
        setSelectedTxId(data.transaction_id);
        setActiveTab("transactions");
      } else {
        const errData = await res.json();
        alert(`Upload failed: ${errData.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading transaction");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle WhatsApp Ingestion
  const sendWaMessage = async (textToSend) => {
    const text = textToSend || waText;
    if (!text.trim()) return;

    setWaMessages(prev => [...prev, { sender: "user", text }]);
    setWaText("");
    setIsWaTyping(true);

    const formData = new FormData();
    formData.append("employee_name", waEmployee);
    formData.append("message_text", text);

    try {
      const res = await fetch(`${API_URL}/intake/whatsapp`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setWaMessages(prev => [...prev, { 
          sender: "agent", 
          text: data.reply,
          txId: data.transaction_id 
        }]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setWaMessages(prev => [...prev, { sender: "agent", text: "Sorry, there was a system error processing your request." }]);
    } finally {
      setIsWaTyping(false);
    }
  };

  // Handle policy update
  const handleUpdatePolicy = async (category, max, threshold) => {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("max_amount", max);
    formData.append("approval_threshold", threshold);

    try {
      const res = await fetch(`${API_URL}/settings/policies`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setPolicyMessage(`Updated rules for ${category} successfully.`);
        fetchData();
        setTimeout(() => setPolicyMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format currency
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? "bg-[#090D16] text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}>
      
      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r flex flex-col justify-between ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-inherit">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-900/30">
              FL
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wider">FraudLens</h1>
              <p className="text-[10px] text-teal-500 uppercase tracking-widest font-semibold">AI Audit Team</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => { setActiveTab("dashboard"); setSelectedTxId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" 
                  : `hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab("transactions"); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "transactions" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" 
                  : `hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`
              }`}
            >
              <span className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                Audit Queue
              </span>
              {summary.flagged_count > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-900 rounded-full">
                  {summary.flagged_count}
                </span>
              )}
            </button>
            <button 
              onClick={() => { setActiveTab("graph"); setSelectedTxId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "graph" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" 
                  : `hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`
              }`}
            >
              <Network className="w-4 h-4" />
              Collusion Network
            </button>
            <button 
              onClick={() => { setActiveTab("whatsapp"); setSelectedTxId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "whatsapp" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" 
                  : `hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Intake
            </button>
            <button 
              onClick={() => { setActiveTab("settings"); setSelectedTxId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "settings" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/10" 
                  : `hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Compliance Policies
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-inherit">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-850">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">Finance Admin</p>
              <p className="text-[10px] text-slate-400 truncate">admin@company.in</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className={`h-16 px-8 border-b flex items-center justify-between ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize tracking-wide">
              {activeTab === "graph" ? "Collusion Network Graph" : activeTab === "whatsapp" ? "WhatsApp Simulator" : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Upload Button */}
            <button 
              onClick={() => { setActiveTab("upload"); setSelectedTxId(null); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Receipt
            </button>

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition ${isDarkMode ? "border-slate-850 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"}`}>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Audited Spend</p>
                  <h3 className="text-2xl font-bold mt-2">{formatINR(summary.total_spend)}</h3>
                  <div className="absolute right-4 bottom-4 text-slate-200 dark:text-slate-800 opacity-20">
                    <DollarSign className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"}`}>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Flagged for Audit</p>
                  <h3 className="text-2xl font-bold mt-2 text-amber-500">{summary.flagged_count}</h3>
                  <div className="absolute right-4 bottom-4 text-amber-500 opacity-20">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"}`}>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Fraud Incidents</p>
                  <h3 className="text-2xl font-bold mt-2 text-rose-500">{summary.fraud_caught_count}</h3>
                  <div className="absolute right-4 bottom-4 text-rose-500 opacity-20">
                    <Shield className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-850" : "bg-white border-slate-200"}`}>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Saved Capital</p>
                  <h3 className="text-2xl font-bold mt-2 text-emerald-500">{formatINR(summary.money_saved)}</h3>
                  <div className="absolute right-4 bottom-4 text-emerald-500 opacity-20">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Collusion Alert Alert Box */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-500 text-sm">Suspicious Repeat Clusters Detected</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Our AI Agents have identified 2 primary risk collusion networks between employees and non-verified vendors in Maharashtra. Visit the <button onClick={() => setActiveTab("graph")} className="underline font-medium text-amber-400">Collusion Network Graph</button> for deep network forensics.
                  </p>
                </div>
              </div>

              {/* Recent Activity feed */}
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-6">Recent Audits Feed</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Tx ID</th>
                        <th className="pb-3 font-semibold">Employee</th>
                        <th className="pb-3 font-semibold">Vendor</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Verdict</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {summary.recent_activity.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/10">
                          <td className="py-4 font-mono">#{tx.id}</td>
                          <td className="py-4 font-medium">{tx.employee}</td>
                          <td className="py-4">{tx.vendor}</td>
                          <td className="py-4 text-slate-400">{tx.date}</td>
                          <td className="py-4 font-bold">{formatINR(tx.amount)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-350 text-[10px]">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.verdict === "Auto-Approved" 
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                : tx.verdict === "Flagged for Review" 
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            }`}>
                              {tx.verdict}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => { setSelectedTxId(tx.id); setActiveTab("transactions"); }}
                              className="text-teal-500 hover:text-teal-400 font-medium inline-flex items-center gap-1"
                            >
                              Details
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === "transactions" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Transactions List */}
              <div className={`lg:col-span-2 p-6 rounded-xl border flex flex-col h-[calc(100vh-12rem)] ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                  <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 w-full md:w-64 bg-slate-900/30 border-inherit">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search employee, vendor..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStatusFilter("All")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "All" ? "bg-teal-600 text-white" : "bg-slate-800/30 text-slate-400"}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Approved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Approved" ? "bg-emerald-500 text-slate-950" : "bg-slate-800/30 text-slate-400"}`}
                    >
                      Approved
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Pending" ? "bg-amber-500 text-slate-950" : "bg-slate-800/30 text-slate-400"}`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Flagged")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Flagged" ? "bg-rose-500 text-white" : "bg-slate-800/30 text-slate-400"}`}
                    >
                      Flagged / Rejected
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      onClick={() => setSelectedTxId(tx.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedTxId === tx.id 
                          ? "bg-slate-800/40 border-teal-500" 
                          : isDarkMode ? "bg-slate-900/50 border-slate-850 hover:bg-slate-800/20" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">#{tx.id}</span>
                          <span className="font-semibold text-sm truncate">{tx.vendor_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{tx.employee_name}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">{tx.category}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatINR(tx.amount)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 inline-block ${
                          tx.verdict === "Auto-Approved" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : tx.verdict === "Flagged for Review" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {tx.verdict || "Auditing..."}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Transaction Verdict Detail */}
              <div className="lg:col-span-1">
                {selectedTx ? (
                  <div className={`p-6 rounded-xl border space-y-6 h-[calc(100vh-12rem)] overflow-y-auto ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                    
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs text-slate-400">Audit Report #{selectedTx.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTx.verdict === "Auto-Approved" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : selectedTx.verdict === "Flagged for Review" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {selectedTx.verdict}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mt-2">{selectedTx.vendor_name}</h3>
                      <p className="text-2xl font-black mt-2 text-teal-500">{formatINR(selectedTx.amount)}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800 text-xs">
                      <div>
                        <p className="text-slate-400">Employee</p>
                        <p className="font-semibold mt-0.5">{selectedTx.employee_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{selectedTx.employee_department}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Date Filed</p>
                        <p className="font-semibold mt-0.5">{selectedTx.date}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Category</p>
                        <p className="font-semibold mt-0.5">{selectedTx.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">GSTIN Status</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          selectedTx.vendor_gstin_status === "Verified" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : selectedTx.vendor_gstin_status === "Unverified" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {selectedTx.vendor_gstin_status}
                        </span>
                      </div>
                    </div>

                    {/* Multi-Agent Reasoning Trail */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">AI Agent Audit Trail</h4>
                      
                      {selectedTx.reasoning_trail ? (
                        <div className="space-y-3">
                          {/* 1. Intake */}
                          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span>📥 Intake Agent</span>
                              <span className="text-emerald-500 text-[10px]">SUCCESS</span>
                            </div>
                            <p className="text-slate-450 mt-1 text-[11px]">
                              Successfully parsed invoice image. Vendor name, date, category and amount verified.
                            </p>
                          </div>

                          {/* 2. Compliance */}
                          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span>⚖️ Compliance Agent</span>
                              {selectedTx.reasoning_trail.compliance?.flags?.length > 0 ? (
                                <span className="text-amber-500 text-[10px]">VIOLATION</span>
                              ) : (
                                <span className="text-emerald-500 text-[10px]">PASSED</span>
                              )}
                            </div>
                            <p className="text-slate-450 mt-1 text-[11px]">
                              {selectedTx.reasoning_trail.compliance?.message || "Policy check completed."}
                            </p>
                          </div>

                          {/* 3. Fraud */}
                          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span>🕵️ Fraud Detection Agent</span>
                              {selectedTx.reasoning_trail.fraud?.duplicate_risk === "High" || selectedTx.reasoning_trail.fraud?.collusion_risk === "High" ? (
                                <span className="text-rose-500 text-[10px]">SUSPICIOUS</span>
                              ) : (
                                <span className="text-emerald-500 text-[10px]">PASSED</span>
                              )}
                            </div>
                            <div className="text-slate-450 mt-1 text-[11px] space-y-1">
                              <p>Duplicate Risk: <b>{selectedTx.reasoning_trail.fraud?.duplicate_risk}</b></p>
                              <p>Collusion Risk: <b>{selectedTx.reasoning_trail.fraud?.collusion_risk}</b></p>
                              {selectedTx.reasoning_trail.fraud?.flags?.map((flag, idx) => (
                                <p key={idx} className="text-rose-400 mt-1">{flag}</p>
                              ))}
                            </div>
                          </div>

                          {/* 4. Vendor */}
                          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span>🏢 Vendor Verification Agent</span>
                              <span className={selectedTx.vendor_gstin_status === "Verified" ? "text-emerald-500 text-[10px]" : "text-rose-500 text-[10px]"}>
                                {selectedTx.vendor_gstin_status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-450 mt-1 text-[11px]">
                              GSTIN: <span className="font-mono">{selectedTx.vendor_gstin}</span>. {selectedTx.reasoning_trail.vendor?.message}
                            </p>
                          </div>

                          {/* 5. Final Verdict */}
                          <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-500/30 text-xs">
                            <div className="font-bold text-teal-400 flex items-center gap-1">
                              <span>🤖 Lead Orchestrator Agent Verdict</span>
                            </div>
                            <p className="text-teal-100 font-semibold mt-1 text-[11px]">
                              {selectedTx.reasoning_trail.final_verdict?.reasoning || selectedTx.verdict}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No detailed reasoning trail found.</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center h-[calc(100vh-12rem)] ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                    <FileText className="w-12 h-12 text-slate-650 mb-3" />
                    <p className="text-sm font-semibold">No Transaction Selected</p>
                    <p className="text-xs text-slate-450 mt-1 max-w-[200px]">Select a receipt card from the audit queue to inspect agent audit details.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "graph" && <CollusionGraph />}

          {activeTab === "whatsapp" && (
            <div className="max-w-md mx-auto">
              <div className={`rounded-2xl border overflow-hidden flex flex-col h-[calc(100vh-14rem)] ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                
                {/* Simulated Header */}
                <div className="bg-emerald-650 p-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-sm">
                    FL
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">FraudLens Intake Bot</h3>
                    <p className="text-[10px] opacity-75">Active Agent Pipeline</p>
                  </div>
                </div>

                {/* Sender Settings Row */}
                <div className="p-3 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Sending as Employee:</span>
                  <select 
                    value={waEmployee} 
                    onChange={(e) => setWaEmployee(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                  >
                    <option value="Aarav Mehta">Aarav Mehta (Engineering)</option>
                    <option value="Diya Sharma">Diya Sharma (Sales)</option>
                    <option value="Ishaan Patel">Ishaan Patel (Finance)</option>
                    <option value="Kabir Rao">Kabir Rao (Operations)</option>
                    <option value="Arjun Gupta">Arjun Gupta (Marketing)</option>
                  </select>
                </div>

                {/* Message Log */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0B0F19]/40">
                  {waMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 text-xs ${
                        msg.sender === "user" 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : msg.sender === "system" 
                            ? "bg-slate-800/50 text-slate-300 border border-slate-800 text-center mx-auto"
                            : "bg-slate-800 text-slate-100 rounded-tl-none whitespace-pre-wrap border border-slate-750"
                      }`}>
                        {msg.text}
                        {msg.txId && (
                          <button 
                            onClick={() => { setSelectedTxId(msg.txId); setActiveTab("transactions"); }}
                            className="block font-bold text-teal-400 mt-2 hover:underline"
                          >
                            Inspect Audit Details →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isWaTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 rounded-xl p-3 text-xs rounded-tl-none text-slate-400 italic">
                        FraudLens bot is auditing...
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-made Ingestion templates */}
                <div className="p-3 bg-slate-900/50 border-t border-slate-800 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Or Select a demo receipt template:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button 
                      onClick={() => sendWaMessage("Forwarding Indigo Airlines ticket of 28499 INR for business trip to Mumbai.")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded"
                    >
                      Indigo Ticket (28,499 INR)
                    </button>
                    <button 
                      onClick={() => sendWaMessage("Lunch receipt at Dhaba Express of 4500 INR.")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded"
                    >
                      Dhaba Lunch (4,500 INR)
                    </button>
                    <button 
                      onClick={() => sendWaMessage("Consulting invoice from Apex Consulting Services for 145000 INR.")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded"
                    >
                      Apex Inv (145,000 INR)
                    </button>
                  </div>
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-slate-850 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type transaction detail..." 
                    value={waText}
                    onChange={(e) => setWaText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendWaMessage()}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                  />
                  <button 
                    onClick={() => sendWaMessage()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-semibold"
                  >
                    Send
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="text-lg font-bold">Category Audit Policies</h3>
                <p className="text-xs text-slate-400 mt-1">Configure absolute spend limits and automated approval thresholds for each expense category. Violating transactions are automatically flagged or rejected by the Compliance Agent.</p>
                
                {policyMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                    {policyMessage}
                  </div>
                )}

                <div className="mt-6 space-y-6 divide-y divide-slate-800/30">
                  {policies.map((p) => (
                    <PolicyRow 
                      key={p.id} 
                      policy={p} 
                      onSave={handleUpdatePolicy} 
                      isDarkMode={isDarkMode} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-lg mx-auto">
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="text-lg font-bold mb-4">Manual Receipt Upload</h3>
                
                {uploadSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg mb-4">
                    {uploadSuccess}
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Vendor Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Indigo Airlines" 
                      value={uploadVendor}
                      onChange={(e) => setUploadVendor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Amount (INR)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="e.g. 4500" 
                        value={uploadAmount}
                        onChange={(e) => setUploadAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Date</label>
                      <input 
                        type="date" 
                        required
                        value={uploadDate}
                        onChange={(e) => setUploadDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select 
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none"
                      >
                        {Object.keys(CATEGORIES).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Vendor GSTIN (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 27AAPCS1234A1Z5" 
                        value={uploadGstin}
                        onChange={(e) => setUploadGstin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2.5 font-semibold text-xs transition"
                    >
                      {isUploading ? "Auditing via AI Agents..." : "Submit Receipt & Run Audit"}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Sub-component: Settings Policy Row
function PolicyRow({ policy, onSave, isDarkMode }) {
  const [max, setMax] = useState(policy.max_amount);
  const [threshold, setThreshold] = useState(policy.approval_threshold);

  return (
    <div className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
      <div className="font-semibold text-sm w-32">{policy.category}</div>
      
      <div className="flex gap-4 flex-1 w-full md:w-auto">
        <div className="flex-1">
          <label className="block text-slate-400 text-[10px] mb-1">Absolute Max Limit (INR)</label>
          <input 
            type="number" 
            value={max}
            onChange={(e) => setMax(parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-slate-400 text-[10px] mb-1">Approval Threshold (INR)</label>
          <input 
            type="number" 
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
          />
        </div>
      </div>

      <button 
        onClick={() => onSave(policy.category, max, threshold)}
        className="bg-teal-650 hover:bg-teal-750 text-white rounded-lg px-4 py-2 font-medium shrink-0 self-end md:self-auto"
      >
        Save Policy
      </button>
    </div>
  );
}
// Sub-component: Collusion Network Graph (SVG force-directed layout)
function CollusionGraph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/network/graph`)
      .then(res => res.json())
      .then(data => {
        setGraph(data);
        
        // Initialize node positions (circle layout as starting point)
        const w = containerRef.current ? containerRef.current.getBoundingClientRect().width : 800;
        const h = 500;
        setDimensions({ width: w, height: h });
        const radius = 180;
        
        const initializedNodes = data.nodes.map((node, idx) => {
          const angle = (idx / data.nodes.length) * 2 * Math.PI;
          return {
            ...node,
            x: w / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 20,
            y: h / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 20,
            vx: 0,
            vy: 0
          };
        });
        
        setNodes(initializedNodes);
        setEdges(data.edges);
      })
      .catch(err => console.error(err));
  }, []);

  // Simple Spring Physics Force-Directed Simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    
    let animationFrame;
    const { width, height } = dimensions;
    const center = { x: width / 2, y: height / 2 };
    
    const runSimulation = () => {
      setNodes(prevNodes => {
        // Create a copy of nodes to update
        const updatedNodes = prevNodes.map(n => ({ ...n }));
        
        // Repulsion force between all nodes (charge)
        for (let i = 0; i < updatedNodes.length; i++) {
          for (let j = i + 1; j < updatedNodes.length; j++) {
            const n1 = updatedNodes[i];
            const n2 = updatedNodes[j];
            
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            if (dist < 200) {
              const force = (200 - dist) * 0.08;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              
              if (n1.id !== draggedNode) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2.id !== draggedNode) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }
        
        // Attraction force along edges (gravity / spring)
        edges.forEach(edge => {
          const source = updatedNodes.find(n => n.id === edge.from);
          const target = updatedNodes.find(n => n.id === edge.to);
          
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const targetDist = 120;
            const k = 0.05; // spring constant
            const force = (dist - targetDist) * k;
            
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            if (source.id !== draggedNode) {
              source.vx += fx;
              source.vy += fy;
            }
            if (target.id !== draggedNode) {
              target.vx -= fx;
              target.vy -= fy;
            }
          }
        });
        
        // Center gravity pulling to the center of SVG
        updatedNodes.forEach(node => {
          if (node.id === draggedNode) return;
          
          const dx = center.x - node.x;
          const dy = center.y - node.y;
          node.vx += dx * 0.01;
          node.vy += dy * 0.01;
          
          // Apply velocity and damping
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.7; // friction
          node.vy *= 0.7;
          
          // Boundary collision
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        });
        
        return updatedNodes;
      });
      
      animationFrame = requestAnimationFrame(runSimulation);
    };
    
    animationFrame = requestAnimationFrame(runSimulation);
    return () => cancelAnimationFrame(animationFrame);
  }, [edges, draggedNode, nodes.length]);

  // Handle Dragging
  const handleMouseDown = (e, nodeId) => {
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setNodes(prev => prev.map(n => {
      if (n.id === draggedNode) {
        return {
          ...n,
          x: mouseX,
          y: mouseY,
          vx: 0,
          vy: 0
        };
      }
      return n;
    }));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Legend & Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-4 rounded-xl border bg-slate-900/40 border-slate-800 space-y-2">
          <p className="font-semibold text-teal-400">Node Legend</p>
          <div className="flex gap-4 items-center mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-teal-600 inline-block"></span>
              Employee
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block"></span>
              Verified Vendor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 inline-block"></span>
              Invalid/Suspicious Vendor
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/40 border-slate-800 space-y-2">
          <p className="font-semibold text-amber-500">Connection Types</p>
          <div className="flex gap-4 items-center mt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-6 bg-slate-600 inline-block"></span>
              Standard Expense
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-6 bg-rose-500 inline-block"></span>
              High Collusion Risk (Thick/Red)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/40 border-slate-800 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-350">Interactive Controls</p>
            <p className="text-[11px] text-slate-400 mt-1">Drag nodes to rearrange or pull nodes apart to visually inspect transaction paths.</p>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[500px] border border-slate-800 rounded-xl relative overflow-hidden bg-[#070A11] cursor-grab active:cursor-grabbing"
      >
        <svg className="w-full h-full">
          {/* Draw Connection Edges */}
          {edges.map((edge, idx) => {
            const source = nodes.find(n => n.id === edge.from);
            const target = nodes.find(n => n.id === edge.to);
            if (!source || !target) return null;
            
            return (
              <g key={`edge-${idx}`}>
                <line 
                  x1={source.x} 
                  y1={source.y} 
                  x2={target.x} 
                  y2={target.y} 
                  stroke={edge.suspicious ? "#F43F5E" : "#475569"} 
                  strokeWidth={edge.suspicious ? 3 : Math.min(1 + edge.tx_count * 0.5, 4)} 
                  opacity={edge.suspicious ? 0.9 : 0.4}
                />
                {/* Weight badge in center of line */}
                {edge.tx_count > 2 && (
                  <g transform={`translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`}>
                    <rect x="-12" y="-8" width="24" height="15" rx="3" fill="#0B0F19" stroke="#334155" strokeWidth="1" />
                    <text textAnchor="middle" y="3" fontSize="9px" className="fill-slate-400 font-semibold">{edge.tx_count}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw Nodes */}
          {nodes.map(node => {
            const isVendor = node.type === "vendor";
            let color = "fill-teal-600";
            if (isVendor) {
              color = node.gstin_status === "Invalid" ? "fill-rose-600" : "fill-indigo-650";
            }
            
            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                className="select-none"
              >
                {/* Collusion Danger Pulse Ring */}
                {(node.label === "Apex Consulting Services" || node.label === "Garg Stationery & Xerox" || node.label === "Kabir Rao" || node.label === "Arjun Gupta") && (
                  <circle r="22" className="fill-none stroke-rose-500 opacity-60 animate-ping" strokeWidth="1" />
                )}

                <circle 
                  r={isVendor ? 12 : 10} 
                  className={`${color} stroke-[#0B0F19] stroke-2 shadow-lg cursor-pointer hover:stroke-teal-400 transition-colors`} 
                />
                
                {/* Label text */}
                <text 
                  y={isVendor ? -18 : 22} 
                  textAnchor="middle" 
                  fontSize="10px" 
                  className="fill-slate-200 font-medium font-sans"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}

const CATEGORIES = {
  "Travel": {"max": 75000.0, "threshold": 50000.0},
  "Meals": {"max": 10000.0, "threshold": 5000.0},
  "Software": {"max": 150000.0, "threshold": 100000.0},
  "Office Supplies": {"max": 30000.0, "threshold": 15000.0},
  "Consulting": {"max": 200000.0, "threshold": 120000.0},
  "Hardware": {"max": 120000.0, "threshold": 80000.0}
};
