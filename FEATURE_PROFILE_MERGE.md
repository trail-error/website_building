# User Profile Merge Feature - Implementation Summary

## Overview
This document outlines the implementation of the user profile merge feature for the Inventory Management System, enabling Super Admins to merge duplicate engineer profiles (imported vs registered).

## Problem Statement
- When engineers import data via "Import from Excel", engineer names without emails create user profiles
- Example: "Rajesh Kumar" from Excel creates a profile without email
- When the same person signs up, they create a profile with email (e.g., "Rajesh@gmail.com")
- These appear as two separate profiles, causing data fragmentation
- Imported profiles weren't visible in "Manage Users" page

## Solution Architecture

### 1. Database Schema Changes (Prisma)
Modified `User` model in `prisma/schema.prisma`:
- Made `email` optional (nullable) to support imported profiles without email
- Made `password` optional (nullable) for imported profiles
- Added `isImportedProfile` boolean field - marks profiles created from Excel import
- Added `mergedIntoUserId` string field - tracks which user a profile was merged into

### 2. API Endpoints

#### `/api/pods/route.ts` (POST - Import)
- Enhanced to auto-create imported engineer profiles when Excel data contains engineer names
- Creates `User` records with `isImportedProfile: true` for names not containing "@"
- Prevents duplicate profile creation by checking existing profiles

#### `/api/users/route.ts` (GET - List Users)
- Modified to display both registered and imported profiles
- Filters out users that have been merged (`mergedIntoUserId != null`)
- Returns pagination for all visible profiles

#### `/api/users/merge/route.ts` (POST - NEW)
- Accepts multiple user IDs and a primary user ID to merge into
- Validates that at least 2 profiles are selected
- Validates primary user has email (is registered)
- Updates all references across the system:
  - Pods: Updates `assignedEngineer` field to primary user's name
  - LogIssues: Updates `createdById` to primary user
  - Pods: Updates `createdById` for pods created by secondary users
  - Notifications: Redirects all notifications
  - PodStatusHistory: Updates change tracking
- Marks secondary users as `mergedIntoUserId: primaryUserId`
- Logs merge transaction for audit trail

#### `/api/engineers/route.ts` (GET - List Engineers)
- Enhanced to include both registered and imported profiles
- Excludes merged profiles automatically
- Returns flags: `isRegistered` and `isImported`
- Matches engineers by email (registered) or name (imported)

### 3. Frontend Components

#### `components/merge-profiles-dialog.tsx` (NEW)
- Multi-select dialog for choosing profiles to merge
- Shows profile type (Imported/Registered) with badges
- Allows selection of primary profile (must have email)
- Displays merge summary before confirmation
- Calls `/api/users/merge` endpoint
- Provides user feedback via toasts

#### `components/user-management.tsx` (Updated)
- Added checkboxes for multi-select profile selection
- Added selection highlight and counter bar
- Added "Merge Profiles" button that opens merge dialog
- Shows "Type" column with badges (Imported/Registered)
- Integrated merge completion handler for refresh
- Checkbox for select-all functionality

### 4. Core Libraries

#### `lib/auth.ts` (Updated)
- Modified `getAllUsers()` to return imported profiles
- Filters out merged users automatically
- Added `createOrGetImportedProfile()` function

#### `lib/types.ts` (Updated)
- Updated `User` interface to reflect nullable email/password
- Added `isImportedProfile?: boolean`
- Added `mergedIntoUserId?: string | null`

## Workflow

### Step 1: Import Data with New Engineer Names
When user imports Excel with "Assigned Engineer" column:
1. System checks each engineer name
2. If name doesn't contain "@", creates imported profile
3. Profile created with: `name`, `isImportedProfile: true`, `role: REGULAR`, no email/password

### Step 2: View All Profiles in Manage Users
Super Admin sees:
- Registered users with email (badge: "Registered")
- Imported profiles without email (badge: "Imported")
- Both types are fully visible and manageable

### Step 3: Merge Duplicate Profiles
Super Admin can:
1. Select multiple profiles (e.g., "Rajesh" + "Rajesh Kumar")
2. Click "Merge Profiles"
3. Choose which one is primary (must have email - the registered one)
4. Confirm merge

### Step 4: Post-Merge System State
After merge:
- All pods assigned to "Rajesh Kumar" now show "Rajesh" (primary user's name)
- Secondary user marked as merged
- Single profile used everywhere: analytics, logs, issues, dashboard
- User logs in with email/password (registered account credentials)

## Data Consistency

The merge operation ensures complete data consistency by updating:
1. **Pod Assignments**: `assignedEngineer` field updated
2. **Creator Tracking**: `createdById` redirected to primary user
3. **Notifications**: All notifications redirected
4. **Status History**: Change tracking updated
5. **Transaction Logs**: Merge action logged for audit

## Security & Validation

- Super Admin only operation (verified in merge endpoint)
- Primary user must have email (registered profile)
- At least 2 profiles required for merge
- Transaction logging for audit trail
- Soft deletion approach (mark as merged, don't delete)

## Files Modified/Created

### Created:
- `app/api/users/merge/route.ts` - Merge endpoint
- `components/merge-profiles-dialog.tsx` - Merge UI component

### Modified:
- `prisma/schema.prisma` - Added schema fields
- `lib/auth.ts` - Added functions and modified user fetching
- `lib/types.ts` - Updated User interface
- `components/user-management.tsx` - Added merge UI
- `app/api/pods/route.ts` - Auto-create imported profiles on import
- `app/api/engineers/route.ts` - Include imported profiles

## Database Migration

Migration: `20260111182957_add_profile_merge_fields`
- Makes email nullable
- Makes password nullable
- Adds isImportedProfile boolean (default: false)
- Adds mergedIntoUserId string (nullable)

## Future Enhancements

1. Bulk merge operation UI improvements
2. Merge history/audit report for Super Admins
3. Automatic profile detection for likely duplicates
4. Profile activity indicators (last used date)
5. Undo merge functionality (with audit trail)
