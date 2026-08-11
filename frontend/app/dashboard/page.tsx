"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const response = await fetch("http://localhost:8000/courses", {
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
        const userResponse = await fetch("http://localhost:8000/auth/me", {
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
      const response = await fetch("http://localhost:8000/courses", {
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
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            StudyingMadeEasy
          </h1>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Your Dashboard
          </h2>

          {user && (
            <p className="mt-2 text-gray-600">
              Signed in as {user.email}
            </p>
          )}
        </div>

        {error && (
          <p className="mb-6 text-red-600">
            {error}
          </p>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">
            Your Courses
          </h3>

          <button
            onClick={() => setShowCourseForm(true)}
            className="rounded-lg bg-black px-4 py-2 font-medium text-white"
          >
            + New Course
          </button>
        </div>

        {showCourseForm && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h4 className="mb-4 text-xl font-semibold text-gray-900">
              Create Course
            </h4>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course Name
                </label>

                <input
                  type="text"
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-black"
                  placeholder="Data Structures"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-black"
                  placeholder="Optional course description"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                  {creatingCourse ? "Creating..." : "Create Course"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCourseForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h4 className="text-lg font-semibold text-gray-900">
              No courses yet
            </h4>

            <p className="mt-2 text-gray-600">
              Create your first course to start studying.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <h4 className="text-xl font-semibold text-gray-900">
                  {course.name}
                </h4>

                <p className="mt-2 text-sm text-gray-600">
                  {course.description || "No description"}
                </p>

                <button
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="mt-6 text-sm font-medium text-black underline"
                >
                  Open Course
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}