# 🏗️ Plan de Professionnalisation Global — Wordex Platform
> Analyse complète de tous les services · Priorités Backend + Frontend

---

## 📊 Résumé de l'audit

| Module | État Backend | État Frontend | Criticité |
|--------|-------------|---------------|-----------|
| **Gantt** | ✅ Tables dédiées (fait) | ⚠️ Refactoré partiel | 🔴 En cours |
| **Dashboard BI** | 🔴 100% `random.randint()` — mock pur | 🟡 Composants présents | 🔴 Critique |
| **Sheets** | 🟡 Wrapper documents JSONB | 🟡 Formules simulées | 🟠 Important |
| **Slides** | 🟡 Wrapper documents JSONB | 🟡 Fallback local | 🟠 Important |
| **Analytics** | 🔴 Pas de router dédié | 🔴 Mapping cellules hardcodé | 🔴 Critique |
| **AI (Ollama)** | ✅ Complet + streaming | 🟡 Pas de historique chat | 🟡 Moyen |
| **Notifications** | ✅ SSE + DB + push | 🟡 Pas de badge temps réel | 🟡 Moyen |
| **Webhooks** | ✅ Complet + delivery log | 🟡 Dashboard readonly | 🟡 Moyen |
| **Export** | ✅ PDF/DOCX/PPTX | 🟡 Pas de prévisualisation | 🟡 Moyen |
| **Auth** | ✅ JWT + refresh | ✅ Fonctionnel | ✅ Stable |
| **Documents** | ✅ CRUD + versions + search | ✅ Fonctionnel | ✅ Stable |
| **Event Bus** | ✅ Redis pub/sub | 🔴 Non consommé en frontend | 🟡 Moyen |

---

## 🔴 MODULE 1 — Dashboard BI (dashboard.py)

### Problème
**Tout est `random.randint()`** — zéro connexion BDD. Les données changent à chaque refresh. Inutilisable en production.

### Plan Backend

#### 1.1 Nouvelles tables SQL
```sql
-- Machines / équipements
CREATE TABLE IF NOT EXISTS machines (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    machine_type TEXT DEFAULT 'press',    -- press | robot | line | sensor
    location    TEXT,
    status      TEXT DEFAULT 'online',    -- online | offline | maintenance
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Relevés OEE / TRS (time-series)
CREATE TABLE IF NOT EXISTS machine_metrics (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id  UUID REFERENCES machines(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    availability INT CHECK (availability BETWEEN 0 AND 100),
    performance  INT CHECK (performance BETWEEN 0 AND 100),
    quality      INT CHECK (quality BETWEEN 0 AND 100),
    oee          INT GENERATED ALWAYS AS (availability * performance * quality / 10000) STORED,
    shift        TEXT DEFAULT 'morning'   -- morning | afternoon | night
);

-- Production runs (lots)
CREATE TABLE IF NOT EXISTS production_runs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    machine_id  UUID REFERENCES machines(id),
    shift       TEXT NOT NULL,
    target_lots INT DEFAULT 250,
    actual_lots INT DEFAULT 0,
    date        DATE DEFAULT CURRENT_DATE
);

-- AMDEC failure modes
CREATE TABLE IF NOT EXISTS amdec_failures (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    machine_id  UUID REFERENCES machines(id),
    mode        TEXT NOT NULL,
    severity    INT CHECK (severity BETWEEN 1 AND 10),
    occurrence  INT CHECK (occurrence BETWEEN 1 AND 10),
    detection   INT CHECK (detection BETWEEN 1 AND 10),
    rpn         INT GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
    status      TEXT DEFAULT 'open',      -- open | mitigated | closed
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_machine_metrics_machine ON machine_metrics(machine_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_runs_date ON production_runs(workspace_id, date DESC);
```

