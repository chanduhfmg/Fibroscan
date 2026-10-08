import { useState, useRef } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import FibroScanReportDesign from './components/PDFGenerator';
import type { FibroScanApiData } from './types/FibroscanApiData';

const AiStatusLIst = {
  initial: "INITIAL",
  analysing: "ANALYSING",
  completed: "COMPLETED",
  error: "ERROR"
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfData, setPdfData] = useState<FibroScanApiData | null>(null);
  const [aiStatus, setAiStatus] = useState(AiStatusLIst.initial);
  const [error, setError] = useState<string | null>(null);
  const [page2Base64, setPage2Base64] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetAll = () => {
    setAiStatus(AiStatusLIst.initial);
    setFile(null);
    setPdfData(null);
    setError(null);
    setPage2Base64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClassify = async () => {
    if (!file) return;
    setAiStatus(AiStatusLIst.analysing);
    try {
      // Step 1: Extract page 2 from the PDF locally in the browser
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);

      if (srcPdf.getPageCount() >= 2) {
        const page2Doc = await PDFDocument.create();
        const [copiedPage] = await page2Doc.copyPages(srcPdf, [1]);
        page2Doc.addPage(copiedPage);
        const bytes = await page2Doc.save();

        // ✅ Use a loop instead of spread operator (spread crashes on large PDFs
        // by hitting the JS max call stack size, corrupting the base64 string)
        const uint8 = new Uint8Array(bytes);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);
        setPage2Base64(base64);
      } else {
        setPage2Base64(null);
      }

      // Step 2: Send original file to AI backend for field extraction
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/scan/upload`, {
        method: 'POST',
        body: formData,
        redirect: "follow"
      });
      const data = await response.json();
      console.log(data);
      setPdfData(data);
      setAiStatus(AiStatusLIst.completed);
    } catch (error) {
      console.log(error);
      const err = error as Error;
      setError(err.message || "An unknown error occurred");
      setAiStatus(AiStatusLIst.error);
    }
  }

  function Loading() {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 w-full">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-3">
          AI is Analyzing...
        </h3>
        <p className="text-gray-500 mb-8 max-w-sm text-center">
          Extracting relevant information from your Fibro Scan report. This will just take a moment.
        </p>
        <div className="w-full max-w-md bg-orange-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full w-full animate-pulse"></div>
        </div>
        <span className="text-sm font-medium text-orange-600 mt-2 animate-pulse tracking-wide">Processing document...</span>
      </div>
    );
  }

  function Initial() {
    return (
      <div className="w-full relative group">
        <div className={`absolute inset-0 bg-gradient-to-r from-orange-300 to-orange-500 rounded-3xl blur-md transition duration-500 ${isDragging ? 'opacity-50' : 'opacity-25'}`}></div>
        <div
          onClick={aiStatus === AiStatusLIst.analysing ? undefined : openFileDialog}
          onDragOver={aiStatus === AiStatusLIst.analysing ? undefined : handleDragOver}
          onDragLeave={aiStatus === AiStatusLIst.analysing ? undefined : handleDragLeave}
          onDrop={aiStatus === AiStatusLIst.analysing ? undefined : handleDrop}
          className={`relative backdrop-blur-xl border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 shadow-xl flex flex-col items-center justify-center
            ${aiStatus === AiStatusLIst.analysing ? 'bg-white/95 border-orange-200 cursor-default' : isDragging ? 'bg-orange-50/90 border-orange-500 scale-[1.02] cursor-pointer' : 'bg-white/80 border-orange-300 hover:bg-orange-50/50 hover:border-orange-500 cursor-pointer'}
          `}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
          {!file ? (
            <>
              <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-transform duration-300 ${isDragging ? 'bg-orange-200 scale-110' : 'bg-orange-100'}`}>
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">{isDragging ? 'Drop your PDF here' : 'Drag & Drop your PDF here'}</h3>
              <p className="text-gray-500 mb-8">or click to browse from your computer</p>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform group-hover:-translate-y-1">
                Select File
              </button>
              <p className="text-xs text-gray-400 mt-6 font-medium tracking-wide uppercase">Supports PDF files up to 50MB</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2 truncate max-w-full px-4" title={file.name}>{file.name}</h3>
              <p className="text-gray-500 mb-8">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <div className="flex gap-4">
                <button onClick={removeFile} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-8 rounded-full shadow-sm transition-all duration-300">
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClassify(); }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Classify
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  function Completed() {
    if (!pdfData) return null;
    const inst = pdfData.institution || [];
    return (
      <div className="w-full relative group">
        <FibroScanReportDesign
          reset={resetAll}
          patientName={pdfData.patientName ?? "Unknown"}
          patientDateOfBirth={pdfData.dob ?? "Unknown"}
          patientGender={pdfData.gender ?? "Unknown"}
          examDate={pdfData.examDate ?? "Unknown"}
          capValue={pdfData.cap ?? "0"}
          eValue={pdfData.ekpa ?? "0"}
          institutionName={inst[0] ?? "Unknown"}
          institutionCity={inst[1] ?? "Unknown"}
          institutionState={inst[2] ?? "Unknown"}
          institutionPostalCode={inst[3] ?? ""}
          institutionCountry={inst[4] ?? ""}
          page2Base64={page2Base64 ?? undefined}
        />
      </div>
    );
  }

  function Error() {
    return (
      <div className="w-full relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-rose-200 rounded-3xl blur-md opacity-40 transition duration-500"></div>
        <div className="relative backdrop-blur-xl border-2 border-red-200 bg-white/90 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center justify-center transition-all duration-300 hover:border-red-300">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
            <div className="relative w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">Oops! Processing Error</h3>
          <p className="text-red-600 mb-8 max-w-sm mx-auto font-medium bg-red-50 py-3 px-6 rounded-2xl border border-red-100 shadow-inner">
            {error || "An unknown error occurred while processing your file."}
          </p>
          <button
            onClick={resetAll}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-red-500 to-rose-600 border border-transparent rounded-full shadow-[0_8px_16px_-6px_rgba(239,68,68,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(239,68,68,0.6)] hover:-translate-y-1"
          >
            <svg className="w-5 h-5 mr-2.5 transition-transform duration-500 group-hover:-rotate-[360deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  function renderContent() {
    switch (aiStatus) {
      case AiStatusLIst.initial:   return <Initial />;
      case AiStatusLIst.analysing: return <Loading />;
      case AiStatusLIst.completed: return <Completed />;
      case AiStatusLIst.error:     return <Error />;
      default:                     return <Initial />;
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-16 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight font-sans mb-4">
            Classify Fibro Scan <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Reports</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Upload your fibro scan Reports and i will classify to Pdf with accurate classification
          </p>
        </div>
        {renderContent()}
      </div>
    </>
  );
}

export default App;