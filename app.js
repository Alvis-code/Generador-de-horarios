// app.js - port of schedule logic from Python to JS (keeps same overlap rule)
// Data structures:
// planEstudios (loaded from plan_estudios.json)
// cursosHorarios: { codigo: { A: { grupo:'A', horarios:[{día, inicio, fin}], tipo:'' }, ... }, ... }
// cursosSeleccionados: { codigo: {nombre, creditos} }

let planEstudios = {};
let cursosHorarios = {};
let cursosSeleccionados = {};
let combinacionesGeneradas = [];
let combinacionesVars = []; // booleans

const dias = ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"];

// Util
function horaAMinutos(horaStr){
  const [h,m] = horaStr.split(":").map(x=>parseInt(x,10));
  return h*60 + m;
}

function horariosSeCruzan(horarios1, horarios2){
  for(const h1 of horarios1){
    for(const h2 of horarios2){
      if(h1.día === h2.día){
        const h1_inicio = horaAMinutos(h1.inicio);
        const h1_fin = horaAMinutos(h1.fin);
        const h2_inicio = horaAMinutos(h2.inicio);
        const h2_fin = horaAMinutos(h2.fin);
        if(!(h1_fin <= h2_inicio || h2_fin <= h1_inicio)){
          return true;
        }
      }
    }
  }
  return false;
}

// Cartesian product
function cartesian(arrays){
  if(arrays.length===0) return [[]];
  const [first, ...rest] = arrays;
  const restProd = cartesian(rest);
  const result = [];
  for(const f of first){
    for(const r of restProd){
      result.push([f, ...r]);
    }
  }
  return result;
}

// Combinaciones válidas
function combinacionesValidas(){
  const cursos_grupos = [];
  const codigos = Object.keys(cursosSeleccionados);
  for(const codigo of codigos){
    if(cursosHorarios[codigo]){
      // take groups as array
      const gruposObj = cursosHorarios[codigo];
      const grupos = Object.values(gruposObj).filter(g => g && g.horarios && g.horarios.length>0);
      cursos_grupos.push(grupos);
    }
  }
  if(cursos_grupos.length === 0) return [];
  const allCombs = cartesian(cursos_grupos);
  const valid = [];
  for(const comb of allCombs){
    let ok = true;
    for(let i=0;i<comb.length;i++){
      for(let j=i+1;j<comb.length;j++){
        if(horariosSeCruzan(comb[i].horarios, comb[j].horarios)){
          ok = false; break;
        }
      }
      if(!ok) break;
    }
    if(ok) valid.push(comb);
  }
  return valid;
}

// Load plan
async function loadPlan(){
  const res = await fetch('plan_estudios.json');
  planEstudios = await res.json();
  renderSemestres();
}

// Render semestres and cursos
function renderSemestres(){
  const container = document.getElementById('semestres-container');
  container.innerHTML = '';
  Object.keys(planEstudios).forEach(sem => {
    const id = 'sem_'+sem.replace(/\s+/g,'_');
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2';
    div.innerHTML = `<input type="checkbox" id="${id}" data-sem="${sem}" class="sem-checkbox"><label for="${id}" class="text-sm ml-1">${sem}</label>`;
    container.appendChild(div);
  });
  document.querySelectorAll('.sem-checkbox').forEach(cb=>{
    cb.addEventListener('change', renderCursosDisponibles);
  });
  renderCursosDisponibles();
}

function renderCursosDisponibles(){
  const container = document.getElementById('cursos-container');
  container.innerHTML = '';
  // get selected semestres
  const selected = [];
  document.querySelectorAll('.sem-checkbox:checked').forEach(cb=>{
    selected.push(cb.dataset.sem);
  });
  const table = document.createElement('div');
  table.className = 'space-y-1';
  selected.forEach(sem=>{
    const cursos = planEstudios[sem];
    Object.keys(cursos).forEach(cod=>{
      const c = cursos[cod];
      const id = 'curso_' + cod;
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-1';
      row.innerHTML = `<label class="flex items-center gap-2"><input type="checkbox" data-codigo="${cod}" data-nombre="${c.nombre}" class="curso-checkbox"> <span class="text-sm">${c.nombre} <span class="text-xs text-gray-400">(${cod})</span></span></label>`;
      table.appendChild(row);
    });
  });
  container.appendChild(table);
}