#### 1.2 Nouveaux endpoints `/api/dashboard/`
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/dashboard/trs-oee?workspace_id=&timeframe=` | TRS réel depuis la BDD |
| `GET` | `/dashboard/production-tracking?workspace_id=&date=` | Lots par shift depuis BDD |
| `GET` | `/dashboard/s-curve?workspace_id=` | Courbe d'avancement réelle |
| `GET` | `/dashboard/amdec?workspace_id=&risk=` | Modes de défaillance réels |
| `POST` | `/dashboard/machines` | Créer une machine |
| `POST` | `/dashboard/metrics` | Injecter un relevé OEE |
| `POST` | `/dashboard/production` | Enregistrer un lot de production |

### Plan Frontend

#### 1.3 Refactoring composants
- `DashboardLayout.tsx` : passer `workspaceId` comme prop à tous les widgets
- `widgets/TrsOeeWidget.tsx` : consomme `/api/dashboard/trs-oee?workspace_id=`
- `widgets/ProductionWidget.tsx` : consomme `/api/dashboard/production-tracking`
- `widgets/SCurveWidget.tsx` : timeline calculée depuis la BDD de projets
- `widgets/AmdecWidget.tsx` : modes de défaillance sauvegardés
- `DashboardSidebar.tsx` : filtres par workspace + date picker

---

## 🔴 MODULE 2 — Analytics (useAnalyticsEngine.ts)

### Problème
- Pas de router backend `/analytics/` (utilise `sheets.list` qui retourne `doc_type: 'sheet'` inexistant)
- Le mapping des cellules est hardcodé avec des valeurs statiques en fallback
- `doc_type: 'analytics'` n'existe pas dans les models

### Plan Backend

#### 2.1 Corriger models.py doc_type
```diff
- pattern=r'^(note|spreadsheet|presentation|gantt)$'
+ pattern=r'^(note|spreadsheet|presentation|gantt|analytics)$'
```

#### 2.2 Router `/api/analytics/` (nouveau)
```python
GET  /analytics/{workspace_id}           # KPIs agrégés depuis les sheets du workspace
GET  /analytics/{workspace_id}/variables # Variables liées (cellule → KPI)
POST /analytics/{workspace_id}/variables # Créer un lien cellule → widget
```

### Plan Frontend

#### 2.3 Refactoring useAnalyticsEngine.ts
- Supprimer les valeurs en dur (`68.8`, `14.8`, `1.8`, `[10, 25, 45, 30, 55, 40]`)
- Charger depuis le vrai router backend
- Widget de configuration : "quel range de cellule alimente quel KPI ?"

---

## 🟠 MODULE 3 — Sheets (spreadsheet)

### Problème
- `evaluateExpression` et `findDependentCells` sont des **stubs** (retournent `15` et `[]` hardcodés)
- Pas de moteur de formules réel
- `useAnalyticsEngine` appelle `sheets.list(workspaceId)` qui n'existe pas dans `api.ts`

### Plan Backend
Déjà ok (wrapper sur `documents` avec JSONB). Ajouter :
```
GET /sheets/{id}/export       # Export CSV
POST /sheets/{id}/import-csv  # Import CSV
```

### Plan Frontend

#### 3.1 Moteur de formules réel
Intégrer **HyperFormula** (lib open-source MIT) au lieu du stub :
```typescript
import HyperFormula from 'hyperformula';
const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
// Évalue =SUM(A1:A5), =AVERAGE(...), =IF(...), etc.
```

#### 3.2 Corriger api.ts — sheets.list manquant
```typescript
export const sheets = {
  list: (workspaceId: string) =>
    apiFetch<Document[]>(`/documents/?workspace_id=${workspaceId}&doc_type=spreadsheet`),
  // ...
};
```

#### 3.3 Fonctionnalités manquantes
- Import / Export CSV
- Sélection multi-cellules
- Copier-coller de plages
- Mise en forme des cellules (gras, couleur, format numérique)

---

## 🟠 MODULE 4 — Slides (présentation)

### Problème
- Fallback offline complet si le backend échoue (crée une présentation locale fantôme)
- `Date.now()` utilisé comme ID de slide (anti-pattern dans React)
- La génération IA retourne un JSON qu'on parse manuellement — fragile

### Plan Backend
- Ajouter endpoint `POST /slides/{id}/generate-from-ai` qui :
  1. Appelle Ollama via le router AI
  2. Sauvegarde directement le contenu généré dans la BDD
  3. Retourne la présentation complète

### Plan Frontend

#### 4.1 Refactoring usePresentationEngine.ts
- Remplacer `Date.now()` id par `crypto.randomUUID()`
- Supprimer le fallback "mode offline" — afficher un `EmptyState` à la place
- Séparer `loadPresentation` du fallback de création (logique métier distincte)

#### 4.2 PowerBIStyleSlides.tsx
- Ajouter drag-and-drop de slides dans le panneau latéral
- Miniature cliquable pour naviguer
- Mode présentation plein écran (F5-like)
- Export vers PPTX bouton direct depuis l'UI

---

## 🟡 MODULE 5 — AI (Ollama)

### Problème
- Pas d'**historique des conversations** sauvegardé en BDD
- Pas de **quota/rate-limit** par utilisateur
- Agents `code`, `admin` — non exposés en frontend

### Plan Backend

#### 5.1 Table chat_sessions
```sql
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    agent       TEXT DEFAULT 'general',
    messages    JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

