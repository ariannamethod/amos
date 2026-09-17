/* Optional browser integration and layout check. Requires Playwright only here. */
'use strict';
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),os=require('os');
const assert=require('assert/strict');
(async()=>{
  const out=process.env.AMOS_BROWSER_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'amos-browser-qa-'));
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,
    ...(process.env.AMOS_CHROMIUM_EXECUTABLE?{executablePath:process.env.AMOS_CHROMIUM_EXECUTABLE}:{}),
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const p=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[],network=[];
    p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
    await p.goto('file://'+path.resolve(__dirname,'../web/index.html'));
    assert.equal(await p.locator('#tick').textContent(),'0');
    await p.click('#step');assert.equal(await p.locator('#tick').textContent(),'1');
    await p.click('#advance');assert.equal(await p.locator('#tick').textContent(),'121');
    await p.click('#checkpoint');const saved=await p.evaluate(()=>amos.dumps());
    await p.click('#advance');const expected=await p.evaluate(()=>amos.dumps());
    await p.click('#restore');assert.equal(await p.evaluate(()=>amos.dumps()),saved);
    await p.click('#advance');assert.equal(await p.evaluate(()=>amos.dumps()),expected);
    await p.click('#scar');assert.equal(await p.locator('#tick').textContent(),'121');
    assert.equal(await p.locator('#branches').isVisible(),true);
    assert.notEqual(await p.evaluate(()=>amos.dumps()),saved);
    const world=await p.evaluate(()=>JSON.stringify(amos.world));
    const oldWorld=JSON.stringify(JSON.parse(saved).amos.world);
    assert.equal(world,oldWorld);
    const before=await p.evaluate(()=>JSON.stringify(amos.subject));
    await p.click('#reverse');assert.equal(await p.evaluate(()=>JSON.stringify(amos.subject)),before);
    const polarity=await p.evaluate(()=>amos.world.polarity);
    assert.equal(polarity,-JSON.parse(saved).amos.world.polarity);
    await p.uncheck('#learning');const updates=await p.evaluate(()=>amos.subject.updates);
    await p.click('#advance');assert.equal(await p.evaluate(()=>amos.subject.updates),updates);
    await p.check('#learning');await p.click('#play');await p.waitForTimeout(300);await p.click('#play');
    assert.equal(await p.locator('#status').textContent(),'Paused');
    await p.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
    await p.click('#settingsToggle');
    const downloadPromise=p.waitForEvent('download');await p.click('#download');const download=await downloadPromise;
    const checkpointPath=path.join(out,'export.json');await download.saveAs(checkpointPath);
    const exported=await p.evaluate(()=>amos.dumps());
    await p.fill('#seed','23');await p.selectOption('#kind','0');await p.click('#birth');assert.equal(await p.locator('#tick').textContent(),'0');
    await p.setInputFiles('#file',checkpointPath);await p.waitForFunction(()=>document.getElementById('message').textContent.includes('Restored complete state'));
    assert.equal(await p.evaluate(()=>amos.dumps()),exported);
    fs.writeFileSync(path.join(out,'invalid.json'),'{"format":"AMOS-JSON-1","amos":{}}');
    await p.setInputFiles('#file',path.join(out,'invalid.json'));await p.waitForFunction(()=>document.getElementById('message').textContent.startsWith('Import rejected'));
    assert.equal(await p.evaluate(()=>amos.dumps()),exported);
    await p.click('#settingsToggle');
    await p.setViewportSize({width:390,height:844});
    await p.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
    await p.click('#step');
    assert.equal(await p.locator('#tick').textContent(),String(JSON.parse(exported).amos.world.tick+1));
    assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
    const result={status:'pass',browser:browser.version(),checks:['step/run/pause','exact restore continuation','scar preserves past world','actuator intervention isolates subject','frozen learning','JSON export/import','invalid import atomic','390px mobile layout','no runtime network requests','no browser exceptions'],screenshots:out};
    fs.writeFileSync(path.resolve(__dirname,'../reports/browser.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
