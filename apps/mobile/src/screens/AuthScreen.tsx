import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Switch } from "react-native";
import { login, signup, listGroups, AuthError, Group } from "@carnet/core";
import { Input, Button, Eyebrow } from "../components/ui";
import { colors, fonts } from "../theme";
import { useToast } from "../context/ToastContext";
import { Picker } from "@react-native-picker/picker";

export default function AuthScreen() {
  const notify = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    listGroups().then(setGroups).catch(() => {});
  }, []);

  const handle = async () => {
    setBusy(true);
    try {
      if (mode === "login") {
        if (!username.trim() || !pass) throw new AuthError("Nom d'utilisateur et mot de passe requis");
        await login(username, pass);
        notify("Bienvenue !");
      } else {
        if (pass.length < 4) throw new AuthError("Mot de passe : 4 caractères minimum");
        if (pass !== pass2) throw new AuthError("Les deux mots de passe ne correspondent pas");
        await signup(username, pass, groupId);
        setInfo("Compte créé ! Un admin doit le valider avant ta première connexion.");
        setMode("login");
        notify("Compte créé, en attente de validation");
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Une erreur est survenue", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Carnet{"\n"}d'entraînement</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{mode === "login" ? "Connexion" : "Créer un compte"}</Text>
        <Text style={styles.cardSub}>
          {mode === "login"
            ? "Le carnet est réservé aux membres du club."
            : "Ton compte devra être validé par un admin avant ta première connexion."}
        </Text>
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Input placeholder="Nom d'utilisateur" value={username} onChangeText={setUsername} autoCapitalize="none" style={{ marginTop: 16 }} />
        <Input placeholder="Mot de passe" value={pass} onChangeText={setPass} secureTextEntry style={{ marginTop: 8 }} />
        {mode === "signup" && (
          <Input placeholder="Confirme le mot de passe" value={pass2} onChangeText={setPass2} secureTextEntry style={{ marginTop: 8 }} />
        )}
        {mode === "signup" && groups.length > 0 && (
          <View style={styles.pickerWrap}>
            <Picker selectedValue={groupId} onValueChange={setGroupId}>
              <Picker.Item label="Choisir un groupe (optionnel)" value="" />
              {groups.map((g) => (
                <Picker.Item key={g.id} label={g.name} value={g.id} />
              ))}
            </Picker>
          </View>
        )}
        <View style={{ height: 12 }} />
        <Button
          title={busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          onPress={handle}
          variant="red"
          disabled={busy}
        />
        <View style={{ height: 8 }} />
        <Button
          title={mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà membre ? Se connecter"}
          onPress={() => {
            setMode(mode === "login" ? "signup" : "login");
            setInfo("");
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.paper, padding: 20, justifyContent: "center" },
  title: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.text,
    textTransform: "uppercase",
    lineHeight: 46,
    marginBottom: 24,
    textAlign: "center",
  },
  card: { backgroundColor: colors.sheet, borderWidth: 2, borderColor: colors.blue, borderRadius: 12, padding: 20 },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.text, textAlign: "center", textTransform: "uppercase" },
  cardSub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginTop: 4 },
  info: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.red,
    borderWidth: 2,
    borderColor: colors.red,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  pickerWrap: { borderWidth: 2, borderColor: colors.blue, borderRadius: 8, marginTop: 8, backgroundColor: colors.field },
});
