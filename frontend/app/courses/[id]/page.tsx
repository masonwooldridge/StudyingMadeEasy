"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Course = {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/courses/${courseId}`,
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
  }, [courseId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-red-600">
          {error || "Course not found"}
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 underline"
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-medium text-gray-700"
          >
            ← Dashboard
          </button>

          <h1 className="text-xl font-bold text-gray-900">
            StudyingMadeEasy
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900">
            {course.name}
          </h2>

          <p className="mt-3 max-w-2xl text-gray-600">
            {course.description || "No course description"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Materials
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Upload notes, slides, and PDFs.
            </p>

            <button className="mt-6 font-medium underline">
              View Materials
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Tutor
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Ask questions about your course.
            </p>

            <button className="mt-6 font-medium underline">
              Open Tutor
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Practice
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Generate quizzes and questions.
            </p>

            <button className="mt-6 font-medium underline">
              Start Practice
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Progress
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Track your topic mastery.
            </p>

            <button className="mt-6 font-medium underline">
              View Progress
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}