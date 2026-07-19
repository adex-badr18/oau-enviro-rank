import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkSuperadmin } from "@/lib/check-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await checkSuperadmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const users = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
