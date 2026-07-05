import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request){const url=new URL(request.url);const code=url.searchParams.get("code");const token_hash=url.searchParams.get("token_hash");const type=url.searchParams.get("type");const supabase=await createClient();if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL("/",url.origin));}if(token_hash&&type){const {error}=await supabase.auth.verifyOtp({type,token_hash});if(!error)return NextResponse.redirect(new URL("/",url.origin));}return NextResponse.redirect(new URL("/login?error=confirmation",url.origin));}
