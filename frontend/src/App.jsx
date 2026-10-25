import { useState } from "react";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setSelectedFile(file);
      setResult(null);
      setQuestion("");
      setAnswer("");
      setError("");
    } else {
      setSelectedFile(null);
      setResult(null);
      setError("Please select a PDF file.");
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setResult(null);
    setAnswer("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not connect to the DocuFlow backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError("Please type a question first.");
      return;
    }
    if (!result?.text) {
      setError("Please upload and process a PDF first.");
      return;
    }

    setIsAsking(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), text: result.text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not answer the question.");
      setAnswer(data.answer || "No answer was returned.");
    } catch (err) {
      setError(err.message || "Could not connect to the question-answering endpoint.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-700">
      <nav className="border-b border-white/40 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">DocuFlow</h1>
            <p className="text-xs text-slate-500">Smart Document Processing</p>
          </div>
          <div className="hidden gap-8 text-sm font-medium text-slate-600 sm:flex">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <div className="mb-6 inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
            Automated PDF Processing
          </div>
          <h2 className="text-4xl font-bold text-slate-950 sm:text-5xl lg:text-6xl">
            Turn documents into <span className="block text-blue-900">useful data.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Upload a PDF and let DocuFlow automatically extract useful information such as emails, phone numbers, dates, URLs and other important details.
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">📄</div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-semibold text-slate-900">Upload your PDF</h3>
              <p className="mt-2 text-sm text-slate-500">Choose a PDF document to begin processing.</p>
            </div>

            <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 px-6 py-10 text-center hover:border-blue-400">
              <div className="text-3xl">☁️</div>
              <p className="mt-4 text-sm font-semibold text-slate-800">Drop your PDF here</p>
              <p className="mt-1 text-xs text-slate-500">or click to browse</p>
              <span className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Browse PDF</span>
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-5 rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-medium text-blue-600">Selected document</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800">{selectedFile.name}</p>
              </div>
            )}

            <button onClick={handleProcess} disabled={!selectedFile || isProcessing} className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
              {isProcessing ? "Processing..." : "Process Document"}
            </button>

            {error && <div role="alert" className="mt-4 whitespace-pre-line rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            {result && (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-slate-50 p-5">
                <div className="mb-5">
                  <p className="text-sm font-semibold text-green-700">{result.message || "PDF processed successfully."}</p>
                  <p className="mt-1 text-xs text-slate-500">Document analysis completed</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Pages", result.pages ?? 0],
                    ["Characters", result.text ? result.text.length : 0],
                    ["Emails", result.emails?.length ?? 0],
                    ["Phone Numbers", result.phone_numbers?.length ?? 0],
                    ["URLs", result.urls?.length ?? 0],
                    ["Dates", result.dates?.length ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">💬 Chat with Your PDF</h3>
                  <p className="mt-1 text-sm text-slate-500">Ask a question about the document you uploaded.</p>
                  <form className="mt-4" onSubmit={(event) => { event.preventDefault(); handleAskQuestion(); }}>
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="Example: What is the main topic?"
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      rows={3}
                    />
                    <button type="submit" disabled={!question.trim() || isAsking} className="mt-3 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                      {isAsking ? "Finding answer..." : "Ask Question"}
                    </button>
                  </form>
                  {answer && (
                    <div className="mt-5 rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-blue-900">Answer</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{answer}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-800">📧 Emails found</p>
                  {result.emails?.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{result.emails.map((email, index) => <li key={`${email}-${index}`} className="break-all">{email}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No email addresses found.</p>}
                </div>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-800">📱 Phone numbers found</p>
                  {result.phone_numbers?.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{result.phone_numbers.map((phone, index) => <li key={`${phone}-${index}`}>{phone}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No phone numbers found.</p>}
                </div>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-800">🔗 URLs found</p>
                  {result.urls?.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{result.urls.map((url, index) => <li key={`${url}-${index}`} className="break-all"><a href={/^https?:\/\//i.test(url) ? url : `https://${url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{url}</a></li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No URLs found.</p>}
                </div>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-800">📅 Dates found</p>
                  {result.dates?.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{result.dates.map((date, index) => <li key={`${date}-${index}`}>{date}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No dates found.</p>}
                </div>
              </div>
            )}
            <p className="mt-4 text-center text-xs text-slate-400">PDF files only</p>
          </div>
        </section>

        <section id="features" className="mx-auto mt-16 grid max-w-5xl gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/90 p-6 shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">📄</div>
            <h3 className="mt-5 font-semibold text-slate-900">Extract</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Automatically extract text and useful information from PDF documents.</p>
          </div>
          <div className="rounded-2xl bg-white/90 p-6 shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">🔍</div>
            <h3 className="mt-5 font-semibold text-slate-900">Detect</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Find emails, phone numbers, dates and URLs automatically.</p>
          </div>
          <div className="rounded-2xl bg-white/90 p-6 shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">📊</div>
            <h3 className="mt-5 font-semibold text-slate-900">Export</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Download extracted information as a CSV file.</p>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto mt-20 max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-950">How it works</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-950">Three simple steps</h3>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/90 p-6 shadow-lg"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</div><h4 className="mt-4 font-semibold text-slate-900">Upload</h4><p className="mt-2 text-sm text-slate-600">Select a PDF from your computer.</p></div>
            <div className="rounded-2xl bg-white/90 p-6 shadow-lg"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-bold text-white">2</div><h4 className="mt-4 font-semibold text-slate-900">Process</h4><p className="mt-2 text-sm text-slate-600">Python automatically analyzes the document.</p></div>
            <div className="rounded-2xl bg-white/90 p-6 shadow-lg"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 font-bold text-white">3</div><h4 className="mt-4 font-semibold text-slate-900">Results</h4><p className="mt-2 text-sm text-slate-600">View the extracted information and ask questions about the PDF.</p></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/40 bg-white/30 px-6 py-8">
        <p className="text-center text-sm text-slate-700">DocuFlow — Smart Document Processing</p>
      </footer>
    </div>
  );
}

export default App;
