\
// app.js v3 - robust plan handling and credit counters
let planEstudios = {};
let cursosHorarios = {};
let cursosSeleccionados = {};
let combinacionesGeneradas = [];
let combinacionesVars = [];
const dias = ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"];
const timeSlots = [
  ["07:00","07:50"], ["07:50","08:40"], ["08:50","09:40"], ["09:40","10:30"],
  ["10:40","11:30"], ["11:30","12:20"], ["12:20","13:10"], ["13:10","14:00"],
  ["14:00","14:50"], ["14:50","15:40"], ["15:50","16:40"], ["16:40","17:30"],
  ["17:40","18:30"], ["18:30","19:20"], ["19:20","20:10"], ["20:10","21:00"]
];
const inicioOptions = timeSlots.map(s=>s[0]);
const finOptions = timeSlots.map(s=>s[1]);

function horaAMinutos(h){ const [hh,mm] = h.split(':').map(n=>parseInt(n,10)); return hh*60+mm; }
function horariosSeCruzan(a,b){ for(const x of a){ for(const y of b){ if(x['día']===y['día']){ const x1 = horaAMinutos(x.inicio), x2 = horaAMinutos(x.fin), y1 = horaAMinutos(y.inicio), y2 = horaAMinutos(y.fin); if(!(x2 <= y1 || y2 <= x1)) return true; } } } return false; }
function cartesian(arr){ if(arr.length===0) return [[]]; const [f,...r]=arr; const rp=cartesian(r); const out=[]; for(const e of f) for(const s of rp) out.push([e,...s]); return out; }

function combinacionesValidas(){
  const cursos_grupos = []; const codigos=Object.keys(cursosSeleccionados);
  for(const codigo of codigos){
    if(cursosHorarios[codigo]){
      const gruposObj = cursosHorarios[codigo];
      const grupos = Object.keys(gruposObj).map(k=>({...gruposObj[k], cursoCodigo:codigo, cursoNombre:cursosSeleccionados[codigo]?.nombre || codigo})).filter(g=>g&&g.horarios&&g.horarios.length>0);
      if(grupos.length>0) cursos_grupos.push(grupos);
    }
  }
  if(cursos_grupos.length===0) return [];
  const all = cartesian(cursos_grupos);
  const valid = [];
  for(const comb of all){
    let ok=true;
    for(let i=0;i<comb.length;i++){ for(let j=i+1;j<comb.length;j++){ if(horariosSeCruzan(comb[i].horarios, comb[j].horarios)){ ok=false; break; } } if(!ok) break; }
    if(ok) valid.push(comb);
  }
  return valid;
}

// try to fetch plan; if not available, reveal upload control

// loadPlan: prefer embedded plan-data script if present (for GitHub Pages reliability)
async function loadPlan(){
  // try embedded JSON first
  try{
    const el = document.getElementById('plan-data');
    if(el && el.textContent && el.textContent.trim() !== ''){
      planEstudios = JSON.parse(el.textContent);
      renderSemestres();
      return;
    }
  }catch(e){
    // fallthrough to fetch
    console.warn('Embedded plan-data parsing failed, falling back to fetch.', e);
  }
  // fallback to fetch (previous behavior)
  try{
    const res = await fetch('plan_estudios.json', {cache:'no-store'});
    if(!res.ok) throw new Error('not ok');
    let p = await res.json();
    // unwrap if wrapped in PLAN_ESTUDIOS
    if(typeof p === 'object' && p !== null){
      const upperKeys = Object.keys(p).map(k=>k.toUpperCase());
      const idx = upperKeys.indexOf('PLAN_ESTUDIOS');
      if(idx !== -1 && typeof p[Object.keys(p)[idx]] === 'object') p = p[Object.keys(p)[idx]];
    }
    planEstudios = p;
  }catch(err){
    planEstudios = {};
    document.getElementById('plan-upload')?.classList.remove('hidden');
  }
  renderSemestres();
}
    planEstudios = p;
  }catch(err){
    planEstudios = {};
    document.getElementById('plan-upload').classList.remove('hidden');
  }
  renderSemestres();
}

