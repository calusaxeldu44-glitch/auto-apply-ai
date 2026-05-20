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
  Upload,
  FileCheck
} from "lucide-react";

// Pre-filled sample data for verification
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

// Client-side text extraction helper
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
    // @ts-ignore
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");
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
    throw new Error("Legacy .doc files not supported. Save as .docx or copy-paste text.");
  }

  throw new Error("Unsupported format. Use .pdf, .docx, or .txt.");
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
          throw new Error("File appears to be empty or lacks selectable text.");
        }
        onFileExtracted(text, file.name);
        setUploadedName(file.name);
      } catch (err: any) {
        console.error(err);
        onError(err.message || "Error parsing file.");
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
      className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-zinc-300 bg-zinc-900/50"
          : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/20"
      }`}
    >
      <input {...getInputProps()} />
      {isParsing ? (
        <div className="flex items-center justify-center gap-2 py-0.5">
          <svg className="animate-spin h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Parsing...</span>
        </div>
      ) : uploadedName ? (
        <div className="flex items-center justify-center gap-2 py-0.5 text-zinc-300 font-mono text-[11px]">
          <FileCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate max-w-[200px]">{uploadedName}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 py-0.5">
          <Upload className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[11px] font-mono uppercase tracking-wider">Upload {label}</span>
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

  // Load from localStorage on mount
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
      const timer = setTimeout(() => setToast(null), 4000);
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
    setToast({ message: "Loaded sample data.", type: "success" });
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
      setError("Please enter a Gemini API Key.");
      showToastError("Missing API Key.");
      return;
    }
    if (!resume || !companyTarget) {
      setError("Resume and Company Target are required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep("Configuring API...");

    try {
      setTimeout(() => setLoadingStep("Analyzing files..."), 1000);
      setTimeout(() => setLoadingStep("Optimizing pitch structure..."), 2200);

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const prompt = `
You are an expert career brand specialist. 
Adapt this candidate's resume and base cover letter to match the target company's culture, focus areas, and role expectations.

1. **Target Company**: "${companyTarget}"
2. **Application Type**: "${appType}"
3. **Specific Notes / Custom Focus**: "${specificDemands || "None"}"
4. **Resume**:
${resume}

5. **Base Cover Letter**:
${baseCoverLetter || "None provided. Draft from scratch."}

Please output a JSON response containing:
1. "candidate_name": Full name extracted from the Resume. If missing, return "Candidate".
2. "email_body": A high-impact introductory email to the recruiter (100-150 words).
3. "adapted_cover_letter": A structured, persuasive cover letter (250-400 words) aligning the accomplishments with the target company's mission/product.
4. "similar_companies": 3 to 5 similar companies the candidate can target.

