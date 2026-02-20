"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data?.error ?? data?.details ?? "Something went wrong. Try again.",
          },
        ]);
        return;
      }

      if (data.message?.content) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message.content }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not reach the chat. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--fg)] shadow-lg transition hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-30 flex w-[min(420px,calc(100vw-3rem))] flex-col rounded-searchable-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl"
          style={{ maxHeight: "min(70vh, 520px)" }}
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--fg)]">Ask about Searchable</h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">Questions about the app and your visibility data</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Ask anything about the app or your data — e.g. &quot;What's my top domain?&quot; or &quot;How does
                ingestion work?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-4 ${m.role === "user" ? "ml-6 text-right" : "mr-6"}`}
              >
                <div
                  className={`inline-block max-w-[85%] rounded-searchable px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-searchable text-white"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]"
                  }`}
                >
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-4 mr-6 inline-block rounded-searchable border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                Thinking…
              </div>
            )}
            <div ref={listEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask a question…"
                rows={1}
                className="min-h-[44px] flex-1 resize-none rounded-searchable border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                disabled={loading}
                aria-label="Chat message"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-searchable bg-gradient-searchable px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
