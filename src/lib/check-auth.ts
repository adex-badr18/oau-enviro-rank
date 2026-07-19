import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";

/**
 * Accepts both `superadmin` and `admin` roles.
 * Use this guard for routes that admin users are allowed to access
 * (e.g. inspect, reports, faculties) — but NOT for user management routes.
 */
export async function checkAuth() {
  if (process.env.BYPASS_AUTH_FOR_TEST === "true") {
    return { authorized: true, user: null };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("oau_session")?.value;

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const payload = verifyToken(token);

    if (!payload || !["superadmin", "admin"].includes(payload.role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, user: payload };
  } catch (error: any) {
    if (
      error &&
      typeof error.message === "string" &&
      !error.message.includes("outside a request scope")
    ) {
      console.error("Error checking auth role:", error);
    }
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error", message: error.message },
        { status: 500 }
      ),
    };
  }
}
