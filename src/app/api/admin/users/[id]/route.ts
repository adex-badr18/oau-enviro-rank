import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkSuperadmin } from "@/lib/check-admin";
import { cookies } from "next/headers";
import { verifyToken, signToken } from "@/lib/auth-session";
import { hashPassword } from "@/lib/auth-crypto";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  email: z.string().email().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine((val) => /[0-9]/.test(val), "Password must contain at least one numeric character")
    .refine((val) => /[!@#$%^&*()\-_\=\+\[\]\{\}]/.test(val), "Password must contain at least one special character")
    .optional()
    .or(z.literal("")),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
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

    // 3. Parse and validate body
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: "Validation Error", message: issue.message },
        { status: 400 }
      );
    }

    // 4. Ensure target profile exists
    const target = await prisma.profile.findUnique({ where: { id: targetId } });
    if (!target) {
      return NextResponse.json(
        { error: "Not Found", message: "User profile not found." },
        { status: 404 }
      );
    }

    // 5. Block self-deactivation
    if (parsed.data.isActive === false && sessionPayload && sessionPayload.userId === targetId) {
      return NextResponse.json(
        { error: "Forbidden", message: "You cannot deactivate your own account." },
        { status: 403 }
      );
    }

    // 6. Block deactivation of the superadmin role entirely
    if (parsed.data.isActive === false && target.role === "superadmin") {
      return NextResponse.json(
        { error: "Forbidden", message: "The superadmin account cannot be deactivated." },
        { status: 403 }
      );
    }

    // 7. Construct updates
    const dataToUpdate: any = {};
    if (parsed.data.isActive !== undefined) {
      dataToUpdate.isActive = parsed.data.isActive;
    }
    
    if (parsed.data.email !== undefined) {
      const normalizedEmail = parsed.data.email.trim().toLowerCase();
      // Check for email conflict
      const conflict = await prisma.profile.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: targetId },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Conflict", message: "An account with this email already exists." },
          { status: 409 }
        );
      }
      dataToUpdate.email = normalizedEmail;
    }

    if (parsed.data.password) {
      dataToUpdate.passwordHash = hashPassword(parsed.data.password);
    }

    if (parsed.data.firstName !== undefined) {
      dataToUpdate.firstName = parsed.data.firstName || null;
    }

    if (parsed.data.lastName !== undefined) {
      dataToUpdate.lastName = parsed.data.lastName || null;
    }

    const updated = await prisma.profile.update({
      where: { id: targetId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json(
      {
        message: "Profile updated successfully.",
        user: updated,
        requiresReLogin: (sessionPayload && sessionPayload.userId === targetId && !!parsed.data.password) ? true : false,
      },
      { status: 200 }
    );

    // If superadmin updated their own credentials/names
    if (sessionPayload && sessionPayload.userId === targetId) {
      if (parsed.data.password) {
        // Clear session cookie to force re-login
        response.cookies.set("oau_session", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      } else {
        // Refresh session token with new details
        const newToken = signToken({
          userId: updated.id,
          email: updated.email,
          role: updated.role,
        });

        response.cookies.set("oau_session", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 24 * 60 * 60, // 24 hours
        });
      }
    }

    return response;
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
