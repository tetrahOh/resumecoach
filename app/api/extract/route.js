import { NextResponse } from "next/server";

const MODEL=process.env.ANTHROPIC_MODEL||"claude-sonnet-4-5-20250929";

export async function POST(request){
 try{
  const {data,mediaType,fileName}=await request.json();
  if(!data||!mediaType)return NextResponse.json({error:"No file was received."},{status:400});
  if(data.length>8_000_000)return NextResponse.json({error:"Please upload a file smaller than 6 MB."},{status:413});
  const isPdf=mediaType==="application/pdf";
  const isImage=mediaType.startsWith("image/");
  if(!isPdf&&!isImage)return NextResponse.json({error:"Upload a PDF, PNG, JPG or WebP file."},{status:415});
  const source={type:"base64",media_type:mediaType,data};
  const fileBlock=isPdf?{type:"document",source}:{type:"image",source};
  const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:MODEL,max_tokens:5000,messages:[{role:"user",content:[fileBlock,{type:"text",text:`Extract all readable resume or job-description text from ${fileName||"this file"}. Preserve headings, names, dates and bullet content. Return only the extracted text, with no commentary.`}]}]})});
  if(!response.ok)return NextResponse.json({error:`Claude could not read this file (${response.status}).`},{status:502});
  const result=await response.json();
  const text=result.content?.filter(x=>x.type==="text").map(x=>x.text).join("\n").trim();
  if(!text)return NextResponse.json({error:"No readable text was found in that file."},{status:422});
  return NextResponse.json({text});
 }catch(error){return NextResponse.json({error:error.message||"The file could not be read."},{status:500})}
}
