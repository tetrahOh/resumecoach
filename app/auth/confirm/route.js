import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request){const url=new URL(request.url);const token_hash=url.searchParams.get("token_hash");const type=url.searchParams.get("type");if(token_hash&&type){const supabase=await createClient();const {error}=await supabase.auth.verifyOtp({type,token_hash});if(!error)return NextResponse.redirect(new URL("/",url.origin));}return NextResponse.redirect(new URL("/login?error=confirmation",url.origin));}
