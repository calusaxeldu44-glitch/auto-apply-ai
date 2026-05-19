"use client";

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useDropzone } from "react-dropzone";
import {
  Sparkles,
  Lock,
  Unlock,
  Key,
  FileText,
  Mail,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  Layers,
  Send,
  User,
  RefreshCw,
  UploadCloud,
  FileCheck
} from "lucide-react";

// Pre-filled sample data for instant verification/test
const SAMPLE_DATA = {
  resume: `Alex Mercer
alex.mercer@email.com | (555) 019-2834 | San Francisco, CA
github.com/alexmercer | linkedin.com/in/alexmercer

SUMMARY
Passionate Software Engineer with 2+ years of experience building scalable web applications. Proficient in React, Next.js, Node.js, and TypeScript, with a strong focus on performance and clean code.

EXPERIENCE
Frontend Engineer | TechVibe Solutions (2024 - Present)
- Re-architected core dashboard using Next.js, improving page load speeds by 40% and SEO rankings.
- Developed and maintained a reusable Tailwind CSS component library used by 3 cross-functional teams.
- Integrated Gemini API to power smart-search features, increasing user engagement by 25%.

Software Engineering Intern | CloudScale Systems (Summer 2023)
- Developed RESTful APIs using Node.js and Express, serving over 10,000 daily active users.
- Implemented unit tests with Jest, achieving 90% test coverage for critical payment workflows.

EDUCATION
B.S. in Computer Science | Stanford University (Graduated 2024)`,

  baseCoverLetter: `Dear Hiring Team,

I am writing to express my enthusiastic interest in the Software Engineer position. With a solid foundation in Computer Science from Stanford University and practical experience building high-performance web applications using React, TypeScript, and Next.js, I am confident in my ability to contribute effectively from day one.

During my time at TechVibe Solutions, I successfully optimized asset loading and implemented responsive designs with Tailwind CSS. I enjoy solving complex engineering challenges and creating modern, user-friendly interfaces that drive engagement.

I admire your commitment to innovation and would love the opportunity to discuss how my technical skills and passion for frontend excellence can help your team achieve its goals.

Sincerely,
Alex Mercer`,
  companyTarget: "Vercel (vercel.com)",
  appType: "job" as const,
  specificDemands: "Emphasize my passion for developer tooling, speed, and my hands-on experience migrating systems to Next.js.",
  hrEmail: "careers@vercel.com"
};

// Client-side text extraction helper with dynamic imports to avoid SSR ReferenceErrors
const extractText = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = () => reject(new Error("Failed to read text file."));
      reader.readAsText(file);
    });
  }

  if (extension === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamically import mammoth to keep build server node execution safe
    // @ts-ignore
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamically import pdfjs-dist to bypass SSR window undefined checks
    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");
    
    // Configure worker CDN matching the local package version
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }

  if (extension === "doc") {
    throw new Error("Legacy Word (.doc) files are not supported client-side. Please save as .docx or copy-paste text directly.");
  }

  throw new Error("Unsupported file format. Please upload a .pdf, .docx, or .txt file.");
};

