import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { AuthorAvatar, AuthorBadge } from "./AuthorBadge";

export default function Messenger({ user, role, onNotify, initialUser }) {
  const [convs, setConvs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState([]);
  const endRef = useRef(null);
  const staff = role === "admin" || role === "trainer";

  const loadLists = useCallback(async () => {
    const [c, f, r] = await Promise.all([supabase.rpc("get_conversations"), supabase.rpc("get_contacts"), supabase.rpc("get_friend_requests")]);
    if (c.error) onNotify?.("Messagerie indisponible : installe le SQL « partie 8 ».");
    if (Array.isArray(c.data)) setConvs(c.data);
    if (Array.isArray(f.data)) setContacts(f.data);
    if (Array.isArray(r.data)) setRequests(r.data);
    return { convs: Array.isArray(c.data) ? c.data : [], contacts: Array.isArray(f.data) ? f.data : [] };
  }, [onNotify]);

  const loadChat = useCallback(async (id) => {
    const { data } = await supabase.rpc("get_conversation", { p_user: id });
    if (Array.isArray(data)) setMessages(data);
  }, []);

  useEffect(() => {
    loadLists().then((lists) => {
      if (initialUser) setActive([...lists.contacts, ...lists.convs].find((x) => x.id === initialUser) || { id: initialUser, full_name: "Membre" });
    });
  }, [initialUser]);

  useEffect(() => {
    if (!active) return undefined;
    loadChat(active.id);
    const timer = setInterval(() => { loadChat(active.id); loadLists(); }, 6000);
    return () => clearInterval(timer);
  }, [active?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  async function send(event) {
    event.preventDefault();
    if ((!text.trim() && files.length === 0) || !active) return;
    setBusy(true);
    const { error } = await supabase.rpc("send_message", { p_to: active.id, p_body: text.trim() || "Pièce jointe", p_attachments: files });
    setBusy(false);
    if (error) { onNotify?.(error.message); return; }
    setText(""); setFiles([]);
    loadChat(active.id);
    loadLists();
  }

  async function answer(id, accept) {
    const { error } = await supabase.rpc("respond_friend_request", { p_user: id, p_accept: accept });
    if (error) onNotify?.(error.message);
    loadLists();
  }

  async function sendBroadcast(event) {
    event.preventDefault();
    if (!broadcast.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("broadcast_message", { p_body: broadcast.trim() });
    setBusy(false);
    if (error) { onNotify?.(error.message); return; }
    setBroadcast("");
    onNotify?.("Message envoyé à tous les membres.");
  }

  if (active) {
    return (
      <section className="section-container">
        <button type="button" className="button button-outline" onClick={() => { setActive(null); setMessages([]); loadLists(); }}>← Retour</button>
        <h2 className="chat-title"><AuthorAvatar card={active} /> {active.full_name} <AuthorBadge card={active} /></h2>
        <div className="chat-box">
          {messages.length === 0 && <p>Aucun message pour le moment. Écris le premier !</p>}
          {messages.map((m) => <div key={m.id} className={m.mine ? "chat-bubble chat-bubble-mine" : "chat-bubble"}>{m.body}<AttachmentList items={m.attachments} /><small>{new Date(m.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>)}
          <div ref={endRef} />
        </div>
        <form className="chat-composer" onSubmit={send}>
          <AttachmentPicker user={user} value={files} onChange={setFiles} full max={3} onNotify={onNotify} />
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Écris ton message…" />
          <button type="submit" className="button button-primary" disabled={busy}>Envoyer</button>
        </form>
      </section>
    );
  }

  return (
    <section className="section-container">
      <span className="eyebrow">MESSAGERIE</span>
      <h1>Mes conversations</h1>
      {requests.length > 0 && (
        <div className="account-content-card">
          <h3>Demandes d'amis</h3>
          {requests.map((r) => (
            <div key={r.id} className="chat-item">
              <AuthorAvatar card={r} /><strong>{r.full_name}</strong>
              <button type="button" className="button button-primary" onClick={() => answer(r.id, true)}>Accepter</button>
              <button type="button" className="button button-outline" onClick={() => answer(r.id, false)}>Refuser</button>
            </div>
          ))}
        </div>
      )}
      {staff && (
        <form className="account-content-card admin-highlight" onSubmit={sendBroadcast}>
          <h3>Message à tous les membres</h3>
          <textarea value={broadcast} onChange={(e) => setBroadcast(e.target.value)} rows={3} maxLength={1000} placeholder="Annonce visible par tous les membres…" />
          <button type="submit" className="button button-primary" disabled={busy}>Envoyer à tous</button>
        </form>
      )}
      <div className="account-content-card">
        <h3>Écrire à un ami ou à l'équipe</h3>
        {contacts.length === 0 ? <p>Ajoute des amis depuis leur profil dans la Communauté.</p> : contacts.map((c) => (
          <button key={c.id} type="button" className="chat-item" onClick={() => setActive(c)}><AuthorAvatar card={c} /><strong>{c.full_name}</strong><AuthorBadge card={c} /></button>
        ))}
      </div>
      <div className="account-content-card">
        <h3>Conversations</h3>
        {convs.length === 0 ? <p>Aucune conversation pour le moment.</p> : convs.map((c) => (
          <button key={c.id} type="button" className="chat-item" onClick={() => setActive(c)}>
            <AuthorAvatar card={c} /><span><strong>{c.full_name}</strong><small>{c.last_body}</small></span>
            {c.unread > 0 && <span className="notification-count">{c.unread}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