function renderSemestres(){
  const container = document.getElementById('semestres-container'); container.innerHTML='';
  const keys = Object.keys(planEstudios || {});
  if(keys.length===0){ container.innerHTML = '<div class="text-sm text-gray-500">No hay semestres cargados. Puedes subir un archivo <strong>plan_estudios.json</strong>.</div>'; return; }
  keys.forEach(sem=>{
    const id = 'sem_'+sem.replace(/\s+/g,'_');
    const wrapper = document.createElement('div'); wrapper.className='flex items-center gap-2';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.id=id; cb.dataset.sem=sem; cb.className='sem-checkbox';
    cb.addEventListener('change', ()=>{ renderCursosDisponibles(); updateCheckedCredits(); });
    const label = document.createElement('label'); label.htmlFor=id; label.className='text-sm ml-1'; label.textContent=sem;
    wrapper.appendChild(cb); wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
  renderCursosDisponibles();
}

function renderCursosDisponibles(){
  const container = document.getElementById('cursos-container'); container.innerHTML='';
  const selected = []; document.querySelectorAll('.sem-checkbox:checked').forEach(cb=>selected.push(cb.dataset.sem));
  if(selected.length===0){ container.innerHTML = '<div class="text-sm text-gray-500">Selecciona al menos un semestre para ver sus cursos.</div>'; updateCheckedCredits(); return; }
  const list = document.createElement('div'); list.className='space-y-1';
  selected.forEach(sem=>{
    const cursos = planEstudios[sem] || {};
    Object.keys(cursos).forEach(cod=>{
      const c = cursos[cod] || {};
      const row = document.createElement('div'); row.className='flex items-center justify-between p-1';
      const left = document.createElement('label'); left.className='flex items-center gap-2';
      const input = document.createElement('input'); input.type='checkbox'; input.className='curso-checkbox'; input.dataset.codigo=cod; input.dataset.nombre=c.nombre || cod; input.dataset.creditos = (c.creditos || 0);
      input.addEventListener('change', updateCheckedCredits);
      const span = document.createElement('span'); span.className='text-sm'; span.innerHTML = `${c.nombre || cod} <span class="text-xs text-gray-400">(${cod})</span> <span class="text-xs text-gray-500 ml-2">[${c.creditos || 0} cr]</span>`;
      left.appendChild(input); left.appendChild(span);
      row.appendChild(left);
      list.appendChild(row);
    });
  });
  container.appendChild(list);
  updateCheckedCredits();
}

document.getElementById('btn-add-cursos').addEventListener('click', ()=>{
  // add checked cursos into cursosSeleccionados, copying creditos
  document.querySelectorAll('.curso-checkbox:checked').forEach(cb=>{
    const codigo = cb.dataset.codigo; const nombre = cb.dataset.nombre; const creditos = parseInt(cb.dataset.creditos || '0',10);
    cursosSeleccionados[codigo] = {nombre, creditos};
    if(!cursosHorarios[codigo]) cursosHorarios[codigo] = {};
  });
  renderConfigCursos();
  updateAddedCredits();
  updateCheckedCredits(); // uncheck checked? we'll leave them; show counts nonetheless
});

document.getElementById('btn-load-sample').addEventListener('click', ()=>{
  const sems = Object.keys(planEstudios);
  if(sems.length>0){
    const cursos = planEstudios[sems[0]] || {}; let i=0;
    for(const cod of Object.keys(cursos)){
      cursosSeleccionados[cod] = {nombre: cursos[cod].nombre, creditos: cursos[cod].creditos || 0};
      cursosHorarios[cod] = {};
      i++; if(i>=3) break;
    }
    renderConfigCursos(); updateAddedCredits();
  }
});

function renderConfigCursos(){
  const container = document.getElementById('config-cursos'); container.innerHTML='';
  Object.keys(cursosSeleccionados).forEach(codigo=>{
    const curso = cursosSeleccionados[codigo];
    const card = document.createElement('div'); card.className='p-3 border rounded-md bg-gray-50';
    card.innerHTML = `<div class="flex justify-between items-center"><div><strong>${curso.nombre}</strong> <div class="text-xs text-gray-500">${codigo} — ${curso.creditos || 0} cr</div></div><div class="flex gap-2"><button class="btn-primary text-xs" data-action="add-group" data-codigo="${codigo}">+ Grupo</button><button class="btn-primary text-xs" data-action="remove-curso" data-codigo="${codigo}">Eliminar</button></div></div><div class="groups mt-2" id="groups_${codigo}"></div>`;
    container.appendChild(card);
    if(!cursosHorarios[codigo]) cursosHorarios[codigo] = {};
    renderGroups(codigo);
  });
  // attach actions
  document.querySelectorAll('[data-action="add-group"]').forEach(btn=> btn.addEventListener('click', ()=>{ addGroup(btn.dataset.codigo); renderGroups(btn.dataset.codigo); }));
  document.querySelectorAll('[data-action="remove-curso"]').forEach(btn=> btn.addEventListener('click', ()=>{ const c=btn.dataset.codigo; delete cursosSeleccionados[c]; delete cursosHorarios[c]; renderConfigCursos(); updateAddedCredits(); }));
}

function addGroup(codigo){
  const existing = Object.keys(cursosHorarios[codigo]||{}); const letters=['A','B','C','D','E','F']; const available = letters.find(l=>!existing.includes(l));
  if(!available){ alert('Máximo 6 grupos alcanzado (A-F).'); return; }
  cursosHorarios[codigo][available] = {grupo:available, horarios:[], tipo:''};
}

function renderGroups(codigo){
  const container = document.getElementById('groups_'+codigo); container.innerHTML=''; const groups = cursosHorarios[codigo]||{};
  Object.keys(groups).forEach(gk=>{
    const g = groups[gk]; const gDiv = document.createElement('div'); gDiv.className='p-2 bg-white rounded-md border mb-2';
    gDiv.innerHTML = `<div class="flex justify-between items-center"><div class="text-sm font-semibold">Grupo ${g.grupo} <span class="text-xs text-gray-400">(${g.tipo||'—'})</span></div><div class="flex gap-2"><button class="btn-primary btn-add-horario text-xs" data-codigo="${codigo}" data-grupo="${g.grupo}">+ Horario</button><button class="btn-primary btn-remove-grupo text-xs" data-codigo="${codigo}" data-grupo="${g.grupo}">Eliminar</button></div></div><div class="horarios-list mt-2" id="horarios_${codigo}_${g.grupo}"></div>`;
    container.appendChild(gDiv);
    renderHorariosList(codigo, g.grupo);
    gDiv.querySelector('.btn-add-horario').addEventListener('click', ()=>{ addHorario(codigo,g.grupo); renderHorariosList(codigo,g.grupo); });
    gDiv.querySelector('.btn-remove-grupo').addEventListener('click', ()=>{ delete cursosHorarios[codigo][g.grupo]; renderGroups(codigo); });
  });
}

function renderHorariosList(codigo, grupo){
  const list = document.getElementById(`horarios_${codigo}_${grupo}`); list.innerHTML=''; const g = cursosHorarios[codigo][grupo];
  g.horarios.forEach((h,idx)=>{
    const inicioSel = `<select class="input-inicio text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">${inicioOptions.map(v=>`<option value="${v}" ${v===h.inicio?'selected':''}>${v}</option>`).join('')}</select>`;
    const finSel = `<select class="input-fin text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">${finOptions.map(v=>`<option value="${v}" ${v===h.fin?'selected':''}>${v}</option>`).join('')}</select>`;
    const row = document.createElement('div'); row.className='flex items-center gap-2 mb-1';
    row.innerHTML = `<select class="input-dia text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">${dias.map(d=>`<option value="${d}" ${d===h.día?'selected':''}>${d}</option>`).join('')}</select>${inicioSel}${finSel}<button class="btn-primary btn-remove-h text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">Eliminar</button>`;
    list.appendChild(row);
  });
  if(g.horarios.length===0){ const hint=document.createElement('div'); hint.className='text-xs text-gray-400'; hint.textContent='No hay horarios. Pulsa + Horario para añadir uno.'; list.appendChild(hint); }
  list.querySelectorAll('.btn-remove-h').forEach(btn=>btn.addEventListener('click', ()=>{ const codigo=btn.dataset.codigo, grupo=btn.dataset.grupo, idx=parseInt(btn.dataset.idx,10); cursosHorarios[codigo][grupo].horarios.splice(idx,1); renderHorariosList(codigo,grupo); }));
  list.querySelectorAll('.input-inicio, .input-fin, .input-dia').forEach(inp=>inp.addEventListener('change', (e)=>{ const codigo=inp.dataset.codigo, grupo=inp.dataset.grupo, idx=parseInt(inp.dataset.idx,10); const h=cursosHorarios[codigo][grupo].horarios[idx]; if(e.target.classList.contains('input-inicio')) h.inicio=e.target.value; if(e.target.classList.contains('input-fin')) h.fin=e.target.value; if(e.target.classList.contains('input-dia')) h.día=e.target.value; }));
}

function addHorario(codigo, grupo){ if(!cursosHorarios[codigo][grupo]) return; cursosHorarios[codigo][grupo].horarios.push({"día":"LUNES","inicio":inicioOptions[0],"fin":finOptions[0]}); }

document.getElementById('btn-generar').addEventListener('click', ()=>{ combinacionesGeneradas = combinacionesValidas(); combinacionesVars = new Array(combinacionesGeneradas.length).fill(false); document.getElementById('combinaciones-info').textContent = `Se encontraron ${combinacionesGeneradas.length} combinaciones válidas.`; const list=document.getElementById('combinaciones-list'); list.innerHTML=''; combinacionesGeneradas.forEach((comb,idx)=>{ const div=document.createElement('div'); div.className='flex items-center justify-between p-2 bg-white rounded'; div.innerHTML=`<label class="flex items-center gap-2"><input type="checkbox" data-idx="${idx}" class="comb-cb"> Combinación ${idx+1} <span class="text-xs text-gray-400">(${comb.length} grupos)</span></label><div class="flex gap-2"><button class="btn-primary btn-ver" data-idx="${idx}">Ver</button></div>`; list.appendChild(div); }); document.querySelectorAll('.comb-cb').forEach(cb=>cb.addEventListener('change', ()=>{ combinacionesVars[parseInt(cb.dataset.idx,10)] = cb.checked; })); document.querySelectorAll('.btn-ver').forEach(b=>b.addEventListener('click', ()=> previewCombinacion(parseInt(b.dataset.idx,10)))); });

function previewCombinacion(idx){ if(idx<0||idx>=combinacionesGeneradas.length) return; drawHorario(combinacionesGeneradas[idx]); }
document.getElementById('btn-preview-selected').addEventListener('click', ()=>{ const i=combinacionesVars.findIndex(v=>v); if(i===-1){ alert('Selecciona al menos una combinación.'); return; } previewCombinacion(i); });

function drawHorario(combinacion){
  const area=document.getElementById('schedule-canvas'); area.innerHTML=''; const slotHeight=36; const grid=document.createElement('div'); grid.className='schedule-grid';
  const timesCol=document.createElement('div'); timesCol.className='p-2'; timesCol.style.minWidth='100px'; timesCol.innerHTML='<div class="text-xs font-semibold">Horas</div>';
  timeSlots.forEach(s=>{ const cell=document.createElement('div'); cell.className='time-cell'; cell.style.height=slotHeight+'px'; cell.textContent=s[0]+' - '+s[1]; timesCol.appendChild(cell); });
  grid.appendChild(timesCol);
  dias.forEach(d=>{ const col=document.createElement('div'); col.className='day-column'; col.style.position='relative'; col.style.minHeight=(slotHeight*timeSlots.length+28)+'px'; const title=document.createElement('div'); title.className='text-sm font-semibold mb-2'; title.textContent=d; col.appendChild(title); timeSlots.forEach(s=>{ const cell=document.createElement('div'); cell.className='time-cell'; cell.style.height=slotHeight+'px'; col.appendChild(cell); }); grid.appendChild(col); });
  area.appendChild(grid);
  const legend=document.createElement('div'); legend.id='schedule-legend'; legend.style.marginTop='12px'; legend.style.display='flex'; legend.style.flexWrap='wrap'; legend.style.gap='8px'; area.appendChild(legend);
  const palette=['#0b3d91','#1fb6a6','#f59e0b','#ef4444','#7c3aed','#06b6d4','#f97316','#0ea5a3'];
  combinacion.forEach((g,idx)=>{ const color=palette[idx%palette.length]; const legendItem=document.createElement('div'); legendItem.style.display='flex'; legendItem.style.alignItems='center'; legendItem.style.gap='8px'; legendItem.style.padding='6px 8px'; legendItem.style.borderRadius='8px'; legendItem.style.background='#ffffff'; legendItem.style.boxShadow='0 6px 14px rgba(2,6,23,0.04)'; legendItem.innerHTML=`<div style="width:12px;height:12px;border-radius:4px;background:${color}"></div><div style="font-size:13px"><strong style="display:block">${g.cursoNombre}</strong><span style="font-size:12px;color:#666">Grupo ${g.grupo}</span></div>`; legend.appendChild(legendItem);
    g.horarios.forEach(h=>{ const dayIndex=dias.indexOf(h['día']); if(dayIndex===-1) return; const startIdx=timeSlots.findIndex(s=>s[0]===h.inicio); const endIdx=timeSlots.findIndex(s=>s[1]===h.fin); let top=0,height=0; if(startIdx!==-1 && endIdx!==-1){ top=startIdx*slotHeight+28; height=(endIdx-startIdx+1)*slotHeight-6; } else { const start=horaAMinutos(h.inicio); const end=horaAMinutos(h.fin); const base=horaAMinutos(timeSlots[0][0]); top=((start-base)/60)*slotHeight+28; height=((end-start)/60)*slotHeight-6; } const dayCols=area.querySelectorAll('.day-column'); const col=dayCols[dayIndex]; const block=document.createElement('div'); block.className='course-block'; block.style.background=color; block.style.position='absolute'; block.style.left='8px'; block.style.right='8px'; block.style.top=top+'px'; block.style.height=Math.max(20,height)+'px'; block.style.zIndex=10; block.style.display='flex'; block.style.flexDirection='column'; block.style.justifyContent='center'; block.style.padding='6px'; block.style.boxSizing='border-box'; const shortName=g.cursoNombre.length>28? g.cursoNombre.slice(0,25)+'...' : g.cursoNombre; block.innerHTML=`<div style="font-weight:700;font-size:12px">${shortName}</div><div style="font-size:11px;font-weight:600">${g.grupo} • ${h.inicio}-${h.fin}</div>`; col.appendChild(block); });
  });
  legend.querySelectorAll('div').forEach(d=> d.style.background='#ffffff');
}

document.getElementById('btn-export-json').addEventListener('click', ()=>{ const data={cursosHorarios,cursosSeleccionados}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='horarios_config.json'; a.click(); URL.revokeObjectURL(url); });
document.getElementById('btn-import-json').addEventListener('click', ()=> document.getElementById('import-json').click());
document.getElementById('import-json').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const txt=await f.text(); try{ const data=JSON.parse(txt); cursosHorarios = data.cursosHorarios || {}; cursosSeleccionados = data.cursosSeleccionados || {}; renderConfigCursos(); updateAddedCredits(); alert('Configuración importada.'); }catch(err){ alert('JSON inválido.'); } });

