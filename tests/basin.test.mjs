import {test} from 'node:test';
import assert from 'node:assert/strict';
import {basinRecord,sendBasin} from '../server/basin.js';
const endpoint='https://f8fb6f6f730b404fb2f273fd789d04df.ingest.cloudflare.com';
test('teacher schema uses epoch milliseconds, trusted IP and no account information',async()=>{
 const req=new Request('https://anh-em-shop.pages.dev/api/analytics/event',{headers:{'CF-Connecting-IP':'192.0.2.7'}});Object.defineProperty(req,'cf',{value:{country:'VN'}});
 const record=basinRecord(req,'nhóm 7','/product','Mobile','iOS','Safari','Direct',1792450000000);
 assert.deepEqual(Object.keys(record).sort(),['id','country','device','time','ip','meta'].sort());assert.equal(record.time,1792450000000);assert.equal(record.id,'nhóm 7');assert.equal(record.device,'ios');assert.equal(record.ip,'192.0.2.7');assert.equal(record.meta.event,'page_view');assert.equal(record.meta.test,false);assert.equal(record.meta.site,'anh-em-shop');assert.ok(record.meta.event_id);
 const result=await sendBasin({BASIN_INGEST_URL:endpoint},record,async(url,options)=>{assert.equal(url,endpoint);assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),[record]);assert.equal(options.redirect,'error');return new Response('',{status:202});});assert.equal(result.status,'accepted');
 assert.equal((await sendBasin({BASIN_INGEST_URL:endpoint},record,async()=>new Response('',{status:401}))).status,'rejected');
 assert.equal((await sendBasin({BASIN_INGEST_URL:endpoint},record,async()=>{throw Error('offline')})).status,'unavailable');
 assert.equal((await sendBasin({},record)).status,'disabled');
 assert.equal((await sendBasin({BASIN_INGEST_URL:'https://other.test'},record)).status,'invalid_endpoint');
});
