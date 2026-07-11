import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { Category, CategoryType, Receipt } from "./types";
import { uid } from "./utils";

const CATEGORIES = "categories";

export const listCategories = async (): Promise<Category[]> => {
  const snap = await getDocs(query(collection(db, CATEGORIES), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Category);
};

export interface CategoryFile {
  name: string;
  uri: string;
  blob?: Blob;
}

const uploadCategoryDoc = async (categoryId: string, file: CategoryFile): Promise<Receipt> => {
  const path = `category-docs/${categoryId}-${file.name}`;
  const storageRef = ref(storage, path);
  const blob = file.blob ?? (await (await fetch(file.uri)).blob());
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, path, url };
};

export interface NewCategoryInput {
  name: string;
  type: CategoryType;
  desc: string;
  details: string;
  groupId: string;
  file?: CategoryFile | null;
}

export const addCategory = async (input: NewCategoryInput, existing: Category[]): Promise<Category> => {
  const n = input.name.trim();
  if (!n) throw new Error("Donne un nom à la catégorie");
  if (existing.some((c) => c.name.toLowerCase() === n.toLowerCase())) throw new Error("Cette catégorie existe déjà");
  const id = uid();
  let document: Receipt | null = null;
  if (input.file) document = await uploadCategoryDoc(id, input.file);
  const cat: Category = {
    id,
    name: n,
    type: input.type,
    desc: input.desc.trim(),
    details: input.details.trim(),
    document,
    groupId: input.groupId || "",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, CATEGORIES, id), cat);
  return cat;
};

export const renameCategory = async (id: string, name: string, existing: Category[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, CATEGORIES, id), { name: n });
};

// file: undefined = unchanged, null = remove, object = replace
export const updateCategoryDetails = async (
  cat: Category,
  details: string,
  file: CategoryFile | null | undefined
): Promise<void> => {
  let document = cat.document ?? null;
  if (file === null) {
    if (cat.document) await deleteObject(ref(storage, cat.document.path)).catch(() => {});
    document = null;
  } else if (file) {
    if (cat.document) await deleteObject(ref(storage, cat.document.path)).catch(() => {});
    document = await uploadCategoryDoc(cat.id, file);
  }
  await updateDoc(doc(db, CATEGORIES, cat.id), { details: details.trim(), document });
};

export const moveCategory = (id: string, groupId: string) => updateDoc(doc(db, CATEGORIES, id), { groupId });

export const removeCategory = async (cat: Category) => {
  await deleteDoc(doc(db, CATEGORIES, cat.id));
  if (cat.document) await deleteObject(ref(storage, cat.document.path)).catch(() => {});
};

export const bulkImportCategories = async (
  lines: string[],
  type: CategoryType,
  groupId: string,
  existing: Category[]
): Promise<number> => {
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
  let added = 0;
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    const name = parts[0];
    if (!name || existingNames.has(name.toLowerCase())) continue;
    existingNames.add(name.toLowerCase());
    const cat: Category = {
      id: uid(),
      name,
      type,
      desc: parts[1] || "",
      details: parts[2] || "",
      document: null,
      groupId: groupId || "",
      createdAt: Date.now(),
    };
    await setDoc(doc(db, CATEGORIES, cat.id), cat);
    added++;
  }
  return added;
};
