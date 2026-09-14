import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const prefixes = ['', 'ru/', 'he/'];
const routes = ['index.html', 'services/ai-business-control-center/index.html', 'cases/index.html', ...['clinic-control-layer','service-follow-up-system','secure-handover-baseline'].map(x=>`cases/${x}/index.html`)];
let checked=0;
for(const prefix of prefixes) for(const route of routes) {
 const file=prefix+route, html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert(!/18:00|premium signal|no fake logos|фейковых логотипов|Премиальный сигнал|הסימן הפרימיום|Data exposure low|Риск данных низкий|חשיפת נתונים נמוכה|—/i.test(html), `${file}: misleading or unpolished copy`);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+': one H1');
 if(route==='index.html') {
  assert(/AI agents|AI-агент|סוכני AI/.test(html),file+': corporate positioning');
  assert(/OSINT/.test(html),file+': OSINT positioning');
  assert(html.indexOf('id="services"') < html.indexOf('id="problem-abcc"'),file+': services precede product');
  const hero=html.match(/<section\b[^>]*id="home"[^>]*>[\s\S]*?<\/section>/)[0];
  assert(!/hero-proof-list|1,500|1 500|20 минут|20 minutes|20 דקות/.test(hero),file+': corporate hero without product promises');
  assert.equal((hero.match(/product-frame-title/g)||[]).length,1,file+': one demo caption');
  assert(!/>Built<|>Owner now sees<|>Сделали<|>Владелец видит<|>נבנה<|>הבעלים רואה</.test(html),file+': hypothetical scenarios');
 }
 if(route.includes('cases/')) assert(/illustrative|иллюстративн|להמחשה/i.test(html), file+': scenario disclosure');
 if(route.includes('ai-business')) {
  for(const price of ['1,500','3,500','6,000']) assert(html.includes(price),file+': preserve '+price);
  assert(/optional|отдельно|בנפרד/i.test(html),file+': integration scope');
 }
 checked++;
}
console.log(`PASS: copy regression checks on ${checked} localized pages`);
