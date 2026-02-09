# POD Inventory Management System - Complete Technical Documentation

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Feature Deep Dive](#5-feature-deep-dive)
6. [API Architecture & Endpoints](#6-api-architecture--endpoints)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Component Architecture](#8-component-architecture)
9. [Server-Side Logic (Actions)](#9-server-side-logic-actions)
10. [Business Logic & Algorithms](#10-business-logic--algorithms)
11. [Error Handling & Validation](#11-error-handling--validation)
12. [Performance & Optimization](#12-performance--optimization)

---

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (React 19)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Pages      │  │  Components  │  │   Hooks    │ │  │
│  │  │   (/main)    │  │   (100+)     │  │  (5)       │ │  │
│  │  │   (/history) │  │              │  │            │ │  │
│  │  │   (/login)   │  │              │  │            │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │              ↓  Context API (AuthContext)  ↓         │  │
│  │         React State Management & Local Storage       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓↑ HTTP/JSON
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (API Routes)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route Handlers (/api/...)                           │  │
│  │  ├─ Authentication (login, signup, verify)           │  │
│  │  ├─ POD Management (CRUD, search, export)            │  │
│  │  ├─ Log Issues (CRUD, notifications)                 │  │
│  │  ├─ User Management (roles, merge profiles)          │  │
│  │  ├─ Notifications (fetch, update read status)        │  │
│  │  └─ Analytics (aggregate data)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓↑ SQL/ORM
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Server Actions (lib/actions.ts - 1900+ lines)       │  │
│  │  ├─ Business logic for all operations                │  │
│  │  ├─ Data transformation (client ↔ DB format)         │  │
│  │  ├─ Complex queries with filtering/pagination        │  │
│  │  ├─ Notification creation & routing                  │  │
│  │  └─ Audit trail & transaction logging                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│            PRISMA ORM + PostgreSQL Database                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  8 Models: User, Pod, LogIssue, Token, Notification │  │
│  │            PodStatusHistory, Transaction, AutofillPod│  │
│  │  ├─ 300+ fields tracked across models                │  │
│  │  ├─ Relationships & indexes                          │  │
│  │  └─ Soft deletes & audit trails                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Cycle

```
User Action (click button)
  ↓
React Component Handler
  ↓
Client-side Validation (Zod)
  ↓
HTTP Request (POST/GET/PUT/DELETE)
  ↓
Next.js API Route Handler
  ↓
Authenticate (check JWT token)
  ↓
Authorize (check user role/permissions)
  ↓
Server Action (lib/actions.ts)
  ↓
Prisma ORM Query/Mutation
  ↓
PostgreSQL Database Operation
  ↓
Server Action Returns Result
  ↓
Notifications Created (if applicable)
  ↓
Transaction Logged (audit trail)
  ↓
Cache Revalidated (revalidatePath)
  ↓
HTTP Response Sent
  ↓
Component Updates State
  ↓
Toast Notification Shown
  ↓
UI Re-renders
```

---

## 2. Technology Stack

### Frontend
```typescript
- Next.js 15.1.0        // React framework with SSR/SSG
- React 19             // UI library
- TypeScript 5         // Type safety
- Tailwind CSS 3.4.17  // Utility-first CSS
- Radix UI 1.x         // Accessible component library (60+ components)
- React Hook Form 7.54 // Form state management
- Zod 3.24.1          // Schema validation
- Recharts 2.15       // Chart visualization
- Moment.js 2.30      // Date manipulation with timezone support
- moment-business-days 1.2 // Business day calculations
- moment-timezone 0.6 // Timezone handling
- XLSX 0.18.5         // Excel file handling
- Lucide React 0.454  // Icon library
- Sonner 1.7.1        // Toast notifications
```

### Backend
```typescript
- Node.js             // Runtime
- Prisma 6.6.0       // ORM
- PostgreSQL         // Database
- JWT 9.0.2          // Token authentication
- bcryptjs 3.0.2     // Password hashing
- node-cron 4.2.1    // Task scheduling
```

---

## 3. Database Schema & Data Models

### Complete Database Model Diagram

```
User (Accounts & Profiles)
├─ id (CUID)
├─ email (optional for imported profiles)
├─ password (bcryptjs hash)
├─ name
├─ role (REGULAR | ADMIN | PRIORITY | SUPER_ADMIN)
├─ isImportedProfile (boolean - auto-created from Excel)
├─ mergedIntoUserId (tracks profile merges)
├─ createdAt, updatedAt
└─ Relations:
   ├─ tokens[] (JWT tokens)
   ├─ pods[] (created PODs)
   ├─ logIssues[] (created issues)
   ├─ notifications[] (assigned to)
   ├─ createdNotifications[] (created by)
   └─ podStatusHistoryChanges[] (modified pods)

Pod (500+ fields - Infrastructure lifecycle tracking)
├─ id (CUID - internal identifier)
├─ pod (string - external POD ID)
├─ internalPodId
├─ type, org, priority
├─ assignedEngineer (engineer name/email)
├─ assignedEngineerDate (when assigned)
├─ status (Initial|Engineering|Data Management|Submitted|Complete|Blocked|etc)
├─ subStatus (Assignment|Assessment|Ready|etc - granular tracking)
├─ subStatusLastChanged (when substatus changed)
├─ 40+ date fields tracking milestones:
│  ├─ lepAssessment, dlpTemplateUpdates
│  ├─ ipAcquisition, ipAllocation
│  ├─ conversionFileUpdate, conversionFileValidation
│  ├─ pepGeneration, checklistCreation
│  ├─ vmDeleteList, vmDeletesComplete
│  ├─ lcmNetworkDeletes, lcmAddTicket
│  ├─ preloadTicketSubmitted, preloadComplete
│  ├─ dns, macdCreation, atsMacdApproval
│  ├─ dlpUploads, cdmLoad
│  ├─ inServiceVavAudit, globalCvaasAudit
│  ├─ lcmComplete, completedDate
│  └─ ... and 20+ more
├─ ticket fields (DNS, LCM, Preload tickets)
├─ infrastructure fields (clli, city, state, routerType, router1/2)
├─ config fields (tenantName, currentLepVersion, lepVersionToBeApplied)
├─ notes, projectManagers, links
├─ totalElapsedCycleTime (calculated from assignedEngineerDate to lcmComplete)
├─ workableCycleTime (active work time)
├─ timeInCurrentStatus (days in current substatus)
├─ slaCalculatedNbd (auto-calculated based on podType)
├─ isHistory (true = archived, false = active)
├─ isDeleted (soft delete flag)
├─ shouldDisplay (visibility control by role)
├─ special (boolean flag for special PODs)
├─ createdById (creator user)
└─ Relations:
   ├─ createdBy (User relation)
   ├─ statusHistory[] (PodStatusHistory records)
   └─ notifications[] (related notifications)

LogIssue (Issue tracking)
├─ id (CUID)
├─ pod (string - which POD)
├─ dateOpened
├─ lepVersionBeingApplied
├─ status
├─ rootCauseOwner (string)
├─ resolutionOwner[] (array of emails)
├─ description, notes
├─ isDeleted (soft delete)
├─ createdById
└─ Relations:
   ├─ createdBy (User)
   ├─ notifications[] (related notifications)

Token (JWT token storage)
├─ id
├─ token (unique)
├─ userId
├─ expiresAt (for validation)
└─ Relations:
   └─ user (User)

PodStatusHistory (Audit trail - tracks ALL changes)
├─ id
├─ podId
├─ status (current)
├─ previousStatus (previous)
├─ subStatus (current)
├─ previousSubStatus (previous)
├─ changedById (who changed it)
├─ createdAt
└─ Relations:
   ├─ pod (Pod)
   └─ changedBy (User)

Notification (User notifications)
├─ id
├─ userId (recipient)
├─ message
├─ read (boolean)
├─ podId (related POD)
├─ logIssueId (related issue)
├─ createdById (who created notification)
├─ createdForId (intended recipient)
├─ createdAt
└─ Relations:
   ├─ user (User - recipient)
   ├─ createdBy (User)
   ├─ createdFor (User)
   └─ logIssue (LogIssue)

Transaction (Complete audit log)
├─ id
├─ entityType (Pod|LogIssue|User)
├─ entityId
├─ action (create|update|delete|move_to_history|merge)
├─ details (JSON of before/after)
├─ podId, logIssueId (references)
├─ createdById
└─ createdAt

AutofillPod (Import templates)
├─ id
├─ pod (unique)
├─ All nullable fields for flexibility
└─ createdAt, updatedAt
```

### Database Indexes (Performance)

```sql
-- User table
CREATE INDEX idx_user_email ON user(email WHERE email IS NOT NULL);
CREATE INDEX idx_user_role ON user(role);

-- Pod table
CREATE INDEX idx_pod_history_deleted ON pod(isHistory, isDeleted);
CREATE INDEX idx_pod_priority ON pod(priority);
CREATE INDEX idx_pod_created ON pod(createdAt);
CREATE INDEX idx_pod_createdby ON pod(createdById);

-- Notification table
CREATE INDEX idx_notification_user_read ON notification(userId, read);
CREATE INDEX idx_notification_created ON notification(createdAt);

-- PodStatusHistory
CREATE INDEX idx_podstatus_pod ON podstatushistory(podId);
CREATE INDEX idx_podstatus_changedby ON podstatushistory(changedById);
CREATE INDEX idx_podstatus_created ON podstatushistory(createdAt);
```

---

## 4. Data Flow Diagrams

### Flow 1: User Login & Authentication

```
┌─────────────────────┐
│  User enters email  │
│  & password         │
└──────────┬──────────┘
           ↓
┌─────────────────────────────────────┐
│ POST /api/auth/login                │
│ body: {email, password}             │
└──────────┬──────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ 1. Validate input (Zod schema)               │
│    ├─ email format                           │
│    └─ password not empty                     │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ 2. prisma.user.findUnique({email})           │
│    ├─ If not found → 401 Unauthorized        │
│    └─ If found → continue                    │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ 3. bcryptjs.compare(password, hashedPwd)     │
│    ├─ If false → 401 Unauthorized            │
│    └─ If true → continue                     │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ 4. jwt.sign({userId}, JWT_SECRET, 7d)        │
│    ├─ Create JWT token                       │
│    └─ Store in database                      │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ 5. Set HTTP-only cookie                      │
│    ├─ name: auth_token                       │
│    ├─ httpOnly: true (no JS access)         │
│    ├─ secure: true (HTTPS only)             │
│    └─ maxAge: 7 days                        │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ Return {user, token} to frontend             │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────┐
│ Frontend:                                    │
│ 1. Store user in AuthContext                 │
│ 2. Redirect to /main                         │
│ 3. Token automatically sent in cookies       │
└──────────────────────────────────────────────┘
```

### Flow 2: Add/Create POD with All Validations

```
┌──────────────────────────┐
│ User opens AddPodDialog  │
└──────────┬───────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Form Component (AddPodDialog)              │
│ ├─ 500+ input fields                       │
│ ├─ React Hook Form state management        │
│ └─ Client-side Zod validation on change    │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ User clicks "Submit"                       │
│ 1. Validate all fields with Zod schema     │
│ 2. Transform data (client format → API)    │
│ 3. Prepare payload                         │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ POST /api/pods                             │
│ body: {pods: [Pod], isHistory: boolean}    │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ API Route Handler (/api/pods/route.ts):    │
│ 1. Check authentication (JWT)              │
│ 2. Validate user role (has permission)     │
│ 3. Parse and validate request body         │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Server Action: addPod(pod, userId)         │
│ (/lib/actions.ts - lines 1700+)            │
│                                            │
│ Step 1: Validate required fields           │
│ ├─ pod ID must exist                       │
│ ├─ status must be valid enum               │
│ └─ subStatus must be valid enum            │
│                                            │
│ Step 2: Transform to DB format             │
│ ├─ clientToDatabasePod() conversion        │
│ │  ├─ Parse date strings to Date objects   │
│ │  ├─ Calculate SLA (business days)        │
│ │  ├─ Calculate cycle time                 │
│ │  ├─ Format time in current status        │
│ │  └─ Set subStatusLastChanged             │
│ └─ Set system fields                       │
│    ├─ assignedEngineerDate = now           │
│    ├─ shouldDisplay = true/false           │
│    │   (based on creator's role)           │
│    └─ createdById = current user           │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Check if assignedEngineer exists as user   │
│ If engineer name (no @) and not registered:│
│ ├─ Create imported profile automatically   │
│ │  (isImportedProfile: true, no email)     │
│ └─ Use name in Pod.assignedEngineer field  │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ prisma.pod.create({                        │
│   data: {...dbPod, createdById: userId}    │
│ })                                         │
│                                            │
│ Database Operations:                       │
│ 1. Insert Pod record                       │
│ 2. Get returned Pod object                 │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Create Status History Record                │
│ prisma.podStatusHistory.create({            │
│   podId, status, subStatus, changedById     │
│ })                                         │
│ (Audit trail)                              │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Evaluate Notification Triggers:             │
│                                            │
│ For each notification type:                │
│ 1. assignedEngineer set?                   │
│    → Find user by email                    │
│    → Send "Pod assigned to you"            │
│                                            │
│ 2. lcmAddTicket date set?                  │
│    → Find all PRIORITY users               │
│    → Send notification                     │
│                                            │
│ 3. preloadTicketSubmitted set?             │
│    → Find all PRIORITY users               │
│    → Send notification                     │
│    (... repeat for 8+ key dates)           │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Create Transaction Record (Audit Log):     │
│ prisma.transaction.create({                │
│   entityType: 'Pod',                       │
│   entityId: podId,                         │
│   action: 'create',                        │
│   details: JSON.stringify(createdPod),     │
│   createdById: userId                      │
│ })                                         │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Revalidate Cache:                          │
│ revalidatePath('/main')  ← Refresh list    │
│ revalidatePath('/history')                 │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Return Response:                           │
│ {                                          │
│   success: true,                           │
│   pod: databaseToClientPod(createdPod)     │
│ }                                          │
└──────────┬─────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ Frontend Receives Response:                │
│ 1. Update UI with success toast            │
│ 2. Refresh POD table                       │
│ 3. Close dialog                            │
│ 4. Show newly created POD in table         │
└──────────────────────────────────────────────┘
```

### Flow 3: Update POD with Status Change & Notifications

```
┌──────────────────────────────┐
│ User edits POD in EditDialog  │
│ Changes substatus from        │
│ "Assignment" to "Assessment"  │
└──────────┬──────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ PUT /api/pods/[id]                       │
│ body: {pod: Pod}                         │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ updatePod(pod, userId) server action     │
│                                          │
│ Step 1: Fetch original POD               │
│ originalPod = prisma.pod.findUnique(id)  │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 2: Compare fields                   │
│ ├─ subStatus changed?                    │
│ │  ├─ YES → set subStatusLastChanged=now │
│ │  └─ NO → keep original timestamp       │
│ │                                        │
│ ├─ assignedEngineer empty → now set?     │
│ │  └─ YES → set assignedEngineerDate     │
│ │                                        │
│ └─ Check for key date changes:           │
│    ├─ lcmAddTicket changed?              │
│    ├─ lcmComplete changed?               │
│    ├─ preloadTicketSubmitted changed?    │
│    └─ ... (8+ dates to monitor)          │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 3: Convert to DB format             │
│ dbPod = clientToDatabasePod(pod)          │
│ ├─ Parse dates: "2024-01-15" → Date obj  │
│ ├─ Check isNA flags for each date        │
│ └─ Calculate SLA using business days     │
│                                          │
│ SLA Logic:                               │
│ if podTypeOriginal === 'FFA'             │
│   sla = podWorkableDate + 22 business days
│ else if 'Greenfield'                     │
│   sla = podWorkableDate + 10 business days
│ else if 'Brownfield'                     │
│   sla = podWorkableDate + 15 business days
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 4: Update in database               │
│ prisma.pod.update({                      │
│   where: {id: pod.id},                   │
│   data: {...dbPod, subStatusLastChanged} │
│ })                                       │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 5: Create status history records    │
│                                          │
│ If status changed:                       │
│ createStatusHistory(                     │
│   podId, newStatus, oldStatus,           │
│   changedById: userId                    │
│ )                                        │
│                                          │
│ If subStatus changed:                    │
│ createStatusHistory(                     │
│   podId, newSubStatus, oldSubStatus,     │
│   changedById: userId                    │
│ )                                        │
│ (Now you have complete audit trail!)     │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 6: Trigger notifications            │
│                                          │
│ if (assignedEngineer changed) {           │
│   Find user by assignedEngineer email    │
│   Create notification:                   │
│   "Pod [POD_ID] assigned to you"         │
│ }                                        │
│                                          │
│ if (lcmAddTicket date changed) {         │
│   Find all PRIORITY users                │
│   Create notifications for each:         │
│   "LCM Add Ticket submitted"             │
│ }                                        │
│ (... repeat for 7 more key dates)        │
│                                          │
│ All notifications stored in database:    │
│ prisma.notification.create({...})        │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 7: Audit trail                      │
│ prisma.transaction.create({              │
│   entityType: 'Pod',                     │
│   action: 'update',                      │
│   details: {before: originalPod,         │
│             after: updatedPod},          │
│   createdById: userId                    │
│ })                                       │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Step 8: Cache revalidation               │
│ revalidatePath('/main')  ← ISR triggered │
│ revalidatePath('/history')               │
│ revalidatePath('/analytics')             │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Return Success Response                  │
│ {success: true}                          │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Frontend:                                │
│ 1. Show success toast                    │
│ 2. Close edit dialog                     │
│ 3. Refresh POD table (ISR)               │
│ 4. Updated POD visible immediately      │
│ 5. Assigned engineer gets notification  │
│    (visible in NotificationBell)         │
│ 6. PRIORITY users get milestone notif    │
└──────────────────────────────────────────┘
```

### Flow 4: User Profile Merge (Super Admin Only)

```
┌──────────────────────────────────────────┐
│ Super Admin goes to /users page          │
│ Sees list of users (registered+imported) │
│ Selects 2+ profiles with checkboxes      │
│ Clicks "Merge Profiles" button           │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ MergeProfilesDialog opens                │
│ Shows:                                   │
│ ├─ List of selected profiles             │
│ ├─ Type badge (Imported/Registered)      │
│ ├─ Radio buttons to select primary       │
│ └─ Merge button                          │
│                                          │
│ Validation:                              │
│ ├─ Primary MUST have email (registered)  │
│ ├─ Can't merge already-merged profiles   │
│ └─ At least 2 profiles required          │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ POST /api/users/merge                    │
│ body: {                                  │
│   primaryUserId,                         │
│   secondaryUserIds: [id1, id2]           │
│ }                                        │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ For each secondary user (id2, id3):      │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ UPDATE ALL POD REFERENCES           ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ 1. Find all PODs created by secondaryId: │
│    WHERE createdById = secondaryId       │
│    → UPDATE createdById = primaryId      │
│                                          │
│ 2. Find all PODs assigned to secondary:  │
│    WHERE assignedEngineer = secondary... │
│    (search by secondary user's email)    │
│    → UPDATE assignedEngineer =           │
│       primaryUser.name                   │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ UPDATE ALL LOG ISSUE REFERENCES    ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ 1. Find LogIssues created by secondary:  │
│    WHERE createdById = secondaryId       │
│    → UPDATE createdById = primaryId      │
│                                          │
│ 2. Update resolution owners:             │
│    If resolutionOwner includes           │
│    secondary email:                      │
│    → REPLACE with primary email          │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ UPDATE ALL NOTIFICATIONS            ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ 1. User notifications:                   │
│    WHERE userId = secondaryId            │
│    → UPDATE userId = primaryId           │
│                                          │
│ 2. Created by secondary:                 │
│    WHERE createdById = secondaryId       │
│    → UPDATE createdById = primaryId      │
│                                          │
│ 3. Created for secondary:                │
│    WHERE createdForId = secondaryId      │
│    → UPDATE createdForId = primaryId     │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ UPDATE POD STATUS HISTORY            ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ Find all changes made by secondary:      │
│ WHERE changedById = secondaryId          │
│ → UPDATE changedById = primaryId         │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ MARK SECONDARY AS MERGED            ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ UPDATE user SET                          │
│   mergedIntoUserId = primaryId           │
│ WHERE id = secondaryId                   │
│                                          │
│ (Now secondary profile is hidden from    │
│  user lists, but data preserved)         │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Log transaction for audit trail          │
│ prisma.transaction.create({              │
│   entityType: 'User',                    │
│   action: 'merge',                       │
│   details: {                             │
│     primaryId,                           │
│     mergedIds: [id2, id3],               │
│     podsUpdated: N,                      │
│     issuesUpdated: N,                    │
│     notificationsUpdated: N              │
│   },                                     │
│   createdById: superAdminId              │
│ })                                       │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Return Success                           │
│ {                                        │
│   success: true,                         │
│   message: 'Merged 2 profiles successfully'
│ }                                        │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Frontend:                                │
│ 1. Show success toast                    │
│ 2. Refresh user list                     │
│ 3. Secondary profiles now hidden         │
│ 4. All POD assignments show primary name │
│ 5. All notifications redirected to primary
│ 6. Analytics consolidated under primary  │
│                                          │
│ Result: Single unified engineer profile! │
└──────────────────────────────────────────┘
```

### Flow 5: Search & Filter PODs

```
┌────────────────────────────────┐
│ User opens AdvancedSearch      │
│ Component                      │
└──────────┬────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ User selects field (e.g., "status")    │
│ and enters value (e.g., "Engineering") │
│ Can add multiple criteria               │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ User clicks "Search"                   │
│ AdvancedSearch component builds query: │
│ {                                      │
│   field0: 'status',                    │
│   value0: 'Engineering',               │
│   field1: 'org',                       │
│   value1: 'ENG'                        │
│ }                                      │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ Frontend calls getPods()                │
│ with searchCriteria array               │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ Server action: getPods(                 │
│   page=1, pageSize=10,                 │
│   searchCriteria=[...], userId          │
│ )                                      │
│                                        │
│ Step 1: Build WHERE clause:             │
│ whereConditions = {                    │
│   isHistory: false,                    │
│   isDeleted: false,                    │
│   AND: [{                              │
│     status: {contains: 'Engineering'} │
│   }, {                                 │
│     org: {contains: 'ENG'}             │
│   }]                                   │
│ }                                      │
│                                        │
│ Special handling for PRIORITY:         │
│ ├─ If searching for priority           │
│ │  (priority: true in criteria)        │
│ │  → Add {priority: {lt: 9999}}        │
│ │  (show only PODs with priority set)  │
│ └─ This filters out default values     │
│                                        │
│ Visibility filter by role:              │
│ ├─ SUPER_ADMIN/PRIORITY: see all       │
│ ├─ REGULAR/ADMIN: see only             │
│ │  shouldDisplay: true                 │
│ └─ Added to WHERE clause               │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ Execute Prisma query:                  │
│                                        │
│ totalCount = prisma.pod.count({        │
│   where: whereConditions               │
│ })                                     │
│                                        │
│ pods = prisma.pod.findMany({           │
│   where: whereConditions,              │
│   orderBy: [                           │
│     {priority: 'asc'},                 │
│     {createdAt: 'desc'}                │
│   ],                                   │
│   skip: (page-1) * pageSize,           │
│   take: pageSize                       │
│ })                                     │
│                                        │
│ Ordering logic:                         │
│ 1. Sort by priority ascending          │
│    (lower = higher priority)           │
│ 2. Then by creation date descending    │
│    (newest first)                      │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ Convert results to client format:       │
│                                        │
│ return {                               │
│   pods: pods.map(databaseToClientPod),  │
│   totalCount,                          │
│   totalPages: Math.ceil(totalCount /   │
│              pageSize),                │
│   currentPage: page                    │
│ }                                      │
│                                        │
│ databaseToClientPod() converts:         │
│ ├─ Date fields from DateTime → string  │
│ │  (using formatDate helper)           │
│ ├─ Calculate cycle times               │
│ ├─ Format time in current status       │
│ └─ All 500+ fields mapped              │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ Frontend receives response              │
│ {                                      │
│   pods: [Pod, Pod, ...],               │
│   totalCount: 47,                      │
│   totalPages: 5,                       │
│   currentPage: 1                       │
│ }                                      │
└──────────┬───────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ PodTable component renders:             │
│ ├─ Table with POD data                 │
│ ├─ Pagination controls                 │
│ │  ├─ "Previous" button (if page > 1)  │
│ │  ├─ Page numbers                     │
│ │  └─ "Next" button (if page < pages)  │
│ ├─ Results count (47 total, page 1 of 5)
│ └─ Edit/delete/complete buttons        │
│                                        │
│ User can:                              │
│ ├─ Click page numbers to navigate      │
│ ├─ Change pageSize dropdown (10/25/50) │
│ ├─ Click column headers to sort        │
│ ├─ Edit/delete individual PODs         │
│ └─ Click row to view full details      │
└──────────────────────────────────────┘
```

---

## 5. Feature Deep Dive

### Feature 1: POD Lifecycle Management

**What it does**: Tracks infrastructure deployment (POD) through complete lifecycle with 500+ fields

**Key Components**:
- Pages: `/main` (active), `/history` (completed)
- Dialogs: AddPodDialog, EditPodDialog, PodDetailsDialog
- Tables: PodTable, HistoryTable
- Actions: addPod, updatePod, completePod, moveToActive, moveToHistory

**Data Model - 500+ Fields**:

```typescript
// Basic Identity
pod: string                    // Unique external ID
internalPodId: string          // Internal reference
type: string                   // POD type

// Assignment & Team
assignedEngineer: string       // Engineer name/email
assignedEngineerDate?: Date    // When assigned (auto-set)
status: Status                 // Major status
subStatus: SubStatus           // Detailed status
subStatusLastChanged?: Date    // When substatus changed (auto-set)

// Lifecycle Dates (40+ fields, each with isNA flag)
// Format: fieldName: Date | null, fieldNameIsNA: boolean
lepAssessment?: Date           // LEP Assessment date
dlpTemplateUpdates?: Date      // DLP Template Updates
ipAcquisition?: Date           // IP Acquisition
ipAllocation?: Date            // IP Allocation
conversionFileUpdate?: Date    // Conversion File Update
// ... 30+ more lifecycle dates
lcmComplete?: Date             // LCM (Lifecycle Management) Complete
completedDate?: Date           // Final completion date

// Ticket Tracking
dnsTicketAddsDeletes?: string  // DNS ticket ID
dnsTicketChanges?: string      // DNS changes ticket ID
lcmAddTicketNumber?: string    // LCM Add Ticket number
preloadTicketNumber1/2/3?: string // Multiple preload tickets
// ... 5+ more ticket fields

// Infrastructure
clli: string                   // Central Office Location
city: string                   // City
state: string                  // State
routerType: string             // Router Type
router1: string                // First router
router2: string                // Second router

// Configuration
org: Org                       // Organization (ATS, DNS Ops, etc)
podType: PodType               // POD Type (eUPF, MS UPF, AIA)
podProgram Type: string        // Program type
tenantName: string             // Tenant name
currentLepVersion: string      // Current LEP version
lepVersionToBeApplied: string  // LEP to apply
special: boolean               // Special flag

// Metrics
totalElapsedCycleTime: number  // Days from assign to complete
workableCycleTime: number      // Active work days
timeInCurrentStatus: string    // "Status - N days"
slaCalculatedNbd?: Date        // Calculated SLA date

// Admin Fields
priority: number               // 1-9999 (9999=default/no priority)
notes?: string                 // Admin notes
projectManagers?: string       // PM names
linkToActiveTds?: string       // Link to TDS
linkToActivePreloads?: string  // Link to preloads

// Status Tracking
isHistory: boolean             // true = archived, false = active
isDeleted: boolean             // true = soft deleted
shouldDisplay: boolean         // Visibility control
```

**Statuses & Substatus**:

```typescript
// Major Statuses (Status)
type Status =
  | "Initial"          // New POD
  | "Engineering"      // In engineering phase
  | "Data Management"  // Data prep phase
  | "Submitted"        // Ready for deployment
  | "Complete"         // Finished
  | "Blocked"          // Waiting for external action
  | "Paused"           // Temporarily paused
  | "Reject"           // Rejected
  | "Revision"         // Needs revision
  | "Decom"            // Decommissioning

// Detailed Substatus (SubStatus)
type SubStatus =
  | "Assignment"       // Engineer assignment phase
  | "Assessment"       // Assessment phase
  | "Conversion File"  // Converting files
  | "Ready"            // Ready for next phase
  | "PEP Generation"   // PEP (Provisioning Execution Plan)
  | "TDS Generation"   // TDS (Technical Design Spec)
  | "Preload Generation" // Preload prep
  | "VM Deletes"       // Virtual Machine deletion
  | "Network Deletes"  // Network deletion
  | "MACD Approval"    // MACD (Move, Add, Change, Delete) approval
  | ... 10+ more substatus values
```

**State Transitions**:

```
Initial (Assignment)
  ↓ (assign engineer)
Engineering (Assessment)
  ↓ (various phases: Conversion, Ready, PEP, TDS, Preload)
Data Management (various phases)
  ↓
Submitted (Services, Network, Deletions)
  ↓
Complete
  ↓ (move to history)
ARCHIVED
```

**Business Logic**:

```typescript
// SLA Calculation (Automatic)
if (podTypeOriginal === 'FFA') {
  slaDate = podWorkableDate + 22 business days
} else if (podTypeOriginal === 'Greenfield') {
  slaDate = podWorkableDate + 10 business days
} else if (podTypeOriginal === 'Brownfield Upgrades') {
  slaDate = podWorkableDate + 15 business days
}

// Cycle Time (Auto-calculated on read)
totalElapsedCycleTime = differenceInDays(
  lcmComplete || now,
  assignedEngineerDate
)

// Time in Current Status
timeInCurrentStatus = `${subStatus} - ${daysSinceStatusChange} days`

// Priority Display
if (priority === 9999) {
  // No priority set (default)
} else if (priority < 100) {
  // High priority
} else if (priority < 1000) {
  // Medium priority
} else {
  // Low priority
}
```

---

### Feature 2: Issue Tracking & Log Issues

**What it does**: Track issues/problems with specific PODs and assign owners

**Page**: `/log-issues`  
**Components**: LogIssuesTable, AddLogIssueDialog, EditLogIssueDialog  
**Data Model**:

```typescript
LogIssue {
  id: string
  pod: string              // Which POD
  dateOpened: Date         // When issue opened
  lepVersionBeingApplied: string // LEP version context
  status: string           // Issue status
  rootCauseOwner: string   // Who owns root cause
  resolutionOwner: string[] // Array of emails (multiple people)
  description: string      // Issue description
  notes: string            // Additional notes
  isDeleted: boolean       // Soft delete flag
  createdById: string      // Creator user ID
  createdAt: Date          // Creation timestamp
}
```

**Workflow**:

```
1. User navigates to /log-issues
2. Clicks "Add Issue"
3. Opens AddLogIssueDialog
4. Selects POD from dropdown
5. Enters issue details (description, root cause, etc)
6. Selects resolution owners (multiple people by email)
7. Submits

Backend Processing:
1. Create LogIssue record
2. Find each resolution owner by email
3. Create notification for each:
   "You were assigned as resolution owner for POD X"
4. Find all ADMIN/SUPER_ADMIN users
5. Create notification for them:
   "New log issue created for POD X by [user]"
6. Log transaction (audit trail)

Frontend:
1. Show success toast
2. Refresh log issues list
3. Issue now visible in table
4. Resolution owners see notification bell update
```

**Notifications**:

```
On issue creation:
├─ Each resolution owner gets notified
│  └─ "You assigned as resolution owner for POD X"
├─ All ADMIN/SUPER_ADMIN get notified
│  └─ "New log issue created for POD X"
└─ Creator has audit record

On issue update:
├─ New resolution owners get notified
└─ ADMIN/SUPER_ADMIN notified of change
```

---

### Feature 3: Notification System

**What it does**: Route smart notifications to users based on events

**Components**: NotificationBell  
**Storage**: Notification model  
**Data Flow**:

```typescript
// 12+ notification triggers:
1. POD Assigned
   Trigger: assignedEngineer value changes
   Recipients: User with that email
   Message: "Pod [X] has been Assigned to you"

2. LCM Add Ticket Set
   Trigger: lcmAddTicket date populated
   Recipients: All PRIORITY users
   Message: "LCM Add Ticket submitted for [X] on [date]"

3. LCM Complete
   Trigger: lcmComplete date populated
   Recipients: All PRIORITY users
   Message: "POD [X] completed LCM processes on [date]"

4. LCM Network Delete Completion
   Trigger: lcmNetworkDeleteCompletion date populated
   Recipients: All PRIORITY users
   Message: "LCM network deletes submitted for [X]"

5. Preload Ticket Submitted
   Trigger: preloadTicketSubmitted date populated
   Recipients: All PRIORITY users
   Message: "Preload ticket submitted for [X]"

6. Preload Complete
   Trigger: preloadComplete date populated
   Recipients: All PRIORITY users
   Message: "POD [X] completed preloads"

7. VM Delete List
   Trigger: vmDeleteList date populated
   Recipients: All PRIORITY users
   Message: "VM Delete ticket submitted for [X]"

8. VM Deletes Complete
   Trigger: vmDeletesComplete date populated
   Recipients: All PRIORITY users
   Message: "VM Deletes completed for [X]"

9. Log Issue Created
   Trigger: New LogIssue record
   Recipients: Resolution owners + ADMIN users
   Message: "New issue for POD [X] assigned to you"

10. Log Issue Updated
    Trigger: LogIssue resolutionOwner changed
    Recipients: New owners + ADMIN users
    Message: "Updated issue for POD [X]"

11. Profile Merged
    Trigger: User merge operation
    Recipients: Affected users
    Message: "Your profile merged into [primary]"

12. Custom Notifications
    Trigger: Admin creates manually
    Recipients: Specified users
```

**Notification Model**:

```typescript
Notification {
  id: string
  userId: string          // Recipient
  message: string         // The notification text
  read: boolean           // Read status
  podId?: string          // Related POD
  logIssueId?: string     // Related issue
  createdById?: string    // Who created it
  createdForId?: string   // Intended for this user
  createdAt: Date         // When created
}
```

**Frontend - Notification Bell**:

```
┌─ Shows unread count (badge)
├─ Click opens dropdown
│  ├─ List of 10 most recent
│  ├─ Each with:
│  │  ├─ Message
│  │  ├─ Created time (relative)
│  │  └─ Mark as read button
│  └─ "View All" link → full page
├─ Fetch via: GET /api/notifications
│  └─ Returns paginated notifications
└─ Mark read via: PUT /api/notifications/[id]/read
```

---

### Feature 4: User Profile Management & Merge

**What it does**: Manage user accounts and consolidate duplicate profiles

**Pages**: `/users` (admin only)  
**Components**: UserManagement, MergeProfilesDialog  

**User Types**:

```typescript
// Registered User (from signup)
{
  email: "user@example.com",      // Has email
  password: "bcryptjs hash",       // Has password
  name: "John Doe",
  role: "REGULAR",
  isImportedProfile: false,        // Created via signup
  mergedIntoUserId: null           // Not merged
}

// Imported Profile (from Excel import)
{
  email: null,                     // NO email
  password: null,                  // NO password
  name: "Engineer Name",           // Name from Excel
  role: "REGULAR",
  isImportedProfile: true,         // Created from import
  mergedIntoUserId: null           // Not merged yet
}

// Merged Profile (secondary)
{
  email: null,                     // Preserved
  name: "Engineer Name",
  role: "REGULAR",
  isImportedProfile: true,
  mergedIntoUserId: "primary-id"   // Merged! Hidden now
}
```

**Merge Workflow**:

```
1. Super Admin navigates to /users
   └─ Sees all users (registered + imported)

2. Select 2+ profiles with checkboxes
   └─ Click "Merge Profiles" button

3. MergeProfilesDialog shows:
   ├─ Selected profiles with type badge
   ├─ Radio buttons to choose primary
   ├─ Validation: "Primary must have email"
   └─ "Merge" button

4. On confirmation, backend does:

   For EACH secondary user:
   ├─ Update all PODs
   │  ├─ Where createdById = secondary
   │  │  └─ Set createdById = primary
   │  └─ Where assignedEngineer = secondary.name
   │     └─ Set assignedEngineer = primary.name
   │
   ├─ Update all LogIssues
   │  ├─ Where createdById = secondary
   │  │  └─ Set createdById = primary
   │  └─ Update resolutionOwner array
   │     └─ Replace secondary.email with primary.email
   │
   ├─ Update all Notifications
   │  ├─ Where userId = secondary
   │  │  └─ Set userId = primary
   │  ├─ Where createdById = secondary
   │  │  └─ Set createdById = primary
   │  └─ Where createdForId = secondary
   │     └─ Set createdForId = primary
   │
   ├─ Update all PodStatusHistory
   │  └─ Where changedById = secondary
   │     └─ Set changedById = primary
   │
   └─ Mark secondary as merged
      └─ Set mergedIntoUserId = primary.id

5. Results:
   ├─ Only primary profile visible in /users
   ├─ All PODs show primary engineer name
   ├─ All issues assigned to primary
   ├─ All notifications go to primary
   ├─ Analytics consolidated under primary
   └─ Complete audit trail preserved
```

**Benefits**:

```
Before merge:
├─ POD assigned to "Rajesh Kumar" (imported)
├─ POD assigned to "Rajesh" (registered)
├─ Two entries in dropdown
└─ Analytics shows both names

After merge:
├─ All PODs show "Rajesh" (primary)
├─ Single dropdown entry
├─ Engineers dropdown deduplicated
└─ Analytics consolidated
```

---

## 6. API Architecture & Endpoints

### API Structure

```
/api/
├─ auth/
│  ├─ POST login
│  ├─ POST signup
│  ├─ GET me
│  └─ POST logout
│
├─ pods/
│  ├─ GET (list with pagination)
│  ├─ POST (create/import)
│  ├─ PUT /[id] (update)
│  ├─ DELETE /[id] (delete)
│  └─ GET active-pods/ (active only)
│
├─ log-issues/
│  ├─ GET (list)
│  ├─ POST (create)
│  ├─ PUT /[id] (update)
│  └─ DELETE /[id] (delete)
│
├─ users/
│  ├─ GET (list all)
│  ├─ POST (create)
│  ├─ PUT /[id]/role (change role)
│  ├─ PUT /[id]/password (update password)
│  └─ POST /merge (merge profiles)
│
├─ notifications/
│  ├─ GET (fetch notifications)
│  └─ PUT /[id]/read (mark read)
│
├─ engineers/
│  └─ GET (deduplicated list)
│
├─ search/
│  └─ POST /pods (advanced search)
│
├─ analytics/
│  └─ GET (analytics data)
│
└─ autofill-pods/
   └─ POST (autofill feature)
```

### Request/Response Pattern

```typescript
// All endpoints follow this pattern:

// Request
POST /api/[resource]
Headers: {
  "Content-Type": "application/json",
  "Cookie": "auth_token=[jwt]"  // Auto sent by browser
}
Body: {
  // Endpoint-specific data
}

// Response
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string,
  totalCount?: number,  // For paginated responses
  totalPages?: number,
  currentPage?: number
}
```

### Example Endpoints in Detail

**POST /api/auth/login**
```typescript
// Request
{
  email: "user@example.com",
  password: "password123"
}

// Processing
1. Validate input (Zod schema)
2. Find user by email
3. Compare password with bcryptjs
4. Create JWT token (7-day expiry)
5. Store token in database
6. Set HTTP-only cookie

// Response
{
  success: true,
  user: {
    id: "user-123",
    email: "user@example.com",
    name: "John Doe",
    role: "ADMIN"
  }
}
```

**GET /api/pods?page=1&pageSize=10&field=status&value=Engineering**
```typescript
// Processing
1. Authenticate user
2. Build WHERE clause from query params
3. Apply role-based visibility filter
4. Execute paginated query
5. Convert to client format
6. Return with pagination metadata

// Response
{
  success: true,
  pods: [
    {
      id: "pod-123",
      pod: "POD-001",
      status: "Engineering",
      // ... 50+ more fields
    },
    // ... more pods
  ],
  totalCount: 47,
  totalPages: 5,
  currentPage: 1
}
```

**POST /api/pods**
```typescript
// Request
{
  pods: [{
    pod: "POD-002",
    type: "HW",
    status: "Initial",
    assignedEngineer: "rajesh.kumar@company.com",
    // ... 500+ fields
  }],
  isHistory: false
}

// Processing (for each POD)
1. Validate required fields
2. Auto-create imported profile if needed
3. Transform to database format
4. Insert into database
5. Create status history record
6. Trigger notifications
7. Log transaction

// Response
{
  success: true,
  message: "1 POD imported successfully"
}
```

**POST /api/users/merge**
```typescript
// Request
{
  primaryUserId: "primary-123",
  secondaryUserIds: ["secondary-1", "secondary-2"]
}

// Processing
1. Validate primary has email
2. For each secondary:
   - Update all PODs (createdById, assignedEngineer)
   - Update all LogIssues
   - Update all Notifications
   - Update PodStatusHistory
   - Mark as merged
3. Log transaction

// Response
{
  success: true,
  message: "Merged 2 profiles successfully"
}
```

---

## 7. Authentication & Authorization

### Authentication Flow (JWT + Cookies)

```
┌─ User enters credentials
├─ POST /api/auth/login
├─ Server:
│  ├─ Validate email/password
│  ├─ Create JWT token: jwt.sign({userId}, SECRET, 7d)
│  ├─ Store in database (Token model)
│  └─ Set HTTP-only cookie
├─ Response: {user, token}
└─ Browser:
   ├─ Stores token in cookie (automatic)
   ├─ All subsequent requests include it
   └─ Can't be accessed by JavaScript (secure!)
```

### Authorization - 4-Tier Role System

```typescript
// Role Hierarchy
type UserRole = "REGULAR" | "ADMIN" | "PRIORITY" | "SUPER_ADMIN"

// Permissions by Role
REGULAR:
├─ View own PODs (shouldDisplay=true)
├─ Create new PODs
├─ Edit own PODs
├─ View log issues
├─ Create/edit issues
└─ View notifications

ADMIN:
├─ All REGULAR permissions
├─ View all PODs
├─ Edit all PODs
├─ Delete PODs
├─ Change priority
├─ Import/export Excel
├─ Manage users (change roles, passwords)
└─ View audit logs

PRIORITY:
├─ View all PODs
├─ Cannot create/edit PODs
├─ Hide/show PODs (toggle shouldDisplay)
├─ View all notifications
└─ Notified of critical milestones

SUPER_ADMIN:
├─ All permissions (unrestricted)
├─ Merge user profiles
├─ Manage all system settings
├─ View all audit trails
└─ Access test endpoints
```

### Permission Gates in Code

```typescript
// In components
const { user, hasPermission } = useAuth()

if (!hasPermission('edit_pod')) {
  return <div>You don't have permission</div>
}

// In API routes
const user = await getCurrentUser()
if (user?.role !== 'SUPER_ADMIN') {
  return NextResponse.json({error: 'Unauthorized'}, {status: 403})
}

// In lib/auth.ts
export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions: Record<UserRole, Permission[]> = {
    REGULAR: ['view_own_pods', 'create_pods', 'view_notifications'],
    ADMIN: [...REGULAR, 'view_all_pods', 'delete_pods', 'manage_users'],
    PRIORITY: ['view_all_pods', 'toggle_visibility', 'view_notifications'],
    SUPER_ADMIN: ['*']  // All permissions
  }
  return permissions[role].includes(permission) || 
         permissions[role].includes('*')
}
```

### Visibility Control (shouldDisplay field)

```
Concept: Some PODs are "hidden" from regular users

Used By:
└─ PRIORITY users create PODs with shouldDisplay=false
   (they don't appear in other users' lists)

Implementation:
├─ On POD creation:
│  └─ shouldDisplay = user.role !== 'PRIORITY'
│
├─ In search queries:
│  ├─ If SUPER_ADMIN/PRIORITY: show all
│  └─ If REGULAR/ADMIN: WHERE shouldDisplay=true
│
└─ In APIs:
   ├─ GET /api/pods: Apply filter
   └─ POST /api/pods/[id]/toggle-visibility: Change flag
```

---

## 8. Component Architecture

### Component Hierarchy

```
RootLayout (Next.js)
└─ AuthProvider (Context)
   └─ ThemeProvider (Light/dark)
      ├─ Toaster (Toast container)
      ├─ Header (Navigation)
      ├─ Sidebar (Menu)
      └─ Page (Dynamic - changes per route)
         └─ Multiple child components
            ├─ Tables (PodTable, HistoryTable, etc)
            ├─ Dialogs (AddPodDialog, EditPodDialog, etc)
            ├─ Forms (AdvancedSearch, etc)
            └─ UI Components (100+ from Radix UI)
```

### Key Components & Responsibilities

**Page Components** (7 main pages)

```typescript
/login
├─ Form with email/password
├─ Signup link
└─ Error handling

/signup
├─ Create account form
├─ Validation
└─ Auto-login on success

/main
├─ PodTable (active PODs)
├─ AdvancedSearch
├─ Export button
├─ Import/Autofill dialogs
├─ Pagination
└─ Add/Edit/Delete actions

/history
├─ HistoryTable (completed PODs)
├─ Search & filter
├─ Export
├─ Move to active action
└─ Same structure as /main

/log-issues
├─ LogIssuesTable
├─ Add issue dialog
├─ Pagination
└─ Edit/Delete actions

/analytics
├─ 3 tabs (Overview, Timeline, Performance)
├─ Charts & metrics
├─ Engineer performance
└─ SLA tracking

/users
├─ UserManagement table
├─ Change role dropdown
├─ Change password dialog
├─ Multi-select for merge
└─ Merge profiles dialog
```

**Dialog Components** (10+ modals)

```typescript
AddPodDialog
├─ 500+ input fields
├─ Form state with React Hook Form
├─ Zod validation
├─ Submit to server action
└─ Success/error handling

EditPodDialog
├─ Same as AddPodDialog
├─ Pre-filled with existing data
└─ Handles updates

PodDetailsDialog
├─ Read-only view of POD
├─ All 500+ fields displayed
└─ No edit capability

AddLogIssueDialog
├─ POD selector
├─ Issue description
├─ Root cause, resolution owners
└─ Submit to API

MergeProfilesDialog
├─ Show selected profiles
├─ Primary selection
├─ Validation messages
└─ Merge action

ImportExcelDialog
├─ File upload
├─ Preview data
├─ Column mapping
└─ Bulk import

// ... 3 more dialogs
```

**Table Components** (4)

```typescript
PodTable
├─ Dynamic columns based on screen width
├─ Sorting by priority
├─ Inline priority editing
├─ Color-coded status badges
├─ Checkbox selection
├─ Action buttons (Edit, Delete, Complete, etc)
├─ Pagination controls
└─ Empty state handling

HistoryTable
├─ Similar to PodTable
├─ Move to active action
└─ Sorted by completion date

LogIssuesTable
├─ Issue-specific columns
├─ Status indicators
└─ Edit/Delete actions

UserManagement
├─ User list
├─ Type badges (Imported/Registered)
├─ Role selector
├─ Password change button
├─ Multi-select for merge
└─ Merge button
```

**Feature Components**

```typescript
AdvancedSearch
├─ Dynamic field selector
├─ Multiple criteria rows
├─ Add/Remove criteria buttons
└─ Search/Clear actions

ExportExcel
├─ Export button
├─ Handles all 60+ columns
├─ Formats dates in Central Time
└─ Triggers download

NotificationBell
├─ Icon with unread count badge
├─ Click opens dropdown
├─ List of recent notifications
├─ Mark as read buttons
└─ Link to full notifications page

Header & Sidebar
├─ Navigation between pages
├─ User profile menu
├─ Theme toggle
└─ Logout button
```

### Data Flow in Components

```typescript
// Example: PodTable Component

// 1. Parent (Main Page) fetches data
const [pods, setPods] = useState<Pod[]>([])

useEffect(() => {
  fetchPods()
}, [currentPage, searchCriteria])

// 2. Fetch via server action
const fetchPods = async () => {
  const result = await getPods(page, pageSize, search, userId)
  setPods(result.pods)
}

// 3. Pass data to table
<PodTable
  pods={pods}
  onComplete={handleComplete}
  refreshData={fetchPods}
/>

// 4. Table renders with data
// User edits POD inline (priority)
<Input
  value={editingPriority?.value}
  onChange={(e) => setEditingPriority({
    id: pod.id,
    value: parseInt(e.target.value)
  })}
/>

// 5. User presses Enter
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    handleSavePriority()
  }
}}

// 6. Save via server action
const handleSavePriority = async () => {
  await updatePodPriority(
    editingPriority.id,
    editingPriority.value,
    userId
  )
  fetchPods()  // Refresh
}

// 7. Server action updates database
// 8. Cache revalidated
// 9. Table re-fetches automatically
// 10. New priority visible
```

---

## 9. Server-Side Logic (Actions)

### Server Actions Location & Size

**File**: `lib/actions.ts` (1900+ lines)

**Key Actions**:

```typescript
// POD Actions
export async function addPod(pod: Pod, userId: string) { ... }
export async function updatePod(pod: Pod, userId: string) { ... }
export async function getPods(page, pageSize, criteria, userId) { ... }
export async function completePod(podId: string, userId: string) { ... }
export async function deletePod(podId: string, userId: string) { ... }
export async function moveToHistory(podId: string, userId: string) { ... }
export async function moveToActive(podId: string, userId: string) { ... }
export async function updatePodPriority(podId, priority, userId) { ... }

// Search & Export
export async function getPods() { ... }  // With filtering
export async function exportPodsToExcel(isHistory, criteria) { ... }

// Log Issues
export async function addLogIssue(issue: LogIssue, userId) { ... }
export async function updateLogIssue(issue, userId) { ... }
export async function getLogIssues(page, pageSize) { ... }

// Data Transformation
function clientToDatabasePod(pod: Pod) { ... }      // Input → DB
function databaseToClientPod(pod: any): Pod { ... } // DB → Display

// Helpers
function parseDate(str, isNA): Date | null { ... }
function formatDate(date: Date): string | null { ... }
function calculateTotalElapsedTime(start, end): number { ... }
function formatTimeInCurrentStatus(status, date): string { ... }
function createStatusHistory(...) { ... }
```

### Transaction Flow in Detail

```typescript
// Every database operation is wrapped:

export async function updatePod(pod: Pod, userId: string) {
  try {
    // Step 1: Get original
    const original = await prisma.pod.findUnique({where: {id}})

    // Step 2: Transform & validate
    const dbPod = clientToDatabasePod(pod)

    // Step 3: Update database
    const updated = await prisma.pod.update({
      where: {id},
      data: dbPod
    })

    // Step 4: Create audit history
    await createStatusHistory(id, updated.status, original.status, userId)

    // Step 5: Generate notifications
    if (changed.assignedEngineer) {
      // Find user and create notification
    }

    // Step 6: Log transaction
    await createTransaction({
      entityType: 'Pod',
      action: 'update',
      details: JSON.stringify({before: original, after: updated}),
      createdById: userId
    })

    // Step 7: Revalidate cache
    revalidatePath('/main')

    // Step 8: Return success
    return {success: true}

  } catch (error) {
    // Log error
    console.error(error)
    // Return failure
    return {success: false, message: error.message}
  }
}
```

---

## 10. Business Logic & Algorithms

### SLA Calculation Algorithm

```typescript
// Input: podTypeOriginal, podWorkableDate
// Output: slaCalculatedNbd (deadline date)

const podTypeBusinessDays = {
  'FFA': 22,
  'Greenfield': 10,
  'Brownfield Upgrades': 15
}

function calculateSLA(podTypeOriginal, podWorkableDate) {
  const businessDays = podTypeBusinessDays[podTypeOriginal]
  
  if (!businessDays || !podWorkableDate) {
    return null
  }

  // Use moment-business-days library
  // Skips weekends automatically
  const slaDate = moment(podWorkableDate)
    .businessAdd(businessDays)  // Add business days
    .toDate()

  return slaDate
}

// Example:
// podWorkableDate = Jan 10, 2024 (Wednesday)
// podTypeOriginal = 'Greenfield' (10 days)
// Result = Jan 24, 2024 (10 business days later, skips weekends)
```

### Cycle Time Calculation

```typescript
// Input: assignedEngineerDate, lcmComplete
// Output: totalElapsedCycleTime (number of days)

function calculateTotalElapsedTime(
  assignedEngineerDate: Date | null,
  lcmComplete: Date | null
): number {
  if (!assignedEngineerDate) return 0

  // If not completed yet, measure until now
  const endDate = lcmComplete || new Date()

  // Use date-fns to get day difference
  return differenceInDays(endDate, assignedEngineerDate)
}

// Example:
// assignedEngineerDate = Jan 1, 2024
// lcmComplete = Jan 31, 2024
// Result = 30 days total elapsed
```

### Time in Current Status

```typescript
// Input: subStatus, subStatusLastChanged
// Output: "Status - N days"

function formatTimeInCurrentStatus(
  subStatus: string,
  subStatusLastChanged: Date | null
): string {
  if (!subStatusLastChanged) {
    return `${subStatus} - N/A`
  }

  const days = differenceInDays(new Date(), subStatusLastChanged) + 1

  return `${subStatus} - ${days} days`
}

// Example:
// subStatus = 'Assessment'
// subStatusLastChanged = Jan 10, 2024
// today = Jan 15, 2024
// Result = "Assessment - 5 days"
```

### Engineer Deduplication

```typescript
// Problem: Same engineer has multiple profile entries
// Solution: Use Map for O(1) lookup

async function getEngineers() {
  const pods = await prisma.pod.findMany({
    select: {assignedEngineer: true},
    where: {isHistory: false, isDeleted: false}
  })

  // Deduplicate using Map
  const engineerMap = new Map()

  for (const pod of pods) {
    const email = pod.assignedEngineer?.trim()
    
    if (email && !engineerMap.has(email)) {
      engineerMap.set(email, {
        name: email,
        email: email,
        isRegistered: hasUserWithEmail(email)
      })
    }
  }

  // Convert to array
  return Array.from(engineerMap.values())
}

// Result:
// Input: [{assigned: "rajesh@a.com"}, {assigned: "rajesh@a.com"}]
// Output: [{email: "rajesh@a.com", ...}]  // Single entry!
```

### Data Transformation Pipeline

```
CLIENT INPUT
    ↓
┌─────────────────────────┐
│  Zod Validation         │
│ (Validate schema)       │
└─────────┬───────────────┘
          ↓
┌─────────────────────────┐
│ clientToDatabasePod()   │
├─ Parse date strings    │
├─ Calculate SLA         │
├─ Format cycle times    │
└─────────┬───────────────┘
          ↓
┌─────────────────────────┐
│ Prisma Operation       │
│ (create/update)        │
└─────────┬───────────────┘
          ↓
┌─────────────────────────┐
│ databaseToClientPod()   │
├─ Format dates for display
├─ Calculate display values
├─ All 500+ fields mapped
└─────────┬───────────────┘
          ↓
FRONTEND DISPLAY
```

---

## 11. Error Handling & Validation

### Validation Layers

```
1. Client-Side (React Component)
   └─ Form validation with React Hook Form
      └─ Real-time feedback

2. Client-Side (Before Submit)
   └─ Zod schema validation
      └─ Comprehensive schema checking

3. Server-Side (Route Handler)
   └─ Verify JWT token
   └─ Check user role/permissions
   └─ Validate request body

4. Server-Side (Server Action)
   └─ Business logic validation
   └─ Database consistency checks
   └─ Referential integrity

5. Database Level
   └─ Constraints
   └─ Foreign keys
   └─ Unique indexes
```

### Error Responses

```typescript
// All endpoints return consistent error format:

// 400 Bad Request
{
  success: false,
  error: "Invalid input",
  message: "Pod ID is required"
}

// 401 Unauthorized
{
  success: false,
  error: "Unauthorized",
  message: "Invalid token or expired session"
}

// 403 Forbidden
{
  success: false,
  error: "Forbidden",
  message: "You don't have permission to perform this action"
}

// 404 Not Found
{
  success: false,
  error: "Not Found",
  message: "POD not found with ID: [id]"
}

// 500 Internal Server Error
{
  success: false,
  error: "Server Error",
  message: "Failed to process request"
}
```

### Try-Catch Pattern

```typescript
export async function updatePod(pod: Pod, userId: string) {
  try {
    // Business logic here
    const result = await prisma.pod.update({...})
    return {success: true}

  } catch (error) {
    // Log error details
    console.error("Error updating pod:", error)

    // Return user-friendly message
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {success: false, message: 'POD not found'}
      }
    }

    return {success: false, message: 'Failed to update POD'}
  }
}
```

---

## 12. Performance & Optimization

### Database Indexes

```sql
-- Critical for read performance
CREATE INDEX idx_user_email ON user(email WHERE email IS NOT NULL)
CREATE INDEX idx_user_role ON user(role)
CREATE INDEX idx_pod_history_deleted ON pod(isHistory, isDeleted)
CREATE INDEX idx_pod_priority ON pod(priority)
CREATE INDEX idx_pod_createdAt ON pod(createdAt)
CREATE INDEX idx_notification_user_read ON notification(userId, read)
```

### Pagination Strategy

```typescript
// All list endpoints use pagination
// Prevents loading thousands of records

const pageSize = 10  // Records per page
const page = 1       // Current page

const skip = (page - 1) * pageSize  // Skip first 10
const take = pageSize               // Take next 10

const pods = await prisma.pod.findMany({
  skip,
  take,
  orderBy: {createdAt: 'desc'}
})

// Response includes pagination metadata
return {
  pods,
  totalCount,
  totalPages: Math.ceil(totalCount / pageSize),
  currentPage: page
}
```

### Query Optimization

```typescript
// Use select to fetch only needed columns
const pods = await prisma.pod.findMany({
  select: {
    id: true,
    pod: true,
    status: true,
    assignedEngineer: true
    // NOT all 500+ fields!
  }
})

// Use include selectively
const pods = await prisma.pod.findMany({
  include: {
    createdBy: {
      select: {email: true}  // NOT all user fields
    }
  }
})
```

### Cache Revalidation Strategy

```typescript
// Only revalidate paths that changed
revalidatePath('/main')      // POD list
revalidatePath('/history')   // History page
revalidatePath('/log-issues')// Issues page

// NOT entire app - targeted updates for speed
```

### Timezone Optimization

```typescript
// Moment.js caches timezone data
// All operations use Central Time

const TIMEZONE = 'America/Chicago'

// Consistent throughout app
const date = moment().tz(TIMEZONE).toDate()
const formatted = moment(date).tz(TIMEZONE).format('MM-DD-YYYY')
```

---

## Summary of Data Flow

```
┌──────────────────────────────────────────────────────┐
│            USER INTERACTION                          │
│  (Click button, type form, navigate)                 │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         REACT COMPONENT                              │
│  (State management with Context/Hooks)               │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         CLIENT VALIDATION                            │
│  (Zod schema validation)                             │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         HTTP REQUEST                                 │
│  (POST/GET/PUT/DELETE to /api/...)                   │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         NEXT.JS API ROUTE                            │
│  (Check auth, check permissions)                     │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         SERVER ACTION (lib/actions.ts)               │
│  (Business logic, data transformation)               │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         PRISMA ORM                                   │
│  (SQL query generation)                              │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         POSTGRESQL DATABASE                          │
│  (Data persistence)                                  │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         NOTIFICATIONS & AUDIT                        │
│  (Create notifications, log transactions)            │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         CACHE REVALIDATION                           │
│  (ISR - Incremental Static Regeneration)             │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         HTTP RESPONSE                                │
│  (Success/error with data)                           │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         REACT UPDATE                                 │
│  (State update, UI re-render)                        │
└──────────────┬───────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────┐
│         USER FEEDBACK                                │
│  (Toast, updated table, refresh data)                │
└──────────────────────────────────────────────────────┘
```

---

This documentation covers the complete architecture, data flows, features, and technical implementation of the POD Inventory Management system.