document.getElementById('btn-add-cursos').addEventListener('click', ()=>{
  document.querySelectorAll('.curso-checkbox:checked').forEach(cb=>{
    const codigo = cb.dataset.codigo;
    const nombre = cb.dataset.nombre;
    cursosSeleccionados[codigo] = {nombre, creditos: 0};
    if(!cursosHorarios[codigo]) cursosHorarios[codigo] = {}; // empty groups
  });
  renderConfigCursos();
});

document.getElementById('btn-load-sample').addEventListener('click', ()=>{
  // load a small sample for quick testing: take first semester's first two courses
  const sems = Object.keys(planEstudios);
  if(sems.length>0){
    const cursos = planEstudios[sems[0]];
    let i=0;
    for(const cod of Object.keys(cursos)){
      cursosSeleccionados[cod] = {nombre: cursos[cod].nombre, creditos: cursos[cod].creditos};
      cursosHorarios[cod] = {};
      i++; if(i>=3) break;
    }
    renderConfigCursos();
  }
});

// Render configuration UI for selected courses
function renderConfigCursos(){
  const container = document.getElementById('config-cursos');
  container.innerHTML = '';
  Object.keys(cursosSeleccionados).forEach(codigo=>{
    const curso = cursosSeleccionados[codigo];
    const card = document.createElement('div');
    card.className = 'p-3 border rounded-md bg-gray-50';
    card.innerHTML = `<div class="flex justify-between items-center">
      <div><strong>${curso.nombre}</strong> <div class="text-xs text-gray-500">${codigo}</div></div>
      <div class="flex gap-2">
        <button class="btn-ghost text-xs" data-action="add-group" data-codigo="${codigo}">+ Grupo</button>
        <button class="btn-ghost text-xs" data-action="remove-curso" data-codigo="${codigo}">Eliminar</button>
      </div>
    </div>
    <div class="groups mt-2" id="groups_${codigo}"></div>`;
    container.appendChild(card);

    // ensure exists
    if(!cursosHorarios[codigo]) cursosHorarios[codigo] = {};
    renderGroups(codigo);
  });

  // attach actions
  document.querySelectorAll('[data-action="add-group"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const codigo = btn.dataset.codigo;
      addGroup(codigo);
      renderGroups(codigo);
    });
  });
  document.querySelectorAll('[data-action="remove-curso"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const codigo = btn.dataset.codigo;
      delete cursosSeleccionados[codigo];
      delete cursosHorarios[codigo];
      renderConfigCursos();
    });
  });
}

// Add group (A..F)
function addGroup(codigo){
  const existing = Object.keys(cursosHorarios[codigo]||{});
  const letters = ['A','B','C','D','E','F'];
  const available = letters.find(l => !existing.includes(l));
  if(!available){
    alert('Máximo 6 grupos alcanzado (A-F).');
    return;
  }
  cursosHorarios[codigo][available] = {grupo: available, horarios: [], tipo: ''};
}

// render groups UI for a course
function renderGroups(codigo){
  const container = document.getElementById('groups_'+codigo);
  container.innerHTML = '';
  const groups = cursosHorarios[codigo] || {};
  Object.keys(groups).forEach(gk=>{
    const g = groups[gk];
    const gDiv = document.createElement('div');
    gDiv.className = 'p-2 bg-white rounded-md border mb-2';
    gDiv.innerHTML = `<div class="flex justify-between items-center">
      <div class="text-sm font-semibold">Grupo ${g.grupo} <span class="text-xs text-gray-400">(${g.tipo||'—'})</span></div>
      <div class="flex gap-2">
        <button class="btn-ghost btn-add-horario text-xs" data-codigo="${codigo}" data-grupo="${g.grupo}">+ Horario</button>
        <button class="btn-ghost btn-remove-grupo text-xs" data-codigo="${codigo}" data-grupo="${g.grupo}">Eliminar</button>
      </div>
    </div>
    <div class="horarios-list mt-2" id="horarios_${codigo}_${g.grupo}"></div>`;
    container.appendChild(gDiv);

    // render horarios
    renderHorariosList(codigo, g.grupo);

    // attach buttons
    gDiv.querySelector('.btn-add-horario').addEventListener('click', ()=>{
      addHorario(codigo, g.grupo);
      renderHorariosList(codigo, g.grupo);
    });
    gDiv.querySelector('.btn-remove-grupo').addEventListener('click', ()=>{
      delete cursosHorarios[codigo][g.grupo];
      renderGroups(codigo);
    });
  });
}

