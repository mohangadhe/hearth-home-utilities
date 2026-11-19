/** Strict parsers for the bill layouts we can verify. No missing field is guessed. */
export type ParsedBill = {provider:string;start:string;end:string;cost:number;usage:number|null;unit:string;billDate:string;filename:string;notes:string;amountDue:number|null};
const money='(-?\\$?\\s*[\\d,]+\\.\\d{2})';
const numeric=(s:string)=>Number(s.replace(/[$,\s]/g,''));
function required(t:string,r:RegExp,label:string){const m=t.match(r);if(!m)throw new Error(`Could not read ${label}. No bill was added.`);return m;}
function date(s:string){let y:number,m:number,d:number;if(/^\d{4}-/.test(s)){[y,m,d]=s.split('-').map(Number);}else if(s.includes('/')){[m,d,y]=s.split('/').map(Number);if(y<100)y+=2000;}else{const parts=s.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);if(!parts)throw new Error('Invalid bill date.');m=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(parts[1].slice(0,3).toLowerCase())+1;d=Number(parts[2]);y=Number(parts[3]);}const v=new Date(Date.UTC(y,m-1,d));if(!Number.isFinite(v.getTime())||v.getUTCFullYear()!==y||v.getUTCMonth()!==m-1||v.getUTCDate()!==d)throw new Error('Invalid bill date. No bill was added.');return v.toISOString().slice(0,10);}
export function parseBill(raw:string):ParsedBill{
 const t=raw.replace(/\s+/g,' ').trim();let provider='',start='',end='',billDate='',cost=NaN,usage:number|null=null,unit='',notes='';
 if(/SERVICE PERIOD/i.test(t)&&(/Base Power|basepowercompany|Howdy,/i.test(t))){
  provider='base';const p=required(t,/SERVICE PERIOD\s+(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/i,'service dates');start=date(p[1]);end=date(p[2]);billDate=date(required(t,/INVOICE DATE\s+(\d{4}-\d{2}-\d{2})/i,'invoice date')[1]);
  usage=numeric(required(t,/YOUR CONSUMPTION\s*\$[\d.]+\s*x\s*([\d,]+(?:\.\d+)?)\s*kWh/i,'electricity usage')[1]);unit='kWh';
  cost=numeric(required(t,new RegExp('New Charges\\s*'+money,'i'),'current electricity charges')[1]);
 }else if(/CenterPointEnergy\.com/i.test(t)&&/Current gas charges/i.test(t)){
  provider='centerpoint';const p=required(t,/(\d{2}\/\d{2}\/\d{2})\s*-\s*(\d{2}\/\d{2}\/\d{2})\s+[\d,]+\s+[\d,]+\s+([\d,.]+)\s*CCF/i,'gas readings');start=date(p[1]);end=date(p[2]);usage=numeric(p[3]);unit='CCF';billDate=date(required(t,/DATE MAILED\s+([A-Za-z]+ \d{1,2}, \d{4})/i,'mailed date')[1]);cost=numeric(required(t,new RegExp('Total current charges\\s*'+money,'i'),'current gas charges')[1]);
 }else if(/MeterNet/i.test(t)){
  provider='meternet';unit='gal';
  if(/Bill Period/i.test(t)){
   const p=required(t,/Bill Period\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,'water service dates');start=date(p[1]);end=date(p[2]);billDate=date(required(t,/Invoice Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,'invoice date')[1]);cost=numeric(required(t,new RegExp('Current Month\\s+Charges & Taxes\\s*'+money,'i'),'current water charges')[1]);
   const u=required(t,/Water\s+\d+\s+\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}\/\d{1,2}\/\d{4}\s+\d+\s+[\d,]+\s+[\d,]+\s+1\s+(?:Gal\s*([\d,.]+)|([\d,.]+)\s*Gal)/i,'water meter usage');usage=numeric(u[1]||u[2]);
  }else{
   const p=required(t,/WATER Meter:\s*\d+\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/i,'water readings');start=date(p[1]);end=date(p[2]);billDate=date(required(t,/Statement Date\s+([A-Za-z]+ \d{1,2}, \d{4})/i,'statement date')[1]);cost=numeric(required(t,new RegExp('Current Charges\\s*'+money,'i'),'current water charges')[1]);usage=numeric(required(t,/WATER USAGE\s+[\d,]+\s+[\d,]+\s+0\.001\s+([\d,.]+)/i,'water usage')[1])*1000;
  }
 }else if(/Xfinity|Comcast/i.test(t)){
  provider='xfinity';const p=required(t,/Services From\s+([A-Za-z]+ \d{1,2}, \d{4})\s+to\s+([A-Za-z]+ \d{1,2}, \d{4})/i,'internet service dates');start=date(p[1]);end=date(p[2]);billDate=date(required(t,/Billing Date\s+([A-Za-z]+ \d{1,2}, \d{4})/i,'billing date')[1]);cost=numeric(required(t,new RegExp('New charges(?: due\\s+[A-Za-z]+ \\d{1,2}, \\d{4})?\\s*'+money,'i'),'new internet charges')[1]);unit='GB';notes='Internet data usage is not reported on this bill.';
 }else throw new Error('This provider or PDF layout is not supported yet. No bill was added.');
 if(start>end||!Number.isFinite(cost)||cost<0||(usage!==null&&(!Number.isFinite(usage)||usage<0)))throw new Error('Bill totals could not be verified. No bill was added.');
 const due=t.match(new RegExp('(?:Total )?Amount Due\\s*'+money,'i'));
 const names:Record<string,string>={base:'Base Power',centerpoint:'CenterPoint Gas',meternet:'MeterNet Water',xfinity:'Xfinity Internet'};
 return {provider,start,end,cost:Math.round(cost*100)/100,usage:usage===null?null:Math.round(usage*1000)/1000,unit,billDate,filename:`${names[provider]} - ${start} to ${end}.pdf`,notes:[notes,'Cost reflects current service charges; previous balances, deposits and separately listed adjustments are excluded.'].filter(Boolean).join(' '),amountDue:due?numeric(due[1]):null};
}
