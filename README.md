# 🍽️ Bon Plan

**Bon Plan** est une application web (installable sur mobile, PWA) qui recense les **cafés et restaurants des 24 gouvernorats de Tunisie** : menus en photos, photos des lieux, emplacement sur la carte, avis, et **mini-jeux** qui font gagner des points échangeables contre des **bons d'achat** chez les commerçants partenaires.

Interface **en français** (par défaut) et **en anglais** (bouton FR / EN dans l'en-tête).

## Fonctionnalités

### Utilisateur
- Recherche par nom, ville ou cuisine ; filtres : type (café / restaurant), gouvernorat, budget, équipements (Wi-Fi, terrasse, vue sur mer…).
- **Autour de moi** : géolocalisation du navigateur, tri par distance.
- Vue **liste** ou **carte** (Leaflet + OpenStreetMap).
- Fiche établissement : photos du menu (galerie plein écran), menu détaillé avec prix en DT, photos du lieu, carte, horaires, itinéraire Google Maps, appel, partage, favoris.
- Avis et notes (points offerts pour un premier avis).
- **Jeux** : Quiz Tunisie, Memory gourmand, Roue de la chance (1 tour par jour).
- **Quiz relié aux menus** : sur 5 questions, jusqu'à 3 (réglable) portent sur de vrais établissements — « Lequel de ces articles figure au menu de… ? », « Combien coûte… chez… ? », « Quel est l'article le moins cher de la catégorie… ? », « Dans quel gouvernorat se trouve… ? ». Chaque question affiche l'établissement avec un lien **« Voir le menu »** : le joueur consulte la fiche pour trouver la réponse, ce qui donne de la visibilité au café ou restaurant. Les établissements des commerçants abonnés apparaissent plus souvent (priorité réglable), et le récapitulatif de fin de partie liste les établissements découverts.
- **Bons d'achat** : échange de points contre une offre, code unique `BP-XXXX-XXXX` à présenter au commerçant, annulation avec remboursement.
- Mon espace : solde, bons, favoris, historique des points, **code de parrainage**.
- **Classement** des joueurs sur 30 jours.

### Commerçant
- Création et modification de ses établissements (position choisie sur la carte).
- Envoi de photos (menu / lieu) depuis un fichier ou une URL ; gestion du menu ; création d'offres (coût en points, stock, date d'expiration).
- **Validation des bons d'achat** des clients (un code ne peut servir qu'une fois).
- **Statistiques de visibilité** sur 30 jours : vues au total, vues de la fiche, affichages dans le quiz, visites depuis le quiz, graphique des vues par jour, détail par établissement.
- Suivi de l'abonnement et demande d'abonnement (mensuel / annuel).

### Administrateur
- Tableau de bord : statistiques (dont les vues sur 30 jours), classement des établissements les plus consultés, répartition par gouvernorat. Colonne « Vues » dans la liste des établissements.
- **Commerçants** : blocage / déblocage avec motif (bloquer un commerçant masque tous ses établissements), gestion des abonnements (créer, marquer payé / impayé).
- **Blocage automatique** des établissements quand l'abonnement n'est pas payé (délai de grâce réglable). Le déblocage est automatique dès que le paiement est enregistré ; les blocages manuels de l'admin ne sont jamais levés automatiquement.
- **Établissements** : bloquer / débloquer, mettre à la une, rattacher un lieu importé à un commerçant, supprimer.
- **Utilisateurs** : rôle, blocage, ajustement des points. **Avis** : modération.
- **Paramètres** : prix des abonnements, parties par jour, points par jeu, points de parrainage, validité des bons…

### Nombre de vues
Chaque fiche affiche son nombre de vues (👁), visible aussi sur les cartes de la liste ; la recherche peut trier par **« Les plus vus »**. Une vue = **un visiteur unique par jour** (compte utilisateur, ou identifiant anonyme en cookie pour les visiteurs non connectés). Les vues du propriétaire et des administrateurs, les robots et les préchargements de page ne sont pas comptés (la vue est enregistrée par le navigateur une fois la page affichée).

