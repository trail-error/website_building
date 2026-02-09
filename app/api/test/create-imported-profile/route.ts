import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow SUPER_ADMIN for test endpoint
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if profile already exists
    const existing = await prisma.user.findFirst({
      where: {
        name: name,
        isImportedProfile: true,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Profile already exists", profile: existing },
        { status: 409 }
      )
    }

    // Create imported profile
    const profile = await prisma.user.create({
      data: {
        name: name,
        isImportedProfile: true,
        role: "REGULAR",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Imported profile created",
      profile,
    })
  } catch (error) {
    console.error("Error creating test profile:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create profile" },
      { status: 500 }
    )
  }
}
