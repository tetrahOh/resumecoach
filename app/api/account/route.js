import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ email: user.email, ...(data || {}) });
}

export async function PATCH(request) {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json();
  const details = {
    id: user.id,
    full_name: body.fullName?.trim() || null,
    phone: body.phone?.trim() || null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("profiles").upsert(details).select("full_name,phone").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ email: user.email, ...data });
}