### Sécurité des jeux
Les points sont toujours calculés **côté serveur** : réponses du quiz chiffrées dans un jeton (le navigateur ne peut pas les lire), durée du memory mesurée par le serveur, résultat de la roue tiré par le serveur, nombre de parties limité par jour. L'échange de points est atomique (pas de solde négatif ni de stock négatif).

## Stack technique
- [Next.js 14](https://nextjs.org) (App Router, Server Actions), React 18, TypeScript, Tailwind CSS
- [Prisma](https://www.prisma.io) : SQLite en développement, PostgreSQL conseillé en production
- Sessions signées (JWT HS256 via `jose`) dans un cookie httpOnly, mots de passe `bcrypt`
- Leaflet / react-leaflet pour les cartes

## Démarrage

```bash
cp .env.example .env        # puis changez AUTH_SECRET
npm install
npm run db:push             # crée la base
npm run db:seed             # 24 gouvernorats + comptes et lieux de démonstration
npm run dev                 # http://localhost:3000
```

Comptes de démonstration :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | admin@bonplan.tn | Admin123! |
| Commerçant (abonnement payé) | commercant@bonplan.tn | Demo1234! |
| Commerçant (impayé → bloqué) | impaye@bonplan.tn | Demo1234! |
| Utilisateur (250 points) | user@bonplan.tn | Demo1234! |

## Extraction des cafés et restaurants de toute la Tunisie

Le script `scripts/import-osm.ts` récupère tous les lieux `amenity=cafe|restaurant|fast_food` de chaque gouvernorat (codes ISO 3166-2 `TN-11` à `TN-83`) depuis **OpenStreetMap** via l'API Overpass, puis les enregistre ou les met à jour (nom, adresse, téléphone, horaires, cuisine, équipements, position).

```bash
npm run import:osm                         # les 24 gouvernorats
npm run import:osm -- --gov=tunis,sfax     # seulement certains
npm run import:osm -- --dry-run            # compter sans écrire
```

- Données sous licence **ODbL** : l'attribution « © contributeurs OpenStreetMap » est affichée dans l'application.
- Un lieu rattaché à un commerçant n'est jamais écrasé par un nouvel import.
- Les lieux OSM n'ont pas de photos : ce sont les commerçants qui ajoutent menus et photos depuis leur espace (l'admin rattache le lieu au compte du commerçant).
- Les données de démonstration (`source = DEMO`) sont marquées « Démo » et peuvent être supprimées une fois l'import réel fait.

## Abonnements : contrôle quotidien
Le contrôle s'exécute automatiquement à chaque modification d'abonnement. Pour gérer les expirations, planifiez-le une fois par jour :

```bash
npm run subscriptions:enforce
# ou, sur le serveur déployé (définir CRON_SECRET) :
curl -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron/subscriptions
```

## API publique
`GET /api/venues?q=&type=CAFE|RESTAURANT&gov=tunis&lat=&lng=&sort=distance|rating|name|recent&page=1` renvoie les établissements visibles en JSON (base pour une future application mobile native).

## Scripts
| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | développement / build / production |
| `npm test` | tests unitaires (jeux, géographie, import OSM, traductions) |
| `npm run typecheck` | vérification TypeScript |
| `npm run db:reset` | réinitialise la base et relance le seed |

## Mise en production
1. Passez `provider = "postgresql"` dans `prisma/schema.prisma` et renseignez `DATABASE_URL`.
2. Définissez un `AUTH_SECRET` long et aléatoire, et `CRON_SECRET`.
3. Les photos envoyées sont stockées dans `public/uploads/` : sur un hébergement sans disque persistant (Vercel…), remplacez par un stockage objet (S3, Cloudinary) dans `src/app/actions/merchant.ts`.
4. Paiement en ligne des abonnements : aujourd'hui l'admin enregistre les paiements à la main ; une passerelle (Konnect, Flouci, carte e-Dinar…) peut appeler la même logique (`enforceForMerchant`).

## Idées pour la suite
- Application mobile native (React Native) branchée sur `/api/venues`
- Notifications push (nouvelles offres près de chez soi)
- Réservation de table, commande à emporter
- Arabe (RTL) comme troisième langue — les noms des gouvernorats sont déjà en arabe
