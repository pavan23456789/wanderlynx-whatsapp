import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderTemplateByName } from "@/lib/template-store";

/**
 * Supabase admin client
 * (service role is REQUIRED because this runs on the server)
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("[Reply API] Hit");

    const body = await req.json();
    console.log("[Reply API] Request body:", body);

    const { contactId, templateName, params } = body;

    // 1️⃣ Validate input
    if (!contactId || !templateName) {
      console.error("[Reply API] Missing contactId or templateName");
      return NextResponse.json(
        { error: "Missing contactId or templateName" },
        { status: 400 }
      );
    }

    // 2️⃣ Fetch phone number for this conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("phone")
      .eq("id", contactId)
      .single();

    if (convError || !conversation?.phone) {
      console.error(
        "[Reply API] Phone not found:",
        convError
      );
      return NextResponse.json(
        { error: "Phone number not found for contact" },
        { status: 404 }
      );
    }

    const phone = conversation.phone;
    console.log("[Reply API] Sending to phone:", phone);

    // 3️⃣ Build Meta payload
    const metaPayload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: (params || []).map((p: string) => ({
              type: "text",
              text: p,
            })),
          },
        ],
      },
    };

    console.log("[Reply API] Meta payload:", metaPayload);

    // 4️⃣ Send to Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaText = await metaRes.text();
    console.log(
      "[Reply API] Meta response:",
      metaRes.status,
      metaText
    );

    if (!metaRes.ok) {
      return NextResponse.json(
        {
          error: "Meta API failed",
          details: metaText,
        },
        { status: 500 }
      );
    }

    // 5️⃣ Render readable message for dashboard UI
    const renderedMessage = await renderTemplateByName(
      templateName,
      params || []
    );

    // 6️⃣ Save outbound message to DB
    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: contactId,
        direction: "outbound",
        body: renderedMessage,
      });

    if (msgError) {
      console.error(
        "[Reply API] Failed to save message:",
        msgError
      );
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Reply API] Server error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
