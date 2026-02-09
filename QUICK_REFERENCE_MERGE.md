# Quick Reference: Profile Merge Feature

## API Endpoints

### POST `/api/users/merge`
Merge multiple user profiles into a primary profile.

**Request Body:**
```json
{
  "userIds": ["user-id-1", "user-id-2", "user-id-3"],
  "primaryUserId": "user-id-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully merged 2 profile(s) into Rajesh",
  "primaryUserId": "user-id-1",
  "mergedUserIds": ["user-id-2", "user-id-3"]
}
```

**Requirements:**
- User must be SUPER_ADMIN
- At least 2 users must be selected
- Primary user must have an email (registered profile)

**What it does:**
- Marks secondary users as merged (`mergedIntoUserId = primaryUserId`)
- Updates all pods' `assignedEngineer` to primary user's name
- Redirects all creator references (`createdById`)
- Updates notifications and pod status history
- Logs transaction for audit trail

---

### GET `/api/engineers`
Get list of all engineers (registered and imported profiles).

**Response:**
```json
{
  "engineers": [
    {
      "email": "rajesh@gmail.com",
      "name": "Rajesh",
      "id": "user-id-1",
      "isRegistered": true,
      "isImported": false
    },
    {
      "email": "Rajesh Kumar",
      "name": "Rajesh Kumar",
      "id": "user-id-2",
      "isRegistered": false,
      "isImported": true
    }
  ]
}
```

---

### GET `/api/users?page=1&pageSize=10`
Get paginated list of all users (registered and imported profiles).

**Response:**
```json
{
  "users": [
    {
      "id": "user-id-1",
      "email": "rajesh@gmail.com",
      "name": "Rajesh",
      "role": "REGULAR",
      "isImportedProfile": false,
      "createdAt": "2026-01-11T10:00:00Z",
      "updatedAt": "2026-01-11T10:00:00Z"
    },
    {
      "id": "user-id-2",
      "email": null,
      "name": "Rajesh Kumar",
      "role": "REGULAR",
      "isImportedProfile": true,
      "createdAt": "2026-01-09T14:30:00Z",
      "updatedAt": "2026-01-09T14:30:00Z"
    }
  ],
  "totalCount": 2,
  "totalPages": 1,
  "currentPage": 1
}
```

---

## Components

### MergeProfilesDialog

**Import:**
```typescript
import { MergeProfilesDialog } from "@/components/merge-profiles-dialog"
```

**Props:**
```typescript
interface MergeProfilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onMergeComplete: () => void
}
```

**Usage:**
```tsx
const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
const [selectedUsers, setSelectedUsers] = useState<User[]>([])

<MergeProfilesDialog
  open={mergeDialogOpen}
  onOpenChange={setMergeDialogOpen}
  users={selectedUsers}
  onMergeComplete={() => {
    // Refresh data
    fetchUsers()
    setMergeDialogOpen(false)
  }}
/>
```

**Features:**
- Multi-select profile list
- Displays profile type (Imported/Registered)
- Allows setting primary profile
- Shows merge summary
- Handles API call and error toast

---

## User Interface

### Manage Users Page

**New Features:**
- Checkbox for multi-select
- "Type" column showing Imported/Registered badge
- Selection counter bar
- "Merge Profiles" button (enabled when 2+ profiles selected)

**Workflow:**
1. Check profiles to merge
2. Click "Merge Profiles" button
3. Dialog opens showing selected profiles
4. Choose primary profile (must have email)
5. Confirm merge
6. Table refreshes automatically

---

## Database Fields

### User Model

```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String?   @unique     // Nullable for imported profiles
  password                String?               // Nullable for imported profiles
  name                    String?
  role                    UserRole  @default(REGULAR)
  isImportedProfile       Boolean   @default(false)
  mergedIntoUserId        String?   // User this profile was merged into
  
  // ... relationships ...
}
```

### Query Examples

**Get all unmerged profiles:**
```prisma
prisma.user.findMany({
  where: { mergedIntoUserId: null }
})
```

**Get merged profiles:**
```prisma
prisma.user.findMany({
  where: { mergedIntoUserId: { not: null } }
})
```

**Get imported profiles:**
```prisma
prisma.user.findMany({
  where: { isImportedProfile: true }
})
```

---

## Error Handling

### Common Error Scenarios

**"At least 2 users must be selected to merge"**
- User clicked Merge without selecting enough profiles
- Solution: Select 2 or more profiles

**"Primary user must be a registered user with an email address"**
- Selected primary profile is imported (no email)
- Solution: Choose a profile with email as primary

**"One or more users not found"**
- Selected user IDs don't exist in database
- Solution: Refresh page and retry

**"Unauthorized" / "Forbidden"**
- User doesn't have SUPER_ADMIN role
- Solution: Only Super Admins can merge profiles

---

## Integration Points

### Where Merged Profiles Are Used

1. **Pod Assignments**
   - Field: `Pod.assignedEngineer`
   - Updated to primary user's name
   - Shows in all pod views, dropdowns, analytics

2. **Creator Tracking**
   - Fields: `Pod.createdById`, `LogIssue.createdById`
   - Updated to primary user's ID
   - Shows creator in audit trails

3. **Analytics Dashboard**
   - Uses `assignedEngineer` for engineer filtering
   - Shows unified data for merged profile

4. **Logs & Issues**
   - Uses `assignedEngineer` for display
   - Updated to show primary profile name

5. **Engineer Dropdown**
   - Fetched from `/api/engineers`
   - Excludes merged profiles automatically

---

## Audit Trail

### Transaction Logging

Each merge operation is logged:
```prisma
Transaction {
  entityType: "User"
  entityId: secondaryUserId
  action: "merge_profile"
  details: {
    mergedIntoUserId: primaryUserId
    primaryUserName: "Rajesh"
    secondaryUserName: "Rajesh Kumar"
  }
  createdById: superAdminUserId
}
```

---

## Testing

### Manual Test Steps

1. **Create Imported Profile:**
   - Go to main page
   - Import Excel with engineer name "Rajesh Kumar" (no email)
   - Check Manage Users - should see "Rajesh Kumar" with "Imported" badge

2. **Create Registered Profile:**
   - Sign up with email "rajesh@gmail.com"
   - Name: "Rajesh"
   - Check Manage Users - should see "Rajesh" with "Registered" badge

3. **Merge Profiles:**
   - Go to Manage Users
   - Select both "Rajesh" and "Rajesh Kumar"
   - Click "Merge Profiles"
   - Choose "Rajesh" (with email) as primary
   - Confirm merge

4. **Verify Merge:**
   - Check Manage Users - only "Rajesh" visible
   - Check Analytics - shows "Rajesh"
   - Check Pod assignments - show "Rajesh"
   - Check Logs & Issues - show "Rajesh"

---

## Troubleshooting

**Merged profile still visible:**
- Clear browser cache
- Refresh page with Ctrl+Shift+R

**Data not updated after merge:**
- Check browser console for errors
- Verify database migration ran: `npx prisma migrate status`
- Regenerate Prisma client: `npx prisma generate`

**Permission denied:**
- Verify user has SUPER_ADMIN role
- Check `app/api/users/merge/route.ts` authorization

---
