# Happy Place : CLAUDE.md

## Contexte
Happy Place est le dashboard interne de **Bigger Boat**, un cabinet de recrutement fictif : actualités, idées et demandes des équipes, points bloquants, indicateurs (KPIs). Projet de la formation « PM & Product Builder ». Tout le texte de l'interface est en **français**.

Ce dépôt contient **une app existante et fonctionnelle**. Le travail consiste à la **faire évoluer** vers la maquette « après » (dossier `design/`), pas à la réécrire.

## Lire d'abord
1. `AGENTS.md` : règles techniques obligatoires (rôles, RLS, smoke tests, bibliothèques navigateur, médias). **Ces règles priment.**
2. `README.md` : installation Supabase, rôles de la version élèves.
3. `design/Main.dc.html` : maquette cible, un seul composant pour les trois profils.

## Pile technique (déjà en place)
- TanStack Start + TanStack Router (routes dans `src/routes`, zone connectée dans `_authenticated`), React, Vite, Tailwind 4, composants shadcn/Radix dans `src/components/ui`.
- Supabase : migrations dans `supabase/migrations`, `setup.sql`, `seed.sql`. Rôles `admin`, `manager`, `collaborateur`.
- Version élèves : entrée libre, écran `/choisir-role`, rôle choisi via `public.choisir_mon_role`. Ne pas réintroduire de liste blanche.
- Tables existantes : `submissions`, `news`, `blockers`, `metrics`, `metrics_history`, `departure_notices`, `teams`, `manager_teams`, `allowed_user_roles`, `submission_status_history`.
- Statuts d'idée actuels : `pending`, `approved`, `rejected` (maquette : en attente, validée, refusée).

## Les trois profils de la maquette
| Profil | Rôle app | Mission |
|---|---|---|
| **Léa** | collaborateur, Relation clients | Suivre le statut de ses idées, consulter les points bloquants de son équipe, lire les actualités |
| **Julien** | manager, Relation clients | Publier une actualité sur son équipe, passer en revue les idées de son équipe |
| **Marc** | admin | Prendre en compte les départs annoncés, gérer les données |

## Cible de la maquette (écart à combler)
**Navigation** : menu à plat dans l'en-tête `BrandHeader`, jamais déroulant.
- Léa et Julien : `Vue d'ensemble`, `Vos actions`.
- Marc : `Vue d'ensemble`, `Gérer les données`, `Vos actions`.
- Les trois profils s'ouvrent par défaut sur `Vue d'ensemble`.
- `Vos actions` (Léa et Julien) porte une pastille rouge avec le nombre de nouveautés non lues depuis la dernière visite : décisions sur les idées de Léa, nouvelles idées à traiter pour Julien. Elle s'efface quand on quitte la page.
- Menu **Profil** à droite : nom, rôle, équipe, photo, « Exporter mes idées » (remplace « Exporter le rapport »), « Déconnexion ».

**Léa**
- Vos actions : bloc `Mes idées` seul, toujours ouvert. Idées en attente et refusées, avec le motif du refus. Bouton « Soumettre une idée » à droite du titre.
- Vue d'ensemble : Actualités du cabinet, Indicateurs, Idées validées, Points bloquants.

**Julien**
- Vos actions : Actualités du cabinet (rédaction avec aide à la rédaction), `Idées de votre équipe à traiter` (repliable), Mes idées (validées automatiquement).
- Vue d'ensemble : Actualités du cabinet, Idées validées, Points bloquants, Indicateurs.

**Marc**
- Vue d'ensemble : uniquement les infos publiées (actualités publiées, indicateurs, idées validées, points bloquants).
- Gérer les données : Rappels de départ, Utilisateurs autorisés.
- Vos actions : Points bloquants, Indicateurs, Actualités. Pas de rédaction d'actualité pour l'admin.

## Règles métier de la maquette
1. **Soumission d'idée** : `Votre nom` (pré-rempli), `Votre idée` (= titre), `Décrivez votre idée` (= description), pièce jointe PDF ou image. Titre et description obligatoires.
2. Une idée de Léa est « En attente » et apparaît dans « Idées de votre équipe à traiter » de Julien.
3. Julien valide, ou refuse avec un **motif obligatoire**. Léa voit le statut, et le motif si refus.
4. Une idée soumise par un **manager** est **validée automatiquement**.
5. « Idées validées » : toutes les idées validées, de la plus récente à la plus ancienne, **4 affichées**, puis « Afficher plus (N restantes) » / « Afficher moins ». Filtre par équipe appliqué avant la limite.
6. Le chip « Validée » n'apparaît que sur les idées de l'utilisateur connecté.
7. **Points bloquants** triés par criticité, filtre d'équipe **présélectionné sur l'équipe du profil**, avec une mention qui l'explique.
8. **Indicateurs** : évolution en chip, hausse en vert, baisse en rouge.

## Design
- Textes plus grands, blocs aérés. Une couleur et un pictogramme par module, couleurs de sévérité conservées.
- Modules : actualités `#6E2470` / `#F4E8F4` ; idées et demandes `#42359A` / `#ECE9F8` ; points bloquants `#17468C` / `#E4EDF9` ; indicateurs `#0A525C` / `#E0F0F2`.
- Sévérité : critique `#8F120C` / `#FBE7E5` ; alerte `#7A4300` / `#FDF0DC`.
- Statuts partout : **validé = vert** (`#E3F3E8` / `#14582F`), **refusé = rouge** (`#FBE7E5` / `#8F120C`), **en attente = gris** (`#ECEBE6` / `#3F4141`).
- Pas de changement de couleur au survol sur les textes d'introduction.
- Accessibilité : `aria-expanded`, `aria-current`, libellés explicites.

## Méthode de travail
- Avant de coder, **comparer l'app existante à la maquette** et proposer un écart par écran. Ne rien coder avant validation.
- Avancer par petites tranches (navigation et en-tête, parcours des idées, actualités, points bloquants et indicateurs, admin), une branche et une PR par tranche.
- Toute migration touchant un ENUM, un trigger ou une fonction de statut : lancer `select * from private.run_smoke_tests();`, toutes les lignes doivent être `ok = true`.
- Vérifier chaque écran avec des captures Playwright comparées à `design/screens/`.
- Les missions des trois profils servent de tests de parcours de bout en bout.
