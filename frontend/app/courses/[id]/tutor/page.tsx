"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Source = {
  document_id: number;
  filename: string;
  page_number: number | null;
  content: string;
  similarity: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function TutorPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id;

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const previousMessages = messages;

    const userMessage: Message = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages([...previousMessages, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const history = previousMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await fetch(
        `http://localhost:8000/courses/${courseId}/tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            history,
            limit: 8,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not get tutor response"
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
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

  function clearConversation() {
    setMessages([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() =>
              router.push(`/courses/${courseId}`)
            }
            className="text-sm font-medium text-gray-700"
          >
            ← Back to Course
          </button>

          <h1 className="text-xl font-bold text-gray-900">
            AI Tutor
          </h1>

          <button
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="text-sm font-medium text-gray-600 disabled:opacity-40"
          >
            Clear Chat
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col px-6 py-8">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">
            Ask about your course
          </h2>

          <p className="mt-2 text-gray-600">
            Answers are based on your uploaded course materials.
          </p>
        </div>

        <div className="mb-6 space-y-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-gray-600">
                Ask your first question about the course.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "ml-auto max-w-2xl rounded-xl bg-black p-4 text-white"
                  : "mr-auto max-w-3xl rounded-xl bg-white p-5 shadow-sm"
              }
            >
              <p className="whitespace-pre-wrap">
                {message.content}
              </p>

              {message.role === "assistant" &&
                message.sources &&
                message.sources.length > 0 && (
                  <div className="mt-5 border-t border-gray-200 pt-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      Sources
                    </p>

                    <div className="space-y-3">
                      {message.sources.map(
                        (source, sourceIndex) => (
                          <details
                            key={`${source.document_id}-${sourceIndex}`}
                            className="rounded-lg bg-gray-50 p-3"
                          >
                            <summary className="cursor-pointer text-sm font-medium text-gray-900">
                              {source.filename}
                              {source.page_number !== null &&
                                ` — Page ${source.page_number}`}
                              {" "}
                              ({Math.round(
                                source.similarity * 100
                              )}
                              % match)
                            </summary>

                            <p className="mt-3 whitespace-pre-wrap text-xs text-gray-600">
                              {source.content}
                            </p>
                          </details>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}

          {loading && (
            <div className="mr-auto max-w-3xl rounded-xl bg-white p-5 shadow-sm">
              <p className="text-gray-500">
                Searching your materials and thinking...
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-4 rounded-xl bg-white p-4 shadow-lg"
        >
          <div className="flex gap-3">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask a question about your course..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-black"
            />

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-lg bg-black px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}