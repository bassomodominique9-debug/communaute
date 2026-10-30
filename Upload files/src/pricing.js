// Calculateur de tarifs. Valeurs par défaut = tarifs confirmés ; l'administrateur peut les modifier
// (table price_settings). Les valeurs non confirmées (cadres, livraison, express) restent à null.

export const STUDIO = {
  photoPrice: 3000,
  minPhotos: 3,
  makeupPerPerson: 7000,
  includedOutfits: 2,
  extraOutfit: 500,
  includedPeople: 2,
  extraPerson: 1000,
};

// Traduit les réglages de la base (clés price_settings) en configuration du calculateur
export function studioConfigFrom(settings) {
  const s = settings || {};
  const num = (k, fallback) => (s[k] == null ? fallback : Number(s[k]));
  return {
    photoPrice: num("photo_price", STUDIO.photoPrice),
    minPhotos: num("photo_min", STUDIO.minPhotos),
    makeupPerPerson: num("makeup_price", STUDIO.makeupPerPerson),
    includedOutfits: num("included_outfits", STUDIO.includedOutfits),
    extraOutfit: num("extra_outfit", STUDIO.extraOutfit),
    includedPeople: num("included_people", STUDIO.includedPeople),
    extraPerson: num("extra_person", STUDIO.extraPerson),
  };
}

export function studioQuote({ photos = 0, makeupPeople = 0, people = 2, outfits = 2 } = {}, cfg = STUDIO) {
  const photoCount = Math.max(Number(photos) || 0, cfg.minPhotos);
  const makeup = Math.max(Number(makeupPeople) || 0, 0);
  const extraPeople = Math.max((Number(people) || 0) - cfg.includedPeople, 0);
  const extraOutfits = Math.max((Number(outfits) || 0) - cfg.includedOutfits, 0);
  const lines = [
    { label: `${photoCount} photo(s) × ${cfg.photoPrice} FCFA`, amount: photoCount * cfg.photoPrice },
  ];
  if (makeup > 0) lines.push({ label: `Maquillage : ${makeup} personne(s) × ${cfg.makeupPerPerson} FCFA`, amount: makeup * cfg.makeupPerPerson });
  if (extraPeople > 0) lines.push({ label: `Personnes supplémentaires : ${extraPeople} × ${cfg.extraPerson} FCFA`, amount: extraPeople * cfg.extraPerson });
  if (extraOutfits > 0) lines.push({ label: `Tenues supplémentaires : ${extraOutfits} × ${cfg.extraOutfit} FCFA`, amount: extraOutfits * cfg.extraOutfit });
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total, minApplied: Number(photos || 0) < cfg.minPhotos };
}

export const FRAME_DEFAULTS = {
  sizes: { "24x30": 4000, "30x45": 6000, "40x60": 15000, "50x70": 20000, "60x80": 26000 },
  framePrice: null,
  express: { available: false, fee: 2000 },
  deliveryFrom: null,
  montageFee: 1000,
};

export function frameQuote({ size, quantity = 1, plexiglas = false, multiPhoto = false, delivery = false,
  express = false, frameCount = 0 } = {}, config = FRAME_DEFAULTS) {
  const lines = [];
  const pending = [];
  const base = config.sizes[size];
  if (base == null) return { lines, total: 0, pending: ["Format non disponible"] };
  const qty = Math.max(Number(quantity) || 1, 1);
  const unit = plexiglas ? base * 2 : base;
  lines.push({ label: `Tableau ${size} cm ${plexiglas ? "(plexiglas)" : "(bois)"} × ${qty}`, amount: unit * qty });
  if (multiPhoto) lines.push({ label: "Montage de plusieurs photos", amount: config.montageFee });
  if (delivery) {
    if (config.deliveryFrom == null) pending.push("Livraison : barème par zone à confirmer");
    else lines.push({ label: "Livraison (à partir de)", amount: config.deliveryFrom });
  }
  if (express) {
    if (!config.express.available) pending.push("Commande express : non disponible actuellement");
    else lines.push({ label: "Option express", amount: config.express.fee });
  }
  const frames = Math.max(Number(frameCount) || 0, 0);
  if (frames > 0) {
    if (config.framePrice == null) pending.push(`${frames} cadre(s) : prix à confirmer`);
    else lines.push({ label: `Cadre(s) × ${frames}`, amount: frames * config.framePrice });
  }
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total, pending };
}
