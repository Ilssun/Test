import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  approveUser,
  setUserRole,
  setUserGroup,
  countActiveAdmins,
  addGroup,
  removeGroup,
  adminResetPassword,
  adminDeleteUser,
  AppUser,
} from "@carnet/core";
import { Eyebrow, Avatar, Button, Input, Chip } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

export default function MembersScreen() {
  const { me } = useAuth();
  const { users, groups, refreshUsers, refreshGroups } = useData();
  const notify = useToast();
  const [newGroupName, setNewGroupName] = useState("");
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetVal, setResetVal] = useState("");

  if (!me || me.role !== "admin") return null;

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name || "";

  const handleApprove = async (id: string) => {
    await approveUser(id);
    await refreshUsers();
    notify("Compte validé");
  };

  const handleReject = async (u: AppUser) => {
    try {
      await adminDeleteUser(u.id);
      await refreshUsers();
      notify("Compte supprimé");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleToggleAdmin = async (u: AppUser) => {
    if (u.role === "admin" && countActiveAdmins(users) <= 1) {
      return notify("Impossible : il faut garder au moins un admin", "err");
    }
    await setUserRole(u.id, u.role === "admin" ? "member" : "admin");
    await refreshUsers();
    notify(u.role === "admin" ? "Droits admin retirés" : "Promu admin");
  };

  const handleAddGroup = async () => {
    try {
      await addGroup(newGroupName, groups);
      setNewGroupName("");
      await refreshGroups();
      notify("Groupe créé");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const handleRemoveGroup = (id: string, name: string) => {
    Alert.alert(`Supprimer « ${name} » ?`, "Les membres redeviennent sans groupe.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeGroup(id);
          await refreshGroups();
          notify("Groupe supprimé");
        },
      },
    ]);
  };

  const handleResetPassword = async (id: string) => {
    if (resetVal.length < 4) return notify("Mot de passe : 4 caractères minimum", "err");
    try {
      await adminResetPassword(id, resetVal);
      setResetTarget(null);
      setResetVal("");
      notify("Mot de passe réinitialisé");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {pending.length > 0 && (
        <View style={{ marginBottom: 28 }}>
          <Eyebrow>En attente de validation</Eyebrow>
          {pending.map((u) => (
            <View key={u.id} style={styles.row}>
              <Avatar name={u.username} />
              <Text style={styles.name}>{u.username}</Text>
              {u.groupId && groupName(u.groupId) ? <Chip label={groupName(u.groupId)} /> : null}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => handleApprove(u.id)}>
                <Text style={styles.linkOk}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleReject(u)}>
                <Text style={styles.linkDanger}>Refuser</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginBottom: 28 }}>
        <Eyebrow>Groupes</Eyebrow>
        {groups.map((g) => {
          const nb = active.filter((u) => (u.groupId || "") === g.id).length;
          return (
            <View key={g.id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{g.name}</Text>
              <Text style={styles.muted}>{nb} membre{nb > 1 ? "s" : ""}</Text>
              <TouchableOpacity onPress={() => handleRemoveGroup(g.id, g.name)}>
                <Text style={styles.linkDanger}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Input
            placeholder="Nouveau groupe"
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={{ flex: 1 }}
          />
          <Button title="Créer" onPress={handleAddGroup} />
        </View>
      </View>

      <View>
        <Eyebrow>Membres</Eyebrow>
        {active.map((u) => (
          <View key={u.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 8 }}>
            <View style={styles.row}>
              <Avatar name={u.username} />
              <Text style={styles.name}>{u.username}</Text>
              {u.role === "admin" ? <Chip label="Admin" tone="expense" /> : null}
              <View style={{ flex: 1 }} />
            </View>
            <View style={[styles.pickerWrap, { marginTop: 6 }]}>
              <Picker selectedValue={u.groupId || ""} onValueChange={(v) => setUserGroup(u.id, v).then(refreshUsers)}>
                <Picker.Item label="Sans groupe" value="" />
                {groups.map((g) => (
                  <Picker.Item key={g.id} label={g.name} value={g.id} />
                ))}
              </Picker>
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
              <TouchableOpacity onPress={() => handleToggleAdmin(u)}>
                <Text style={styles.link}>{u.role === "admin" ? "Retirer admin" : "Promouvoir admin"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setResetTarget(resetTarget === u.id ? null : u.id)}>
                <Text style={styles.link}>Réinitialiser mdp</Text>
              </TouchableOpacity>
              {u.id !== me.id && (
                <TouchableOpacity onPress={() => handleReject(u)}>
                  <Text style={styles.linkDanger}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
            {resetTarget === u.id && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Input placeholder="Nouveau mot de passe" value={resetVal} onChangeText={setResetVal} secureTextEntry style={{ flex: 1 }} />
                <Button title="OK" onPress={() => handleResetPassword(u.id)} />
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  name: { fontWeight: "700", fontSize: 14.5, color: colors.text },
  muted: { color: colors.muted, fontSize: 12 },
  link: { color: colors.blue, fontWeight: "700", fontSize: 13 },
  linkOk: { color: colors.blue, fontWeight: "700", fontSize: 13 },
  linkDanger: { color: colors.red, fontWeight: "700", fontSize: 13 },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
});
