import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Group } from "./types";
import { uid } from "./utils";

const GROUPS = "groups";

export const listGroups = async (): Promise<Group[]> => {
  const snap = await getDocs(query(collection(db, GROUPS), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Group);
};

export const addGroup = async (name: string, existing: Group[]): Promise<Group> => {
  const n = name.trim();
  if (!n) throw new Error("Donne un nom au groupe");
  if (existing.some((g) => g.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce groupe existe déjà");
  const group: Group = { id: uid(), name: n, createdAt: Date.now() };
  await setDoc(doc(db, GROUPS, group.id), group);
  return group;
};

export const renameGroup = async (id: string, name: string, existing: Group[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((g) => g.id !== id && g.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, GROUPS, id), { name: n });
};

export const removeGroup = (id: string) => deleteDoc(doc(db, GROUPS, id));
