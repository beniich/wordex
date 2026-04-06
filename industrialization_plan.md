# Plan d'Industrialisation Wordex - SaaS Multi-tenant

Ce plan détaille les étapes pour transformer Wordex en une plateforme SaaS multi-tenant prête pour la production.

## 💳 Sprint 1 : Architecture Multi-tenant (Backend & Prisma)
L'objectif est de structurer la base de données pour isoler les données par "Organisation" (Clinique).

### 1.1 Initialisation de Prisma
- Installer Prisma et `@prisma/client`.
- Créer le fichier `schema.prisma`.
- Configurer la connexion à PostgreSQL.

### 1.2 Schéma Multi-tenant
- Ajout du modèle `Organisation` (ou `Tenant`).
- Ajout du modèle `Subscription` (lié à Stripe).
- Mise à jour des modèles existants :
    - `User` appartient à une `Organisation`.
    - `Workspace` appartient à une `Organisation`.
    - `Document`, `Machine`, etc. héritent de l'isolation via `Workspace` ou directement via `Organisation`.

---

## 💳 Sprint 2 : Intégration Stripe & Plans d'Abonnement
Connecter Stripe pour gérer les paiements et les accès aux fonctionnalités selon le plan.

### 2.1 Configuration Stripe
- Création des produits et prix dans le Dashboard Stripe (Basic, Pro, Enterprise).

### 2.2 Checkout & Portail Client
- Implémentation du flux de paiement (Checkout Session).

---

## 👑 Sprint 3 : Dashboard SUPER_ADMIN
Une interface de contrôle global pour l'administrateur de la plateforme.

- Vue d'ensemble des organisations.
- Statistiques globales (MRR, taux de rétention).

---

## 🎨 Refonte Landing & Pricing
Design d'une page commerciale haut de gamme pour convaincre les cliniques.
