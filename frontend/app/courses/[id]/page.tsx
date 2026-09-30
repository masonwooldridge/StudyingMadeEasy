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

type Document = {
  id: number;
  filename: string;
  course_id: number;
  created_at: string;
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

  async function loadDocuments(token: string) {
    const response = await fetch(
      `http://localhost:8000/courses/${courseId}/documents`,
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
  }

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
  }, [courseId, router]);

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
        `http://localhost:8000/courses/${courseId}/documents`,
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

        <div className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">
              Study Materials
            </h3>

            <p className="mt-2 text-gray-600">
              Upload PDF notes, lecture slides, and study guides.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 p-6">
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setSelectedFile(file);
              }}
              className="block w-full text-sm text-gray-700"
            />

            {selectedFile && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-4 rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>

          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900">
              Uploaded Materials
            </h4>

            {documents.length === 0 ? (
              <p className="mt-3 text-gray-600">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {document.filename}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Uploaded{" "}
                        {new Date(
                          document.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="text-sm text-gray-500">
                      PDF
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Tutor
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Ask questions about your course materials.
            </p>

            <button
              onClick={() => router.push(`/courses/${course.id}/tutor`)}
              className="mt-6 font-medium underline"
            >
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