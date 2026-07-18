import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";
import { signToken } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Bad Request", message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[Login API] Attempting login for email: "${email}" (normalized: "${normalizedEmail}")`);

    // Find the profile in PostgreSQL
    const profile = await prisma.profile.findFirst({
      where: { email: normalizedEmail },
    });

    if (!profile) {
      console.log(`[Login API] User profile not found for email: "${normalizedEmail}"`);
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid credentials or unauthorized access." },
        { status: 401 }
      );
    }

    console.log(`[Login API] Profile found. ID: ${profile.id}, Role: ${profile.role}, Active: ${profile.isActive}`);

    // Verify user role is allowed
    if (!["superadmin", "admin"].includes(profile.role)) {
      console.log(`[Login API] Role "${profile.role}" is not authorized for admin section.`);
      return NextResponse.json(
        { error: "Forbidden", message: "Access not permitted for this account type." },
        { status: 403 }
      );
    }

    // Reject deactivated accounts
    if (!profile.isActive) {
      console.log(`[Login API] Account is inactive.`);
      return NextResponse.json(
        { error: "Forbidden", message: "Your account has been deactivated. Contact the system administrator." },
        { status: 403 }
      );
    }

    // Verify password hash
    const isPasswordCorrect = verifyPassword(password, profile.passwordHash);
    console.log(`[Login API] Password verification result: ${isPasswordCorrect}`);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid credentials or unauthorized access." },
        { status: 401 }
      );
    }

    // Generate token
    const token = signToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    // Create response
    const response = NextResponse.json(
      { success: true, message: "Authenticated successfully!" },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set("oau_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
