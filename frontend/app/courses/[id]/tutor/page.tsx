"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Brand from "../../../components/brand";
import { API_URL } from "../../../lib/api";

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
        `${API_URL}/courses/${courseId}/tutor`,
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
    <main className="min-h-screen bg-[#f3f0e8] text-[#1d251f]">
      <header className="sticky top-0 z-20 border-b border-[#d9d4c8] bg-[#f8f6f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={() => router.push(`/courses/${courseId}`)} className="focus-ring flex items-center gap-2 rounded-full py-2 text-sm font-bold text-[#455148]"><span>←</span><span className="hidden sm:inline">Back to course</span></button>
          <Brand compact />
          <button onClick={clearConversation} disabled={messages.length === 0} className="focus-ring rounded-full border border-[#cbc5b8] px-4 py-2 text-xs font-bold text-[#687169] disabled:opacity-35">Clear chat</button>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-74px)] max-w-6xl flex-col px-5 pb-7 pt-9 sm:px-8">
        <section className="mb-8 flex flex-col justify-between gap-5 border-b border-[#d9d4c8] pb-8 sm:flex-row sm:items-end">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#b65f42]">Source-grounded tutor</p><h1 className="display-type mt-3 text-5xl font-semibold leading-none tracking-[-0.04em]">Work through the hard parts.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#687169]">Ask naturally. Every answer is checked against your uploaded course material and includes the pages used.</p></div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#45614f]"><span className="h-2 w-2 rounded-full bg-[#4f805e]" />Course material connected</div>
        </section>

        <div className="flex-1 space-y-5">
          {messages.length === 0 && (
            <section className="paper-grid rounded-[26px] border border-[#d9d4c8] bg-[#fbfaf6] p-6 sm:p-9">
              <p className="display-type text-2xl font-semibold">A few good ways to begin</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Explain the main idea in simple terms.", "What should I remember for an exam?", "Connect two important concepts."].map((prompt, index) => (
                  <button key={prompt} onClick={() => setQuestion(prompt)} className="lift focus-ring rounded-2xl border border-[#ded8cc] bg-white p-4 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#b65f42]">Prompt {index + 1}</span><span className="mt-5 block text-sm font-bold leading-6 text-[#344239]">{prompt}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {messages.map((message, index) => (
            <article key={index} className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-4xl"}>
              <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-[0.17em] ${message.role === "user" ? "text-right text-[#8b7365]" : "text-[#54705e]"}`}>{message.role === "user" ? "You" : "Study tutor"}</p>
              <div className={message.role === "user" ? "rounded-[22px] rounded-tr-md bg-[#1d251f] p-5 text-[15px] leading-7 text-white" : "rounded-[24px] rounded-tl-md border border-[#d9d4c8] bg-[#fbfaf6] p-6 text-[15px] leading-7 subtle-shadow sm:p-7"}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                  <div className="mt-7 border-t border-[#e0dbcf] pt-5">
                    <div className="mb-4 flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#687169]">Sources used</p><span className="text-xs text-[#7b817b]">{message.sources.length} {message.sources.length === 1 ? "passage" : "passages"}</span></div>
                    <div className="space-y-2">
                      {message.sources.map((source, sourceIndex) => (
                        <details key={`${source.document_id}-${sourceIndex}`} className="group rounded-xl border border-[#e0dbcf] bg-white p-4">
                          <summary className="flex list-none items-center justify-between gap-3 text-sm font-bold"><span className="min-w-0 truncate">{source.filename}{source.page_number !== null && ` · Page ${source.page_number}`}</span><span className="shrink-0 rounded-full bg-[#edf0e9] px-2.5 py-1 text-[10px] text-[#264a38]">{Math.round(source.similarity * 100)}% match</span></summary>
                          <p className="mt-4 whitespace-pre-wrap border-t border-[#ece8df] pt-4 text-xs leading-6 text-[#687169]">{source.content}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}

          {loading && (
            <div className="mr-auto max-w-md rounded-[22px] rounded-tl-md border border-[#d9d4c8] bg-[#fbfaf6] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#687169]"><span>Reading your material</span><span className="thinking-dot h-1.5 w-1.5 rounded-full bg-[#b65f42]" /><span className="thinking-dot h-1.5 w-1.5 rounded-full bg-[#b65f42]" /><span className="thinking-dot h-1.5 w-1.5 rounded-full bg-[#b65f42]" /></div>
            </div>
          )}
        </div>

        {error && <p className="mt-5 rounded-xl border border-[#b65f42]/20 bg-[#f0ded4] px-4 py-3 text-sm text-[#8f3f2b]">{error}</p>}

        <form onSubmit={handleSubmit} className="sticky bottom-4 z-10 mt-8 rounded-[22px] border border-[#cfc9bc] bg-[#fbfaf6]/95 p-3 shadow-[0_18px_60px_rgba(31,42,34,0.16)] backdrop-blur sm:p-4">
          <div className="flex items-end gap-3">
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") event.currentTarget.form?.requestSubmit(); }} placeholder="Ask a question about your course…" rows={2} className="focus-ring min-h-14 flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-[15px] leading-6 outline-none placeholder:text-[#9a9e98]" />
            <button type="submit" disabled={loading || !question.trim()} className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#b65f42] text-xl font-bold text-white transition hover:bg-[#994a32] disabled:opacity-35" aria-label="Send question">↑</button>
          </div>
          <p className="hidden px-3 pt-2 text-[10px] font-semibold text-[#8b918a] sm:block">Press ⌘ + Enter to send · Verify important details against the cited page</p>
        </form>
      </div>
    </main>
  );
}
