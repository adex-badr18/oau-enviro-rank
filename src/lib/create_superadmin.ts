import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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

    // Check if profile/user already exists
    const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("email", email);

    if (fetchError) {
        console.error("Error fetching profiles:", fetchError);
        process.exit(1);
    }

    if (profiles && profiles.length > 0) {
        console.log("Superadmin profile already exists in DB:", profiles[0]);

        // Ensure the role is superadmin
        if (profiles[0].role !== "superadmin") {
            console.log("Updating role to superadmin...");
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ role: "superadmin" })
                .eq("id", profiles[0].id);

            if (updateError) {
                console.error("Error updating profile role:", updateError);
            } else {
                console.log("Successfully updated role to superadmin.");
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

    console.log("Creating public profile...");
    const { error: profileError } = await supabase
        .from("profiles")
        .insert({
            id: newUser.user.id,
            email,
            role: "superadmin",
        });

    if (profileError) {
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
