// Lionfish Logger — vanilla JS PWA (offline-first via localStorage)
// Author: ChatGPT (MIT)
// Data keys
const LS_ENTRIES = "lionfish_entries_v1";
const LS_SETTINGS = "lionfish_settings_v1";
const LS_QUEUE = "lionfish_queue_v1";

const SIZE_BINS = ["0-10","10-15","15-20","20-25","25-30",">=30"]; // cm
const DEPTH_BANDS = ["0-10","10-20","20-30","30-40","40-60",">60"];
const METHODS = ["scuba","freedive","tech"];

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function loadJSON(key, def){ try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function nowLocalInput(){ const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16); }

// State
let entries = loadJSON(LS_ENTRIES, []);
let queue = loadJSON(LS_QUEUE, []);
let settings = loadJSON(LS_SETTINGS, {
  club: "", team: "", webhookUrl: "",
  autoGps: false, sites: ["Acropora","La Petite Sirène","Trois‑Rivières"]
});

// UI refs
const views = {
  log: $("#view-log"),
  dash: $("#view-dash"),
  export: $("#view-export"),
  settings: $("#view-settings"),
};
$("#tab-log").onclick = () => selectTab("log");
$("#tab-dash").onclick = () => selectTab("dash");
$("#tab-export").onclick = () => selectTab("export");
$("#tab-settings").onclick = () => selectTab("settings");

function selectTab(name){
  Object.values(views).forEach(v => v.classList.add("hidden"));
  Object.keys(views).forEach(k => $(`#tab-${k}`).setAttribute("aria-selected", k===name ? "true" : "false"));
  views[name].classList.remove("hidden");
  if(name==="dash") refreshDash();
}

function refreshSiteList(){
  const dl = $("#siteList"); dl.innerHTML = "";
  (settings.sites || []).forEach(s => {
    const opt = document.createElement("option"); opt.value = s; dl.appendChild(opt);
  });
}
refreshSiteList();

// Form fields
const site = $("#site");
const timestamp = $("#timestamp");
const method = $("#method");
const depthBand = $("#depthBand");
const divers = $("#divers");
const bottomTimeMin = $("#bottomTimeMin");
const latlon = $("#latlon");
const notes = $("#notes");
const gpsBtn = $("#gpsBtn");
const sizeCounters = $("#sizeCounters");
const totalEl = $("#total");
const cpueEl = $("#cpue");
const saveBtn = $("#saveBtn");
const resetBtn = $("#resetBtn");
const entriesDiv = $("#entries");

// Settings fields
const club = $("#club");
const team = $("#team");
const webhookUrl = $("#webhookUrl");
const autoGps = $("#autoGps");
const sites = $("#sites");

function initForm(){
  timestamp.value = nowLocalInput();
  method.value = METHODS.includes(settings.defaultMethod) ? settings.defaultMethod : "scuba";
  depthBand.value = "10-20";
  divers.value = 2;
  bottomTimeMin.value = 60;
  notes.value = "";
  latlon.value = "";
  sizeCounts = Object.fromEntries(SIZE_BINS.map(k => [k, 0]));
  renderSizeCounters();
  updateStats();
}
let sizeCounts = {};
initForm();

