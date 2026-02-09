# Analytics Consolidation - Verification Guide

## Quick Test (10 minutes)

### Step 1: Import Data with Multiple Engineer Names
1. Go to **Main** page
2. Click "Import from Excel"
3. Upload file with these engineers in "Assigned Engineer" column:
   - "Rajesh"
   - "Rajesh Kumar"
   - "Mounika"
   - "Mounika M"

### Step 2: Create Registered Profiles
1. Sign up as: 
   - Email: `rajesh@company.com`, Name: `Rajesh`
   - Email: `mounika@company.com`, Name: `Mounika`

### Step 3: Verify Dropdown Shows No Duplicates
1. Go to **Main** page
2. Click "Add POD" → Look at "Assigned Engineer" dropdown
   - ✅ Should show: `Rajesh` (appears once)
   - ✅ Should show: `Mounika` (appears once)
   - ❌ Should NOT show `Rajesh Kumar` separately
   - ❌ Should NOT show `Mounika M` separately

### Step 4: Merge Profiles
1. Go to **Manage Users** (Super Admin only)
2. Select both "Rajesh" profiles (imported + registered)
3. Click "Merge Profiles"
4. Select registered `rajesh@company.com` as primary
5. Click "Merge"
6. Repeat for Mounika profiles

### Step 5: Verify Analytics Consolidation
**Navigate to Analytics > Overview**

#### Workload Distribution Chart:
- ✅ Only shows ONE bar for "Rajesh" (not two)
- ✅ Only shows ONE bar for "Mounika" (not two)
- ✅ Bar height = total pods from ALL merged profiles
- ❌ Should NOT show separate bars for "Rajesh Kumar" or "Mounika M"

#### Workload Distribution Table:
- ✅ "Rajesh" row shows: consolidated total pods count
- ✅ "Mounika" row shows: consolidated total pods count
- ✅ Status breakdown includes all merged pods
- ❌ Should NOT have separate rows for name variations

#### All PODs Table:
- ✅ All pods show: canonical engineer names (e.g., "Rajesh", "Mounika")
- ✅ No pods show: old names (e.g., "Rajesh Kumar", "Mounika M")

#### Overdue PODs Table (if any):
- ✅ Engineer names are consolidated
- ✅ No duplicate entries for same engineer

## Detailed Verification Workflow

### Test Case 1: Name Variation Consolidation
```
Setup:
- Import pod with "Rajesh Kumar" as engineer
- Register user with name "Rajesh"
- Merge profiles

Expected After Merge:
- Pod's assignedEngineer field = "Rajesh" (primary name)
- Dropdown shows "Rajesh" (once)
- Analytics shows "Rajesh" (once) with count including merged pod

Verification:
1. Check Main page pod table - engineer shows "Rajesh"
2. Check Analytics > Workload Chart - "Rajesh" bar is consolidated
3. Check Manage Users - merged profile marked as merged
```

### Test Case 2: Email Variation Consolidation
```
Setup:
- Imported profile: "EngineerName" (no email)
- Registered profile: "EngineerName" (email: eng@company.com)

Expected After Merge:
- All pods reference "EngineerName" (canonical)
- Dropdown shows "EngineerName" with badge "Registered"
- Analytics consolidates under "EngineerName"

Verification:
1. Check engineers API response - no email-only entry
2. Check dropdown - one entry per canonical name
3. Check analytics - consolidated workload
```

### Test Case 3: Multiple Merges
```
Setup:
- Have 3 variations of same engineer name
- Merge them progressively or all at once

Expected After All Merges:
- All pods under one canonical name
- One dropdown entry
- One analytics entry with all pod counts

Verification:
1. Create multiple pods with variations
2. Verify dropdown duplication
3. Merge all profiles
4. Verify single dropdown entry
5. Verify single analytics entry with consolidated counts
```

## Key Metrics to Check

### In Analytics > Overview Page

| Metric | Expected | Bad Sign |
|--------|----------|----------|
| Number of engineers in dropdown | 5-6 unique names | Duplicates like "Rajesh", "rajesh", "Rajesh K." |
| Workload Distribution Chart | One bar per engineer | Multiple bars for same name variations |
| Workload Distribution Table | One row per engineer | Multiple rows for same engineer |
| Total PODs count | Matches all PODs | Missing pods from merged profiles |
| Overdue PODs | Consolidated by engineer | Duplicated by engineer name |

### Database Verification (Optional)

```sql
-- Check pods are updated to primary name
SELECT DISTINCT "assignedEngineer" FROM "Pod" 
WHERE "assignedEngineer" LIKE '%ajesh%' 
ORDER BY "assignedEngineer";
-- Should show only: "Rajesh" (one entry)

-- Check merged users marked correctly
SELECT "id", "name", "mergedIntoUserId" FROM "User" 
WHERE "mergedIntoUserId" IS NOT NULL;
-- Should show secondary users with mergedIntoUserId populated
```

## Common Issues & Solutions

### Issue: Still seeing duplicate names in dropdown
**Solution**: 
1. Clear browser cache (Cmd+Shift+Delete)
2. Hard refresh page (Cmd+Shift+R)
3. Restart dev server (`npx next dev`)

### Issue: Analytics shows old engineer names
**Solution**:
1. Verify merge completed without errors
2. Check pod table - assignedEngineer updated?
3. Restart analytics page and clear filters
4. Check that merged users are properly marked

### Issue: Some pods not consolidated
**Solution**:
1. Check if pod has exact name match in database
2. Verify merge operation completed
3. Check if there are case-sensitivity issues
4. Check if engineer name has special characters

## Expected Post-Merge Behavior

### Before Merge
```
Manage Users:
├─ Rajesh (imported, no email)
├─ Rajesh (registered, rajesh@company.com)
└─ ...

Engineers Dropdown:
├─ Rajesh       [Appears twice due to duplication]
├─ Rajesh
└─ ...

Analytics Chart:
├─ "Rajesh" bar: 2 pods
├─ "Rajesh Kumar" bar: 3 pods  [Different name variation]
└─ ...

Analytics Table:
├─ Rajesh: 2 pods
├─ Rajesh Kumar: 3 pods
└─ ...
```

### After Merge
```
Manage Users:
├─ Rajesh (registered, rajesh@company.com) [Primary]
├─ Rajesh (imported, no email) [Marked as merged]
└─ ...

Engineers Dropdown:
├─ Rajesh       [Appears once only]
└─ ...

Analytics Chart:
├─ "Rajesh" bar: 5 pods  [Consolidated from all variations]
└─ ...

Analytics Table:
├─ Rajesh: 5 pods, status breakdown showing all
└─ ...
```

## Rollback Procedure (If Needed)

If something goes wrong, you can:

1. **Undo specific merge**:
   - Find the merged users in Manage Users
   - Mark them separately (manual database update if needed)

2. **Restore from backup**:
   - Use Vercel backup if deployed
   - Use local database backup

3. **Restart affected pods**:
   - Clear POD assignments and reassign

## Questions to Verify

After testing, answer these:

1. **Dropdown**: Are engineer names appearing only once? ✓ Yes / ✗ No
2. **Analytics Chart**: Do similar engineer names consolidate into one bar? ✓ Yes / ✗ No
3. **Analytics Table**: Do consolidated engineers show all their pods? ✓ Yes / ✗ No
4. **Pod Tables**: Do pods show canonical engineer names? ✓ Yes / ✗ No
5. **Status Breakdown**: Does workload distribution show correct status counts? ✓ Yes / ✗ No

---

**Status**: Ready for testing - All code changes deployed