#### 5.2 Nouveaux endpoints
```
GET  /ai/sessions              # Historique des conversations
POST /ai/sessions              # Créer une session
GET  /ai/sessions/{id}         # Détail d'une session
POST /ai/sessions/{id}/message # Envoyer un message (sauvegarde + réponse)
DELETE /ai/sessions/{id}       # Supprimer une session
```

### Plan Frontend
- `FloatingAIChat.tsx` : charger l'historique depuis la session BDD
- Sidebar "Conversations" : liste des sessions passées cliquables
- Sélecteur d'agent : editor / analyst / code / designer
- Token counter visible (nombre approximatif de tokens utilisés)

---

## 🟡 MODULE 6 — Notifications

### Problème
- L'EventBus Redis publie des événements mais **aucun router ne crée de notification en réponse** (`comment.created`, `document.updated`, etc.)
- Le SSE fonctionne mais le frontend ne s'y abonne jamais (pas de `EventSource` dans le code)
- Badge de notifications non-temps-réel (poll HTTP toutes les 30s au lieu de SSE)

### Plan Backend

#### 6.1 Connecter EventBus → Notifications
Dans `main.py`, ajouter des subscribers :
```python
await event_bus.subscribe("comment.created",   notify_on_comment)
await event_bus.subscribe("document.updated",  notify_collaborators)
await event_bus.subscribe("user.joined",       notify_workspace_members)
```

### Plan Frontend

#### 6.2 Abonnement SSE côté client
```typescript
// Dans AppShell ou un provider global
const es = new EventSource(`${API_BASE}/notifications/stream`, {
  headers: { Authorization: `Bearer ${token}` }
});
es.onmessage = (e) => {
  const event = JSON.parse(e.data);
  if (event.type === 'notification') dispatch(addNotification(event.data));
};
```

#### 6.3 Composants à créer/améliorer
- Badge rouge sur la cloche (mis à jour via SSE, pas de poll)
- Toast de notification en bas à droite (micro-animation slide-in)
- Centre de notifications avec filtres (lu / non-lu / type)

---

## 🟡 MODULE 7 — Export

### Problème
- `weasyprint` nécessite des dépendances système lourdes (non installé dans Docker par défaut)
- Pas de **prévisualisation avant téléchargement**
- Pas d'export pour les **Sheets** (CSV manquant) et **Gantt** (PDF de planning)

### Plan Backend
- Ajouter export Gantt → PDF (tableau + barres visuelles)
- Ajouter export Sheet → CSV / XLSX
- Vérifier l'installation `weasyprint` dans le Dockerfile

### Plan Frontend
- Bouton "Preview" avant download (iframe avec le PDF généré via blob URL)
- Gantt : bouton export dans la toolbar

---

## 🟡 MODULE 8 — Event Bus & Webhooks

