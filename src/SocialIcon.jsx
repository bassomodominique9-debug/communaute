import { useState } from "react";
import { imageUrl } from "./imageCatalog";
import "./social-icons.css";

// Logo d'un réseau, lu dans le bucket. Si le fichier manque, une lettre de secours s'affiche.
export default function SocialIcon({ social }) {
  const [failed, setFailed] = useState(false);
  const letters = social.name === "WhatsApp" ? "WA" : social.name === "Facebook" ? "f" : social.name === "Instagram" ? "◎" : "@";
  return (
    <span className={`social-fallback-mark social-${social.name.toLowerCase()}`} aria-hidden="true">
      {!failed && <img data-no-fallback="true" src={imageUrl(social.image)} alt="" loading="lazy" onError={() => setFailed(true)} />}
      {failed && letters}
    </span>
  );
}
