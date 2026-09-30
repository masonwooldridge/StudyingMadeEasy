"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Brand from "../../components/brand";
import { API_URL } from "../../lib/api";

type Course = {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
};

type Document = {
  id: number;
  filename: string;
  course_id: number;
  created_at: string;
};

type SearchResult = {
  chunk_id: number;
  document_id: number;
  filename: string;
  page_number: number | null;
  content: string;
  similarity: number;
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const loadDocuments = useCallback(async (token: string) => {
    const response = await fetch(
      `${API_URL}/courses/${courseId}/documents`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Could not load documents");
    }

    const data = await response.json();
    setDocuments(data);
  }, [courseId]);

  useEffect(() => {
    async function loadCourse() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load course");
        }

        const data = await response.json();

        setCourse(data);

        await loadDocuments(token);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId, loadDocuments, router]);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/courses/${courseId}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not upload document");
      }

      setSelectedFile(null);

      await loadDocuments(token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();
    const token = localStorage.getItem("access_token");

    if (!query || !token) {
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/courses/${courseId}/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query, limit: 5 }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not search course material");
      }

      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f0e8]">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#687169]">Opening course</p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f3f0e8] px-6">
        <p className="rounded-xl border border-[#b65f42]/20 bg-[#f0ded4] px-5 py-4 text-[#8f3f2b]">
          {error || "Course not found"}
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-5 font-bold text-[#264a38] underline underline-offset-4"
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f0e8] text-[#1d251f]">
      <header className="border-b border-[#d9d4c8] bg-[#f8f6f0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={() => router.push("/dashboard")} className="focus-ring flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#455148]">
            <span aria-hidden>←</span> Dashboard
          </button>
          <Brand />
          <div className="hidden w-24 sm:block" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-8 border-b border-[#d9d4c8] pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#b65f42]">Course workspace</p>
            <h1 className="display-type max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl">{course.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#687169]">{course.description || "A focused home for your readings, notes, and questions."}</p>
          </div>
          <button onClick={() => router.push(`/courses/${course.id}/tutor`)} className="focus-ring group flex items-center justify-between gap-8 rounded-full bg-[#264a38] px-6 py-4 text-sm font-extrabold text-white transition hover:bg-[#173326]">
            Open AI tutor <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </section>

        {error && <p className="mt-7 rounded-xl border border-[#b65f42]/20 bg-[#f0ded4] px-4 py-3 text-sm text-[#8f3f2b]">{error}</p>}

        <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section className="rounded-[26px] border border-[#d9d4c8] bg-[#fbfaf6] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b65f42]">Knowledge search</p><h2 className="display-type mt-2 text-3xl font-semibold">Find an idea, not just a word.</h2></div>
              <span className="hidden rounded-full bg-[#e7dfd0] px-3 py-1 text-xs font-bold text-[#264a38] sm:block">Semantic</span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687169]">Search across your uploaded material by meaning. Try a concept, process, or question.</p>
            <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="e.g. How does light become stored energy?" className="focus-ring min-w-0 flex-1 rounded-xl border border-[#cfc9bc] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#264a38]" />
              <button type="submit" disabled={searching || !searchQuery.trim() || documents.length === 0} className="rounded-xl bg-[#1d251f] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-40">{searching ? "Searching…" : "Search notes"}</button>
            </form>

            {hasSearched && !searching && (
              <div className="mt-7 space-y-3 border-t border-[#e3ded3] pt-6">
                {searchResults.length === 0 ? <p className="text-sm text-[#687169]">No close matches found. Try a broader question.</p> : searchResults.map((result) => (
                  <article key={result.chunk_id} className="rounded-2xl border border-[#e0dbcf] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#687169]"><span>{result.filename}{result.page_number !== null && ` · Page ${result.page_number}`}</span><span className="rounded-full bg-[#edf0e9] px-2.5 py-1 text-[#264a38]">{Math.round(result.similarity * 100)}% match</span></div>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#455148]">{result.content}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-[#d9d4c8] bg-[#fbfaf6] p-6 sm:p-8">
            <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b817b]">Course library</p><h2 className="display-type mt-2 text-3xl font-semibold">Materials</h2></div><span className="display-type text-4xl text-[#b65f42]">{documents.length}</span></div>

            <label className="paper-grid focus-ring mt-6 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-[#aaa394] bg-[#f6f3eb] px-5 py-7 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#264a38] text-xl text-white">↑</span>
              <span className="mt-3 text-sm font-extrabold">Choose a PDF</span>
              <span className="mt-1 text-xs text-[#7b817b]">Notes, readings, or slides</span>
              <input type="file" accept="application/pdf" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="sr-only" />
            </label>
            {selectedFile && <div className="mt-3 flex items-center justify-between rounded-xl bg-[#e7dfd0] px-4 py-3 text-xs"><span className="max-w-48 truncate font-bold">{selectedFile.name}</span><button onClick={() => setSelectedFile(null)} className="text-[#687169]">Remove</button></div>}
            <button onClick={handleUpload} disabled={!selectedFile || uploading} className="mt-3 w-full rounded-xl bg-[#b65f42] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#994a32] disabled:opacity-40">{uploading ? "Extracting & indexing…" : "Upload and index"}</button>

            <div className="mt-7 space-y-3 border-t border-[#e3ded3] pt-6">
              {documents.length === 0 ? <p className="text-sm leading-6 text-[#687169]">No material yet. Upload your first PDF to unlock search and tutoring.</p> : documents.map((document) => (
                <div key={document.id} className="flex items-center gap-3 rounded-xl border border-[#e0dbcf] bg-white p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f0ded4] text-[10px] font-extrabold text-[#8f3f2b]">PDF</span>
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{document.filename}</p><p className="mt-0.5 text-xs text-[#7b817b]">Indexed {new Date(document.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-7 grid gap-5 md:grid-cols-3">
          <button onClick={() => router.push(`/courses/${course.id}/tutor`)} className="lift group rounded-[22px] border border-[#264a38]/20 bg-[#264a38] p-6 text-left text-white"><span className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Ready now</span><h3 className="display-type mt-8 text-3xl font-semibold">AI Tutor</h3><p className="mt-2 text-sm leading-6 text-white/65">Ask follow-up questions with context and cited pages.</p><span className="mt-7 inline-block text-sm font-bold">Start a conversation <span className="transition group-hover:ml-1">→</span></span></button>
          <div className="rounded-[22px] border border-[#d9d4c8] bg-[#fbfaf6] p-6"><span className="rounded-full bg-[#e7dfd0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#687169]">Coming soon</span><h3 className="display-type mt-8 text-3xl font-semibold">Practice sets</h3><p className="mt-2 text-sm leading-6 text-[#687169]">Turn your readings into focused recall questions and quizzes.</p></div>
          <div className="rounded-[22px] border border-[#d9d4c8] bg-[#fbfaf6] p-6"><span className="rounded-full bg-[#e7dfd0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#687169]">Coming soon</span><h3 className="display-type mt-8 text-3xl font-semibold">Study progress</h3><p className="mt-2 text-sm leading-6 text-[#687169]">See which concepts are solid and which need another pass.</p></div>
        </section>
      </div>
    </main>
  );
}
