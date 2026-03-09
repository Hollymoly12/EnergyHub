# Extensions VS Code — EnergyHub

## Installation rapide
Copie-colle chaque identifiant dans VS Code : Ctrl+P (Cmd+P sur Mac) → `ext install [identifiant]`

---

## 🤖 IA & Productivité
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| Claude Code | anthropic.claude-code | Agent IA principal du projet |
| GitHub Copilot | github.copilot | Autocomplétion IA en temps réel |
| GitHub Copilot Chat | github.copilot-chat | Chat IA dans VS Code |

---

## ⚛️ Next.js & React
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| ES7+ React Snippets | dsznajder.es7-react-js-snippets | Snippets rfc, useState, useEffect |
| Next.js Snippets | pulkitgangwar.nextjs-snippets | Snippets Next.js spécifiques |
| Auto Import | steoates.autoimport | Import automatique des composants |

---

## 🎨 Tailwind CSS
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| Tailwind CSS IntelliSense | bradlc.vscode-tailwindcss | Autocomplétion classes Tailwind |
| Headwind | heybourn.headwind | Trie les classes Tailwind automatiquement |

---

## 🔷 TypeScript & Qualité
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| TypeScript Error Translator | mattpocock.ts-error-translator | Traduit les erreurs TypeScript en français clair |
| ESLint | dbaeumer.vscode-eslint | Détecte les erreurs de code |
| Prettier | esbenp.prettier-vscode | Formate le code automatiquement |
| Error Lens | usernamehw.errorlens | Affiche les erreurs inline dans le code |

---

## 🗄️ Supabase & Base de données
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| SQLTools | mtxr.sqltools | Éditeur SQL dans VS Code |
| SQLTools PostgreSQL | mtxr.sqltools-driver-pg | Connexion directe à Supabase |
| PostgreSQL | ckolkman.vscode-postgres | Coloration syntaxique SQL |

---

## 🔧 Git & Collaboration  
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| GitLens | eamodio.gitlens | Historique git inline, blame, comparaison |
| Git Graph | mhutchie.git-graph | Visualisation graphique des branches |
| GitHub Pull Requests | github.vscode-pull-request-github | Gérer les PRs sans quitter VS Code |

---

## 🌐 API & Debug
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| Thunder Client | rangav.vscode-thunder-client | Tester les APIs REST (comme Postman) |
| REST Client | humao.rest-client | Tester les APIs depuis des fichiers .http |
| JSON Crack | aykutsarac.jsoncrack-vscode | Visualiser les JSON complexes |

---

## 📁 Confort & Navigation
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| File Nesting Configurator | antfu.file-nesting | Groupe les fichiers liés (page.tsx + layout.tsx) |
| Material Icon Theme | pkief.material-icon-theme | Icônes pour chaque type de fichier |
| One Dark Pro | zhuangtongfa.material-theme | Thème sombre optimal (proche du design EnergyHub) |
| Auto Rename Tag | formulahendry.auto-rename-tag | Renomme les balises HTML/JSX en paire |
| Path Intellisense | christian-kohler.path-intellisense | Autocomplétion des chemins de fichiers |
| Bracket Pair Colorizer | coenraads.bracket-pair-colorizer-2 | Colorie les parenthèses/accolades |

---

## ⚡ Performance & Bundle
| Extension | Identifiant | Pourquoi |
|-----------|-------------|---------|
| Import Cost | wix.vscode-import-cost | Affiche le poids de chaque import |
| Bundle Size | ambar.bundle-size | Surveille la taille du bundle |

---

## Configuration Prettier recommandée
Crée un fichier `.prettierrc` à la racine du projet :
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Configuration VS Code recommandée
Crée `.vscode/settings.json` :
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  }
}
```

## Ordre d'installation recommandé
1. Prettier + ESLint (qualité de code immédiate)
2. Tailwind CSS IntelliSense (productivité frontend)
3. Error Lens (debug plus rapide)
4. GitLens (comprendre l'historique)
5. Thunder Client (tester les APIs Supabase)
6. Le reste selon les besoins
