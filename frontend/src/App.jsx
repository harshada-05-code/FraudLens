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
  AlertCircle,
  Info,
  X
} from "lucide-react";

// API Base URL
const API_URL = "http://localhost:8000/api";

const translate = (text, lang) => {
  if (lang !== "HI" || !text) return text;
  
  const dict = {
    // Menu
    "Dashboard": "डैशबोर्ड",
    "Audit Queue": "ऑडिट कतार",
    "Collusion Network": "साठगांठ नेटवर्क",
    "WhatsApp Simulator": "व्हाट्सएप सिम्युलेटर",
    "WhatsApp Intake": "व्हाट्सएप इनटेक",
    "Compliance Policies": "अनुपालन नीतियां",
    "Upload Receipt": "रसीद अपलोड",
    
    // Status / verdicts
    "Auto-Approved": "स्वचालित स्वीकृत",
    "Flagged for Review": "समीक्षा के लिए चिह्नित",
    "Rejected": "अस्वीकृत",
    "Pending": "लंबित",
    "Approved": "स्वीकृत",
    "Flagged": "चिह्नित",
    "Auditing...": "ऑडिट चल रहा है...",
    
    // Dashboard Stats
    "Total Audited Spend": "कुल ऑडिटेड खर्च",
    "Flagged for Audit": "ऑडिट के लिए चिह्नित",
    "Fraud Incidents": "धोखाधड़ी की घटनाएं",
    "Saved Capital": "बचाई गई पूंजी",
    "Recent Audits Feed": "हालिया ऑडिट फीड",
    
    // Alerts
    "Suspicious Repeat Clusters Detected": "संदिग्ध बार-बार लेनदेन क्लस्टर मिले",
    "Our AI Agents have identified 2 primary risk collusion networks between employees and non-verified vendors in Maharashtra. Visit the ": "हमारे एआई एजेंटों ने कर्मचारियों और गैर-सत्यापित विक्रेताओं के बीच 2 मुख्य जोखिम साठगांठ नेटवर्क की पहचान की है। साठगांठ का गहराई से विश्लेषण करने के लिए ",
    "for deep network forensics.": " पर जाएं।",
    
    // Table Headers
    "Tx ID": "लेनदेन आईडी",
    "Employee": "कर्मचारी",
    "Vendor": "विक्रेता",
    "Date": "तारीख",
    "Amount": "राशि",
    "Category": "श्रेणी",
    "Verdict": "निर्णय",
    "Action": "कार्रवाई",
    "Details": "विवरण",
    
    // Category Names
    "Travel": "यात्रा",
    "Meals": "भोजन",
    "Software": "सॉफ्टवेयर",
    "Office Supplies": "कार्यालय आपूर्ति",
    "Consulting": "परामर्श",
    "Hardware": "हार्डवेयर",
    "All": "सभी",
    
    // Selected Detail Panel
    "Audit Report": "ऑडिट रिपोर्ट",
    "Date Filed": "दाखिला तिथि",
    "GSTIN Status": "GSTIN स्थिति",
    "AI Agent Audit Trail": "एआई एजेंट ऑडिट ट्रेल",
    "No detailed reasoning trail found.": "कोई विस्तृत ऑडिट ट्रेल नहीं मिला।",
    "No Transaction Selected": "कोई लेनदेन नहीं चुना गया",
    "Select a receipt card from the audit queue to inspect agent audit details.": "एजेंट ऑडिट विवरण देखने के लिए ऑडिट कतार से एक रसीद चुनें।",
    
    // Agent Names
    "Intake Agent": "इनटेक एजेंट (Intake)",
    "Compliance Agent": "अनुपालन एजेंट (Compliance)",
    "Fraud Detection Agent": "धोखाधड़ी जांच एजेंट (Fraud)",
    "Vendor Verification Agent": "विक्रेता सत्यापन एजेंट (Vendor)",
    "Lead Orchestrator Agent Verdict": "मुख्य समन्वयक एजेंट निर्णय",
    
    // Agent Statuses
    "SUCCESS": "सफल",
    "PASSED": "उत्तीर्ण",
    "VIOLATION": "उल्लंघन",
    "SUSPICIOUS": "संदिग्ध",
    "VERIFIED": "सत्यापित",
    "UNVERIFIED": "असत्यापित",
    "INVALID": "अमान्य",
    
    // Settings screen
    "Category Audit Policies": "श्रेणी ऑडिट नीतियां",
    "Configure absolute spend limits and automated approval thresholds for each expense category. Violating transactions are automatically flagged or rejected by the Compliance Agent.": "प्रत्येक खर्च श्रेणी के लिए पूर्ण खर्च सीमा और स्वचालित अनुमोदन सीमा कॉन्फ़िगर करें। नीति उल्लंघन करने वाले लेनदेन को अनुपालन एजेंट द्वारा स्वचालित रूप से चिह्नित या अस्वीकृत कर दिया जाता है।",
    "Absolute Max Limit (INR)": "पूर्ण अधिकतम सीमा (INR)",
    "Approval Threshold (INR)": "अनुमोदन सीमा (INR)",
    "Save Policy": "नीति सहेजें",
    "Updated rules for": "के लिए नीति नियम अपडेट किए गए",
    "successfully.": "सफलतापूर्वक।",
    
    // Upload screen
    "Manual Receipt Upload": "मैनुअल रसीद अपलोड",
    "Vendor Name": "विक्रेता का नाम",
    "Amount (INR)": "राशि (INR)",
    "Vendor GSTIN (Optional)": "विक्रेता का जीएसटीआईएन (वैकल्पिक)",
    "Submit Receipt & Run Audit": "रसीद सबमिट करें और ऑडिट चलाएं",
    "Auditing via AI Agents...": "एआई एजेंटों द्वारा ऑडिट किया जा रहा है...",
    "Transaction uploaded and audited successfully.": "लेनदेन सफलतापूर्वक अपलोड और ऑडिट किया गया।",
    
    // WhatsApp
    "FraudLens Intake Bot": "फ्रॉड लेंस इनटेक बॉट",
    "Active Agent Pipeline": "सक्रिय एजेंट पाइपलाइन",
    "Sending as Employee:": "कर्मचारी के रूप में भेजें:",
    "Or Select a demo receipt template:": "या एक डेमो रसीद टेम्पलेट चुनें:",
    "Type transaction detail...": "लेनदेन का विवरण टाइप करें...",
    "Send": "भेजें",
    "FraudLens bot is auditing...": "फ्रॉड लेंस बॉट ऑडिट कर रहा है...",
    "Inspect Audit Details →": "ऑडिट विवरण का निरीक्षण करें →",
    
    // Legend
    "Node Legend": "नोड संकेत (Legend)",
    "Connection Types": "कनेक्शन के प्रकार",
    "Standard Expense": "सामान्य खर्च",
    "High Collusion Risk (Thick/Red)": "उच्च साठगांठ जोखिम (लाल)",
    "Interactive Controls": "इंटरएक्टिव नियंत्रण",
    "Drag nodes to rearrange or pull nodes apart to visually inspect transaction paths.": "लेनदेन पथों का विश्लेषण करने के लिए नोड्स को खींचें और पुनर्व्यवस्थित करें।",
    "Verified Vendor": "सत्यापित विक्रेता",
    "Invalid/Suspicious Vendor": "अमान्य/संदिग्ध विक्रेता",
    
    // General phrases
    "All agent checks passed successfully.": "सभी एजेंट जांच सफलतापूर्वक पूरी हो गई।",
    "Transaction is within budget limits.": "लेनदेन बजट सीमा के भीतर है।",
    "Flagged / Rejected": "चिह्नित / अस्वीकृत",
    "Search employee, vendor...": "कर्मचारी, विक्रेता खोजें...",
    "Finance Admin": "वित्त प्रशासक",
    "Engineering": "इंजीनियरिंग",
    "Sales": "बिक्री",
    "HR": "मानव संसाधन (HR)",
    "Finance": "वित्त",
    "Operations": "संचालन",
    "Marketing": "विपणन (Marketing)",
    "online": "ऑनलाइन",
    "Welcome to FraudLens WhatsApp Intake. Send a receipt description to analyze it.": "फ्रॉड लेंस व्हाट्सएप इनटेक में आपका स्वागत है। विश्लेषण करने के लिए रसीद का विवरण भेजें।",
    "Elevated repeat transaction frequency between employee and vendor.": "कर्मचारी और विक्रेता के बीच बार-बार लेनदेन की आवृत्ति बढ़ी हुई है।",
    "Policy check completed.": "नीति उल्लंघन की जांच पूरी हो गई है।"
  };

  if (dict[text]) return dict[text];

  // Dynamic WhatsApp reply template translation
  if (text.includes("I've received your receipt for")) {
    let trans = text;
    trans = trans.replace(/Hi\s+([^,]+),/, "नमस्ते $1,");
    trans = trans.replace(/I've received your receipt for \*([0-9.,]+)\s+INR\* from \*([^*]+)\*\./, "मुझे आपका *$2* से *$1 रुपये* का रसीद मिल गया है।");
    trans = trans.replace(/\*FraudLens Agent Verdict\*:/, "*फ्रॉड लेंस एजेंट निर्णय*:");
    trans = trans.replace(/Reasoning:/, "कारण:");
    trans = trans.replace("You can view the detailed audit logs on your FraudLens dashboard.", "आप अपने फ्रॉड लेंस डैशबोर्ड पर विस्तृत ऑडिट लॉग देख सकते हैं।");
    
    Object.keys(dict).forEach(key => {
      trans = trans.replaceAll(key, dict[key]);
    });
    
    // Basic dynamic replacement fallbacks
    trans = trans.replace("Successfully parsed invoice image. Vendor name, date, category and amount verified.", "रसीद की छवि को सफलतापूर्वक पढ़ा गया। विक्रेता का नाम, दिनांक, श्रेणी और राशि सत्यापित।");
    trans = trans.replace("Transaction rejected due to:", "लेनदेन अस्वीकृत होने का कारण:");
    trans = trans.replace("identical duplicate receipt detected", "समान प्रतिलिपि (डुप्लिकेट) रसीद पाई गई");
    trans = trans.replace("vendor GSTIN is invalid/unregistered", "विक्रेता का जीएसटीआईएन (GSTIN) अमान्य या अपंजीकृत है");
    trans = trans.replace("Transaction flagged for audit:", "लेनदेन ऑडिट के लिए चिह्नित किया गया है:");
    trans = trans.replace("suspicious collusion pattern", "संदिग्ध साठगांठ का पैटर्न");
    trans = trans.replace("unverified vendor GSTIN", "असत्यापित विक्रेता जीएसटीआईएन (GSTIN)");
    trans = trans.replace("Limit Exceeded: amount exceeds category budget of", "सीमा पार हुई: राशि श्रेणी के बजट से अधिक है जो कि है");
    trans = trans.replace("Needs Approval: amount exceeds review threshold of", "अनुमोदन की आवश्यकता: राशि समीक्षा सीमा से अधिक है जो कि है");
    trans = trans.replace("INR", "रुपये");

    return trans;
  }

  // Dynamic policy update message
  if (text.startsWith("Updated rules for")) {
    const category = text.replace("Updated rules for ", "").replace(" successfully.", "");
    const translatedCategory = dict[category] || category;
    return `${translatedCategory} के लिए नियम सफलतापूर्वक अपडेट किए गए।`;
  }

  // Dynamic manual upload success message
  if (text.startsWith("Uploaded! Audit Verdict:")) {
    const verdict = text.replace("Uploaded! Audit Verdict: ", "");
    const translatedVerdict = dict[verdict] || verdict;
    return `अपलोड सफल! ऑडिट निर्णय: ${translatedVerdict}`;
  }

  let translated = text;
  translated = translated.replace("Successfully parsed invoice image. Vendor name, date, category and amount verified.", "रसीद की छवि को सफलतापूर्वक पढ़ा गया। विक्रेता का नाम, दिनांक, श्रेणी और राशि सत्यापित।");
  translated = translated.replace("Transaction rejected due to:", "लेनदेन अस्वीकृत होने का कारण:");
  translated = translated.replace("identical duplicate receipt detected", "समान प्रतिलिपि (डुप्लिकेट) रसीद पाई गई");
  translated = translated.replace("vendor GSTIN is invalid/unregistered", "विक्रेता का जीएसटीआईएन (GSTIN) अमान्य या अपंजीकृत है");
  
  translated = translated.replace("Transaction flagged for audit:", "लेनदेन ऑडिट के लिए चिह्नित किया गया है:");
  translated = translated.replace("suspicious collusion pattern", "संदिग्ध साठगांठ का पैटर्न");
  translated = translated.replace("unverified vendor GSTIN", "असत्यापित विक्रेता जीएसटीआईएन (GSTIN)");
  
  translated = translated.replace("Limit Exceeded: amount exceeds category budget of", "सीमा पार हुई: राशि श्रेणी के बजट से अधिक है जो कि है");
  translated = translated.replace("Needs Approval: amount exceeds review threshold of", "अनुमोदन की आवश्यकता: राशि समीक्षा सीमा से अधिक है जो कि है");
  
  translated = translated.replace("Exceeds Meals limit", "भोजन (Meals) की सीमा पार हुई");
  translated = translated.replace("Exceeds Travel limit", "यात्रा (Travel) की सीमा पार हुई");
  translated = translated.replace("Exceeds Software limit", "सॉफ्टवेयर (Software) की सीमा पार हुई");
  translated = translated.replace("Exceeds Hardware limit", "हार्डवेयर (Hardware) की सीमा पार हुई");
  translated = translated.replace("Exceeds Office Supplies limit", "कार्यालय आपूर्ति (Office Supplies) की सीमा पार हुई");
  translated = translated.replace("Exceeds Consulting limit", "परामर्श (Consulting) की सीमा पार हुई");
  
  translated = translated.replace("Above review threshold", "समीक्षा सीमा से ऊपर");
  translated = translated.replace("unverified", "असत्यापित");
  translated = translated.replace("verified", "सत्यापित");
  translated = translated.replace("invalid", "अमान्य");
  translated = translated.replace("INR", "रुपये");
  translated = translated.replace("Duplicate Risk:", "डुप्लिकेट जोखिम:");
  translated = translated.replace("Collusion Risk:", "साठगांठ जोखिम:");
  translated = translated.replace("Low", "कम");
  translated = translated.replace("Medium", "मध्यम");
  translated = translated.replace("High", "उच्च");

  return translated;
};

const getPageDescription = (tab, lang) => {
  const dict = {
    "dashboard": {
      "EN": "Overview of your company's expense health, audit stats, and active alerts detected by AI Agents.",
      "HI": "आपके कंपनी के खर्च स्वास्थ्य, ऑडिट आंकड़ों और एआई एजेंटों द्वारा पता लगाए गए सक्रिय अलर्ट का विवरण।"
    },
    "transactions": {
      "EN": "Real-time feed of all invoices and receipts uploaded. Inspect the step-by-step reasoning trail generated by our Compliance, Fraud, and Vendor Verification agents.",
      "HI": "अपलोड किए गए सभी इनवॉइस और रसीदों का रीयल-टाइम फीड। हमारे अनुपालन, धोखाधड़ी और विक्रेता सत्यापन एजेंटों द्वारा उत्पन्न ऑडिट रिपोर्ट का निरीक्षण करें।"
    },
    "graph": {
      "EN": "Interactive visualization showing links between employees and vendors. Thick red lines indicate potential collusion or suspicious recurring transaction clusters.",
      "HI": "कर्मचारियों और विक्रेताओं के बीच संबंधों को दर्शाने वाला इंटरएक्टिव ग्राफ। मोटी लाल रेखाएं संभावित मिलीभगत या संदिग्ध बार-बार होने वाले लेनदेन क्लस्टर को दर्शाती हैं।"
    },
    "whatsapp": {
      "EN": "Simulate forwarding a receipt from an employee's phone. Our AI intake agent automatically extracts the vendor, amount, and category, runs the audit pipeline, and replies instantly.",
      "HI": "कर्मचारी के फोन से रसीद भेजने का अनुकरण करें। हमारा एआई इनटेक एजेंट विक्रेता, राशि और श्रेणी को स्वचालित रूप से निकालता है, ऑडिट चलाता है, और तुरंत उत्तर देता है।"
    },
    "settings": {
      "EN": "Define maximum allowable amounts and review thresholds for each expense category. The Compliance Agent checks every submission against these active rules.",
      "HI": "प्रत्येक खर्च श्रेणी के लिए अधिकतम स्वीकार्य राशि और समीक्षा सीमाएं परिभाषित करें। अनुपालन एजेंट इन नियमों के खिलाफ प्रत्येक जमा की जांच करता है।"
    },
    "upload": {
      "EN": "Manually file an expense report for audit analysis by entering the invoice amount, vendor name, category, and optionally vendor GSTIN.",
      "HI": "चालान राशि, विक्रेता का नाम, श्रेणी और वैकल्पिक रूप से विक्रेता जीएसटीआईएन दर्ज करके ऑडिट विश्लेषण के लिए एक व्यय रिपोर्ट मैन्युअल रूप से दर्ज करें।"
    }
  };
  return dict[tab]?.[lang] || dict[tab]?.["EN"] || "";
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState("EN"); // EN or HI
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Demo auto-login
  const [dismissedGuides, setDismissedGuides] = useState([]);

  const dismissGuide = (tab) => {
    setDismissedGuides(prev => [...prev, tab]);
  };

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
  const [uploadDate, setUploadDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (mm < 10) mm = '0' + mm;
    if (dd < 10) dd = '0' + dd;
    return `${yyyy}-${mm}-${dd}`;
  });
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
    
    const todayStr = (() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      let mm = today.getMonth() + 1;
      let dd = today.getDate();
      if (mm < 10) mm = '0' + mm;
      if (dd < 10) dd = '0' + dd;
      return `${yyyy}-${mm}-${dd}`;
    })();

    const formData = new FormData();
    formData.append("amount", uploadAmount);
    formData.append("vendor_name", uploadVendor);
    formData.append("date_str", uploadDate || todayStr);
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
        setUploadDate(todayStr);
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
              <p className="text-[10px] text-teal-500 uppercase tracking-widest font-semibold">{translate("AI Audit Team", language)}</p>
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
              {translate("Dashboard", language)}
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
                {translate("Audit Queue", language)}
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
              {translate("Collusion Network", language)}
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
              {translate("WhatsApp Intake", language)}
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
              {translate("Compliance Policies", language)}
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-inherit">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{translate("Finance Admin", language)}</p>
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
              {translate(activeTab === "graph" ? "Collusion Network" : activeTab === "whatsapp" ? "WhatsApp Simulator" : activeTab === "upload" ? "Manual Receipt Upload" : activeTab === "settings" ? "Compliance Policies" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1), language)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Upload Button */}
            <button 
              onClick={() => { setActiveTab("upload"); setSelectedTxId(null); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {translate("Upload Receipt", language)}
            </button>

            {/* Language toggle */}
            <button 
              onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                isDarkMode 
                  ? "border-slate-800 hover:bg-slate-800 text-slate-200" 
                  : "border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              🌐 {language === "EN" ? "हिन्दी" : "English"}
            </button>

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition ${isDarkMode ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* First-time mini walkthrough caption banner */}
          {!dismissedGuides.includes(activeTab) && (
            <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 relative transition-all ${
              isDarkMode 
                ? "bg-slate-900/60 border-slate-800 text-slate-350" 
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <div className="pr-6 text-xs leading-relaxed">
                <p className="font-semibold text-slate-850 dark:text-slate-200 mb-0.5">
                  {language === "HI" ? "यह स्क्रीन क्या करती है?" : "What does this screen do?"}
                </p>
                <p>{getPageDescription(activeTab, language)}</p>
              </div>
              <button 
                onClick={() => dismissGuide(activeTab)} 
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">{translate("Total Audited Spend", language)}</p>
                  <h3 className="text-2xl font-bold mt-2">{formatINR(summary.total_spend)}</h3>
                  <div className="absolute right-4 bottom-4 text-slate-200 dark:text-slate-800 opacity-20">
                    <DollarSign className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">{translate("Flagged for Audit", language)}</p>
                  <h3 className="text-2xl font-bold mt-2 text-amber-500">{summary.flagged_count}</h3>
                  <div className="absolute right-4 bottom-4 text-amber-500 opacity-20">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">{translate("Fraud Incidents", language)}</p>
                  <h3 className="text-2xl font-bold mt-2 text-rose-500">{summary.fraud_caught_count}</h3>
                  <div className="absolute right-4 bottom-4 text-rose-500 opacity-20">
                    <Shield className="w-12 h-12" />
                  </div>
                </div>

                <div className={`p-6 rounded-xl border relative overflow-hidden transition hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">{translate("Saved Capital", language)}</p>
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
                  <h4 className="font-semibold text-amber-600 dark:text-amber-500 text-sm">{translate("Suspicious Repeat Clusters Detected", language)}</h4>
                  <p className="text-xs dark:text-slate-400 text-slate-700 mt-1">
                    {translate("Our AI Agents have identified 2 primary risk collusion networks between employees and non-verified vendors in Maharashtra. Visit the ", language)}
                    <button onClick={() => setActiveTab("graph")} className="underline font-medium dark:text-amber-400 text-amber-700 hover:text-amber-800 dark:hover:text-amber-300">
                      {translate("Collusion Network Graph", language)}
                    </button>
                    {translate("for deep network forensics.", language)}
                  </p>
                </div>
              </div>

              {/* Recent Activity feed */}
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="font-bold text-sm uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-6">{translate("Recent Audits Feed", language)}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">{translate("Tx ID", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Employee", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Vendor", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Date", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Amount", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Category", language)}</th>
                        <th className="pb-3 font-semibold">{translate("Verdict", language)}</th>
                        <th className="pb-3 font-semibold text-right">{translate("Action", language)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800/30 divide-slate-200/50">
                      {summary.recent_activity.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20">
                          <td className="py-4 font-mono">#{tx.id}</td>
                          <td className="py-4 font-medium">{tx.employee}</td>
                          <td className="py-4">{tx.vendor}</td>
                          <td className="py-4 dark:text-slate-400 text-slate-500">{tx.date}</td>
                          <td className="py-4 font-bold">{formatINR(tx.amount)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 text-[10px]">
                              {translate(tx.category, language)}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.verdict === "Auto-Approved" 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20" 
                                : tx.verdict === "Flagged for Review" 
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" 
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}>
                              {translate(tx.verdict, language)}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => { setSelectedTxId(tx.id); setActiveTab("transactions"); }}
                              className="text-teal-600 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 font-medium inline-flex items-center gap-1"
                            >
                              {translate("Details", language)}
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
                  <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 w-full md:w-64 dark:bg-slate-900/30 bg-slate-50 border-slate-200 dark:border-slate-800">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={translate("Search employee, vendor...", language)} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none dark:text-slate-100 text-slate-800 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStatusFilter("All")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "All" ? "bg-teal-600 text-white" : "dark:bg-slate-800/30 bg-slate-100 dark:text-slate-400 text-slate-650 hover:bg-slate-200 dark:hover:bg-slate-800/60 border dark:border-slate-800 border-slate-200/50 shadow-xs"}`}
                    >
                      {translate("All", language)}
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Approved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Approved" ? "bg-emerald-500 text-white dark:text-slate-950" : "dark:bg-slate-800/30 bg-slate-100 dark:text-slate-400 text-slate-655 hover:bg-slate-200 dark:hover:bg-slate-800/60 border dark:border-slate-800 border-slate-200/50 shadow-xs"}`}
                    >
                      {translate("Approved", language)}
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Pending" ? "bg-amber-500 text-white dark:text-slate-950" : "dark:bg-slate-800/30 bg-slate-100 dark:text-slate-400 text-slate-655 hover:bg-slate-200 dark:hover:bg-slate-800/60 border dark:border-slate-800 border-slate-200/50 shadow-xs"}`}
                    >
                      {translate("Pending", language)}
                    </button>
                    <button 
                      onClick={() => setStatusFilter("Flagged")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === "Flagged" ? "bg-rose-500 text-white" : "dark:bg-slate-800/30 bg-slate-100 dark:text-slate-400 text-slate-655 hover:bg-slate-200 dark:hover:bg-slate-800/60 border dark:border-slate-800 border-slate-200/50 shadow-xs"}`}
                    >
                      {translate("Flagged / Rejected", language)}
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
                          ? "dark:bg-slate-800/40 bg-teal-50/50 dark:border-teal-500 border-teal-500 shadow-sm" 
                          : isDarkMode ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800/20" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] dark:text-slate-400 text-slate-500">#{tx.id}</span>
                          <span className="font-semibold text-sm truncate">{tx.vendor_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs dark:text-slate-400 text-slate-500 mt-1">
                          <span>{tx.employee_name}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 text-[10px]">{translate(tx.category, language)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatINR(tx.amount)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 inline-block ${
                          tx.verdict === "Auto-Approved" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" 
                            : tx.verdict === "Flagged for Review" 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {tx.verdict ? translate(tx.verdict, language) : translate("Auditing...", language)}
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
                        <span className="font-mono text-xs dark:text-slate-400 text-slate-500">{translate("Audit Report", language)} #{selectedTx.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTx.verdict === "Auto-Approved" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20" 
                            : selectedTx.verdict === "Flagged for Review" 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" 
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}>
                          {translate(selectedTx.verdict, language)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mt-2">{selectedTx.vendor_name}</h3>
                      <p className="text-2xl font-black mt-2 text-teal-500">{formatINR(selectedTx.amount)}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y dark:border-slate-800 border-slate-200 text-xs">
                      <div>
                        <p className="dark:text-slate-400 text-slate-500">{translate("Employee", language)}</p>
                        <p className="font-semibold mt-0.5">{selectedTx.employee_name}</p>
                        <p className="text-[10px] dark:text-slate-400 text-slate-500 truncate">{selectedTx.employee_department}</p>
                      </div>
                      <div>
                        <p className="dark:text-slate-400 text-slate-500">{translate("Date Filed", language)}</p>
                        <p className="font-semibold mt-0.5">{selectedTx.date}</p>
                      </div>
                      <div>
                        <p className="dark:text-slate-400 text-slate-500">{translate("Category", language)}</p>
                        <p className="font-semibold mt-0.5">{translate(selectedTx.category, language)}</p>
                      </div>
                      <div>
                        <p className="dark:text-slate-400 text-slate-500">{translate("GSTIN Status", language)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          selectedTx.vendor_gstin_status === "Verified" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20" 
                            : selectedTx.vendor_gstin_status === "Unverified" 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" 
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}>
                          {translate(selectedTx.vendor_gstin_status, language)}
                        </span>
                      </div>
                    </div>

                    {/* Multi-Agent Reasoning Trail */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider dark:text-slate-400 text-slate-500">{translate("AI Agent Audit Trail", language)}</h4>
                      
                      {selectedTx.reasoning_trail ? (
                        <div className="space-y-3">
                          {/* 1. Intake */}
                          <div className="p-3 rounded-lg dark:bg-slate-900/40 bg-slate-50 border dark:border-slate-800 border-slate-200 text-xs shadow-sm">
                            <div className="flex justify-between items-center font-bold">
                              <span>📥 {translate("Intake Agent", language)}</span>
                              <span className="text-emerald-500 text-[10px]">{translate("SUCCESS", language)}</span>
                            </div>
                            <p className="dark:text-slate-400 text-slate-600 mt-1 text-[11px]">
                              {translate("Successfully parsed invoice image. Vendor name, date, category and amount verified.", language)}
                            </p>
                          </div>

                          {/* 2. Compliance */}
                          <div className="p-3 rounded-lg dark:bg-slate-900/40 bg-slate-50 border dark:border-slate-800 border-slate-200 text-xs shadow-sm">
                            <div className="flex justify-between items-center font-bold">
                              <span>⚖️ {translate("Compliance Agent", language)}</span>
                              {selectedTx.reasoning_trail.compliance?.flags?.length > 0 ? (
                                <span className="text-amber-500 text-[10px]">{translate("VIOLATION", language)}</span>
                              ) : (
                                <span className="text-emerald-500 text-[10px]">{translate("PASSED", language)}</span>
                              )}
                            </div>
                            <p className="dark:text-slate-400 text-slate-600 mt-1 text-[11px]">
                              {translate(selectedTx.reasoning_trail.compliance?.message || "Policy check completed.", language)}
                            </p>
                          </div>

                          {/* 3. Fraud */}
                          <div className="p-3 rounded-lg dark:bg-slate-900/40 bg-slate-50 border dark:border-slate-800 border-slate-200 text-xs shadow-sm">
                            <div className="flex justify-between items-center font-bold">
                              <span>🕵️ {translate("Fraud Detection Agent", language)}</span>
                              {selectedTx.reasoning_trail.fraud?.duplicate_risk === "High" || selectedTx.reasoning_trail.fraud?.collusion_risk === "High" ? (
                                <span className="text-rose-500 text-[10px]">{translate("SUSPICIOUS", language)}</span>
                              ) : (
                                <span className="text-emerald-500 text-[10px]">{translate("PASSED", language)}</span>
                              )}
                            </div>
                            <div className="dark:text-slate-400 text-slate-600 mt-1 text-[11px] space-y-1">
                              <p>{translate("Duplicate Risk:", language)} <b>{translate(selectedTx.reasoning_trail.fraud?.duplicate_risk, language)}</b></p>
                              <p>{translate("Collusion Risk:", language)} <b>{translate(selectedTx.reasoning_trail.fraud?.collusion_risk, language)}</b></p>
                              {selectedTx.reasoning_trail.fraud?.flags?.map((flag, idx) => (
                                <p key={idx} className="text-rose-500 dark:text-rose-450 mt-1">{translate(flag, language)}</p>
                              ))}
                            </div>
                          </div>

                          {/* 4. Vendor */}
                          <div className="p-3 rounded-lg dark:bg-slate-900/40 bg-slate-50 border dark:border-slate-800 border-slate-200 text-xs shadow-sm">
                            <div className="flex justify-between items-center font-bold">
                              <span>🏢 {translate("Vendor Verification Agent", language)}</span>
                              <span className={selectedTx.vendor_gstin_status === "Verified" ? "text-emerald-500 text-[10px]" : "text-rose-500 text-[10px]"}>
                                {translate(selectedTx.vendor_gstin_status.toUpperCase(), language)}
                              </span>
                            </div>
                            <p className="dark:text-slate-400 text-slate-600 mt-1 text-[11px]">
                              GSTIN: <span className="font-mono">{selectedTx.vendor_gstin}</span>. {translate(selectedTx.reasoning_trail.vendor?.message, language)}
                            </p>
                          </div>

                          {/* 5. Final Verdict */}
                          <div className="p-3 rounded-lg dark:bg-teal-950/20 bg-teal-50/40 border dark:border-teal-500/30 border-teal-200/50 text-xs">
                            <div className="font-bold dark:text-teal-400 text-teal-700 flex items-center gap-1">
                              <span>🤖 {translate("Lead Orchestrator Agent Verdict", language)}</span>
                            </div>
                            <p className="dark:text-teal-100 text-teal-900 font-semibold mt-1 text-[11px]">
                              {translate(selectedTx.reasoning_trail.final_verdict?.reasoning || selectedTx.verdict, language)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs dark:text-slate-400 text-slate-500 italic">{translate("No detailed reasoning trail found.", language)}</p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center h-[calc(100vh-12rem)] ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                    <FileText className="w-12 h-12 text-slate-500 mb-3" />
                    <p className="text-sm font-semibold">{translate("No Transaction Selected", language)}</p>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 max-w-[200px]">{translate("Select a receipt card from the audit queue to inspect agent audit details.", language)}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "graph" && <CollusionGraph language={language} isDarkMode={isDarkMode} />}

          {activeTab === "whatsapp" && (
            <div className="max-w-md mx-auto">
              <div className={`rounded-2xl border overflow-hidden flex flex-col h-[calc(100vh-14rem)] ${isDarkMode ? "bg-[#0b141a] border-slate-800" : "bg-white border-slate-200"}`}>
                
                {/* Simulated Header */}
                <div className="dark:bg-[#202c33] bg-[#00a884] p-4 text-white flex items-center justify-between border-b dark:border-slate-900/60 border-emerald-600/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-800 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-white">
                      FL
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{translate("FraudLens Intake Bot", language)}</h3>
                      <p className="text-[10px] opacity-75">{translate("Active Agent Pipeline", language)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#53bdeb] inline-block animate-pulse"></span>
                    <span className="text-[10px] text-white/90 font-medium font-sans capitalize">{translate("online", language)}</span>
                  </div>
                </div>

                {/* Sender Settings Row */}
                <div className="p-3 border-b dark:bg-[#111b21] bg-[#f0f2f5] dark:border-slate-900 border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="dark:text-slate-300 text-slate-600 font-medium">{translate("Sending as Employee:", language)}</span>
                  <select 
                    value={waEmployee} 
                    onChange={(e) => setWaEmployee(e.target.value)}
                    className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded px-2 py-1 dark:text-slate-100 text-slate-800"
                  >
                    <option value="Aarav Mehta">Aarav Mehta ({translate("Engineering", language)})</option>
                    <option value="Diya Sharma">Diya Sharma ({translate("Sales", language)})</option>
                    <option value="Ishaan Patel">Ishaan Patel ({translate("Finance", language)})</option>
                    <option value="Kabir Rao">Kabir Rao ({translate("Operations", language)})</option>
                    <option value="Arjun Gupta">Arjun Gupta ({translate("Marketing", language)})</option>
                  </select>
                </div>

                {/* Message Log */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 dark:bg-[#0b141a] bg-[#efeae2] relative">
                  {waMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-xs ${
                        msg.sender === "user" 
                          ? "dark:bg-[#005c4b] bg-[#d9fdd3] dark:text-slate-100 text-[#111b21] rounded-tr-none shadow-xs border dark:border-transparent border-emerald-200/40" 
                          : msg.sender === "system" 
                            ? "dark:bg-[#182229] bg-[#ffeecd] dark:text-amber-300 text-amber-900 border dark:border-[#182229] border-amber-200/40 px-3 py-1.5 rounded-lg shadow-sm text-center mx-auto font-medium"
                            : "dark:bg-[#202c33] bg-white dark:text-slate-100 text-[#111b21] rounded-tl-none whitespace-pre-wrap border dark:border-slate-800/60 border-slate-200 shadow-xs"
                      }`}>
                        {translate(msg.text, language)}
                        {msg.txId && (
                          <button 
                            onClick={() => { setSelectedTxId(msg.txId); setActiveTab("transactions"); }}
                            className="block font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mt-2 hover:underline"
                          >
                            {translate("Inspect Audit Details →", language)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isWaTyping && (
                    <div className="flex justify-start">
                      <div className="dark:bg-[#202c33] bg-white border dark:border-slate-800/60 border-slate-200 rounded-lg p-3 text-xs rounded-tl-none text-slate-500 dark:text-slate-400 italic shadow-xs">
                        {translate("FraudLens bot is auditing...", language)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-made Ingestion templates */}
                <div className="p-3 dark:bg-[#111b21] bg-[#f0f2f5] border-t dark:border-[#2a3942]/60 border-slate-200 space-y-2">
                  <p className="text-[10px] dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">{translate("Or Select a demo receipt template:", language)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button 
                      onClick={() => sendWaMessage("Forwarding Indigo Airlines ticket of 28499 INR for business trip to Mumbai.")}
                      className="dark:bg-[#202c33] bg-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border dark:border-slate-800 border-slate-200/80 dark:text-slate-200 text-slate-700 text-[10px] px-2.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      {language === "HI" ? "इंडिगो टिकट (28,499 रुपये)" : "Indigo Ticket (28,499 INR)"}
                    </button>
                    <button 
                      onClick={() => sendWaMessage("Lunch receipt at Dhaba Express of 4500 INR.")}
                      className="dark:bg-[#202c33] bg-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border dark:border-slate-800 border-slate-200/80 dark:text-slate-200 text-slate-700 text-[10px] px-2.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      {language === "HI" ? "ढाबा लंच (4,500 रुपये)" : "Dhaba Lunch (4,500 INR)"}
                    </button>
                    <button 
                      onClick={() => sendWaMessage("Consulting invoice from Apex Consulting Services for 145000 INR.")}
                      className="dark:bg-[#202c33] bg-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border dark:border-slate-800 border-slate-200/80 dark:text-slate-200 text-slate-700 text-[10px] px-2.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      {language === "HI" ? "एपेक्स इनवॉइस (145,000 रुपये)" : "Apex Inv (145,000 INR)"}
                    </button>
                  </div>
                </div>

                {/* Input Bar */}
                <div className="p-3 dark:bg-[#111b21] bg-[#f0f2f5] border-t dark:border-[#2a3942]/60 border-slate-200 flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder={translate("Type transaction detail...", language)} 
                    value={waText}
                    onChange={(e) => setWaText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendWaMessage()}
                    className="flex-1 dark:bg-[#2a3942] bg-white border-none rounded-lg px-3 py-2 text-xs dark:text-slate-100 text-[#111b21] dark:placeholder-slate-400 placeholder-slate-500 outline-none shadow-xs focus:ring-1 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={() => sendWaMessage()}
                    className="bg-[#00a884] hover:bg-[#019373] text-white rounded-full w-9 h-9 flex items-center justify-center shadow-xs transition shrink-0"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" className="fill-current"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="text-lg font-bold">{translate("Category Audit Policies", language)}</h3>
                <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">{translate("Configure absolute spend limits and automated approval thresholds for each expense category. Violating transactions are automatically flagged or rejected by the Compliance Agent.", language)}</p>
                
                {policyMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                    {translate(policyMessage, language)}
                  </div>
                )}

                <div className="mt-6 space-y-6 divide-y dark:divide-slate-800/30 divide-slate-200">
                  {policies.map((p) => (
                    <PolicyRow 
                      key={p.id} 
                      policy={p} 
                      onSave={handleUpdatePolicy} 
                      isDarkMode={isDarkMode} 
                      language={language}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-lg mx-auto">
              <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="text-lg font-bold mb-4">{translate("Manual Receipt Upload", language)}</h3>
                
                {uploadSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg mb-4">
                    {translate(uploadSuccess, language)}
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block dark:text-slate-400 text-slate-500 mb-1">{translate("Vendor Name", language)}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Indigo Airlines" 
                      value={uploadVendor}
                      onChange={(e) => setUploadVendor(e.target.value)}
                      className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-2 dark:text-slate-100 text-slate-800 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block dark:text-slate-400 text-slate-500 mb-1">{translate("Amount (INR)", language)}</label>
                      <input 
                        type="number" 
                        required
                        placeholder="e.g. 4500" 
                        value={uploadAmount}
                        onChange={(e) => setUploadAmount(e.target.value)}
                        className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-2 dark:text-slate-100 text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block dark:text-slate-400 text-slate-500 mb-1">{translate("Date", language)}</label>
                      <input 
                        type="date" 
                        required
                        value={uploadDate}
                        onChange={(e) => setUploadDate(e.target.value)}
                        className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-2 dark:text-slate-100 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block dark:text-slate-400 text-slate-500 mb-1">{translate("Category", language)}</label>
                      <select 
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-2 dark:text-slate-100 text-slate-800 outline-none"
                      >
                        {Object.keys(CATEGORIES).map(c => (
                          <option key={c} value={c}>{translate(c, language)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block dark:text-slate-400 text-slate-500 mb-1">{translate("Vendor GSTIN (Optional)", language)}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 27AAPCS1234A1Z5" 
                        value={uploadGstin}
                        onChange={(e) => setUploadGstin(e.target.value)}
                        className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-2 dark:text-slate-100 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2.5 font-semibold text-xs transition"
                    >
                      {isUploading ? translate("Auditing via AI Agents...", language) : translate("Submit Receipt & Run Audit", language)}
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
function PolicyRow({ policy, onSave, isDarkMode, language }) {
  const [max, setMax] = useState(policy.max_amount);
  const [threshold, setThreshold] = useState(policy.approval_threshold);

  return (
    <div className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
      <div className="font-semibold text-sm w-32">{translate(policy.category, language)}</div>
      
      <div className="flex gap-4 flex-1 w-full md:w-auto">
        <div className="flex-1">
          <label className="block dark:text-slate-400 text-slate-500 text-[10px] mb-1">{translate("Absolute Max Limit (INR)", language)}</label>
          <input 
            type="number" 
            value={max}
            onChange={(e) => setMax(parseFloat(e.target.value))}
            className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-1.5 dark:text-slate-100 text-slate-800 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block dark:text-slate-400 text-slate-500 text-[10px] mb-1">{translate("Approval Threshold (INR)", language)}</label>
          <input 
            type="number" 
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-1.5 dark:text-slate-100 text-slate-800 outline-none"
          />
        </div>
      </div>

      <button 
        onClick={() => onSave(policy.category, max, threshold)}
        className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-semibold shadow-xs shrink-0 self-end md:self-auto"
      >
        {translate("Save Policy", language)}
      </button>
    </div>
  );
}
// Sub-component: Collusion Network Graph (SVG force-directed layout)
function CollusionGraph({ language, isDarkMode }) {
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
        <div className="p-4 rounded-xl border dark:bg-slate-900/40 bg-slate-50 dark:border-slate-800 border-slate-200/80 space-y-2">
          <p className="font-semibold text-teal-600 dark:text-teal-400">{translate("Node Legend", language)}</p>
          <div className="flex gap-4 items-center mt-1">
            <span className="flex items-center gap-1.5 dark:text-slate-300 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-teal-600 inline-block"></span>
              {translate("Employee", language)}
            </span>
            <span className="flex items-center gap-1.5 dark:text-slate-300 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block"></span>
              {translate("Verified Vendor", language)}
            </span>
            <span className="flex items-center gap-1.5 dark:text-slate-300 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 inline-block"></span>
              {translate("Invalid/Suspicious Vendor", language)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border dark:bg-slate-900/40 bg-slate-50 dark:border-slate-800 border-slate-200/80 space-y-2">
          <p className="font-semibold text-amber-600 dark:text-amber-500">{translate("Connection Types", language)}</p>
          <div className="flex gap-4 items-center mt-1 text-slate-700 dark:text-slate-350">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-6 bg-slate-400 dark:bg-slate-600 inline-block"></span>
              {translate("Standard Expense", language)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-6 bg-rose-500 inline-block"></span>
              {translate("High Collusion Risk (Thick/Red)", language)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border dark:bg-slate-900/40 bg-slate-50 dark:border-slate-800 border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="font-semibold dark:text-slate-300 text-slate-700">{translate("Interactive Controls", language)}</p>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-1">{translate("Drag nodes to rearrange or pull nodes apart to visually inspect transaction paths.", language)}</p>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[500px] border dark:border-slate-800 border-slate-200 rounded-xl relative overflow-hidden dark:bg-[#070A11] bg-slate-50 cursor-grab active:cursor-grabbing"
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
                  stroke={edge.suspicious ? "#F43F5E" : (isDarkMode ? "#475569" : "#94A3B8")} 
                  strokeWidth={edge.suspicious ? 3 : Math.min(1 + edge.tx_count * 0.5, 4)} 
                  opacity={edge.suspicious ? 0.9 : 0.4}
                />
                {/* Weight badge in center of line */}
                {edge.tx_count > 2 && (
                  <g transform={`translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`}>
                    <rect x="-12" y="-8" width="24" height="15" rx="3" fill={isDarkMode ? "#0B0F19" : "#FFFFFF"} stroke={isDarkMode ? "#334155" : "#CBD5E1"} strokeWidth="1" />
                    <text textAnchor="middle" y="3" fontSize="9px" className="dark:fill-slate-400 fill-slate-650 font-semibold">{edge.tx_count}</text>
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
              color = node.gstin_status === "Invalid" ? "fill-rose-600" : "fill-indigo-600";
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
                  className={`${color} dark:stroke-[#0B0F19] stroke-white stroke-2 shadow-lg cursor-pointer hover:stroke-teal-400 transition-colors`} 
                />
                
                {/* Label text */}
                <text 
                  y={isVendor ? -18 : 22} 
                  textAnchor="middle" 
                  fontSize="10px" 
                  className="dark:fill-slate-200 fill-slate-800 font-semibold font-sans"
                  style={isDarkMode ? { textShadow: "0 1px 2px rgba(0,0,0,0.8)" } : { textShadow: "0 1px 1px rgba(255,255,255,0.8)" }}
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
