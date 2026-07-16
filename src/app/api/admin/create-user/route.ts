import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkSuperadmin } from "@/utils/supabase/check-admin";
import { hashPassword } from "@/lib/auth-crypto";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["superadmin", "user"]).default("user"),
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
        { error: "Conflict", message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Create the user directly in profiles using Prisma with hashed password
    const hashedPassword = hashPassword(password);
    const newProfile = await prisma.profile.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
      },
    });

    return NextResponse.json(
      {
        message: "User and profile created successfully",
        user: {
          id: newProfile.id,
          email: newProfile.email,
          role: newProfile.role,
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
