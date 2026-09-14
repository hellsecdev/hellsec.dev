// npm i --no-save playwright; serve the repo, then set MOTION_URL and CHROMIUM_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.MOTION_URL || 'http://127.0.0.1:8879';
const out = process.env.MOTION_ARTIFACTS;
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium', args:['--no-sandbox'], headless:true});
  const results=[];
  try {
    for (const locale of ['', 'ru/', 'he/']) for (const mobile of [false,true]) {
      const context = await browser.newContext({viewport:{width:mobile?390:1280,height:800}});
      const page = await context.newPage();
      await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      for (const path of ['', 'services/ai-business-control-center/', 'cases/']) {
        await page.goto(base+'/'+locale+path);
        const item=page.locator('.faq-item').first();
        if (!await item.count()) continue;
        await item.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
        if (await item.getAttribute('open')!==null) {
          await item.locator('summary').click();
          await page.waitForFunction(()=>!document.querySelector('.faq-item').open);
        }
        async function samples() {
          return item.evaluate(async el=>{
            const h=()=>el.getBoundingClientRect().height;
            const values=[h()]; el.querySelector('summary').click();
            // Sample the real rendered animation at deterministic timeline positions.
            // This also works on overloaded CI where a single frame can exceed 300ms.
            const animation=el.getAnimations().find(a=>a.effect.getKeyframes().some(k=>'height' in k));
            if(animation){
              animation.pause();
              for(const time of [0,75,150,225,299]){animation.currentTime=time;values.push(h());}
              animation.finish();
            }
            await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
            values.push(h());
            return values;
          });
        }
        const opening=await samples();
        console.log('SAMPLES',locale,mobile,path,opening);
        assert(opening.some(h=>h>opening[0]+1 && h<opening.at(-1)-1),'intermediate opening '+locale+path);
        if(out && !path){await page.screenshot({path:`${out}/motion-${locale||'en/'}${mobile?'mobile':'desktop'}-open.png`.replace(/(en|ru|he)\//,'$1-')});}
        const closing=await samples();
        assert(closing.some(h=>h<closing[0]-1 && h>closing.at(-1)+1),'intermediate closing');
        if(out && !path) await page.screenshot({path:`${out}/motion-${locale.replace('/','')||'en'}-${mobile?'mobile':'desktop'}-closed.png`});
        await item.evaluate(async el=>{for(let i=0;i<7;i++){el.querySelector('summary').click();await new Promise(r=>setTimeout(r,35));}});
        await page.waitForTimeout(450);
        assert.equal(await item.getAttribute('open'),'');
        assert.equal(await item.locator('summary').getAttribute('aria-expanded'),'true');
        await item.evaluate(el=>{el.querySelector('p').append(' Dynamic content. '.repeat(35));});
        await page.setViewportSize({width:mobile?430:1000,height:800});
        assert(await item.evaluate(el=>el.getBoundingClientRect().height>=el.querySelector('summary').offsetHeight+el.querySelector('.faq-answer').offsetHeight-2));
        await item.locator('summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.faq-item').open,{},{timeout:5000});
        assert.equal(await item.getAttribute('open'),null);
        await page.keyboard.press('Space');await page.waitForTimeout(700);
        assert.equal(await item.getAttribute('open'),'');
        assert(await item.locator('summary').evaluate(el=>el.matches(':focus-visible') && getComputedStyle(el).outlineStyle!=='none'));
        await item.locator('summary').click();await page.waitForTimeout(700);
        assert(await item.locator('summary').evaluate(el=>getComputedStyle(el).outlineStyle==='none'));
        await page.emulateMedia({reducedMotion:'reduce'});
        await item.locator('summary').click();
        assert.equal(await item.getAttribute('open'),'');
        assert.equal(await item.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0,JSON.stringify(await item.evaluate(el=>el.getAnimations({subtree:true}).map(a=>({state:a.playState,frames:a.effect.getKeyframes()})))));
        await page.emulateMedia({reducedMotion:'no-preference'});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        results.push({locale:locale||'en',mobile,path,opening,closing});
      }
      if(mobile){
        const toggle=page.locator('#mobile-toggle');await toggle.click();await page.waitForTimeout(300);
        assert.equal(await toggle.getAttribute('aria-expanded'),'true');
        await page.keyboard.press('Escape');await page.waitForTimeout(300);
        assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      }
      assert.deepEqual(errors,[]);await context.close();
      const fallback=await browser.newContext({javaScriptEnabled:false,viewport:{width:mobile?390:1280,height:800}});
      const nojs=await fallback.newPage();await nojs.goto(base+'/'+locale);
      const detail=nojs.locator('.faq-item').first();const wasOpen=await detail.getAttribute('open');
      await detail.locator('summary').click();assert.notEqual(await detail.getAttribute('open'),wasOpen);
      await fallback.close();
    }
    if(out)fs.writeFileSync(out+'/motion-results.json',JSON.stringify(results,null,2));
    console.log(`PASS ${results.length} FAQ page/viewport combinations: intermediate heights both ways, rapid reversal, resize/dynamic content, keyboard/focus, reduced motion; all locales no-JS and mobile menus.`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
