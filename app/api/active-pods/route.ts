import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active PODs (no filtering on backend)
    const pods = await prisma.pod.findMany({
      where: {
        isHistory: false,
        isDeleted: false,
      },
      select: {
        id: true,
        pod: true,
        status: true,
        subStatus: true,
        assignedEngineer: true,
        org: true,
        podProgramType: true,
        podTypeOriginal: true,
        creationTimestamp: true,
        slaCalculatedNbd: true,
      },
      orderBy: { pod: "asc" },
    })

    // Get unique values for filters from the same data
    const uniqueOrgs = [...new Set(pods.map(p => p.org).filter(Boolean))]
    const uniquePodProgramTypes = [...new Set(pods.map(p => p.podProgramType).filter(Boolean))]
    const uniquePodTypes = [...new Set(pods.map(p => p.podTypeOriginal).filter(Boolean))]
    
    // Get engineers with same deduplication logic as /api/engineers endpoint
    // This ensures Timeline dropdown matches the Assigned Engineer dropdown
    const allUsers = await prisma.user.findMany({
      where: {
        mergedIntoUserId: null, // Exclude merged profiles
      },
      select: { id: true, email: true, name: true, isImportedProfile: true },
    })

    // Create a map of engineers, deduplicating by name (case-insensitive)
    // Prefer registered users over imported profiles when names match
    const engineersMap = new Map<string, string>()
    
    for (const user of allUsers) {
      // Use email as the primary identifier for registered users, name for imported profiles
      const engineerEmail = user.email || user.name || ""
      
      if (!engineerEmail) continue // Skip if neither email nor name exists
      
      // Use name (case-insensitive) as key for deduplication
      const nameKey = (user.name || engineerEmail).toLowerCase()
      
      // If we already have an engineer with this name:
      // - Keep the registered user (prefer registered over imported)
      // - If both are registered/imported, keep the first one encountered
      if (!engineersMap.has(nameKey) || 
          (!allUsers.find(u => u.email === engineersMap.get(nameKey))?.isImportedProfile && user.isImportedProfile)) {
        engineersMap.set(nameKey, engineerEmail)
      }
    }

    // Get unique engineers from the deduplicated user list
    const uniqueEngineers = Array.from(engineersMap.values()).sort()

    return NextResponse.json({
      pods,
      filters: {
        orgs: uniqueOrgs,
        podProgramTypes: uniquePodProgramTypes,
        podTypes: uniquePodTypes,
        engineers: uniqueEngineers,
      },
    })
  } catch (error) {
    console.error("Error fetching active PODs:", error)
    return NextResponse.json({ error: "Failed to fetch active PODs" }, { status: 500 })
  }
}