interface FileUploadZoneProps {
  onFileExtracted: (text: string, filename: string) => void;
  onError: (error: string) => void;
  label: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileExtracted, onError, label }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setIsParsing(true);
      setUploadedName(null);
      try {
        const text = await extractText(file);
        if (!text || text.trim() === "") {
          throw new Error("Extracted text is empty. Ensure the file contains selectable text (not scanned images).");
        }
        onFileExtracted(text, file.name);
        setUploadedName(file.name);
      } catch (err: any) {
        console.error(err);
        onError(err.message || "Error parsing document.");
      } finally {
        setIsParsing(false);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/msword": [".doc"]
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
        isDragActive
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
          : "border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-900/30"
      }`}
    >
      <input {...getInputProps()} />
      {isParsing ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold text-indigo-300 animate-pulse">Extracting text...</span>
        </div>
      ) : uploadedName ? (
        <div className="flex items-center justify-center gap-2 py-1 text-emerald-400 font-medium">
          <FileCheck className="h-4.5 w-4.5 shrink-0" />
          <span className="text-xs truncate max-w-[240px]" title={uploadedName}>
            Loaded: {uploadedName}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-300">
          <div className="flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold">Drop or Upload {label}</span>
          </div>
          <span className="text-[10px] text-slate-650">PDF, DOCX, or TXT</span>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  // Input Form States
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);

  const [resume, setResume] = useState<string>("");
  const [baseCoverLetter, setBaseCoverLetter] = useState<string>("");
  const [companyTarget, setCompanyTarget] = useState<string>("");
  const [appType, setAppType] = useState<"job" | "internship">("job");
  const [specificDemands, setSpecificDemands] = useState<string>("");
  const [hrEmail, setHrEmail] = useState<string>("");

  // Output States
  const [emailBody, setEmailBody] = useState<string>("");
  const [adaptedCoverLetter, setAdaptedCoverLetter] = useState<string>("");
  const [similarCompanies, setSimilarCompanies] = useState<string[]>([]);
  const [candidateName, setCandidateName] = useState<string>("");

  // System States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [activeTab, setActiveTab] = useState<"email" | "letter">("email");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load from localStorage on mount (safe hydration)
  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
    setGeminiKey(savedKey);
    if (savedKey) {
      setIsKeySaved(true);
    }

    const savedResume = localStorage.getItem("AUTO_APPLY_RESUME") || "";
    const savedBaseLetter = localStorage.getItem("AUTO_APPLY_BASE_LETTER") || "";
    if (savedResume) setResume(savedResume);
    if (savedBaseLetter) setBaseCoverLetter(savedBaseLetter);
  }, []);

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGeminiKey(val);
    if (val) {
      localStorage.setItem("GEMINI_API_KEY", val);
      setIsKeySaved(true);
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
      setIsKeySaved(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setResume(val);
    localStorage.setItem("AUTO_APPLY_RESUME", val);
  };

  const handleBaseLetterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBaseCoverLetter(val);
    localStorage.setItem("AUTO_APPLY_BASE_LETTER", val);
  };

  const loadSampleData = () => {
    setResume(SAMPLE_DATA.resume);
    setBaseCoverLetter(SAMPLE_DATA.baseCoverLetter);
    setCompanyTarget(SAMPLE_DATA.companyTarget);
    setAppType(SAMPLE_DATA.appType);
    setSpecificDemands(SAMPLE_DATA.specificDemands);
    setHrEmail(SAMPLE_DATA.hrEmail);

    localStorage.setItem("AUTO_APPLY_RESUME", SAMPLE_DATA.resume);
    localStorage.setItem("AUTO_APPLY_BASE_LETTER", SAMPLE_DATA.baseCoverLetter);
    setToast({ message: "Loaded sample profile data.", type: "success" });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const showToastError = (msg: string) => {
    setToast({ message: msg, type: "error" });
  };

  const generateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey) {
      setError("Please provide a valid Gemini API Key first.");
      showToastError("Missing Gemini API Key.");
      return;
    }
    if (!resume || !companyTarget) {
      setError("Resume and Company Target are required to customize your application.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep("Initializing Gemini Engine...");

    try {
      // Simulate progressive steps to improve perceived user experience
      setTimeout(() => setLoadingStep("Analyzing Target Company & Industry..."), 1200);
      setTimeout(() => setLoadingStep("Scanning Resume & Base Cover Letter..."), 2400);
      setTimeout(() => setLoadingStep("Drafting Tailored Pitch & Recommendations..."), 4000);

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const prompt = `
You are a top-tier recruiter and career branding specialist.
Analyze the following Target Company, and cross-reference the candidate's Resume and Base Cover Letter to generate a highly compelling, custom-tailored application.

1. **Target Company / URL**: "${companyTarget}"
2. **Application Type**: "${appType === "internship" ? "Internship" : "Full-Time Job"}"
3. **Specific Demands / User Focus Notes**: "${specificDemands || "None provided"}"
4. **Candidate Resume**:
${resume}

