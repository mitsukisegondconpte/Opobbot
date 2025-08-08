# Bot WhatsApp Musical 🎵🤖

Un bot WhatsApp complet avec pont musical Telegram, jeux interactifs et architecture multi-services utilisant Node.js et Python.

## Fonctionnalités ✨

### 🎮 Jeux Interactifs
- **Tic-Tac-Toe**: Jouez contre l'IA avec affichage emoji
- **Pierre-Feuille-Ciseaux**: Jeux multi-rounds avec suivi des scores

### 🎵 Intégration Musicale
- Recherche et téléchargement de musique via le pont Telegram @vkmusbot
- Streaming audio haute qualité
- Suggestions de recherche intelligentes

### 🔧 Fonctionnalités Techniques
- Gestion des sessions et traitement des erreurs
- Authentification par code QR ou code d'appariement
- Support multi-langues (Anglais, Français, Créole Haïtien)
- Reconnexion automatique et surveillance de santé
- Limitation de débit et fonctionnalités de sécurité

## Architecture 🏗️

### Service WhatsApp Node.js
- **Bibliothèque Baileys**: Intégration API WhatsApp Web
- **Express.js**: Serveur HTTP pour vérifications de santé
- **Moteurs de Jeu**: Logique Tic-Tac-Toe et Pierre-Feuille-Ciseaux
- **Gestion de Session**: État utilisateur et persistance des jeux

### Pont Telegram Python
- **Telethon**: Automatisation client Telegram
- **aiohttp**: Serveur HTTP asynchrone
- **Récupérateur Musical**: Interaction avec VK Music Bot
- **Traitement Audio**: Capacités de téléchargement et streaming

## Prérequis 📋

### Comptes Requis
1. **Compte Telegram**: Pour le pont bot musical
2. **Compte WhatsApp**: Pour la connexion bot
3. **Identifiants API Telegram**: De https://my.telegram.org

### Configuration Système
- Node.js 16+ 
- Python 3.8+
- Environnement Linux/Unix (pour déploiement)

## Installation 🚀

### 1. Cloner le Référentiel
```bash
git clone <url-du-référentiel>
cd whatsapp-music-bot
