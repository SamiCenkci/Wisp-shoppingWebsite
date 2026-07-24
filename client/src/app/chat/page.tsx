"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/compressImage";

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
  unread: number;
  listing_deleted?: boolean;
};
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
};

function isImage(name: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
}

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  function openConversation(id: string) {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  }

  useEffect(() => {
    loadConversations().then((data) => {
      const preselect = searchParams.get("c");
      if (preselect) openConversation(preselect);
      else if (data.length > 0) openConversation(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;

    function loadMessages() {
      api(`/api/conversations/${activeId}/messages`)
        .then((data) => setMessages(data ?? []))
        .catch(() => {});
    }

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeId]);

  // Can the current user still leave a review for this sale?
  useEffect(() => {
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) {
      setCanReview(false);
      return;
    }
    api(`/api/listings/${conv.listing_id}/can-review`)
      .then((data) => setCanReview(Boolean(data.can_review)))
      .catch(() => setCanReview(false));
  }, [activeId, conversations]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/api/ws?token=${token}`);
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
          loadConversations();
        }
      } catch {}
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onFilePick(original: File) {
    const file = await compressImage(original);
    if (file.size > 10 * 1024 * 1024) {
      alert("Filen er for stor. Maks 10 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!file.type) {
      alert("Kunne ikke gjenkjenne filtypen. Prøv en JPG, PNG, GIF, WEBP eller PDF.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const { upload_url, public_url } = await api("/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, content_type: file.type }),
      });
      const res = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Opplasting feilet");
      setAttachment({ url: public_url, name: file.name });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke laste opp filen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !attachment) || !activeId) return;
    const content = text;
    const att = attachment;
    setText("");
    setAttachment(null);
    try {
      const msg = await api(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content,
          attachment_url: att?.url ?? "",
          attachment_name: att?.name ?? "",
        }),
      });
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    } catch {
      setText(content);
      setAttachment(att);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <main className="max-w-[1400px] mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-semibold text-ink mb-6">Meldinger</h1>

      <div className="flex flex-col lg:flex-row gap-6 h-[72vh]">
        <aside className="lg:w-96 shrink-0 bg-surface border border-line rounded-2xl shadow-sm overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-6 text-ink-secondary text-sm">Ingen samtaler ennå.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
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
                  <p className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-ink" : "font-medium text-ink"}`}>
                    {conv.other_name || "Bruker"}
                  </p>
                  <p className="text-xs text-ink-secondary truncate">{conv.listing_title}</p>
                  {conv.last_message && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-ink font-medium" : "text-ink-muted"}`}>
                      {conv.last_message}
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                    {conv.unread > 9 ? "9+" : conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </aside>

        <section className="flex-1 bg-surface border border-line rounded-2xl shadow-sm flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-ink-secondary">
              Velg en samtale
            </div>
          ) : (
            <>
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
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{active.other_name || "Bruker"}</p>
                    <p className="text-sm text-ink-secondary truncate">{active.listing_title}</p>
                  </div>
                  {canReview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/review/${active.listing_id}`);
                      }}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark whitespace-nowrap"
                    >
                      Gi vurdering
                    </button>
                  )}
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
                        {msg.attachment_url && (
                          <div className="mb-1.5">
                            {isImage(msg.attachment_name || msg.attachment_url) ? (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={msg.attachment_url}
                                  alt={msg.attachment_name || "bilde"}
                                  className="rounded-xl max-h-60 w-auto object-cover border border-black/5"
                                />
                              </a>
                            ) : (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" download={msg.attachment_name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${mine ? "bg-white/15 hover:bg-white/25" : "bg-surface border border-line hover:border-brand"}`}>
                                <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${mine ? "bg-white/20" : "bg-brand-lightest"}`}>📄</span>
                                <span className="min-w-0">
                                  <span className={`block truncate font-medium ${mine ? "text-white" : "text-ink"}`}>{msg.attachment_name || "Fil"}</span>
                                  <span className={`block text-xs ${mine ? "text-white/70" : "text-ink-muted"}`}>Trykk for å laste ned</span>
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content && <div>{msg.content}</div>}
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-ink-muted"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {attachment && (
                <div className="px-3 pt-3">
                  <div className="inline-flex items-center gap-3 bg-subtle border border-line rounded-xl px-3 py-2 text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-lightest shrink-0">
                      {isImage(attachment.name) ? "🖼️" : "📄"}
                    </span>
                    <span className="text-ink truncate max-w-[200px] font-medium">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-ink-muted hover:bg-line hover:text-red-600"
                      aria-label="Fjern vedlegg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={send} className="border-t border-line p-3 flex gap-2 items-center">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFilePick(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-10 h-10 shrink-0 rounded-xl border border-line text-ink flex items-center justify-center hover:border-brand hover:text-brand disabled:opacity-50"
                  aria-label="Legg ved fil"
                >
                  {uploading ? "…" : "📎"}
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Skriv en melding..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-subtle outline-none focus:bg-surface focus:border-brand text-sm"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark text-sm disabled:opacity-50"
                >
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

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="max-w-[1400px] mx-auto px-[5%] py-8 text-ink-secondary">Laster...</main>}>
      <ChatInner />
    </Suspense>
  );
}