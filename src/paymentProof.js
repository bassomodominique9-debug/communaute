import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";

export async function uploadProof(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("La preuve doit être une photo (JPG, PNG ou WebP).");
  if (file.size > 8 * 1024 * 1024) throw new Error("Photo trop lourde (8 Mo maximum).");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour envoyer ta preuve de paiement.");
  return uploadFile(user, file, "payment-proofs/");
}
