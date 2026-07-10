import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Account } from "./types";
import { uid } from "./utils";

const ACCOUNTS = "accounts";

export const listAccounts = async (): Promise<Account[]> => {
  const snap = await getDocs(query(collection(db, ACCOUNTS), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Account);
};

export const addAccount = async (name: string, desc: string, existing: Account[]): Promise<Account> => {
  const n = name.trim();
  if (!n) throw new Error("Donne un nom au compte");
  if (existing.some((a) => a.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce compte existe déjà");
  const account: Account = { id: uid(), name: n, desc: desc.trim(), createdAt: Date.now() };
  await setDoc(doc(db, ACCOUNTS, account.id), account);
  return account;
};

export const renameAccount = async (id: string, name: string, desc: string, existing: Account[]) => {
  const n = name.trim();
  if (!n) throw new Error("Le nom ne peut pas être vide");
  if (existing.some((a) => a.id !== id && a.name.toLowerCase() === n.toLowerCase())) throw new Error("Ce nom est déjà pris");
  await updateDoc(doc(db, ACCOUNTS, id), { name: n, desc: desc.trim() });
};

export const removeAccount = (id: string) => deleteDoc(doc(db, ACCOUNTS, id));
