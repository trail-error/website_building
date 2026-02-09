# Testing Guide - User Profile Merge Feature

## Issue Fixed

The system was unable to store imported profiles without email addresses due to a PostgreSQL unique constraint violation. This has been resolved with a partial unique index that allows multiple NULL email values.

**Migration Applied:**
- `20260111200000_fix_email_unique_constraint` - Creates partial unique index on email WHERE email IS NOT NULL

This allows:
- ✅ Multiple profiles without email (imported profiles)
- ✅ Only one profile per non-null email (registered users)
- ✅ Seamless merging of imported and registered profiles

---

## Testing the Feature

### Method 1: Import from Excel (Recommended)

1. **Prepare an Excel file** with the following structure:
   ```
   POD          | Assigned Engineer   | Status      | ...other fields
   POD-001      | Rajesh Kumar        | Initial     | ...
   POD-002      | Harjot Singh        | Engineering | ...
   POD-003      | Rajesh Kumar        | Data Mgmt   | ...
   ```

2. **Import the file:**
   - Go to Main page
   - Click "Import from Excel" button
   - Select your Excel file
   - Review the preview
   - Click "Import"

3. **Verify imported profiles were created:**
   - Go to Manage Users page
   - You should now see:
     - "Rajesh Kumar" with "Imported" badge and NO email
     - "Harjot Singh" with "Imported" badge and NO email

### Method 2: Create Test Profile (Quick Test)

**Using API directly (requires Super Admin token):**

```bash
curl -X POST http://localhost:3000/api/test/create-imported-profile \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<YOUR_AUTH_TOKEN>" \
  -d '{"name": "Test Engineer Name"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Imported profile created",
  "profile": {
    "id": "clz1234567890abcdef",
    "email": null,
    "name": "Test Engineer Name",
    "role": "REGULAR",
    "isImportedProfile": true,
    "createdAt": "2026-01-11T20:00:00.000Z"
  }
}
```

---

## Verification Steps

### Step 1: View All Profiles in Manage Users

**Expected Result:**
- Page shows Registered users (with email) + Imported profiles (without email)
- Each row shows the profile type in the "Type" column
- Checkboxes available to select profiles for merging

```
Email                    | Name              | Type       | Role    | ...
rajesh@gmail.com         | Rajesh            | Registered | REGULAR | ...
                         | Rajesh Kumar      | Imported   | REGULAR | ...
harika@gmail.com         | Harika            | Registered | PRIORITY| ...
                         | Harjot Singh      | Imported   | REGULAR | ...
```

### Step 2: Select Profiles for Merging

**Steps:**
1. Check the checkbox for "Rajesh" (Registered)
2. Check the checkbox for "Rajesh Kumar" (Imported)
3. A blue bar should appear saying "2 profile(s) selected"
4. "Merge Profiles" button should be enabled

### Step 3: Merge Profiles

**Steps:**
1. Click "Merge Profiles" button
2. Dialog opens showing both profiles
3. "Rajesh" (Registered) should be highlighted as primary (has email)
4. Click "Merge Profiles" in the dialog
5. Toast notification: "Successfully merged 1 profile(s) into Rajesh"

### Step 4: Verify Merge Results

**Manage Users Page:**
- Only "Rajesh" visible now
- "Rajesh Kumar" is hidden (marked as merged)

**Main Page - Pods:**
- All pods that had "assignedEngineer: Rajesh Kumar" now show "Rajesh"
- Pod dropdowns show only "Rajesh" (not duplicate)

**Analytics Page:**
- Engineer filter shows only "Rajesh"
- No duplicate entries

**Assigned Engineer Dropdown:**
- Only "Rajesh" appears
- No more "Rajesh Kumar"

---

## Database Verification

### Check Imported Profiles in Database

**Using Prisma Studio:**
```bash
npx prisma studio
```

Then query:
```
User where isImportedProfile = true
```

**Using Direct SQL (if psql available):**
```sql
SELECT id, email, name, "isImportedProfile", "mergedIntoUserId" 
FROM "User" 
WHERE "isImportedProfile" = true 
OR "mergedIntoUserId" IS NOT NULL;
```

### Verify Unique Constraint Works

The partial unique index should:
- ✅ Allow NULL emails: Multiple imported profiles can have email = NULL
- ✅ Enforce unique non-NULL emails: Can't create two users with same email
- ✅ No duplicates in normal users: Registered users have unique emails

---

## Troubleshooting

### Issue: Imported profiles not showing in Manage Users

**Causes:**
1. Excel import didn't happen yet
2. Profiles were created but page needs refresh
3. Filter is hiding imported profiles

**Solutions:**
1. Import an Excel file with engineer names (Method 1)
2. Refresh the page (Ctrl+Shift+R for full refresh)
3. Check database directly using Prisma Studio

### Issue: Merge button is disabled

**Causes:**
1. Only 1 profile selected (need minimum 2)
2. Primary profile doesn't have email
3. Selected profile is already merged

**Solutions:**
1. Select 2 or more profiles
2. Choose a profile WITH email as primary (will be marked with "Registered" badge)
3. Check if profiles show "Imported" badge

### Issue: Data not updated after merge

**Causes:**
1. Page cache not cleared
2. Browser cache showing old data
3. Migration didn't apply

**Solutions:**
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Verify migration: `npx prisma migrate status`
4. Check database: `npx prisma studio`

---

## Key Files for Testing

**API Endpoints:**
- `POST /api/users/merge` - Perform merge
- `GET /api/users` - Get all users (both registered + imported)
- `GET /api/engineers` - Get engineers dropdown list
- `POST /api/test/create-imported-profile` - Test endpoint to create imported profile

**Database:**
- `prisma/migrations/20260111200000_fix_email_unique_constraint` - Partial unique index

**Components:**
- `components/merge-profiles-dialog.tsx` - Merge UI
- `components/user-management.tsx` - User table with merge

---

## Success Criteria Checklist

- [ ] Imported profiles appear in Manage Users (without email)
- [ ] Registered profiles appear in Manage Users (with email)  
- [ ] Type column shows "Imported" or "Registered" badge
- [ ] Can select multiple profiles with checkboxes
- [ ] "Merge Profiles" button appears when 2+ selected
- [ ] Merge dialog shows both profiles
- [ ] Can only merge with registered profile as primary
- [ ] After merge, secondary profile is hidden
- [ ] Pods assigned to secondary profile show primary profile name
- [ ] Analytics reflects merged profile
- [ ] Logs & Issues reflect merged profile
- [ ] Assigned Engineer dropdown shows only primary profile
- [ ] Can still assign new pods to primary profile

---

## Performance Notes

- Database index on email improves lookup performance
- Partial index is more efficient than full unique constraint
- Allows unlimited imported profiles without email
- No impact on registered user performance

---

## Support

For issues or questions:
1. Check the logs: `next build` or browser console
2. Verify database migrations: `npx prisma migrate status`
3. Regenerate Prisma client: `npx prisma generate`
4. Review IMPLEMENTATION_COMPLETE.md for full feature documentation