5. **Base Cover Letter**:
${baseCoverLetter || "None provided. Write a customized cover letter from scratch based on the resume details."}

Please output a JSON response containing:
1. "candidate_name": The full name of the candidate extracted from the Resume. If not found or ambiguous, return "Candidate".
2. "email_body": A short, high-impact introductory email to the recruiter/HR contact (100-150 words). Make it engaging, professional, and clear.
3. "adapted_cover_letter": A beautifully structured, persuasive cover letter (250-400 words) aligning the candidate's core accomplishments with the company's industry position, product ethos, or corporate mission. Integrate specific demands naturally.
4. "similar_companies": An array of 3 to 5 similar companies in the same industry space that the candidate could target.

Format the output strictly as JSON matching the schema below:
{
  "candidate_name": "string",
  "email_body": "string",
  "adapted_cover_letter": "string",
  "similar_companies": ["string"]
}
`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              candidate_name: { type: SchemaType.STRING },
              email_body: { type: SchemaType.STRING },
              adapted_cover_letter: { type: SchemaType.STRING },
              similar_companies: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              }
            },
            required: ["candidate_name", "email_body", "adapted_cover_letter", "similar_companies"]
          }
        }
      });

      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      setCandidateName(parsedData.candidate_name || "Candidate");
      setEmailBody(parsedData.email_body || "");
      setAdaptedCoverLetter(parsedData.adapted_cover_letter || "");
      setSimilarCompanies(parsedData.similar_companies || []);
      setActiveTab("email");
      setToast({ message: "Successfully generated application drafts!", type: "success" });
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "An unexpected error occurred while communicating with Gemini. Please verify your API Key and try again."
      );
      showToastError("Generation failed. Check key & logs.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const triggerMailTo = () => {
    const to = hrEmail.trim();
    const typeLabel = appType === "internship" ? "Internship" : "Job";
    const nameLabel = candidateName.trim() || "Applicant";
    const subject = `Application for ${typeLabel} - ${nameLabel}`;

    const divider = "\r\n\r\n---------------------------------------------\r\nADAPTED COVER LETTER:\r\n---------------------------------------------\r\n\r\n";
    const fullBody = emailBody + divider + adaptedCoverLetter;
    
    const formattedBody = fullBody.replace(/\r?\n/g, "\r\n");
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;
    
    window.location.href = mailtoUrl;
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Toast Notifications */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-float transition-all duration-300 bg-slate-950/90 border-slate-800 max-w-sm">
          {toast.type === "error" ? (
            <AlertCircle className="h-4.5 w-4.5 text-rose-450 shrink-0" />
          ) : (
            <FileCheck className="h-4.5 w-4.5 text-emerald-450 shrink-0" />
          )}
          <span className={`text-xs font-semibold ${toast.type === "error" ? "text-rose-205" : "text-emerald-205"}`}>
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 ml-2 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* HEADER SECTION A */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Auto-Apply AI
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                Ultra-Lean Client Edition
              </p>
            </div>
          </div>

          {/* Settings / API Key */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 gap-2 max-w-[280px] sm:max-w-xs transition-all focus-within:border-indigo-500/50">
              <Key className="h-4 w-4 text-indigo-400 shrink-0" />
              <input
                type={showKey ? "text" : "password"}
                placeholder="Enter Gemini API Key..."
                value={geminiKey}
                onChange={handleKeyChange}
                className="bg-transparent text-sm w-full focus:outline-none text-slate-200 placeholder-slate-500"
                id="gemini_key_input"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showKey ? "Hide Key" : "Show Key"}
              >
                {showKey ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </button>
              {isKeySaved && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Key stored in browser" />
              )}
            </div>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-all font-medium"
            >
              Get Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        {/* Help text on Mobile */}
        <div className="sm:hidden text-center pb-2 bg-slate-950/60 border-b border-slate-900">
          <p className="text-[11px] text-slate-500">
            Secure client-only storage. Get your key at{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline"
            >
              Google AI Studio
            </a>.
          </p>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* SECTION B: INPUT FORM (Left Column) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md relative flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-indigo-400" />
                <h2 className="text-base font-semibold text-slate-200">
                  Target & Profile Inputs
                </h2>
              </div>
              <button
                type="button"
                onClick={loadSampleData}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 border border-indigo-500/15 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Load Sample
              </button>
            </div>

            <form onSubmit={generateApplication} className="flex flex-col gap-4">
              {/* Resume text and dropzone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" /> Resume / CV (Text)*
                  </span>
                </label>
                {/* PDF/Word Drag and Drop Area */}
                <FileUploadZone
                  onFileExtracted={(text, name) => {
                    setResume(text);
                    localStorage.setItem("AUTO_APPLY_RESUME", text);
                    setToast({ message: `Successfully loaded resume from ${name}`, type: "success" });
                  }}
                  onError={showToastError}
                  label="Resume"
                />
                <textarea
                  placeholder="Paste your plain text resume here or upload a document above..."
                  value={resume}
                  onChange={handleResumeChange}
                  rows={5}
                  className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-900/50 resize-y"
                  required
                />
              </div>

              {/* Base Cover Letter and dropzone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" /> Base Cover Letter (Optional)
                  </span>
                </label>
                {/* PDF/Word Drag and Drop Area */}
                <FileUploadZone
                  onFileExtracted={(text, name) => {
                    setBaseCoverLetter(text);
                    localStorage.setItem("AUTO_APPLY_BASE_LETTER", text);
                    setToast({ message: `Successfully loaded base cover letter from ${name}`, type: "success" });
                  }}
                  onError={showToastError}
                  label="Cover Letter"
                />
                <textarea
                  placeholder="Paste cover letter or upload document. Gemini will adapt it, or write one from scratch if left empty..."
                  value={baseCoverLetter}
                  onChange={handleBaseLetterChange}
                  rows={3}
                  className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-900/50 resize-y"
                />
              </div>

              {/* Company & URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Company Target*
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vercel (vercel.com) or Linear"
                  value={companyTarget}
                  onChange={(e) => setCompanyTarget(e.target.value)}
                  className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-900/50"
                  required
                />
              </div>

              {/* App Type & Recruiter Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Application Type
                  </label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as "job" | "internship")}
                    className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:bg-slate-900/50 cursor-pointer appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="job" className="bg-slate-950">Job</option>
                    <option value="internship" className="bg-slate-950">Internship</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-indigo-400" /> HR/Recruiter Email
                  </label>
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={hrEmail}
                    onChange={(e) => setHrEmail(e.target.value)}
                    className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-900/50"
                  />
                </div>
              </div>

              {/* Specific Demands */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-indigo-400" /> Specific Demands / Focus
                </label>
                <textarea
                  placeholder="e.g. Highlight leadership skills, state availability from June, or mention a referral..."
                  value={specificDemands}
                  onChange={(e) => setSpecificDemands(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-900/50 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-955/20 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300 leading-normal">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !geminiKey || !resume || !companyTarget}
                className={`w-full relative overflow-hidden group py-3 rounded-xl font-medium text-sm transition-all duration-305 flex items-center justify-center gap-2 border ${
                  !geminiKey
                    ? "bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed"
                    : !resume || !companyTarget
                    ? "bg-slate-900/45 border-slate-800 text-indigo-400/55 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99] cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating Pitch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-12" />
                    <span>Generate Application</span>
                  </>
                )}
              </button>

              {!geminiKey && (
                <p className="text-[10px] text-center text-slate-500 mt-1">
                  * Provide a Gemini API Key in the header to unlock generation.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* SECTION C: OUTPUT DISPLAY (Right Column) */}
        <div className="lg:col-span-7 flex flex-col min-h-[480px]">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex-1 bg-slate-950/30 border border-slate-900/50 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-center items-center text-center gap-6 min-h-[500px] shadow-2xl">
              {/* Spinner/Glow container */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md animate-ping" />
                <div className="relative p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 animate-bounce">
                  <Sparkles className="h-8 w-8 text-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-slate-200">
                  AI Adaptation Engine Active
                </h3>
                <p className="text-xs text-indigo-300 font-mono animate-pulse">
                  {loadingStep}
                </p>
              </div>
              {/* Fake Skeleton Bars */}
              <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
                <div className="h-3.5 bg-slate-900 rounded-full w-3/4 animate-pulse self-center" />
                <div className="h-3 bg-slate-900/80 rounded-full w-full animate-pulse" />
                <div className="h-3 bg-slate-900/80 rounded-full w-5/6 animate-pulse self-center" />
                <div className="h-3 bg-slate-900/80 rounded-full w-4/5 animate-pulse" />
              </div>
            </div>
          )}

          {/* Idle / Initial State */}
          {!isLoading && !emailBody && !adaptedCoverLetter && (
            <div className="flex-1 bg-slate-950/20 border border-slate-900/80 border-dashed rounded-2xl p-8 backdrop-blur-md flex flex-col justify-center items-center text-center gap-4 min-h-[500px] animate-float">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <Mail className="h-7 w-7 text-indigo-400" />
              </div>
              <div className="max-w-xs flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-slate-200">
                  No Application Drafted Yet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your credentials and target criteria on the left, then click <strong>Generate Application</strong> to craft your custom pitch.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-650 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <span>Zero Backend Logs</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <span>100% Free-to-Host</span>
              </div>
            </div>
          )}

          {/* Render Output Form (Active State) */}
          {!isLoading && (emailBody || adaptedCoverLetter) && (
            <div className="flex-1 bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-5 justify-between shadow-xl">
              <div className="flex flex-col gap-4">
                {/* Tabs & Meta Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-900 gap-3">
                  <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 shrink-0 self-start">
                    <button
                      type="button"
                      onClick={() => setActiveTab("email")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "email"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Send className="h-3 w-3" /> Email Intro
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("letter")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "letter"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <FileText className="h-3 w-3" /> Tailored Cover Letter
                    </button>
                  </div>

                  {candidateName && (
                    <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-xl self-end">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[11px] font-semibold text-slate-300">
                        Candidate: {candidateName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Active Tab Textarea Display */}
                {activeTab === "email" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                        Email Body
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(emailBody, "email")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === "email" ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={8}
                      className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:bg-slate-900/50 resize-y"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                        Adapted Cover Letter
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(adaptedCoverLetter, "letter")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === "letter" ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={adaptedCoverLetter}
                      onChange={(e) => setAdaptedCoverLetter(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-900/30 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:bg-slate-900/50 resize-y"
                    />
                  </div>
                )}

                {/* Similar Companies Suggestion */}
                {similarCompanies && similarCompanies.length > 0 && (
                  <div className="flex flex-col gap-2 bg-slate-900/20 border border-slate-900/50 rounded-xl p-3.5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Similar Targets to Consider:
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {similarCompanies.map((company, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/search?q=${encodeURIComponent(company + " careers")}`,
                              "_blank"
                            )
                          }
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 border border-slate-850 hover:border-indigo-500/50 hover:bg-slate-850 rounded-lg text-slate-300 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          title="Search Careers on Google"
                        >
                          {company} <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Open in my email */}
              <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={triggerMailTo}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.99] cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Open in My Email</span>
                </button>
                <div className="flex justify-between items-center text-[10px] text-slate-555 font-mono px-1">
                  <span>HR Email: {hrEmail ? hrEmail : "(None provided - fill on form)"}</span>
                  <span>Subject: Application for {appType === "internship" ? "Internship" : "Job"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-950 py-4 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 Auto-Apply AI. All computations happen in your browser.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition-colors">100% Client-Side</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">GDPR compliant (BYOK)</span>
            <span>•</span>
            <a
              href="https://github.com/google/generative-ai-js"
              className="text-indigo-400/80 hover:text-indigo-400 hover:underline transition-all"
              target="_blank"
              rel="noreferrer"
            >
              Gemini SDK
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