document.getElementById('btn-upload-plan').addEventListener('click', ()=> document.getElementById('file-plan').click());
document.getElementById('file-plan').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const txt=await f.text(); try{ const data=JSON.parse(txt); // unwrap possible wrapper
  const upper = Object.keys(data||{}).map(k=>k.toUpperCase()); const idx = upper.indexOf('PLAN_ESTUDIOS'); if(idx!==-1) data = data[Object.keys(data)[idx]]; planEstudios = data; document.getElementById('plan-upload').classList.add('hidden'); renderSemestres(); alert('Plan cargado.'); }catch(err){ alert('Plan inválido.'); } });

document.getElementById('btn-export-png').addEventListener('click', async ()=>{ const area=document.getElementById('schedule-canvas'); if(area.innerHTML.trim()===''){ alert('No hay horario para exportar.'); return; } const canvas=await html2canvas(area,{useCORS:true,backgroundColor:'#ffffff',scale:1.5}); const url=canvas.toDataURL('image/png'); const a=document.createElement('a'); a.href=url; a.download='horario.png'; a.click(); });
document.getElementById('btn-export-pdf').addEventListener('click', async ()=>{ const selIdx=combinacionesVars.map((v,i)=> v? i:-1).filter(i=>i!==-1); if(selIdx.length===0){ alert('Selecciona al menos una combinación para exportar.'); return; } const { jsPDF } = window.jspdf; const pdf = new jsPDF('landscape','pt','a4'); for(let k=0;k<selIdx.length;k++){ drawHorario(combinacionesGeneradas[selIdx[k]]); await new Promise(r=>setTimeout(r,250)); const canvas=await html2canvas(document.getElementById('schedule-canvas'),{useCORS:true,backgroundColor:'#ffffff',scale:1.5}); const img=canvas.toDataURL('image/png'); const imgProps=pdf.getImageProperties(img); const pdfW=pdf.internal.pageSize.getWidth(); const pdfH=(imgProps.height*pdfW)/imgProps.width; if(k>0) pdf.addPage(); pdf.addImage(img,'PNG',0,0,pdfW,pdfH); } pdf.save('horarios.pdf'); });

// Credit counters
function updateAddedCredits(){ const sum = Object.values(cursosSeleccionados).reduce((s,c)=> s + (parseInt(c.creditos||0,10)||0), 0); document.getElementById('credits-added').textContent = sum; }
function updateCheckedCredits(){ const checked = Array.from(document.querySelectorAll('.curso-checkbox:checked')); const sum = checked.reduce((s,el)=> s + (parseInt(el.dataset.creditos||'0',10)||0), 0); document.getElementById('credits-checked').textContent = sum; }

// Initialize
loadPlan();