Format the output strictly as JSON matching the schema below:
{
  "candidate_name": "string",
  "email_body": "string",
  "adapted_cover_letter": "string",
  "similar_companies": ["string"]
}
`;

      let result;
      try {
        result = await model.generateContent({
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
      } catch (firstErr: any) {
        console.warn("Primary model call failed, checking if 503 or overload...", firstErr);
        
        const errMsg = firstErr?.message || "";
        const is503 = errMsg.includes("503") || 
                      errMsg.toLowerCase().includes("overloaded") || 
                      errMsg.toLowerCase().includes("demand") || 
                      errMsg.toLowerCase().includes("resource exhausted") ||
                      firstErr?.status === 503;

        if (is503) {
          setLoadingStep("Primary model overloaded. Routing to fallback engine...");
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
          
          result = await fallbackModel.generateContent({
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
        } else {
          throw firstErr;
        }
      }

      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      setCandidateName(parsedData.candidate_name || "Candidate");
      setEmailBody(parsedData.email_body || "");
      setAdaptedCoverLetter(parsedData.adapted_cover_letter || "");
      setSimilarCompanies(parsedData.similar_companies || []);
      setActiveTab("email");
      setToast({ message: "Generated successfully.", type: "success" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate application. Please check your API key and connection.");
      showToastError("Generation failed.");
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
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col justify-between selection:bg-zinc-800 selection:text-white antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-200 shadow-2xl backdrop-blur-md max-w-sm animate-fade-in font-mono text-xs">
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0" />
          ) : (
            <FileCheck className="h-4 w-4 text-zinc-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-auto pl-2 font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Auto-Apply
            </span>
            <span className="text-[10px] font-mono text-zinc-650 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
              v2.0
            </span>
          </div>

          {/* API Key Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1 gap-2 w-48 sm:w-64 transition-colors focus-within:border-zinc-700">
              <Key className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type={showKey ? "text" : "password"}
                placeholder="Gemini API Key..."
                value={geminiKey}
                onChange={handleKeyChange}
                className="bg-transparent text-xs w-full focus:outline-none text-zinc-200 placeholder-zinc-600 font-mono"
                id="gemini_key_input"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                {showKey ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              </button>
              {isKeySaved && (
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" title="Saved locally" />
              )}
            </div>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Get Key
            </a>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <span className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              Application Context
            </span>
            <button
              type="button"
              onClick={loadSampleData}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 animate-none" /> Load Sample
            </button>
          </div>

          <form onSubmit={generateApplication} className="flex flex-col gap-5">
            {/* Resume Upload + Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-zinc-500" /> Resume / CV*
              </label>
              <FileUploadZone
                onFileExtracted={(text) => {
                  setResume(text);
                  localStorage.setItem("AUTO_APPLY_RESUME", text);
                }}
                onError={showToastError}
                label="Resume"
              />
              <textarea
                placeholder="Paste plain text resume or drop file above..."
                value={resume}
                onChange={handleResumeChange}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono resize-y leading-relaxed"
                required
              />
            </div>

            {/* Base Cover Letter Upload + Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" /> Base Cover Letter
              </label>
              <FileUploadZone
                onFileExtracted={(text) => {
                  setBaseCoverLetter(text);
                  localStorage.setItem("AUTO_APPLY_BASE_LETTER", text);
                }}
                onError={showToastError}
                label="Cover Letter"
              />
              <textarea
                placeholder="Paste base cover letter or drop file above..."
                value={baseCoverLetter}
                onChange={handleBaseLetterChange}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono resize-y leading-relaxed"
              />
            </div>

            {/* Target Company */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" /> Target Company*
              </label>
              <input
                type="text"
                placeholder="e.g. Vercel (vercel.com)"
                value={companyTarget}
                onChange={(e) => setCompanyTarget(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono"
                required
              />
            </div>

            {/* Config row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-500" /> Type
                </label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as "job" | "internship")}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2352525b\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-zinc-500" /> Recruiter Email
                </label>
                <input
                  type="email"
                  placeholder="careers@company.com"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>
            </div>

            {/* Demands */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-zinc-500" /> Focus Notes
              </label>
              <textarea
                placeholder="e.g. Highlight developer tooling experience..."
                value={specificDemands}
                onChange={(e) => setSpecificDemands(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-900 rounded p-2.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono resize-none leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-400 font-mono flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !geminiKey || !resume || !companyTarget}
              className={`w-full py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-colors ${
                !geminiKey || !resume || !companyTarget
                  ? "bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed"
                  : "bg-zinc-100 text-zinc-950 border border-zinc-200 hover:bg-zinc-200 cursor-pointer active:bg-zinc-300 font-semibold"
              }`}
            >
              {isLoading ? "Processing..." : "Generate Application"}
            </button>
          </form>
        </div>

        {/* OUTPUTS COLUMN */}
        <div className="lg:col-span-7 flex flex-col min-h-[500px]">
          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 border border-zinc-900 rounded-lg p-6 bg-zinc-950/20 flex flex-col justify-center items-center text-center gap-4 min-h-[500px]">
              <svg className="animate-spin h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  Adapting Application
                </span>
                <span className="text-[10px] font-mono text-zinc-550 lowercase">
                  {loadingStep}
                </span>
              </div>
            </div>
          )}

          {/* Idle state */}
          {!isLoading && !emailBody && !adaptedCoverLetter && (
            <div className="flex-1 border border-dashed border-zinc-850 rounded-lg p-8 flex flex-col justify-center items-center text-center gap-3 min-h-[500px] bg-zinc-950/10">
              <Mail className="h-6 w-6 text-zinc-650" />
              <div className="max-w-xs flex flex-col gap-1">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Ready to draft
                </h3>
                <p className="text-[11px] text-zinc-550 leading-relaxed font-mono">
                  Input target metrics on the left and submit to view custom email intro and cover letter drafts.
                </p>
              </div>
            </div>
          )}

          {/* Active State */}
          {!isLoading && (emailBody || adaptedCoverLetter) && (
            <div className="flex-1 border border-zinc-900 bg-zinc-950/20 rounded-lg p-5 flex flex-col justify-between gap-6 shadow-sm">
              <div className="flex flex-col gap-5">
                {/* Selector Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                  <div className="flex bg-zinc-900 border border-zinc-850 p-0.5 rounded font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("email")}
                      className={`px-2.5 py-1 rounded transition-colors uppercase tracking-wider cursor-pointer ${
                        activeTab === "email"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Email Intro
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("letter")}
                      className={`px-2.5 py-1 rounded transition-colors uppercase tracking-wider cursor-pointer ${
                        activeTab === "letter"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Cover Letter
                    </button>
                  </div>

                  {candidateName && (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-850/60 px-2 py-1 rounded">
                      Name: {candidateName}
                    </span>
                  )}
                </div>

                {/* Display Editor */}
                {activeTab === "email" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Email Body
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(emailBody, "email")}
                        className="text-[11px] font-mono text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === "email" ? (
                          <span className="text-zinc-300">Copied</span>
                        ) : (
                          <span className="underline decoration-zinc-800 underline-offset-2">Copy Plaintext</span>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={8}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded p-3 text-xs text-zinc-350 focus:outline-none focus:border-zinc-700 font-mono resize-y leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Adapted Letter
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(adaptedCoverLetter, "letter")}
                        className="text-[11px] font-mono text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === "letter" ? (
                          <span className="text-zinc-300">Copied</span>
                        ) : (
                          <span className="underline decoration-zinc-800 underline-offset-2">Copy Plaintext</span>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={adaptedCoverLetter}
                      onChange={(e) => setAdaptedCoverLetter(e.target.value)}
                      rows={12}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded p-3 text-xs text-zinc-350 focus:outline-none focus:border-zinc-700 font-mono resize-y leading-relaxed"
                    />
                  </div>
                )}

                {/* Similar targets */}
                {similarCompanies && similarCompanies.length > 0 && (
                  <div className="flex flex-col gap-2 bg-zinc-950/50 border border-zinc-900 rounded p-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Suggested Similar Targets:
                    </span>
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
                          className="px-2 py-0.5 text-[10px] font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-400 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {company} <ExternalLink className="h-2.5 w-2.5 text-zinc-650" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-zinc-900 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={triggerMailTo}
                  className="w-full py-2.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Open in Default Mail Client
                </button>
                <div className="flex justify-between items-center text-[9px] text-zinc-550 font-mono px-1">
                  <span>To: {hrEmail ? hrEmail : "(Fill in recruiter email)"}</span>
                  <span>Subject: Application for {appType === "internship" ? "Internship" : "Job"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-6 bg-zinc-950/20 font-mono text-[10px] text-zinc-600">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Auto-Apply. All processing occurs locally in-browser.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-450 transition-colors">Serverless</span>
            <span>•</span>
            <span className="hover:text-zinc-450 transition-colors">GDPR Compliant</span>
            <span>•</span>
            <a
              href="https://github.com/google/generative-ai-js"
              className="text-zinc-500 hover:text-zinc-350 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Gemini JS SDK
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
