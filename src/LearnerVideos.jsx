import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { safeUrl } from "./Attachments";

export const youtubeId = (url) => (String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];

export function VideoPlayer({ url, title }) {
  const id = youtubeId(url);
  return id
    ? <iframe className="video-frame" src={`https://www.youtube-nocookie.com/embed/${id}`} title={title || "Vidéo"} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
    : <video className="video-frame" src={safeUrl(url)} controls playsInline preload="metadata" />;
}

export default function LearnerVideos() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    supabase.from("learner_videos").select("id, title, description, video_url, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data, error }) => { if (!error) setItems(data || []); });
  }, []);
  if (items.length === 0) return null;
  return (
    <section className="learner-videos section-container" aria-label="Vidéos des apprenants">
      <div className="section-heading"><span className="eyebrow">VIDÉOS DES APPRENANTS</span><h2>Ils racontent <span>leur parcours</span></h2></div>
      <div className="video-grid">
        {items.map((v) => (
          <article className="video-card" key={v.id}>
            <VideoPlayer url={v.video_url} title={v.title} />
            <h3>{v.title}</h3>
            {v.description && <p>{v.description}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
