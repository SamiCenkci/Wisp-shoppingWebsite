"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  other_name: string;
  listing_title: string;
  listing_image: string;
  last_message: string;
};
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setMyId(JSON.parse(stored).id ?? "");
      } catch {}
    }
  }, []);

  function loadConversations() {
    return api("/api/conversations").then((data) => {
      setConversations(data ?? []);
      return data ?? [];
    });
  }

  useEffect(() => {
    loadConversations().then((data) => {
      const preselect = searchParams.get("c");
      if (preselect) setActiveId(preselect);
      else if (data.length > 0) setActiveId(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    api(`/api/conversations/${activeId}/messages`)
      .then((data) => setMessages(data ?? []))
      .catch(() => setMessages([]));
  }, [activeId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:8080/api/ws?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setActiveId((currentActive) => {
            if (data.conversation_id === currentActive) {
              setMessages((prev) => [...prev, data.message]);
            }
            return currentActive;
          });
          loadConversations(); // refresh previews/order
        }
      } catch {}
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const content = text;
    setText("");
    try {
      const msg = await api(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    } catch {
      setText(content);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <main className="max-w-[1400px] mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-semibold text-ink mb-6">Meldinger</h1>

      <div className="flex flex-col lg:flex-row gap-6 h-[72vh]">
        {/* Conversation list */}
        <aside className="lg:w-96 shrink-0 bg-surface border border-line rounded-2xl shadow-sm overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-6 text-ink-secondary text-sm">Ingen samtaler ennå.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-line hover:bg-subtle flex gap-3 items-center ${
                  activeId === conv.id ? "bg-brand-lightest" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-subtle shrink-0">
                  {conv.listing_image ? (
                    <img src={conv.listing_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{conv.other_name || "Bruker"}</p>
                  <p className="text-xs text-ink-secondary truncate">{conv.listing_title}</p>
                  {conv.last_message && (
                    <p className="text-xs text-ink-muted truncate mt-0.5">{conv.last_message}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Active conversation */}
        <section className="flex-1 bg-surface border border-line rounded-2xl shadow-sm flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-ink-secondary">
              Velg en samtale
            </div>
          ) : (
            <>
              {/* Header showing who + which listing */}
              {active && (
                <div
                  onClick={() => router.push(`/listings/${active.listing_id}`)}
                  className="border-b border-line p-4 flex items-center gap-3 cursor-pointer hover:bg-subtle"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-subtle shrink-0">
                    {active.listing_image ? (
                      <img src={active.listing_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">—</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{active.other_name || "Bruker"}</p>
                    <p className="text-sm text-ink-secondary truncate">{active.listing_title}</p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const mine = msg.sender_id === myId;
                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                          mine ? "bg-brand text-white rounded-br-sm" : "bg-subtle text-ink rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-ink-muted"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="border-t border-line p-3 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Skriv en melding..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-subtle outline-none focus:bg-surface focus:border-brand text-sm"
                />
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark text-sm">
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}