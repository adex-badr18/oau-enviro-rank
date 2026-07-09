import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "./db";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl ? rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "") : undefined;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Error: Missing Supabase URL or Service Role Key in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("Connecting to Supabase at:", supabaseUrl);

    const email = "superadmin@oau.edu.ng";
    const password = "password123";

    // Check if profile/user already exists in local database using Prisma
    const existingProfile = await prisma.profile.findFirst({
        where: { email }
    });

    if (existingProfile) {
        console.log("Superadmin profile already exists in DB:", existingProfile);

        // Ensure the role is superadmin
        if (existingProfile.role !== "superadmin") {
            console.log("Updating role to superadmin...");
            try {
                await prisma.profile.update({
                    where: { id: existingProfile.id },
                    data: { role: "superadmin" }
                });
                console.log("Successfully updated role to superadmin.");
            } catch (updateError: any) {
                console.error("Error updating profile role:", updateError);
            }
        }
        return;
    }

    console.log("Creating new auth user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "superadmin" },
    });

    if (createError || !newUser.user) {
        console.error("Failed to create user in auth.users:", createError);
        process.exit(1);
    }

    console.log("Successfully created auth user:", newUser.user.id);

    console.log("Creating public profile in local database using Prisma...");
    try {
        await prisma.profile.create({
            data: {
                id: newUser.user.id,
                email,
                role: "superadmin",
            }
        });
    } catch (profileError: any) {
        console.error("Failed to create public.profiles entry:", profileError);
        // clean up
        await supabase.auth.admin.deleteUser(newUser.user.id);
        process.exit(1);
    }

    console.log("✓ Superadmin account created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