function renderSizeCounters(){
  sizeCounters.innerHTML = "";
  SIZE_BINS.forEach(bin => {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div class="grid-2" style="align-items:center;">
        <strong>${bin} cm</strong>
        <div class="counter">
          <button type="button" class="secondary" data-d="-1" data-bin="${bin}">−</button>
          <span style="width:2.4rem; text-align:center;"><b id="count-${bin}">0</b></span>
          <button type="button" data-d="+1" data-bin="${bin}">+</button>
        </div>
      </div>`;
    sizeCounters.appendChild(wrap);
  });
  sizeCounters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if(!btn) return;
    const bin = btn.dataset.bin;
    const d = Number(btn.dataset.d);
    sizeCounts[bin] = Math.max(0, (sizeCounts[bin]||0) + d);
    $("#count-"+bin).textContent = sizeCounts[bin];
    updateStats();
  });
}

function computeTotal(){ return Object.values(sizeCounts).reduce((a,b)=>a+(b||0),0); }
function computeCPUE(){
  const total = computeTotal();
  const hours = Math.max(0.0001, (Number(divers.value||0) * Number(bottomTimeMin.value||0))/60);
  return total / hours;
}
function updateStats(){
  totalEl.textContent = computeTotal();
  cpueEl.textContent = computeCPUE().toFixed(2);
}

gpsBtn.onclick = () => {
  if(!navigator.geolocation) { alert("Géolocalisation non disponible"); return; }
  navigator.geolocation.getCurrentPosition(
    pos => { latlon.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`; },
    err => alert("GPS: " + err.message),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
};

resetBtn.onclick = () => initForm();

saveBtn.onclick = () => {
  if(!site.value) { alert("Veuillez renseigner le site."); return; }
  const e = {
    id: uid(),
    timestamp: new Date(timestamp.value).toISOString(),
    site: site.value,
    lat: latlon.value ? Number(latlon.value.split(",")[0]) : "",
    lon: latlon.value ? Number(latlon.value.split(",")[1]) : "",
    method: method.value,
    depthBand: depthBand.value,
    diverCount: Number(divers.value||0),
    bottomTimeMin: Number(bottomTimeMin.value||0),
    sizeCounts: {...sizeCounts},
    notes: notes.value,
    club: settings.club || "",
    team: settings.team || "",
    cpue: computeCPUE()
  };
  entries = [e, ...entries];
  saveJSON(LS_ENTRIES, entries);
  renderEntries();
  initForm();
};

function renderEntries(){
  if(entries.length===0){ entriesDiv.innerHTML = `<p class="muted">Aucune saisie pour l’instant.</p>`; return; }
  const last = entries.slice(0, 10);
  entriesDiv.innerHTML = last.map(e => `
    <div class="card">
      <div class="grid-2" style="align-items:center;">
        <div><strong>${e.site}</strong><br><span class="small muted">${new Date(e.timestamp).toLocaleString()}</span></div>
        <div class="small muted" style="text-align:right;">${e.method}, ${e.depthBand} m<br>${Object.values(e.sizeCounts).reduce((a,b)=>a+b,0)} ind — CPUE ${Number(e.cpue).toFixed(2)}</div>
      </div>
      ${ (e.lat && e.lon) ? `<div class="small muted">lat ${Number(e.lat).toFixed(5)}, lon ${Number(e.lon).toFixed(5)}</div>` : "" }
      ${ e.notes ? `<div class="small">${e.notes}</div>` : "" }
      <div class="grid-2">
        <button class="secondary small" data-del="${e.id}">Supprimer</button>
        <button class="small" data-share="${e.id}">Partager</button>
      </div>
    </div>
  `).join("");

  entriesDiv.onclick = async (ev) => {
    const btn = ev.target.closest("button");
    if(!btn) return;
    const delId = btn.dataset.del;
    const shareId = btn.dataset.share;
    if(delId){
      entries = entries.filter(x => x.id !== delId);
      saveJSON(LS_ENTRIES, entries);
      renderEntries();
    } else if(shareId){
      const e = entries.find(x => x.id === shareId);
      if(!e) return;
      const text = `Lionfish — ${e.site} — ${new Date(e.timestamp).toLocaleString()} — total ${Object.values(e.sizeCounts).reduce((a,b)=>a+b,0)} — CPUE ${Number(e.cpue).toFixed(2)}`;
      if(navigator.share){
        try { await navigator.share({ title: "Lionfish log", text }); } catch {}
      } else {
        navigator.clipboard?.writeText(text);
        alert("Résumé copié dans le presse‑papier.");
      }
    }
  }
}
renderEntries();

// Dashboard
function refreshDash(){
  const today = new Date().toISOString().slice(0,10);
  const todayTotal = entries
    .filter(e => e.timestamp.slice(0,10)===today)
    .reduce((acc,e)=> acc + Object.values(e.sizeCounts).reduce((a,b)=>a+b,0), 0);
  $("#kpiToday").textContent = todayTotal;
  $("#kpiCount").textContent = entries.length;
  const meanCpue = entries.length ? (entries.reduce((a,e)=>a+Number(e.cpue||0),0)/entries.length) : 0;
  $("#kpiCpue").textContent = meanCpue.toFixed(2);
  // bars
  const current = sizeCounts; // from current form
  const bars = SIZE_BINS.map(bin => {
    const v = Number(current[bin]||0); const pct = Math.min(100, v*10); // arbitrary scale
    return `<div class="small">${bin} cm</div><div class="bar"><span style="width:${pct}%"></span></div>`;
  }).join("");
  $("#sizeBars").innerHTML = bars;
}

// Export / Sync
function rowsFromEntries(list){
  return list.map(e => ({
    id: e.id, timestamp: e.timestamp, site: e.site, lat: e.lat||"", lon: e.lon||"",
    method: e.method, depth_band: e.depthBand, divers: e.diverCount, bottom_time_min: e.bottomTimeMin,
    count_0_10: e.sizeCounts["0-10"]||0, count_10_15: e.sizeCounts["10-15"]||0, count_15_20: e.sizeCounts["15-20"]||0,
    count_20_25: e.sizeCounts["20-25"]||0, count_25_30: e.sizeCounts["25-30"]||0, count_ge_30: e.sizeCounts[">=30"]||0,
    total: Object.values(e.sizeCounts).reduce((a,b)=>a+b,0), cpue: Number(e.cpue||0).toFixed(2),
    club: e.club||"", team: e.team||"", notes: e.notes||""
  }));
}
function toCSV(rows){
  if(!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = s => {
    s = (s===undefined||s===null) ? "" : String(s);
    return (s.includes(",")||s.includes("\n")||s.includes("\"")) ? ('\"'+s.replace(/\"/g,'\"\"')+'\"') : s;
  }
  const lines = [headers.join(",")];
  rows.forEach(r => lines.push(headers.map(h => esc(r[h])).join(",")));
  return lines.join("\n");
}
$("#exportCsv").onclick = async () => {
  const csv = toCSV(rowsFromEntries(entries));
  const blob = new Blob([csv], {type:"text/csv"});
  const name = `lionfish_logs_${new Date().toISOString().slice(0,10)}.csv`;
  if(navigator.share && (navigator).canShare?.({ files: [new File([blob], name, {type:"text/csv"})] })){
    try { await navigator.share({ title: "Lionfish logs", files: [new File([blob], name, {type:"text/csv"})] }); return; } catch{}
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
$("#exportJson").onclick = async () => {
  const blob = new Blob([JSON.stringify({ settings, entries }, null, 2)], {type:"application/json"});
  const name = `lionfish_logs_${new Date().toISOString().slice(0,10)}.json`;
  if(navigator.share && (navigator).canShare?.({ files: [new File([blob], name, {type:"application/json"})] })){
    try { await navigator.share({ title: "Lionfish logs", files: [new File([blob], name, {type:"application/json"})] }); return; } catch{}
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
$("#syncBtn").onclick = async () => {
  const url = (settings.webhookUrl||"").trim();
  if(!url){ alert("Configurez l’URL de synchronisation dans Paramètres."); return; }
  const payload = { entries: rowsFromEntries(entries), meta: { club: settings.club, team: settings.team, ts: new Date().toISOString() } };
  try{
    const res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error(res.statusText);
    alert("Synchronisation effectuée ✅");
  }catch(e){
    const q = loadJSON(LS_QUEUE, []);
    q.push({ when: new Date().toISOString(), payload });
    saveJSON(LS_QUEUE, q);
    $("#queueHint").textContent = `File d’attente hors‑ligne : ${q.length} paquet(s) en attente.`;
    alert("Hors‑ligne ou erreur : les données sont mises en file d’attente.");
  }
};

// Settings init
club.value = settings.club||"";
team.value = settings.team||"";
webhookUrl.value = settings.webhookUrl||"";
autoGps.value = String(!!settings.autoGps);
sites.value = (settings.sites||[]).join("\n");

club.oninput = () => { settings.club = club.value; saveJSON(LS_SETTINGS, settings); };
team.oninput = () => { settings.team = team.value; saveJSON(LS_SETTINGS, settings); };
webhookUrl.oninput = () => { settings.webhookUrl = webhookUrl.value; saveJSON(LS_SETTINGS, settings); };
autoGps.onchange = () => { settings.autoGps = (autoGps.value === "true"); saveJSON(LS_SETTINGS, settings); };
sites.oninput = () => {
  settings.sites = sites.value.split(/\n+/).map(s => s.trim()).filter(Boolean);
  saveJSON(LS_SETTINGS, settings); refreshSiteList();
};

// Auto-GPS if enabled
if(settings.autoGps){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos => { 
      $("#latlon").value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
    }, ()=>{}, { enableHighAccuracy: true, maximumAge: 10000 });
  }
}

// Service worker
if("serviceWorker" in navigator){
  window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js"); });
}

// Offline badge
window.addEventListener("online", ()=> { $("#offlineBadge").textContent = "Online"; });
window.addEventListener("offline", ()=> { $("#offlineBadge").textContent = "Offline"; });

