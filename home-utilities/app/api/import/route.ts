import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {parseBill} from '../../../lib/bill-import';
const hash=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to import your bills.'},{status:401});
 try{
  const form=await req.formData(),file=form.get('file'),text=form.get('text');
  if(!(file instanceof File)||file.size>15*1024*1024||typeof text!=='string'||text.length>500000)return Response.json({error:'Choose a PDF under 15 MB.'},{status:400});
  const bytes=await file.arrayBuffer();if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('Only PDF files are supported.');
  const parsed=parseBill(text),digest=await hash(bytes);
  const existing:any=await env.DB.prepare("SELECT id,data FROM records WHERE owner=? AND kind='bill' AND (json_extract(data,'$.fileHash')=? OR (json_extract(data,'$.provider')=? AND json_extract(data,'$.start')=? AND json_extract(data,'$.end')=?)) LIMIT 1").bind(user.userId,digest,parsed.provider,parsed.start,parsed.end).first();
  if(existing){
   const bill=JSON.parse(existing.data);if(bill.file)return Response.json({status:'duplicate',bill,message:'Already in your library.'});
   const key=user.userId+'/'+digest+'.pdf';await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf'},customMetadata:{filename:parsed.filename}});
   const updated={...bill,billDate:bill.billDate||parsed.billDate,notes:bill.notes||parsed.notes,amountDue:bill.amountDue??parsed.amountDue,file:key,fileHash:digest,filename:parsed.filename};await env.DB.prepare('UPDATE records SET data=? WHERE id=? AND owner=?').bind(JSON.stringify(updated),existing.id,user.userId).run();return Response.json({status:'attached',bill:updated,message:'PDF attached to your existing bill.'});
  }
  const id='pdf-'+await hash(new TextEncoder().encode([user.userId,parsed.provider,parsed.start,parsed.end].join('|')).buffer),key=user.userId+'/'+digest+'.pdf';
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf'},customMetadata:{filename:parsed.filename}});
  const bill={...parsed,id,kind:'bill',file:key,fileHash:digest,source:'pdf-import',importedAt:new Date().toISOString()};
  const result=await env.DB.prepare('INSERT OR IGNORE INTO records (id,owner,kind,data) VALUES (?,?,?,?)').bind(id,user.userId,'bill',JSON.stringify(bill)).run();
  return Response.json({status:result.meta.changes?'imported':'duplicate',bill,message:result.meta.changes?'Imported automatically.':'Already in your library.'});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Import failed. Please retry this PDF.'},{status:422});}
}
