import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Category, CategoryType } from "./types";
import { uid } from "./utils";

const CATEGORIES = "categories";

export const listCategories = async (): Promise<Category[]> => {
  const snap = await getDocs(query(collection(db, CATEGORIES), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Category);
};

export const addCategory = async (
  name: string,
  type: CategoryType,
  desc: string,
  existing: Category[]
): Promise<Category> => {
  const n = name.trim();
  if (!n) throw new Error("Donne un nom à la catégorie");
  if (existing.some((c) => c.name.toLowerCase() === n.toLowerCase())) throw new Error("Cette catégorie existe déjà");
  const cat: Category = { id: uid(), name: n, type, desc: desc.trim(), createdAt: Date.now() };
  await setDoc(doc(db, CATEGORIES, cat.id), cat);
  return cat;
};

export const renameCategory = async (id: string, name: string, existing: Category[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, CATEGORIES, id), { name: n });
};

export const removeCategory = (id: string) => deleteDoc(doc(db, CATEGORIES, id));

export const bulkImportCategories = async (
  lines: string[],
  existing: Category[]
): Promise<number> => {
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
  let added = 0;
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    const name = parts[0];
    if (!name || existingNames.has(name.toLowerCase())) continue;
    const type: CategoryType = (parts[1] || "").toLowerCase().startsWith("rev") ? "income" : "expense";
    const desc = parts[2] || "";
    existingNames.add(name.toLowerCase());
    const cat: Category = { id: uid(), name, type, desc, createdAt: Date.now() };
    await setDoc(doc(db, CATEGORIES, cat.id), cat);
    added++;
  }
  return added;
};
