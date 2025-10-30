# Lionfish Logger — PWA (clé en main)

Une mini‑application **mobile** (web) pour saisir les **captures de poisson‑lion** : site, méthode, **profondeur**, **effort** (plongeurs × temps), **classes de taille**, **CPUE**, **notes** — avec **export CSV/JSON** et **synchronisation** vers un **Google Sheet** (webhook).

## Fonctionnalités
- **Offline‑first** (cache + localStorage) — installable comme **PWA** (icône écran d’accueil).
- **GPS** (bouton), sites prédéfinis (paramétrables), bandes de profondeur, méthodes (scuba/freedive/tech).
- **Compteurs par classes de taille** (0–10, 10–15, 15–20, 20–25, 25–30, ≥30 cm).
- **CPUE** automatique = individus / (plongeurs × heures).
- **Export** CSV/JSON, **Web Share** quand disponible.
- **Sync** vers Google Sheets via **Apps Script** (fichier `webhook.gs`).

## Déploiement (hébergement **gratuit**)

### Option A — **GitHub Pages** (ultra simple)
1. Créez un dépôt GitHub vide (ex. `lionfish-logger`).
2. Glissez‑déposez les fichiers du dossier dans le dépôt (`index.html`, `app.js`, `manifest.webmanifest`, `sw.js`, `icons/`, etc.).
3. Allez dans **Settings → Pages → Source**: sélectionnez **Deploy from a branch**, choisissez `main` et le répertoire `/root` (ou `/`).
4. L’URL publique sera du type `https://<votre-user>.github.io/lionfish-logger/`.

### Option B — **Netlify** (drag‑and‑drop)
1. Connectez‑vous sur netlify.app (compte gratuit). 
2. **Add new site → Deploy manually** et glissez‑déposez le dossier. 
3. L’URL sera `https://<nom>.netlify.app`.

### Option C — **Vercel**
1. `New Project` → importez le repo GitHub (ou drag‑and‑drop).
2. Build **non nécessaire** (site statique) → Deploy → URL `https://<nom>.vercel.app`.

> L’app est 100 % statique : **aucun serveur** requis.

## Activer la synchronisation (Google Sheets)
1. Créez un **Google Sheet** et récupérez l’ID du fichier (dans l’URL).
2. Ouvrez **Extensions → Apps Script** et collez le contenu de `webhook.gs`.
3. Remplacez `PASTE_YOUR_SHEET_ID_HERE` par l’ID du Sheet.
4. **Deploy → New deployment → Web app** : *Anyone with the link*.
5. Copiez l’URL de déploiement et collez‑la dans **Paramètres → Webhook URL** de l’app.
6. Testez **Export → Synchroniser** : les lignes doivent s’ajouter à la feuille `lionfish_logs`.

## Utilisation (terrain)
- **Paramètres** : renseignez `Club`, `Équipe`, `Webhook URL`, la liste des **Sites** (un par ligne). Activez **GPS auto** si souhaité.
- **Saisie** : remplissez les champs, utilisez **+ / −** pour les classes de taille, puis **Enregistrer**. 
- **Dernières saisies** : supprimez/partagez si besoin. 
- **Tableau** : suivez **Total aujourd’hui**, **Nb saisies**, **CPUE moyenne**.
- **Export / Sync** : exportez CSV/JSON ou **Synchronisez** vers le Sheet.

## Personnalisation
- Modifiez les **bandes de profondeur** et **classes de taille** dans `app.js` (`SIZE_BINS`, `DEPTH_BANDS`).
- Remplacez les **icônes** dans `icons/` (192 & 512 px).

## Licence
MIT — utilisez, modifiez et déployez librement.
