import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Category, Session } from "./types";
import { uid } from "./utils";

const CATEGORIES = "categories";

export const listCategories = async (): Promise<Category[]> => {
  const snap = await getDocs(query(collection(db, CATEGORIES), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Category);
};

export const addCategory = async (name: string, existing: Category[]): Promise<Category> => {
  const n = name.trim();
  if (!n) throw new Error("Donne un nom à la catégorie");
  if (existing.some((c) => c.name.toLowerCase() === n.toLowerCase())) throw new Error("Cette catégorie existe déjà");
  const cat: Category = { id: uid(), name: n, createdAt: Date.now() };
  await setDoc(doc(db, CATEGORIES, cat.id), cat);
  return cat;
};

export const renameCategory = async (id: string, name: string, existing: Category[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, CATEGORIES, id), { name: n });
};

// Removing a category doesn't delete its sessions: they become uncategorized,
// mirroring how removing a member group leaves its members "sans groupe".
export const removeCategory = async (id: string, sessions: Session[]) => {
  await deleteDoc(doc(db, CATEGORIES, id));
  const orphaned = sessions.filter((s) => s.catId === id);
  await Promise.all(orphaned.map((s) => updateDoc(doc(db, "sessions", s.id), { catId: "" })));
};
