import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { CategoryGroup, Category } from "./types";
import { uid } from "./utils";

const CATEGORY_GROUPS = "categoryGroups";

export const listCategoryGroups = async (): Promise<CategoryGroup[]> => {
  const snap = await getDocs(query(collection(db, CATEGORY_GROUPS), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as CategoryGroup);
};

export const addCategoryGroup = async (name: string, existing: CategoryGroup[]): Promise<CategoryGroup> => {
  const n = name.trim();
  if (!n) throw new Error("Donne un nom au groupe de catégories");
  if (existing.some((g) => g.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce groupe existe déjà");
  const group: CategoryGroup = { id: uid(), name: n, createdAt: Date.now() };
  await setDoc(doc(db, CATEGORY_GROUPS, group.id), group);
  return group;
};

export const renameCategoryGroup = async (id: string, name: string, existing: CategoryGroup[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((g) => g.id !== id && g.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, CATEGORY_GROUPS, id), { name: n });
};

// Removing a group doesn't delete its categories: they become ungrouped,
// mirroring how removing a member group leaves its members "sans groupe".
export const removeCategoryGroup = async (id: string, categories: Category[]) => {
  await deleteDoc(doc(db, CATEGORY_GROUPS, id));
  const orphaned = categories.filter((c) => c.groupId === id);
  await Promise.all(orphaned.map((c) => updateDoc(doc(db, "categories", c.id), { groupId: "" })));
};
