"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "../components/brand";
import { API_URL } from "../lib/api";

type User = {
  id: number;
  email: string;
  created_at: string;
};

type Course = {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  async function loadCourses(token: string) {
    const response = await fetch(`${API_URL}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Could not load courses");
    }

    const data = await response.json();
    setCourses(data);
  }

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        const userData = await userResponse.json();
        setUser(userData);

        await loadCourses(token);
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

    loadDashboard();
  }, [router]);

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setCreatingCourse(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: courseName,
          description: courseDescription || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create course");
      }

      setCourseName("");
      setCourseDescription("");
      setShowCourseForm(false);

      await loadCourses(token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setCreatingCourse(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f0e8]">
        <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-[#687169]">
          <span className="h-2 w-2 rounded-full bg-[#b65f42]" />
          Opening your study desk
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f0e8] text-[#1d251f]">
      <header className="border-b border-[#d9d4c8] bg-[#f8f6f0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7dfd0] text-xs font-extrabold uppercase text-[#264a38]">
                  {user.email.slice(0, 2)}
                </span>
                <div className="max-w-48 truncate text-sm font-semibold text-[#455148]">{user.email}</div>
              </div>
            )}
            <button onClick={handleLogout} className="focus-ring rounded-full border border-[#cbc5b8] px-4 py-2 text-sm font-bold transition hover:bg-white">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#b65f42]">Your study desk</p>
            <h1 className="display-type max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl">
              Make today&apos;s reading stick.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#687169]">
              Keep every course organized, search the ideas inside your material, and ask questions with page-level sources.
            </p>
          </div>

          <aside className="rounded-[22px] border border-[#274b39]/15 bg-[#264a38] p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Workspace</span>
              <span className="h-2 w-2 rounded-full bg-[#d7aa8f]" />
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div><strong className="display-type text-5xl font-medium">{courses.length}</strong><p className="mt-1 text-sm text-white/65">active {courses.length === 1 ? "course" : "courses"}</p></div>
              <p className="max-w-32 text-right text-xs leading-5 text-white/55">Your materials stay private to this account.</p>
            </div>
          </aside>
        </section>

        {error && <p className="mt-8 rounded-xl border border-[#b65f42]/20 bg-[#f0ded4] px-4 py-3 text-sm text-[#8f3f2b]">{error}</p>}

        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d4c8] pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b817b]">Library</p>
              <h2 className="display-type mt-1 text-3xl font-semibold">Your courses</h2>
            </div>
            <button onClick={() => setShowCourseForm(true)} className="focus-ring rounded-full bg-[#b65f42] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#994a32]">
              <span className="mr-2 text-lg leading-none">＋</span> New course
            </button>
          </div>

          {showCourseForm && (
            <div className="subtle-shadow mb-8 rounded-[24px] border border-[#cfc9bc] bg-[#fbfaf6] p-6 sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b65f42]">New workspace</p><h3 className="display-type mt-2 text-3xl font-semibold">Add a course</h3></div>
                <button type="button" onClick={() => setShowCourseForm(false)} aria-label="Close form" className="grid h-9 w-9 place-items-center rounded-full border border-[#d9d4c8] text-xl text-[#687169]">×</button>
              </div>
              <form onSubmit={handleCreateCourse} className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold text-[#344239]">Course name<input type="text" value={courseName} onChange={(event) => setCourseName(event.target.value)} required className="focus-ring mt-2 w-full rounded-xl border border-[#cfc9bc] bg-white px-4 py-3.5 font-normal outline-none focus:border-[#264a38]" placeholder="Modern European History" /></label>
                <label className="text-sm font-bold text-[#344239]">Short description<input value={courseDescription} onChange={(event) => setCourseDescription(event.target.value)} className="focus-ring mt-2 w-full rounded-xl border border-[#cfc9bc] bg-white px-4 py-3.5 font-normal outline-none focus:border-[#264a38]" placeholder="Seminar notes and primary sources" /></label>
                <div className="flex gap-3 sm:col-span-2"><button type="submit" disabled={creatingCourse} className="rounded-full bg-[#264a38] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{creatingCourse ? "Creating…" : "Create course"}</button><button type="button" onClick={() => setShowCourseForm(false)} className="rounded-full px-5 py-3 text-sm font-bold text-[#687169]">Cancel</button></div>
              </form>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="paper-grid rounded-[26px] border border-dashed border-[#bcb5a7] bg-[#fbfaf6] p-14 text-center">
              <span className="display-type text-6xl text-[#b65f42]">Aa</span><h3 className="display-type mt-4 text-3xl font-semibold">Your first course starts here.</h3><p className="mx-auto mt-3 max-w-md leading-7 text-[#687169]">Create a course, upload a PDF, and start asking questions grounded in your own material.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course, index) => (
                <article key={course.id} className="lift group flex min-h-72 flex-col rounded-[24px] border border-[#d9d4c8] bg-[#fbfaf6] p-6">
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7dfd0] font-extrabold text-[#264a38]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rounded-full border border-[#d9d4c8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#687169]">Active</span>
                  </div>
                  <h3 className="display-type mt-8 text-3xl font-semibold leading-tight tracking-[-0.025em]">{course.name}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#687169]">{course.description || "A focused space for notes, readings, and questions."}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#e3ded3] pt-5">
                    <span className="text-xs font-semibold text-[#7b817b]">Added {new Date(course.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    <button onClick={() => router.push(`/courses/${course.id}`)} className="focus-ring flex items-center gap-2 text-sm font-extrabold text-[#264a38]">Open <span className="transition group-hover:translate-x-1">→</span></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
