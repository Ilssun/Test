# Carnet d'entraînement

Application de suivi d'entraînement sportif multiplateforme (Windows,
Android, iOS, Web) pour un club ou une équipe : catalogue de séances,
validation quotidienne, historique et classement partagés entre membres.

## Fonctionnalités

- **Comptes utilisateurs** : inscription par nom d'utilisateur, validation
  par un admin avant la première connexion, changement de mot de passe.
- **Groupes** : pour séparer l'historique visible entre équipes (ex :
  "Équipe du mardi"), un membre appartient à un groupe.
- **Catégories** (ex : Cardio, Renfo), gérées par les admins, pour organiser
  le catalogue de séances en sous-menus.
- **Catalogue de séances** : nom, description, détail des exercices,
  document attaché (PDF/photo, 3 Mo max), import en masse.
- **Ma séance** : validation quotidienne (date, séance, note en étoiles
  optionnelle, commentaire).
- **Historique** : total de séances validées, athlètes actifs, séance
  favorite, classement (traits de comptage), filtres par groupe / membre /
  séance.
- **Admin** : gestion du catalogue de séances et des catégories.
- **Membres** : validation des inscriptions, gestion des groupes,
  promotion admin, réinitialisation de mot de passe, suppression de compte.

## Architecture

Un seul code source React (Expo / React Native) couvre **Android, iOS et
Web** ; l'app Web est ensuite empaquetée avec **Electron** pour produire un
exécutable **Windows**.

```
packages/core     logique métier partagée (Firebase, types, services)
apps/mobile       app Expo (React Native) — Android, iOS, Web
apps/desktop      coquille Electron qui charge l'export Web pour Windows
functions         2 Cloud Functions admin (reset mot de passe / suppression de compte)
firebase.json, firestore.rules, storage.rules   règles de sécurité Firestore + Storage
```

Les données sont stockées sur **Firebase** (Firestore + Auth + Storage) et
se synchronisent automatiquement entre tous tes appareils.

## 1. Créer le projet Firebase

1. Va sur https://console.firebase.google.com et crée un projet.
2. Active **Authentication** → méthode **Email/Password**.
3. Active **Firestore Database** (mode production).
4. Active **Storage**.
5. Dans *Paramètres du projet → Général*, ajoute une app **Web**, puis
   copie les valeurs `apiKey`, `authDomain`, `projectId`,
   `storageBucket`, `messagingSenderId`, `appId`.
6. Passe le projet en forfait **Blaze** (pay-as-you-go) — nécessaire pour
   déployer les Cloud Functions (le volume de cette app reste dans les
   quotas gratuits pour un usage familial/petite structure, mais Firebase
   exige Blaze pour activer les Functions).

## 2. Configurer le code

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
# remplis apps/mobile/.env avec les valeurs Firebase récupérées ci-dessus
```

Déployer les règles de sécurité et les Cloud Functions :

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc
# édite .firebaserc avec l'ID de ton projet Firebase
firebase deploy --only firestore:rules,storage,functions
```

## 3. Premier lancement — créer le premier admin

Par sécurité, l'inscription ne crée **jamais** de compte admin directement
(les règles Firestore l'interdisent). Après ta première inscription dans
l'app :

1. Ouvre la console Firebase → Firestore → collection `users`.
2. Trouve ton document (par ton `username`).
3. Modifie les champs : `role` → `"admin"`, `status` → `"active"`.

Tu peux ensuite te connecter et valider les inscriptions suivantes depuis
l'onglet **Membres** de l'app.

## 4. Lancer en développement

```bash
npm run mobile        # ouvre Expo Dev Tools (scanne le QR code avec Expo Go)
npm run mobile:android
npm run mobile:ios
```

## 5. Distribuer l'app sans passer par un store

Trois façons de rendre l'app disponible pour tes membres, sans Google Play
ni App Store.

### Android — fichier `.apk` à installer directement

Nécessite un compte Expo (gratuit, sur expo.dev).

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build --platform android --profile preview
```

Le build tourne sur les serveurs Expo (quelques minutes) et te donne un
lien de téléchargement direct du `.apk` à la fin. Partage ce lien (email,
Drive, WhatsApp...) — chaque membre télécharge le fichier, autorise
« Installer des applications inconnues » quand Android le demande, et
installe. Pas de Play Store, pas de délai de validation.

### Windows — installeur `.exe`

```bash
npm run web:export                # génère apps/mobile/dist (export web Expo)
rm -rf apps/desktop/web && cp -r apps/mobile/dist apps/desktop/web
cd apps/desktop
npm install
npm run build                     # produit l'installeur .exe dans apps/desktop/release
```

Partage le `.exe` généré directement. Windows SmartScreen affichera un
avertissement (« Windows a protégé votre ordinateur ») car l'app n'est pas
signée — l'utilisateur clique sur « Informations complémentaires » puis
« Exécuter quand même ». Pour supprimer cet avertissement il faudrait un
certificat de signature de code payant (optionnel).

Remplace `apps/desktop/icon.ico` par une vraie icône avant de distribuer
l'installeur (aucune icône par défaut n'est fournie).

### iOS (et tout navigateur) — via Firebase Hosting

Apple ne permet pas d'installer une app en dehors de l'App Store sans
compte développeur payant (99 $/an, même pour TestFlight). L'alternative
gratuite : héberger la version Web sur une URL publique — les utilisateurs
iPhone l'ouvrent dans Safari et peuvent faire « Ajouter à l'écran
d'accueil » pour une icône façon app. Mêmes comptes, mêmes données que sur
Android/Windows puisque c'est le même projet Firebase.

```bash
npm run web:export                # génère apps/mobile/dist
firebase deploy --only hosting
```

Ton app sera disponible sur `https://<ton-projet>.web.app`.

### Publier sur les stores officiels (optionnel, plus tard)

Si tu veux un jour une vraie présence sur Google Play / App Store :

```bash
eas build --platform android --profile production   # génère un .aab pour Play Store
eas build --platform ios                             # nécessite un compte Apple Developer
eas submit --platform android
eas submit --platform ios
```

Nécessite un compte Google Play Console (25 $ une fois) et/ou Apple
Developer (99 $/an), plus un délai de validation.

## Ce que ce dépôt ne fait PAS

- Il ne construit pas de binaires prêts à distribuer (`.apk` / `.exe`) ni
  ne déploie l'hébergement Web — ces builds tournent sur tes propres
  comptes (Expo, Firebase) via les commandes ci-dessus.
- Il ne fournit pas d'icônes ni de splash screen définitifs — remplace les
  fichiers dans `apps/mobile/assets/` et `apps/desktop/icon.ico`.
