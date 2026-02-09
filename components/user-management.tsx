"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { MergeProfilesDialog } from "@/components/merge-profiles-dialog"
import { useToast } from "@/hooks/use-toast"
import type { User, UserRole } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface UserManagementProps {
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function UserManagement({ currentPage, pageSize, onPageChange, onPageSizeChange }: UserManagementProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<{ userId: string; role: UserRole } | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [editPasswordUser, setEditPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [currentPage, pageSize])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users?page=${currentPage}&pageSize=${pageSize}`)

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalItems(data.totalCount)
      // Clear selections when fetching
      setSelectedUserIds([])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId])
    } else {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map((u) => u.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleOpenMergeDialog = () => {
    if (selectedUserIds.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 profiles to merge",
        variant: "destructive",
      })
      return
    }

    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id))
    const hasRegisteredUser = selectedUsers.some((u) => u.email)

    if (!hasRegisteredUser) {
      toast({
        title: "Error",
        description: "At least one selected profile must be a registered user with an email",
        variant: "destructive",
      })
      return
    }

    setMergeDialogOpen(true)
  }

  const handleRoleChange = (userId: string, role: UserRole) => {
    setEditingRole({ userId, role })
    setConfirmDialogOpen(true)
  }

  const handleConfirmRoleChange = async () => {
    if (!editingRole) return

    setIsUpdatingRole(true)
    try {
      const response = await fetch(`/api/users/${editingRole.userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: editingRole.role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update role")
      }

      toast({
        title: "Role Updated",
        description: "The user role has been updated successfully.",
      })

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRole(false)
      setConfirmDialogOpen(false)
      setEditingRole(null)
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "PRIORITY":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "REGULAR":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const pageSizeOptions = [10, 25, 50, 100]
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
            users
          </div>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number.parseInt(value))}>
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm">per page</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
            {selectedUserIds.length} profile(s) selected
          </span>
          <Button
            size="sm"
            onClick={handleOpenMergeDialog}
            disabled={selectedUserIds.length < 2}
          >
            Merge Profiles
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < users.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    disabled={isLoading || users.length === 0}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={selectedUserIds.includes(user.id) ? "bg-blue-50 dark:bg-blue-950" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                        disabled={isLoading}
                      />
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      {(user as any).isImportedProfile ? (
                        <Badge variant="outline">Imported</Badge>
                      ) : (
                        <Badge variant="secondary">Registered</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role as UserRole)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Change Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGULAR">Regular</SelectItem>
                          <SelectItem value="PRIORITY">Priority</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditPasswordUser(user)
                            setNewPassword("")
                            setCurrentPassword("")
                          }}
                        >
                          Edit Password
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmRoleChange}
        title="Change User Role"
        description={`Are you sure you want to change this user's role to ${editingRole?.role}?`}
        confirmText="Change Role"
        cancelText="Cancel"
        isLoading={isUpdatingRole}
      />

      <MergeProfilesDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        users={selectedUsers}
        onMergeComplete={() => {
          fetchUsers()
          setMergeDialogOpen(false)
          setSelectedUserIds([])
        }}
      />

      <Dialog open={!!editPasswordUser} onOpenChange={(open) => { if (!open) setEditPasswordUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Password for {editPasswordUser?.email}</DialogTitle>
          </DialogHeader>
          {editPasswordUser && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsPasswordLoading(true)
                try {
                  const body: any = { newPassword }
                  const res = await fetch(`/api/users/${editPasswordUser.id}/password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || "Failed to update password")
                  toast({ title: "Password Updated", description: "Password updated successfully." })
                  setEditPasswordUser(null)
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" })
                } finally {
                  setIsPasswordLoading(false)
                }
              }}
              className="space-y-4"
            >
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
