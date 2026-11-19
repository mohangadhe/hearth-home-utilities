export async function extractPdfText(file:File,progress:(message:string)=>void=()=>{}){
 if(file.size>15*1024*1024)throw new Error('Choose a PDF under 15 MB.');
 progress('Loading PDF reader');
 // Load the parser directly so embedded browsers do not need to spawn a worker.
 const [pdfjs,worker]=await Promise.all([import('pdfjs-dist'),import('pdfjs-dist/build/pdf.worker.min.mjs')]);
 (globalThis as any).pdfjsWorker=worker;
 progress('Opening PDF');
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{const pdf=await Promise.race([task.promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('PDF reading timed out. Please retry this file.')),30000);})]);clearTimeout(timer);if(pdf.numPages>50)throw new Error('Please upload individual statements with 50 pages or fewer.');let text='';for(let i=1;i<=pdf.numPages;i++){progress(`Reading page ${i} of ${pdf.numPages}`);const page=await pdf.getPage(i);const c=await page.getTextContent();text+=c.items.map(x=>'str' in x?x.str:'').join(' ')+'\n';page.cleanup();if(text.length>500000)throw new Error('This document is too long to import.');}if(text.trim().length<100)throw new Error('This PDF has no readable text. Scanned bills are not supported yet.');return text;}finally{clearTimeout(timer);void task.destroy();}
}
