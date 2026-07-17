import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkSuperadmin } from "@/utils/supabase/check-admin";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-session";

const patchSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize — superadmin only
    const auth = await checkSuperadmin();
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Get the currently logged-in user from the session
    const cookieStore = await cookies();
    const token = cookieStore.get("oau_session")?.value;
    const sessionPayload = token ? verifyToken(token) : null;

    const { id: targetId } = await params;

    // 3. Block self-deactivation
    if (sessionPayload && sessionPayload.userId === targetId) {
      return NextResponse.json(
        { error: "Forbidden", message: "You cannot deactivate your own account." },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 5. Ensure target profile exists
    const target = await prisma.profile.findUnique({ where: { id: targetId } });
    if (!target) {
      return NextResponse.json(
        { error: "Not Found", message: "User profile not found." },
        { status: 404 }
      );
    }

    // 6. Block deactivation of the superadmin role entirely
    if (target.role === "superadmin") {
      return NextResponse.json(
        { error: "Forbidden", message: "The superadmin account cannot be deactivated." },
        { status: 403 }
      );
    }

    // 7. Update isActive
    const updated = await prisma.profile.update({
      where: { id: targetId },
      data: { isActive: parsed.data.isActive },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: `Account ${updated.isActive ? "activated" : "deactivated"} successfully.`,
        user: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
