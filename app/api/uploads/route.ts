import { env } from "cloudflare:workers";

const allowed=new Set(["image/jpeg","image/png","image/webp"]);
export async function GET(request:Request){
  const key=new URL(request.url).searchParams.get("key")||"";
  if(!key.startsWith("creator-evidence/"))return Response.json({error:"Invalid evidence key"},{status:400});
  const object=await env.MEDIA.get(key);
  if(!object)return Response.json({error:"Evidence not found"},{status:404});
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set("cache-control","private, max-age=300"); headers.set("content-length",String(object.size));
  return new Response(object.body,{headers});
}

export async function POST(request:Request){
  const data=await request.formData(); const file=data.get("file");
  if(!(file instanceof File))return Response.json({error:"Image is required"},{status:400});
  if(!allowed.has(file.type))return Response.json({error:"Use JPG, PNG, or WEBP"},{status:400});
  if(file.size>8*1024*1024)return Response.json({error:"Image must be 8 MB or smaller"},{status:400});
  const key=`creator-evidence/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
  await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type},customMetadata:{owner:request.headers.get("oai-authenticated-user-id")||"local-demo"}});
  return Response.json({key,name:file.name,size:file.size},{status:201});
}
