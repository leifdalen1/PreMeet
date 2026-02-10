import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "recent"; // recent, company, alphabetical
    const company = searchParams.get("company") || "";

    // Build query
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId);

    // Apply search
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    // Apply company filter
    if (company) {
      query = query.ilike("company", `%${company}%`);
    }

    // Apply sorting based on filter
    switch (filter) {
      case "recent":
        query = query.order("last_meeting_date", { ascending: false });
        break;
      case "company":
        query = query.order("company", { ascending: true });
        break;
      case "alphabetical":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("last_meeting_date", { ascending: false });
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    // Get unique companies for filter dropdown
    const { data: companiesData } = await supabase
      .from("contacts")
      .select("company")
      .eq("user_id", userId)
      .not("company", "is", null);

    const companies = [...new Set(companiesData?.map(c => c.company).filter(Boolean) || [])].sort();

    // Get stats
    const { count: totalContacts } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: recentContacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .order("last_meeting_date", { ascending: false })
      .limit(5);

    return NextResponse.json({
      contacts: contacts || [],
      companies,
      stats: {
        total: totalContacts || 0,
        recent: recentContacts || [],
      },
    });
  } catch (err) {
    console.error("Get contacts error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
