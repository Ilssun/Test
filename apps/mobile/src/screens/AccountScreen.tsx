import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { renameSelf, changeOwnPassword, setUserGroup, logout, AuthError } from "@carnet/core";
import { Eyebrow, Input, Button } from "../components/ui";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

export default function AccountScreen() {
  const { me, refreshMe } = useAuth();
  const { groups } = useData();
  const notify = useToast();

  const [name, setName] = useState(me?.username || "");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  if (!me) return null;

  const saveName = async () => {
    try {
      await renameSelf(me.id, name);
      await refreshMe();
      notify("Nom mis à jour");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Échec", "err");
    }
  };

  const savePassword = async () => {
    if (newPass.length < 4) return notify("Mot de passe : 4 caractères minimum", "err");
    if (newPass !== newPass2) return notify("Les deux mots de passe ne correspondent pas", "err");
    try {
      await changeOwnPassword(curPass, newPass);
      setCurPass("");
      setNewPass("");
      setNewPass2("");
      notify("Mot de passe mis à jour");
    } catch (e) {
      notify(e instanceof AuthError ? e.message : "Mot de passe actuel incorrect", "err");
    }
  };

  const changeGroup = async (groupId: string) => {
    await setUserGroup(me.id, groupId);
    await refreshMe();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ marginBottom: 24 }}>
        <Eyebrow>Mon nom d'utilisateur</Eyebrow>
        <Input value={name} onChangeText={setName} />
        <View style={{ height: 8 }} />
        <Button title="Enregistrer" onPress={saveName} />
      </View>

      <View style={{ marginBottom: 24 }}>
        <Eyebrow>Mon groupe</Eyebrow>
        {groups.length === 0 ? (
          <Text style={{ color: colors.muted }}>Aucun groupe n'a encore été créé par les admins.</Text>
        ) : (
          <View style={styles.pickerWrap}>
            <Picker selectedValue={me.groupId || ""} onValueChange={changeGroup}>
              <Picker.Item label="Sans groupe" value="" />
              {groups.map((g) => (
                <Picker.Item key={g.id} label={g.name} value={g.id} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={{ marginBottom: 24 }}>
        <Eyebrow>Changer mon mot de passe</Eyebrow>
        <Input placeholder="Mot de passe actuel" value={curPass} onChangeText={setCurPass} secureTextEntry />
        <View style={{ height: 8 }} />
        <Input placeholder="Nouveau mot de passe" value={newPass} onChangeText={setNewPass} secureTextEntry />
        <View style={{ height: 8 }} />
        <Input placeholder="Confirme le nouveau mot de passe" value={newPass2} onChangeText={setNewPass2} secureTextEntry />
        <View style={{ height: 8 }} />
        <Button title="Mettre à jour" onPress={savePassword} />
      </View>

      <Button title="Se déconnecter" onPress={() => logout()} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, backgroundColor: colors.field },
});
