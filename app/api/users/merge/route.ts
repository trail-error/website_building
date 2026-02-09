import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createTransaction } from "@/lib/transaction"
import prisma from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is SuperAdmin
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userIds, primaryUserId } = await request.json()

    // Validate input
    if (!Array.isArray(userIds) || userIds.length < 2) {
      return NextResponse.json({ error: "At least 2 users must be selected to merge" }, { status: 400 })
    }

    if (!userIds.includes(primaryUserId)) {
      return NextResponse.json({ error: "Primary user must be in the selected users" }, { status: 400 })
    }

    // Fetch all users to merge
    const usersToMerge = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    })

    if (usersToMerge.length !== userIds.length) {
      return NextResponse.json({ error: "One or more users not found" }, { status: 404 })
    }

    // Find the primary user (the one with email - registered profile)
    const primaryUser = usersToMerge.find((u) => u.id === primaryUserId)
    if (!primaryUser) {
      return NextResponse.json({ error: "Primary user not found" }, { status: 404 })
    }

    // Ensure primary user has an email (is a registered user)
    if (!primaryUser.email) {
      return NextResponse.json(
        { error: "Primary user must be a registered user with an email address" },
        { status: 400 }
      )
    }

    // Get the primary user's name (use the one who signed up)
    const primaryUserName = primaryUser.name || primaryUser.email.split("@")[0]

    // Update all other users to mark them as merged into the primary user
    const secondaryUserIds = userIds.filter((id) => id !== primaryUserId)

    for (const secondaryUserId of secondaryUserIds) {
      // Get the secondary user for logging
      const secondaryUser = usersToMerge.find((u) => u.id === secondaryUserId)
      if (!secondaryUser) continue

      // Mark the secondary user as merged
      await prisma.user.update({
        where: { id: secondaryUserId },
        data: {
          mergedIntoUserId: primaryUserId,
        },
      })

      // Collect all possible engineer identifiers for this secondary user
      const secondaryEngineerIds = [
        secondaryUser.name,
        secondaryUser.email,
        secondaryUserId,
      ].filter(Boolean) as string[]

      // First, get all pods assigned to any of the secondary engineer identifiers
      const podsToUpdate = await prisma.pod.findMany({
        where: {
          OR: secondaryEngineerIds.map(id => ({
            assignedEngineer: id
          }))
        },
        select: {
          id: true,
          assignedEngineer: true,
        }
      })

      // Update all pods assigned to ANY identifier of the secondary user to use primary user's identifier
      const uniquePodIds = new Set(podsToUpdate.map(p => p.id))
      if (uniquePodIds.size > 0) {
        await prisma.pod.updateMany({
          where: {
            id: { in: Array.from(uniquePodIds) }
          },
          data: {
            assignedEngineer: primaryUserName,
          },
        })
      }

      // Also handle case-insensitive matching - find pods with similar names (case-insensitive)
      // This handles cases where "Rajesh" and "Rajesh Kumar" are different people but same after merge
      for (const engineerId of secondaryEngineerIds) {
        if (engineerId && engineerId !== secondaryUserId) {  // Skip UUID, only do name/email
          // Find pods with case-insensitive match to this identifier
          const additionalPods = await prisma.pod.findMany({
            where: {
              AND: [
                {
                  assignedEngineer: {
                    mode: 'insensitive',
                    equals: engineerId,
                  }
                },
                {
                  assignedEngineer: {
                    not: primaryUserName
                  }
                }
              ]
            },
            select: {
              id: true,
              assignedEngineer: true,
            }
          })

          // Update these pods
          if (additionalPods.length > 0) {
            await prisma.pod.updateMany({
              where: {
                id: { in: additionalPods.map(p => p.id) }
              },
              data: {
                assignedEngineer: primaryUserName,
              },
            })
          }
        }
      }

      // Update all log issues created by secondary user to be created by primary user
      await prisma.logIssue.updateMany({
        where: {
          createdById: secondaryUserId,
        },
        data: {
          createdById: primaryUserId,
        },
      })

      // Update all pods created by secondary user to be created by primary user
      await prisma.pod.updateMany({
        where: {
          createdById: secondaryUserId,
        },
        data: {
          createdById: primaryUserId,
        },
      })

      // Update notifications created by secondary user
      await prisma.notification.updateMany({
        where: {
          createdById: secondaryUserId,
        },
        data: {
          createdById: primaryUserId,
        },
      })

      // Update notifications for secondary user to be for primary user
      await prisma.notification.updateMany({
        where: {
          createdForId: secondaryUserId,
        },
        data: {
          createdForId: primaryUserId,
        },
      })

      // Update pod status history
      await prisma.podStatusHistory.updateMany({
        where: {
          changedById: secondaryUserId,
        },
        data: {
          changedById: primaryUserId,
        },
      })

      // Log transaction for each merge
      await createTransaction({
        entityType: "User",
        entityId: secondaryUserId,
        action: "merge_profile",
        details: JSON.stringify({
          mergedIntoUserId: primaryUserId,
          primaryUserName: primaryUserName,
          secondaryUserName: secondaryUser.name || secondaryUser.email,
        }),
        createdById: currentUser.id,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${secondaryUserIds.length} profile(s) into ${primaryUserName}`,
      primaryUserId,
      mergedUserIds: secondaryUserIds,
    })
  } catch (error) {
    console.error("Error merging users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while merging users" },
      { status: 500 }
    )
  }
}
