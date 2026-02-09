"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

interface MergeProfilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onMergeComplete: () => void
}

export function MergeProfilesDialog({ open, onOpenChange, users, onMergeComplete }: MergeProfilesDialogProps) {
  const { toast } = useToast()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [primaryUserId, setPrimaryUserId] = useState<string>("")
  const [isMerging, setIsMerging] = useState(false)

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
      if (primaryUserId === userId) {
        setPrimaryUserId("")
      }
    }
  }

  const handleMerge = async () => {
    if (selectedUsers.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 profiles to merge",
        variant: "destructive",
      })
      return
    }

    if (!primaryUserId) {
      toast({
        title: "Error",
        description: "Please select a primary profile (the one with email)",
        variant: "destructive",
      })
      return
    }

    const primaryUser = users.find((u) => u.id === primaryUserId)
    if (!primaryUser || !primaryUser.email) {
      toast({
        title: "Error",
        description: "Primary profile must be a registered user with an email address",
        variant: "destructive",
      })
      return
    }

    setIsMerging(true)
    try {
      const response = await fetch("/api/users/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          primaryUserId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to merge profiles")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message,
      })

      // Reset state
      setSelectedUsers([])
      setPrimaryUserId("")
      onOpenChange(false)
      onMergeComplete()
    } catch (error) {
      console.error("Error merging profiles:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to merge profiles",
        variant: "destructive",
      })
    } finally {
      setIsMerging(false)
    }
  }

  const filteredUsers = users.filter((u) => selectedUsers.includes(u.id))
  const primaryUser = users.find((u) => u.id === primaryUserId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge User Profiles</DialogTitle>
          <DialogDescription>
            Select 2 or more profiles to merge. The selected primary profile (with email) will be kept, and others will be merged into it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              When merging, all data (pods, logs, issues) assigned to other profiles will be updated to use the primary profile name.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                  disabled={isMerging}
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user.name || "Unknown"}</span>
                      {user.email && (
                        <span className="text-sm text-muted-foreground">({user.email})</span>
                      )}
                      {(user as any).isImportedProfile && (
                        <Badge variant="outline" className="text-xs">
                          Imported
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
                {selectedUsers.includes(user.id) && user.email && (
                  <Button
                    variant={primaryUserId === user.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrimaryUserId(user.id)}
                    disabled={isMerging}
                  >
                    {primaryUserId === user.id ? "Primary" : "Set as Primary"}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {selectedUsers.length >= 2 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Summary:</p>
                  <div className="text-sm space-y-1">
                    <p>Profiles to merge: <strong>{selectedUsers.length}</strong></p>
                    {primaryUser && (
                      <p>
                        Primary profile: <strong>{primaryUser.name || primaryUser.email}</strong>
                      </p>
                    )}
                    {selectedUsers.length > 1 && primaryUser && (
                      <p>
                        Profiles to merge into primary: <strong>{selectedUsers.length - 1}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMerging}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={selectedUsers.length < 2 || !primaryUserId || isMerging}
          >
            {isMerging ? "Merging..." : "Merge Profiles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
