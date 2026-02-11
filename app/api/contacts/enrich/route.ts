import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PDL_API_URL = "https://api.peopledatalabs.com/v5/person/enrich";

interface PDLResponse {
    status: number;
    data?: {
        full_name?: string;
        job_title?: string;
        job_company_name?: string;
        linkedin_url?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const pdlApiKey = process.env.PDL_API_KEY;
        if (!pdlApiKey) {
            return NextResponse.json(
                { error: "PeopleDataLabs API key not configured" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { contactId } = body;

        if (!contactId) {
            return NextResponse.json(
                { error: "contactId is required" },
                { status: 400 }
            );
        }

        // Look up the contact
        const { data: contact, error: fetchError } = await supabase
            .from("contacts")
            .select("*")
            .eq("id", contactId)
            .eq("user_id", userId)
            .single();

        if (fetchError || !contact) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        if (contact.enriched) {
            return NextResponse.json({
                contact,
                message: "Contact already enriched",
            });
        }

        // Call PeopleDataLabs API
        const params = new URLSearchParams({
            email: contact.email,
            pretty: "true",
        });

        const pdlResponse = await fetch(`${PDL_API_URL}?${params}`, {
            headers: {
                "X-Api-Key": pdlApiKey,
                "Content-Type": "application/json",
            },
        });

        if (pdlResponse.status === 429) {
            return NextResponse.json(
                { error: "Rate limit reached. Free tier allows 100 enrichments/month." },
                { status: 429 }
            );
        }

        if (pdlResponse.status === 404) {
            // Person not found — mark as enriched with no data so we don't retry
            const { data: updated } = await supabase
                .from("contacts")
                .update({ enriched: true })
                .eq("id", contactId)
                .eq("user_id", userId)
                .select()
                .single();

            return NextResponse.json({
                contact: updated,
                message: "No enrichment data found for this contact",
            });
        }

        if (!pdlResponse.ok) {
            const errorData = await pdlResponse.text();
            console.error("PDL API error:", pdlResponse.status, errorData);
            return NextResponse.json(
                { error: "Enrichment API error" },
                { status: 502 }
            );
        }

        const pdlData: PDLResponse = await pdlResponse.json();

        // Extract enrichment fields
        const enrichedFields = {
            title: pdlData.data?.job_title || contact.title,
            company: pdlData.data?.job_company_name || contact.company,
            linkedin_url: pdlData.data?.linkedin_url || null,
            name: pdlData.data?.full_name || contact.name,
            enriched: true,
        };

        // Update the contact in Supabase
        const { data: updatedContact, error: updateError } = await supabase
            .from("contacts")
            .update(enrichedFields)
            .eq("id", contactId)
            .eq("user_id", userId)
            .select()
            .single();

        if (updateError) {
            console.error("Supabase update error:", updateError);
            return NextResponse.json(
                { error: "Failed to save enrichment data" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            contact: updatedContact,
            message: "Contact enriched successfully",
        });
    } catch (err) {
        console.error("Enrich contact error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
