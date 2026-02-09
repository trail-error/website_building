# Profile Merge Feature - Bug Fixes & Verification Guide

## Bugs Fixed

### Bug #1: Duplicate Engineer Names in Dropdown
**Issue**: After merging profiles, the same engineer name appeared multiple times in the "Assigned Engineer" dropdown (e.g., "Mounika" appeared twice).

**Root Cause**: The `/api/engineers` endpoint was returning all unique `assignedEngineer` values from pods without deduplication. If there were multiple pods with the same engineer name (possibly due to different name formats or merge operations), they would each create a separate entry.

**Solution Applied**:
- Modified `/app/api/engineers/route.ts` to deduplicate engineers by name
- Used a Map with name as key to ensure only one entry per engineer
- When duplicates exist, prefer the one with a user profile ID (registered user)
- Sort final list alphabetically

**Changes**:
```typescript
// Before: Created separate entry for each unique assignedEngineer value
const engineers = uniqueEngineerValues.map(...)

// After: Deduplicate by name using a Map
const engineersMap = new Map<string, any>()
for (const engineerValue of uniqueEngineerValues) {
  // ... lookup user profile
  const key = engineer.name.toLowerCase()
  if (!engineersMap.has(key) || (!engineersMap.get(key).id && engineer.id)) {
    engineersMap.set(key, engineer)
  }
}
const engineers = Array.from(engineersMap.values())
```

### Bug #2: Duplicate Names in Analytics After Merge
**Issue**: After merging "Rajesh" and "Rajesh Kumar" profiles, the analytics page still showed two separate bars/rows instead of consolidating them.

**Root Cause**: The merge operation was only updating pods assigned to the secondary user's exact name. If pods had different name variations (e.g., "Rajesh Kumar" vs "Rajesh"), only one variation would be updated while the other remained unchanged.

**Solution Applied**:
- Enhanced `/app/api/users/merge/route.ts` to collect ALL possible identifiers for secondary users
- Update pods for each identifier variant (name, email, userId)
- This ensures complete consolidation regardless of how engineer names were stored

**Changes**:
```typescript
// Before: Only updated one specific engineer identifier
await prisma.pod.updateMany({
  where: { assignedEngineer: secondaryUser.name || secondaryUser.email || secondaryUserId },
  data: { assignedEngineer: primaryUserName }
})

// After: Update all possible engineer identifiers
const secondaryEngineerIds = [
  secondaryUser.name,
  secondaryUser.email,
  secondaryUserId,
].filter(Boolean) as string[]

for (const engineerId of secondaryEngineerIds) {
  await prisma.pod.updateMany({
    where: { assignedEngineer: engineerId },
    data: { assignedEngineer: primaryUserName }
  })
}
```

## Verification Checklist

### ✓ Test 1: No Duplicate Engineers in Dropdown
1. Navigate to Main page
2. Open "Add New POD" dialog
3. Click on "Assigned Engineer" dropdown
4. **Verify**: Each engineer name appears only ONCE
5. Count the entries for any engineer - should be 1
6. **Status**: If you see duplicates, the fix didn't apply correctly

### ✓ Test 2: Analytics Consolidates After Merge
1. Navigate to Analytics page
2. Check "Workload Distribution" section
3. Note the engineer names and their counts
4. Go back to Manage Users
5. Merge two profiles with the same name
6. Return to Analytics
7. **Verify**: The engineer now shows a SINGLE bar/row with consolidated count
8. Example: If "Rajesh" had 1 pod and "Rajesh Kumar" had 1 pod, they should now show as 1 engineer with 2 pods

### ✓ Test 3: Complete Merge Workflow
1. **Import Data**: 
   - Import Excel with engineer names like "Rajesh Kumar" (no email)
   - Verify profiles appear in Manage Users with "Imported" badge

2. **Sign Up**:
   - Create account with email "rajesh@gmail.com" name "Rajesh"
   - Verify new "Registered" profile appears in Manage Users

