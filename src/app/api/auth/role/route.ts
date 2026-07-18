import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("oau_session")?.value;
    
    if (!token) {
      return NextResponse.json({ role: null });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ role: null });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!profile || !profile.isActive) {
      return NextResponse.json({ role: null });
    }

    return NextResponse.json({
      role: profile.role,
      userId: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
