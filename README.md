# Video Assistant

Le bouton « ouvrir dans le lecteur vidéo » de Samsung Internet, pour tous les navigateurs.
Il sort n'importe quelle vidéo de sa page et l'ouvre dans un lecteur plein écran, avec gestes et raccourcis.

## Fonctions

- Lecture/pause, ±10 s, barre de progression, vitesse, format (ajuster / remplir / étirer), rotation, image dans l'image, plein écran
- Double-tap gauche/droite : ±10 s · glisser horizontal : avancer/reculer · glisser vertical : luminosité (gauche) / volume (droite)
- Clavier, télécommande, manette : ← → ±5 s, J/L ±10 s, ↑ ↓ volume, Espace/OK pause, F plein écran, M muet, < > vitesse
- Le bouton Retour ferme le lecteur au lieu de quitter la page

## Installation

| Où | Comment |
|---|---|
| Chrome / Edge / Brave | `chrome://extensions` → Mode développeur → **Charger l'extension non empaquetée** → dossier `extension/` |
| Firefox | `about:debugging` → Ce Firefox → **Charger un module temporaire** → `extension/manifest.json` |
| Tampermonkey / Violentmonkey | Installer `video-assistant.user.js` |
| Quest, mobile, autres | Ouvrir `installer.html`, copier le code et l'enregistrer comme adresse d'un favori |

L'extension ajoute un bouton bleu flottant dès qu'une vidéo joue ; l'icône de la barre d'outils ou **Alt+Maj+V** ouvre le lecteur directement.

## Développement

Le code source est dans `src/`. À chaque push, l'action GitHub `Build` régénère automatiquement `extension/`, `video-assistant.user.js`, `installer.html`, `bookmarklet.txt` et `video-assistant-extension.zip`.

Pour les générer en local (Windows) :

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```
