import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users (both registered and imported profiles) that haven't been merged
    const allUsers = await prisma.user.findMany({
      where: {
        mergedIntoUserId: null, // Exclude users that have been merged into others
      },
      select: { id: true, email: true, name: true, isImportedProfile: true },
    })

    // Create a map of engineers, deduplicating by name (case-insensitive)
    // Prefer registered users over imported profiles when names match
    const engineersMap = new Map<string, any>()
    
    for (const user of allUsers) {
      // Use email as the primary identifier for registered users, name for imported profiles
      const engineerEmail = user.email || user.name || ""
      
      if (!engineerEmail) continue // Skip if neither email nor name exists
      
      const engineer = {
        email: engineerEmail,
        name: user.name || engineerEmail,
        id: user.id,
        isRegistered: !user.isImportedProfile,
        isImported: user.isImportedProfile,
      }

      // Use name (case-insensitive) as key for deduplication
      const nameKey = (user.name || engineerEmail).toLowerCase()
      
      // If we already have an engineer with this name:
      // - Keep the registered user (prefer registered over imported)
      // - If both are registered/imported, keep the first one encountered
      if (!engineersMap.has(nameKey) || 
          (!engineersMap.get(nameKey).isRegistered && engineer.isRegistered)) {
        engineersMap.set(nameKey, engineer)
      }
    }

    // Convert to array and sort
    const engineers = Array.from(engineersMap.values())
    engineers.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))

    return NextResponse.json({ engineers })
  } catch (error) {
    console.error("Error fetching engineers:", error)
    return NextResponse.json({ error: "Failed to fetch engineers" }, { status: 500 })
  }
}

