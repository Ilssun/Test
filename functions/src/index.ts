import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp();

const requireActiveAdmin = async (uid: string | undefined) => {
  if (!uid) throw new HttpsError("unauthenticated", "Connecte-toi d'abord.");
  const snap = await getFirestore().collection("users").doc(uid).get();
  const caller = snap.data();
  if (!caller || caller.role !== "admin" || caller.status !== "active") {
    throw new HttpsError("permission-denied", "Réservé aux admins.");
  }
};

export const adminResetPassword = onCall(async (request) => {
  await requireActiveAdmin(request.auth?.uid);
  const { targetUserId, newPassword } = request.data as { targetUserId: string; newPassword: string };
  if (!targetUserId || typeof newPassword !== "string" || newPassword.length < 4) {
    throw new HttpsError("invalid-argument", "Mot de passe : 4 caractères minimum.");
  }
  await getAuth().updateUser(targetUserId, { password: newPassword });
  return { ok: true };
});

export const adminDeleteUser = onCall(async (request) => {
  await requireActiveAdmin(request.auth?.uid);
  const { targetUserId } = request.data as { targetUserId: string };
  if (!targetUserId) throw new HttpsError("invalid-argument", "Compte manquant.");
  if (targetUserId === request.auth?.uid) {
    throw new HttpsError("failed-precondition", "Tu ne peux pas supprimer ton propre compte.");
  }
  const db = getFirestore();
  const targetSnap = await db.collection("users").doc(targetUserId).get();
  const target = targetSnap.data();
  if (target?.role === "admin" && target?.status === "active") {
    const admins = await db
      .collection("users")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();
    if (admins.size <= 1) {
      throw new HttpsError("failed-precondition", "Il faut garder au moins un admin.");
    }
  }
  await db.collection("users").doc(targetUserId).delete();
  await getAuth().deleteUser(targetUserId);
  return { ok: true };
});
