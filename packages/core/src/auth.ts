import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { AppUser, Role } from "./types";
import { emailForUsername, slug } from "./utils";

const USERS = "users";

export class AuthError extends Error {}

const FRIENDLY_MESSAGES: Record<string, string> = {
  "auth/wrong-password": "Mot de passe incorrect",
  "auth/invalid-credential": "Mot de passe incorrect",
  "auth/user-not-found": "Compte introuvable",
  "auth/too-many-requests": "Trop de tentatives, réessaie dans un instant",
  "auth/weak-password": "Mot de passe : 6 caractères minimum",
  "auth/email-already-in-use": "Ce nom d'utilisateur est déjà pris",
  "auth/network-request-failed": "Pas de connexion réseau",
};

const rethrowFriendly = (e: unknown): never => {
  const code = (e as { code?: string })?.code;
  if (code && FRIENDLY_MESSAGES[code]) throw new AuthError(FRIENDLY_MESSAGES[code]);
  throw e;
};

export const findUserByUsername = async (username: string): Promise<AppUser | null> => {
  const s = slug(username);
  const snap = await getDocs(query(collection(db, USERS), where("usernameLower", "==", username.trim().toLowerCase())));
  if (!snap.empty) return snap.docs[0].data() as AppUser;
  // fall back to slug comparison for legacy/edge-case usernames
  const all = await getDocs(collection(db, USERS));
  const found = all.docs.find((d) => slug((d.data() as AppUser).username) === s);
  return found ? (found.data() as AppUser) : null;
};

export const signup = async (username: string, password: string, groupId: string): Promise<void> => {
  const name = username.trim();
  if (name.length < 2 || name.length > 20) throw new AuthError("Nom d'utilisateur : 2 à 20 caractères");
  if (!/[a-zA-Z0-9]/.test(name)) throw new AuthError("Le nom doit contenir des lettres ou des chiffres");
  const existing = await findUserByUsername(name);
  if (existing) throw new AuthError("Ce nom d'utilisateur est déjà pris");

  const email = emailForUsername(name);
  const cred = await createUserWithEmailAndPassword(auth, email, password).catch(rethrowFriendly);
  const id = cred.user.uid;
  // Every signup starts as a pending member — Firestore rules only allow
  // self-created profiles with this exact role/status. The very first
  // account of a fresh deployment must be promoted to an active admin
  // manually from the Firebase console (see README "First-run setup").
  const profile: AppUser = {
    id,
    username: name,
    usernameLower: name.toLowerCase(),
    email,
    role: "member",
    status: "pending",
    groupId: groupId || "",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, USERS, id), profile);
  await signOut(auth);
};

export const login = async (username: string, password: string): Promise<AppUser> => {
  const name = username.trim();
  const existing = await findUserByUsername(name);
  if (!existing) throw new AuthError("Compte introuvable");
  await signInWithEmailAndPassword(auth, existing.email, password).catch(rethrowFriendly);
  const fresh = (await getDoc(doc(db, USERS, existing.id))).data() as AppUser;
  if (fresh.status !== "active") {
    await signOut(auth);
    throw new AuthError("Compte en attente de validation par un admin");
  }
  return fresh;
};

export const logout = () => signOut(auth);

export const onAuthChange = (cb: (fbUser: FirebaseUser | null) => void) => onAuthStateChanged(auth, cb);

export const getProfile = async (id: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, USERS, id));
  return snap.exists() ? (snap.data() as AppUser) : null;
};

export const getAllUsers = async (): Promise<AppUser[]> => {
  const snap = await getDocs(collection(db, USERS));
  return snap.docs.map((d) => d.data() as AppUser);
};

export const renameSelf = async (id: string, newUsername: string) => {
  const name = newUsername.trim();
  if (name.length < 2 || name.length > 20) throw new AuthError("Nom d'utilisateur : 2 à 20 caractères");
  const existing = await findUserByUsername(name);
  if (existing && existing.id !== id) throw new AuthError("Ce nom d'utilisateur est déjà pris");
  await updateDoc(doc(db, USERS, id), { username: name, usernameLower: name.toLowerCase() });
};

export const changeOwnPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new AuthError("Non connecté");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
};

export const approveUser = (id: string) => updateDoc(doc(db, USERS, id), { status: "active" });

export const deleteUserProfile = (id: string) => deleteDoc(doc(db, USERS, id));

export const setUserRole = (id: string, role: Role) => updateDoc(doc(db, USERS, id), { role });

export const setUserGroup = (id: string, groupId: string) => updateDoc(doc(db, USERS, id), { groupId });

export const countActiveAdmins = (users: AppUser[]) =>
  users.filter((u) => u.role === "admin" && u.status === "active").length;