function renderHorariosList(codigo, grupo){
  const list = document.getElementById(`horarios_${codigo}_${grupo}`);
  list.innerHTML = '';
  const g = cursosHorarios[codigo][grupo];
  g.horarios.forEach((hidx, idx)=>{
    // each horario
  });
  // show existing horarios
  g.horarios.forEach((h, idx)=>{
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-1';
    row.innerHTML = `<select class="input-dia text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">
      ${dias.map(d=>`<option value="${d}" ${d===h.día?'selected':''}>${d}</option>`).join('')}
    </select>
    <input type="time" class="input-inicio text-xs" value="${h.inicio}" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">
    <input type="time" class="input-fin text-xs" value="${h.fin}" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">
    <button class="btn-ghost btn-remove-h text-xs" data-codigo="${codigo}" data-grupo="${grupo}" data-idx="${idx}">Eliminar</button>`;
    list.appendChild(row);
  });
  // add a button to add if none
  if(g.horarios.length===0){
    const hint = document.createElement('div');
    hint.className = 'text-xs text-gray-400';
    hint.textContent = 'No hay horarios. Pulsa + Horario para añadir uno.';
    list.appendChild(hint);
  }

  // attach remove handlers and inputs change
  list.querySelectorAll('.btn-remove-h').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const codigo = btn.dataset.codigo, grupo = btn.dataset.grupo, idx = parseInt(btn.dataset.idx,10);
      cursosHorarios[codigo][grupo].horarios.splice(idx,1);
      renderHorariosList(codigo, grupo);
    });
  });
  list.querySelectorAll('.input-inicio, .input-fin, .input-dia').forEach(inp=>{
    inp.addEventListener('change', (e)=>{
      const codigo = inp.dataset.codigo, grupo = inp.dataset.grupo, idx = parseInt(inp.dataset.idx,10);
      const h = cursosHorarios[codigo][grupo].horarios[idx];
      h.inicio = (e.target.classList.contains('input-inicio')) ? e.target.value : h.inicio;
      h.fin = (e.target.classList.contains('input-fin')) ? e.target.value : h.fin;
      h.día = (e.target.classList.contains('input-dia')) ? e.target.value : h.día;
    });
  });
}

// addHorario: push a default horario
function addHorario(codigo, grupo){
  if(!cursosHorarios[codigo][grupo]) return;
  cursosHorarios[codigo][grupo].horarios.push({
    "día": "LUNES",
    "inicio": "08:00",
    "fin": "10:00"
  });
}

// Generate combinations and render list
document.getElementById('btn-generar').addEventListener('click', ()=>{
  const valid = combinacionesValidas();
  combinacionesGeneradas = valid;
  combinacionesVars = new Array(valid.length).fill(false);
  const info = document.getElementById('combinaciones-info');
  info.textContent = `Se encontraron ${valid.length} combinaciones válidas.`;
  const list = document.getElementById('combinaciones-list');
  list.innerHTML = '';
  valid.forEach((comb, idx)=>{
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 bg-white rounded';
    div.innerHTML = `<label class="flex items-center gap-2"><input type="checkbox" data-idx="${idx}" class="comb-cb"> Combinación ${idx+1} <span class="text-xs text-gray-400">(${comb.length} grupos)</span></label>
      <div class="flex gap-2"><button class="btn-ghost btn-ver" data-idx="${idx}">Ver</button></div>`;
    list.appendChild(div);
  });
  // attach handlers
  document.querySelectorAll('.comb-cb').forEach(cb=>{
    cb.addEventListener('change', (e)=>{
      const i = parseInt(cb.dataset.idx,10);
      combinacionesVars[i] = cb.checked;
    });
  });
  document.querySelectorAll('.btn-ver').forEach(b=>{
    b.addEventListener('click', ()=> previewCombinacion(parseInt(b.dataset.idx,10)));
  });
});

// Preview a single combination (draw schedule)
function previewCombinacion(idx){
  if(idx<0 || idx>=combinacionesGeneradas.length) return;
  const comb = combinacionesGeneradas[idx];
  drawHorario(comb);
}

// Preview selected combinations (draw first selected)
document.getElementById('btn-preview-selected').addEventListener('click', ()=>{
  const i = combinacionesVars.findIndex(v=>v);
  if(i===-1){ alert('Selecciona al menos una combinación.'); return;}  
  previewCombinacion(i);
});

