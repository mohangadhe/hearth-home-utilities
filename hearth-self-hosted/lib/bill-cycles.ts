import type {Bill,Provider} from './utilities';
const dayMs=86400000;
const utc=(s:string)=>new Date(s+'T00:00:00Z');
const iso=(d:Date)=>d.toISOString().slice(0,10);
function nextMonth(s:string){const d=utc(s),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return d;}
export function cycleAlerts(provider:Provider,bills:Bill[],now=new Date()){
 const rows=bills.filter(b=>b.provider===provider.id).sort((a,b)=>a.start.localeCompare(b.start));
 const alerts:string[]=[];if(!rows.length)return {alerts,summary:'No bills yet — upload statements to check coverage.'};
 let end=rows[0].end;
 if(provider.since&&provider.since<rows[0].start&&utc(rows[0].start).getTime()-utc(provider.since).getTime()>dayMs)alerts.push(`Missing history: ${provider.since} to ${iso(new Date(utc(rows[0].start).getTime()-dayMs))}.`);
 for(const b of rows.slice(1)){if(utc(b.start).getTime()-utc(end).getTime()>dayMs)alerts.push(`Missing service period: ${iso(new Date(utc(end).getTime()+dayMs))} to ${iso(new Date(utc(b.start).getTime()-dayMs))}.`);if(b.end>end)end=b.end;}
 if(provider.archived){if(provider.until&&utc(provider.until).getTime()-utc(end).getTime()>dayMs)alerts.push(`Missing final coverage: after ${end} through ${provider.until}.`);}
 else if(rows.length>=2){
  const dates=rows.map(b=>b.billDate).filter((s):s is string=>!!s).sort();
  const basis=dates.at(-1)||end;
  const expected=nextMonth(basis),late=new Date(expected.getTime()+7*dayMs);
  if(now.getTime()>late.getTime())alerts.push(`Possibly missing ${dates.length?'statement':'cycle'}: expected around ${iso(expected)}. Latest service coverage ends ${end}. Estimate allows 7 extra days.`);
 }
 return {alerts,summary:`${rows.length} bills · ${rows[0].start} to ${end}${alerts.length?'':' · No gaps found'}`};
}