3. **Merge**:
   - Go to Manage Users
   - Select both "Rajesh" and "Rajesh Kumar" profiles
   - Click "Merge Profiles"
   - Select "Rajesh" (with email) as primary
   - Confirm merge

4. **Verify Results**:
   - ✓ Only "Rajesh" (primary) visible in Manage Users
   - ✓ Dropdown shows "Rajesh" only once
   - ✓ Analytics shows unified data
   - ✓ Logs & Issues show merged profile name
   - ✓ Pod assignments show only primary name

### ✓ Test 4: No Data Loss During Merge
1. Before merge: Note total pod count
2. Merge profiles
3. After merge: Verify same total pod count
4. Check each page (Main, History, Analytics, Logs)
5. **Verify**: All data is preserved

### ✓ Test 5: Assign Pod to Merged Engineer
1. Merge two profiles
2. Create a new POD
3. Assign to the merged engineer
4. **Verify**: 
   - Pod created successfully
   - Only one name appears in dropdown
   - Pod appears correctly in all views

## Files Modified

1. `/app/api/engineers/route.ts` - Deduplication logic
2. `/app/api/users/merge/route.ts` - Enhanced merge to handle all name variations
3. `/app/api/test/create-imported-profile/route.ts` - Test endpoint (NEW)

## Database Schema
No schema changes required - all fixes are in business logic.

## Migration Status
✓ All previous migrations applied successfully
✓ Database is in sync with schema

## Performance Impact
- Minimal: Added Map-based deduplication in engineers API (O(n) operation)
- Loop added in merge for multiple identifier updates (typically 2-3 iterations per secondary user)

## Rollback Instructions
If needed, revert these changes:
```bash
git checkout app/api/engineers/route.ts
git checkout app/api/users/merge/route.ts
npm run dev
```

## Testing Commands

### Test with curl:
```bash
# Get engineers list (check for duplicates)
curl http://localhost:3000/api/engineers

# Create test imported profile
curl -X POST http://localhost:3000/api/test/create-imported-profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Engineer"}'

# Get all users
curl http://localhost:3000/api/users?page=1&pageSize=50
```

### Run test script:
```bash
bash /Users/mounika/Desktop/work/inventory-management/test-profile-merge.sh
```

## Common Issues & Solutions

### Issue: Still seeing duplicates in dropdown
- Clear browser cache (Ctrl+Shift+Del)
- Refresh page with Ctrl+Shift+R
- Verify database changes were applied: `npx prisma db execute "SELECT DISTINCT \"assignedEngineer\" FROM \"Pod\" WHERE \"assignedEngineer\" IS NOT NULL ORDER BY \"assignedEngineer\""`

### Issue: Analytics still shows two bars for same engineer
- Verify merge completed successfully in database
- Check pods' assignedEngineer field: `npx prisma db execute "SELECT DISTINCT \"assignedEngineer\" FROM \"Pod\" WHERE \"assignedEngineer\" LIKE '%Rajesh%'"`
- Should show only ONE unique value after merge

### Issue: Merge didn't consolidate properly
- Verify secondary user profiles still exist (marked with mergedIntoUserId)
- Check if pods have mixed name formats that weren't caught
- Run test endpoint to verify it's working

## Success Criteria

✓ Dropdown shows each engineer name exactly ONCE
✓ Analytics consolidates engineers with same name into single entry
✓ No data is lost during merge operations
✓ All pods updated to use primary engineer name
✓ Build compiles without errors
✓ All API endpoints respond correctly

---

## Summary

Both bugs have been fixed with targeted changes to the engineer deduplication and merge consolidation logic. The fixes ensure:

1. **No duplicates in dropdowns** - Engineers are deduplicated by name
2. **Consolidated analytics** - All pod assignments use primary engineer name
3. **Complete data consistency** - All references updated across system
4. **No data loss** - All pod counts and assignments preserved