### Problème
- `webhook_service.py` utilise Redis pour stocker les webhooks mais il n'y a **pas de table SQL** de persistance — les webhooks sont perdus au redémarrage
- Delivery log stocké en Redis (non durable)

### Plan Backend

#### 8.1 Table webhooks en PostgreSQL
```sql
CREATE TABLE IF NOT EXISTS webhooks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT,
    url          TEXT NOT NULL,
    events       TEXT[] NOT NULL,
    secret       TEXT NOT NULL,
    active       BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id  UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type  TEXT,
    status_code INT,
    success     BOOLEAN,
    response    TEXT,
    delivered_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🗓️ Séquence Globale d'Implémentation

```mermaid
gantt
    title Roadmap Professionnalisation Wordex
    dateFormat  YYYY-MM-DD
    section 🔴 Critique
    Tables BDD Dashboard        :a1, 2026-04-02, 2d
    Router dashboard réel       :a2, after a1, 3d
    Analytics doc_type + router :a3, after a1, 2d
    section 🟠 Important
    HyperFormula (sheets)       :b1, after a2, 2d
    Slides refactor + PPTX UI   :b2, after a3, 2d
    sheets.list fix api.ts      :b3, 2026-04-02, 1d
    section 🟡 Moyen
    AI sessions BDD             :c1, after b1, 2d
    SSE frontend (notifs)       :c2, after b1, 1d
    EventBus → notif subscribers:c3, after c2, 1d
    Webhooks SQL persistance    :c4, after c1, 2d
    Export CSV sheets           :c5, after b2, 1d
    section ✅ Gantt (fait)
    Gantt backend complet       :done, g1, 2026-04-01, 2026-04-02
