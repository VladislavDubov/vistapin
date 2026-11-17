window.__sleep = ms => new Promise(r=>setTimeout(r,ms));
window.__deep = function(root, sel, out=[]) { root.querySelectorAll(sel).forEach(e=>out.push(e)); root.querySelectorAll('*').forEach(e=>{ if(e.shadowRoot) window.__deep(e.shadowRoot, sel, out); }); return out; };
window.__visible = e => { const r = e.getBoundingClientRect(); return r.width>0 && r.height>0; };
window.__btn = (label) => window.__deep(document, 'button, ytcp-button, tp-yt-paper-item, [role=button]').filter(e=>window.__visible(e) && (e.getAttribute('aria-label')===label || e.innerText && e.innerText.trim()===label));
window.__inject = async (inp, url, name, type) => { const r = await fetch(url); if (r.status!==200) throw 'fetch '+r.status+' '+name; const b = await r.blob(); const dt = new DataTransfer(); dt.items.add(new File([b], name, {type})); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true})); return b.size; };
window.__waitFor = async (fn, ms=20000) => { const t=Date.now(); while(Date.now()-t<ms){ const v=fn(); if(v) return v; await window.__sleep(300);} throw 'timeout'; };
window.__vid = id => window.__deep(document,'#'+id).find(window.__visible);
window.__pubBtn = () => window.__deep(document,'ytcp-button').find(b=>window.__visible(b) && b.innerText && b.innerText.trim()==='Опублікувати' && !b.hasAttribute('disabled') && b.getAttribute('aria-disabled')!=='true');
if(!window.__origClick){ window.__origClick = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function(){ if (this.type==='file') { window.__pendingInput = this; return; } return window.__origClick.call(this); }; }
window.__doLang = async (lang, code, base) => {
  const log=[]; const S=window.__sleep;
  if(!window.__vid('language-details-text-button-audio')){
    const row = window.__deep(document,'ytgn-video-translation-row').find(r=>r.innerText.trim().split('\n')[0].trim()===lang);
    if(!row) throw 'no row '+lang;
    (window.__deep(row,'button, ytcp-button, [role=button]').find(b=>b.innerText && b.innerText.trim()===lang) || row.querySelector('td')).click(); log.push('row');
  }
  if(!window.__btn('Вибрати файл')[0]){
    const addAudio = await window.__waitFor(()=>window.__vid('language-details-text-button-audio'));
    addAudio.click(); log.push('addAudio');
    await window.__waitFor(()=>window.__btn('Вибрати файл')[0]);
  }
  const ain = window.__deep(document,'#audio-file-loader')[0];
  log.push('audio '+await window.__inject(ain, base+code+'.m4a', code+'.m4a', 'audio/mp4'));
  await S(1500);
  const pub = await window.__waitFor(window.__pubBtn, 60000);
  pub.click(); log.push('audioPub');
  await window.__waitFor(()=>!window.__btn('Вибрати файл')[0], 90000);
  await S(1500);
  const addSub = await window.__waitFor(()=>window.__vid('language-details-text-button-subtitles'));
  addSub.click(); log.push('addSub');
  await S(1500);
  const save = window.__btn('Зберегти зміни')[0]; if(save){ save.click(); log.push('saved'); await S(2500); }
  const addFile = await window.__waitFor(()=>window.__deep(document,'*').find(e=>window.__visible(e) && e.children.length===0 && e.textContent.trim()==='Додати файл'));
  addFile.click(); log.push('addFile');
  const next = await window.__waitFor(()=>window.__btn('Далі')[0]);
  window.__pendingInput=null; next.click();
  const sin = await window.__waitFor(()=>window.__pendingInput);
  log.push('srt '+await window.__inject(sin, base+code+'.srt', code+'.srt', 'application/x-subrip')); window.__pendingInput=null;
  await S(3000);
  const spub = await window.__waitFor(window.__pubBtn);
  spub.click(); log.push('subPub');
  await S(4000);
  return log.join(',');
};
window.__runAll = (base, items) => { window.__log=[]; window.__done=false; (async()=>{ for (const [l,c] of items) { try { window.__log.push(l+': '+await window.__doLang(l,c,base)); } catch(e){ window.__log.push(l+' ERR '+e); break; } await window.__sleep(2000);} window.__done=true; })(); return 'started'; };
'helpers ok'
