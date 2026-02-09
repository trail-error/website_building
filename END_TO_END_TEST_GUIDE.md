# Complete Functionality Test Guide - Profile Merge Feature

## End-to-End Test Scenario

This guide walks you through a complete test of all profile merge features from start to finish.

### Prerequisites
- Application running on http://localhost:3000
- Logged in as Super Admin user (e.g., dukkar@gmail.com)
- Clean database or separate test environment

---

## Scenario: Merge Rajesh Profiles

This scenario creates two "Rajesh" profiles and merges them:
- **Profile A**: "Rajesh Kumar" (imported, no email)
- **Profile B**: "Rajesh" (registered, has email)

### Step 1: Import Excel with Imported Engineer Name

**Goal**: Create an imported profile for "Rajesh Kumar"

1. Navigate to **Main page** (http://localhost:3000/main)
2. Look for "Import from Excel" button
3. Prepare an Excel file with columns:
   - `POD` (required): Enter "TEST-RAJ-001"
   - `Assigned Engineer`: Enter "Rajesh Kumar"
   - Other fields: Leave empty or fill as needed

4. Click **"Import from Excel"**
5. Upload the file
6. Review preview - should show 1 row
7. Click **"Import"**

**Expected Result**:
- ✓ Import completes successfully
- ✓ POD "TEST-RAJ-001" created with assignedEngineer = "Rajesh Kumar"
- ✓ Toast notification shows success

**Verify**:
- Go to Manage Users (/users)
- Should see "Rajesh Kumar" profile with:
  - Email: (empty / dash)
  - Type: "Imported" badge
  - Role: "REGULAR"

### Step 2: Check Dropdown Before Merge

**Goal**: Verify imported profile appears in dropdown

1. Navigate to **Main page**
2. Click **"Add New POD"** button
3. In the dialog, click **"Assigned Engineer"** dropdown
4. Look for "Rajesh Kumar" in the list

**Expected Result**:
- ✓ "Rajesh Kumar" appears in dropdown
- ✓ Only appears once
- ✓ Can select it

### Step 3: Create Registered Profile (Optional if not exists)

**Goal**: Create a registered "Rajesh" profile with email

1. Navigate to **Login page** (http://localhost:3000/login)
2. Click "Sign up"
3. Fill form:
   - Email: `rajesh@gmail.com`
   - Password: (set any password)
   - Name: `Rajesh`
4. Click "Sign up"
5. Verify you're logged in as Rajesh

**Expected Result**:
- ✓ New user account created
- ✓ Can log in with rajesh@gmail.com

**Return to Admin**:
- Log out
- Log in as Super Admin (dukkar@gmail.com)

### Step 4: Verify Both Profiles Exist in Manage Users

**Goal**: Confirm both profiles are visible

1. Navigate to **Manage Users** (/users)
2. Look for both profiles:
   - "Rajesh" with email "rajesh@gmail.com" - Type: "Registered"
   - "Rajesh Kumar" with no email - Type: "Imported"

**Expected Result**:
- ✓ Both profiles visible
- ✓ Different type badges shown
- ✓ "Rajesh" has email, "Rajesh Kumar" doesn't

### Step 5: Assign Some Pods to "Rajesh Kumar"

**Goal**: Create test data to verify merge consolidation

1. Navigate to **Main page**
2. Create a POD manually (or use import):
   - Click **"Add New POD"**
   - Fill in basic info
   - For **"Assigned Engineer"**: Select "Rajesh Kumar"
   - Click **"Add POD"**

**Expected Result**:
- ✓ POD created with assignedEngineer = "Rajesh Kumar"

**Repeat**: Create 1-2 more PODs assigned to "Rajesh Kumar"

### Step 6: Verify Dropdown Still Shows Single Entry

**Goal**: Confirm no duplicates yet

1. Click **"Add New POD"** again
2. Check **"Assigned Engineer"** dropdown
3. Count occurrences of "Rajesh" names

**Expected Result**:
- ✓ See "Rajesh" (registered) - 1x
- ✓ See "Rajesh Kumar" (imported) - 1x
- ✓ Each appears exactly once

### Step 7: Merge the Profiles

**Goal**: Consolidate both Rajesh profiles into one

1. Go to **Manage Users** (/users)
2. Find and **check** the checkboxes for:
   - "Rajesh" (with email)
   - "Rajesh Kumar" (without email)

**Expected Result**:
- ✓ Both checkboxes checked
- ✓ Selection counter shows "2 profile(s) selected"
- ✓ Blue bar appears with "Merge Profiles" button

3. Click **"Merge Profiles"** button
4. **Merge Dialog** opens showing:
   - Both profiles listed with checkboxes
   - Type badges (Imported/Registered)
   - Description of merge

5. For **"Primary Profile"** (must have email):
   - Click **"Set as Primary"** on "Rajesh" (with email)
   - Button should change to **"Primary"**

**Expected Result**:
- ✓ "Rajesh" marked as primary
- ✓ Dialog shows merge summary
- ✓ "Merge Profiles" button enabled

6. Click **"Merge Profiles"** button (in dialog)

**Expected Result**:
- ✓ Toast shows success: "Successfully merged 1 profile(s) into Rajesh"
- ✓ Dialog closes
- ✓ Manage Users page refreshes

### Step 8: Verify Merge Results in Manage Users

**Goal**: Confirm merged profiles are consolidated

1. In **Manage Users** page
2. Look for both profiles

**Expected Result**:
- ✓ Only "Rajesh" (primary) is visible
- ✓ "Rajesh Kumar" is no longer shown (merged/hidden)
- ✓ User count decreased by 1

### Step 9: Verify Dropdown Now Shows No Duplicates

**Goal**: Confirm dropdown deduplication

1. Navigate to **Main page**
2. Click **"Add New POD"**
3. Click **"Assigned Engineer"** dropdown
4. Count "Rajesh" entries

**Expected Result**:
- ✓ "Rajesh" appears exactly ONCE
- ✓ "Rajesh Kumar" no longer appears separately
- ✓ Can select "Rajesh" to assign pods

### Step 10: Verify Pod Assignments Updated

**Goal**: Confirm all pods now use primary name

1. Navigate to **Main page**
2. Look at the list of PODs
3. Find pods you assigned to "Rajesh Kumar"

**Expected Result**:
- ✓ All pods now show "Rajesh" as assignedEngineer
- ✓ Not "Rajesh Kumar" anymore
- ✓ All pods visible and functional

### Step 11: Verify Analytics Consolidated

**Goal**: Confirm analytics shows single bar for merged engineer

1. Navigate to **Analytics** page (/analytics)
2. Look at **"Workload Distribution"** section
3. Find "Rajesh" in the chart

**Expected Result**:
- ✓ "Rajesh" shows as single entry (not two)
- ✓ Pod count includes pods from both merged profiles
- ✓ Single bar in chart (if charted)

**Example**:
- Before: "Rajesh" (1 pod) + "Rajesh Kumar" (2 pods) = separate entries
- After: "Rajesh" (3 pods) = single consolidated entry

### Step 12: Verify No Data Loss

**Goal**: Confirm all pod data is intact

1. Go to **Main page**
2. Count total number of PODs
3. Verify it's the same as before merge

**Expected Result**:
- ✓ Total POD count unchanged
- ✓ All POD details intact
- ✓ No pods deleted

4. Go to **History page** (/history)
5. Search for "Rajesh"

**Expected Result**:
- ✓ History entries preserved
- ✓ Updated to show primary engineer name

### Step 13: Test Assigning New Pod to Merged Engineer

**Goal**: Verify merged profile works for new assignments

1. Create a new POD
2. Assign it to "Rajesh"

**Expected Result**:
- ✓ POD created successfully
- ✓ Shows "Rajesh" as engineer
- ✓ Appears in all views correctly

---

## Success Criteria Checklist

- [ ] Imported profile created without email
- [ ] Both profiles visible in Manage Users before merge
- [ ] Dropdown shows no duplicates after merge
- [ ] Merge operation completes successfully
- [ ] Only primary profile visible in Manage Users after merge
- [ ] All pods updated to use primary engineer name
- [ ] Analytics shows single consolidated entry
- [ ] No pod data lost during merge
- [ ] New pods can be assigned to merged engineer
- [ ] All system features (logs, issues, notifications) show merged profile

---

## Quick Test (5 minutes)

If short on time, run this minimal test:

1. Import Excel with "Test Engineer" name
2. Go to Manage Users - verify profile exists
3. Merge with a registered user manually (if one exists)
4. Check dropdown - verify no duplicates
5. Create new POD - assign to merged engineer
6. Verify POD shows merged name

**Success = All 5 steps complete without errors**

---

## Troubleshooting

### Issue: Imported profile not showing
- Check /api/users endpoint for the profile
- Verify email field is nullable in database
- Check migration: `20260111200000_fix_email_unique_constraint`

### Issue: Merge button disabled
- Ensure 2+ profiles selected
- Ensure at least one has email (for primary)
- Try selecting different profiles

### Issue: Dropdown still shows duplicates
- Clear browser cache
- Refresh page (Ctrl+Shift+R)
- Restart dev server
- Check /api/engineers endpoint directly

### Issue: Analytics not updated
- Navigate away and back to Analytics page
- Hard refresh (Ctrl+Shift+R)
- Check pod's assignedEngineer in database

---

## Database Queries (for verification)

```sql
-- Check all users including merged ones
SELECT id, email, name, "isImportedProfile", "mergedIntoUserId" FROM "User" ORDER BY name;

-- Check pods with "Rajesh"
SELECT DISTINCT "assignedEngineer" FROM "Pod" WHERE "assignedEngineer" LIKE '%Rajesh%';

-- Count pods per engineer
SELECT "assignedEngineer", COUNT(*) as count FROM "Pod" WHERE "isDeleted" = false GROUP BY "assignedEngineer" ORDER BY count DESC;

-- Check merged users
SELECT id, name, "mergedIntoUserId" FROM "User" WHERE "mergedIntoUserId" IS NOT NULL;
```

---

## Support

If issues occur:
1. Check console for errors
2. Review database queries above
3. Check API responses in browser DevTools
4. Refer to BUG_FIXES_VERIFICATION.md for detailed fixes
