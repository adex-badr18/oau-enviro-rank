import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkSuperadmin } from "@/utils/supabase/check-admin";
import { hashPassword } from "@/lib/auth-crypto";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.literal("admin").default("admin"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize the requester - must be a superadmin
    const auth = await checkSuperadmin();
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse and validate the body
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;

    // Check if user already exists
    const existing = await prisma.profile.findFirst({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Conflict", message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Create the admin user with hashed password
    const hashedPassword = hashPassword(password);
    const newProfile = await prisma.profile.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: {
          id: newProfile.id,
          email: newProfile.email,
          role: newProfile.role,
          isActive: newProfile.isActive,
          createdAt: newProfile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