// Draw schedule grid
function drawHorario(combinacion){
  const area = document.getElementById('schedule-canvas');
  area.innerHTML = '';
  // create header with days
  const grid = document.createElement('div');
  grid.className = 'schedule-grid';
  // times column
  const timesCol = document.createElement('div');
  timesCol.className = 'p-2';
  timesCol.innerHTML = '<div class="text-xs font-semibold">Horas</div>';
  // hours from 7 to 22 step 1
  for(let h=7; h<=22; h++){
    const cell = document.createElement('div');
    cell.className = 'time-cell';
    cell.textContent = `${h.toString().padStart(2,'0')}:00`;
    timesCol.appendChild(cell);
  }
  grid.appendChild(timesCol);
  // day columns
  dias.forEach(d=>{
    const col = document.createElement('div');
    col.className = 'day-column';
    const title = document.createElement('div');
    title.className = 'text-sm font-semibold mb-2';
    title.textContent = d;
    col.appendChild(title);
    // background slots
    for(let h=7; h<=22; h++){
      const cell = document.createElement('div');
      cell.className = 'time-cell';
      col.appendChild(cell);
    }
    grid.appendChild(col);
  });
  area.appendChild(grid);

  // place course blocks
  // assign colors per course
  const palette = ['#0b3d91','#1fb6a6','#f59e0b','#ef4444','#7c3aed','#06b6d4'];
  const courseToColor = {};
  combinacion.forEach((g, idx)=>{
    const cursoNombre = g.cursoNombre || ('Grupo '+g.grupo);
    courseToColor[cursoNombre] = palette[idx % palette.length];
  });
  // Place blocks: compute position by time
  combinacion.forEach((g, idx)=>{
    g.horarios.forEach(h=>{
      const dayIndex = dias.indexOf(h["día"]);
      if(dayIndex===-1) return;
      const start = horaAMinutos(h.inicio);
      const end = horaAMinutos(h.fin);
      const topHours = (start - 7*60)/60; // number of hours from 7:00
      const durationHours = (end - start)/60;
      // create block element positioned relative inside day column
      const dayCols = area.querySelectorAll('.day-column');
      const col = dayCols[dayIndex];
      const block = document.createElement('div');
      const color = palette[idx % palette.length];
      block.className = 'course-block';
      block.style.background = color;
      block.style.marginTop = (topHours*30)+'px';
      block.style.height = (durationHours*30 - 6)+'px';
      block.style.position = 'relative';
      block.textContent = `${g.grupo} ${h.inicio}-${h.fin}`;
      block.title = `${g.grupo} ${h.inicio}-${h.fin}`;
      // append
      col.appendChild(block);
    });
  });
}

// Export functions
document.getElementById('btn-export-json').addEventListener('click', ()=>{
  const data = {cursosHorarios, cursosSeleccionados};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'horarios_config.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-import-json').addEventListener('click', ()=>{
  document.getElementById('import-json').click();
});
document.getElementById('import-json').addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const txt = await f.text();
  try{
    const data = JSON.parse(txt);
    cursosHorarios = data.cursosHorarios || {};
    cursosSeleccionados = data.cursosSeleccionados || {};
    renderConfigCursos();
    alert('Configuración importada.');
  }catch(err){ alert('JSON inválido.'); }
});

// Export image of preview (first combination or current canvas)
document.getElementById('btn-export-png').addEventListener('click', async ()=>{
  const area = document.getElementById('schedule-canvas');
  if(area.innerHTML.trim()===''){ alert('No hay horario para exportar.'); return; }
  const canvas = await html2canvas(area);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'horario.png'; a.click();
});

// Export PDF of selected combinations
document.getElementById('btn-export-pdf').addEventListener('click', async ()=>{
  const selectedIdx = combinacionesVars.map((v,i)=> v? i : -1).filter(i=>i!==-1);
  if(selectedIdx.length===0){ alert('Selecciona al menos una combinación para exportar.'); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('landscape','pt','a4');
  for(let k=0;k<selectedIdx.length;k++){
    const comb = combinacionesGeneradas[selectedIdx[k]];
    // draw to preview then render
    drawHorario(comb);
    await new Promise(r=>setTimeout(r,150)); // allow DOM update
    const canvas = await html2canvas(document.getElementById('schedule-canvas'), {scale:1.5});
    const img = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(img);
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (imgProps.height * pdfW) / imgProps.width;
    if(k>0) pdf.addPage();
    pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH);
  }
  pdf.save('horarios.pdf');
});

// Initialize
loadPlan();
