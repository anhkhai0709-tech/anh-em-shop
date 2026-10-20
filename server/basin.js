// Only page views are sent, so clicks do not inflate visit counts.
export function basinRecord(request, group, path, device, os, browser, referrer, now=Date.now()) {
 return {id:group,country:request.cf?.country||'',device:os==='Other'?device:os.toLowerCase(),time:now,ip:request.headers.get('CF-Connecting-IP')||'',meta:{event:'page_view',event_id:crypto.randomUUID(),site:'anh-em-shop',host:new URL(request.url).hostname,path,device_type:device,os,browser,referrer,test:false}};
}
export async function sendBasin(env, record, fetcher=fetch){
 if(!env.BASIN_INGEST_URL)return {status:'disabled'};
 // This deployment intentionally permits only the teacher-provided destination.
 if(env.BASIN_INGEST_URL!=='https://f8fb6f6f730b404fb2f273fd789d04df.ingest.cloudflare.com')return {status:'invalid_endpoint'};
 try {const response=await fetcher(env.BASIN_INGEST_URL,{method:'POST',headers:{'Content-Type':'application/json',...(env.BASIN_SEND_TOKEN?{Authorization:'Bearer '+env.BASIN_SEND_TOKEN}:{})},body:JSON.stringify([record]),signal:AbortSignal.timeout(5000),redirect:'manual'});return {status:response.ok?'accepted':'rejected',http_status:response.status};}
 catch {return {status:'unavailable'};}
}