```

---

## ⚡ Priorités immédiates (top 5 actions)

1. **Dashboard BI** → Ajouter tables `machines` + `machine_metrics` + remplacer `random.randint()` par de vraies requêtes SQL
2. **Analytics** → Ajouter `analytics` au `doc_type` regex + créer le router `/api/analytics/`
3. **Sheets** → Ajouter `sheets.list()` dans `api.ts` + intégrer HyperFormula
4. **Notifications SSE** → Abonner le frontend via `EventSource` + connecter EventBus aux subscribers
5. **Webhooks** → Migrer de Redis volatile vers table PostgreSQL durable

---

## 📁 Fichiers à créer / modifier par priorité

### Nouveaux fichiers backend
- `back/app/routers/analytics.py`
- `back/app/routers/dashboard.py` ← remplacer les `random`

### Fichiers à modifier backend
- `back/app/database.py` ← tables `machines`, `machine_metrics`, `production_runs`, `amdec_failures`, `ai_chat_sessions`, `webhooks`, `webhook_deliveries`
- `back/app/models.py` ← doc_type `analytics`, modèles Dashboard, AI sessions
- `back/main.py` ← import analytics router, event subscribers

### Fichiers à modifier frontend
- `front/.../lib/api.ts` ← `sheets.list()`, `analytics.*`
- `front/.../hooks/useAnalyticsEngine.ts` ← supprimer valeurs hardcodées
- `front/.../hooks/usePresentationEngine.ts` ← fix `Date.now()` + supprimer fallback offline
- `front/.../hooks/useAdvancedSheetEngine.tsx` ← intégrer HyperFormula
- `front/.../components/layout/AppShell.tsx` ← EventSource SSE notifications

---

## 🚀 MISE À JOUR — Industrialisation SaaS (Sprints 1-3)
> État d'avancement au 2026-04-03 · Architecture Multi-tenant, Billing et Admin

### ✅ SPRINT 1 — Architecture Multi-tenant (Prisma)
- **Modèle de données** : Passage à une architecture multi-tenant native via `Organisation`.
- **Isolation** : Tous les modèles (`User`, `Workspace`, `Document`, `Machine`, `Gantt`, `AI Session`) sont désormais scopés par `organisation_id`.
- **Outillage** : Installation de `Prisma Client Python` et configuration du schéma (`back/prisma/schema.prisma`).
- **Migration** : Script `init_tenant.py` créé pour migrer les données existantes vers une organisation par défaut.

### ✅ SPRINT 2 — Intégration Stripe & Billing
- **Backend Billing** : Router `/api/billing` opérationnel (`stripe_billing.py`).
- **Flux Stripe** : Gestion des Checkout Sessions, Portail Client, et Webhooks (plan sync, cancel, trial).
- **Interface Pricing** : Nouvelle page `/admin/billing` avec sélection de plans (Starter, Pro, Enterprise).
- **Success/Cancel** : Pages de confirmation après paiement intégrées.

### ✅ SPRINT 3 — Dashboard SUPER_ADMIN
- **Console Globale** : Nouvelle route `/admin/superadmin` réservée aux rôles `SUPER_ADMIN`.
- **Métriques Plateforme** : Suivi du MRR, ARR, Churn rate, et Croissance MoM.
- **Gestion des Tenants** : Liste exhaustive des organisations, filtrage par plan, et accès rapide à la facturation.

### 🎨 REFONTE — Landing Page Médicale Premium
- **Ciblage** : Transformation de la landing générique en page commerciale haute performance pour cliniques.
- **Design system** : Respect strict du thème "Sable & Cuivre", animations fluides (AnimatedNumber), glassmorphism.
- **Conversion** : Grille de fonctionnalités cliniques, témoignages, et pricing dynamique intégré.

### 🛠️ Prochaines étapes immédiates :
1. **Middleware Isolation** : Injecter `organisation_id` dans tous les filtres SQL via FastAPI dependancy injection.
2. **Setup Stripe Prod** : Configurer les `price_id` réels dans le `.env`.
3. **Data Residency** : Configurer le stockage S3/MinIO par organisation (buckets séparés).

---

## 📜 Historique des Sessions d'Intervention

### 🏥 Session 2026-04-03 (Dernière) — Industrialisation SaaS
*   **Objectif** : Transformer Wordex en SaaS multi-tenant.
*   **Actions** :
    *   Schéma Prisma avec isolation par `Organisation`.
    *   Système de facturation Stripe (checkout/portal/webhooks).
    *   Console `SUPER_ADMIN` pour pilotage global.
    *   Refonte Landing Page premium pour cliniques.

### 🍱 Session 2026-04-02 — Stabilisation Editor & Nav
*   **Objectif** : Stabiliser le moteur collaboratif et la navigation.
*   **Actions** :
    *   Correctifs sur le moteur TipTap (conflits d'awareness).
    *   Finalisation de la barre de navigation collapsible "Sable & Cuivre".
    *   Amélioration de la transition Local/Collaboratif.

### 🏗️ Session 2026-04-01 (Midi) — Persistance & Architecture
*   **Objectif** : Mise en place de la persistance backend pour les nouveaux modules.
*   **Actions** :
    *   Refactorisation de la logique de récupération de données (suppression des mocks).
    *   Structure backend pour les modules Sheets et Slides.
    *   Nettoyage du frontend (suppression des constantes inutiles, fix hooks).

### 🚀 Session 2026-04-01 (Matin) — Transition Mocks → Backend
*   **Objectif** : Connecter le "Spreadsheet" et le "Recent Documents" au backend.
*   **Actions** :
    *   Intégration du module Sheets avec JSONB/PostgreSQL.
    *   Création de l'endpoint global pour les documents récents.
    *   Base pour la génération AI de slides.

### 🛡️ Session 2026-04-04 (Matin) — Isolation et Sécurisation IA
*   **Objectif** : Cloisonner les agents IA et renforcer la sécurité éthique.
*   **Actions** :
    *   **Privacy Envelope** : Injection d'un prompt système "Sandbox" pour interdire toute communication externe.
    *   **Multi-tenant Scoping** : Intégration de `get_current_org_id` dans toutes les routes d'agents (isolation par organisation).
    *   **Garde-fous Éthiques** : Interdiction formelle de contenu Militaire et Sexuel.
    *   **Network Isolation** : Blocage des tentatives de connexion vers des serveurs tiers via le prompt système.
