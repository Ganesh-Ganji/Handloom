/* ============================================================
   EDIT THIS BLOCK — everything else works on its own.
   ============================================================

   ── HOW TO CONNECT YOUR GOOGLE SHEET + DRIVE PHOTOS ──────────

   STEP 1 — Create your Google Sheet with these column headers
   (column order does not matter, names must match exactly):

     Name        | The design name shown on the card
     Photo       | Google Drive photo link(s) — see Step 2
     Price       | e.g.  4200  or  ₹4,200  or  "₹650 per metre"
     Description | Short description (optional)
     Available   | Leave blank or "Yes" if available; type "No" or
                 |   "Sold out" to show the Sold Out badge
     Fabric      | (optional extra column — any label you like)
     Colours     | (optional extra column)
     Length      | (optional extra column)
     ...          Any extra columns appear in the detail panel

   STEP 2 — Add Google Drive photo links to the Photo column
     a) Upload your photo to Google Drive
     b) Right-click → "Get link" → set access to "Anyone with the link"
     c) Copy the link — it looks like:
           https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view
     d) Paste the whole link into the Photo column
        To show MULTIPLE photos for one design, separate links with a comma:
           https://drive.google.com/file/d/.../view, https://drive.google.com/file/d/.../view

   STEP 3 — Publish your Sheet as CSV
     a) In Google Sheets → File → Share → Publish to web
     b) Choose the sheet tab (e.g. "Sheet1") and format "Comma-separated values (.csv)"
     c) Click Publish → copy the URL shown
     d) Paste that URL into sheetCsvUrl below

   ============================================================ */
const CONFIG = {
  shopName: "Your Handloom Name",
  tagline: "Ikkat woven on the loom, one design at a time.",

  // Paste your Google Sheet CSV URL here (from Step 3 above).
  // Leave "" to see sample designs instead.
  sheetCsvUrl: "",

  whatsapp: "91XXXXXXXXXX",          // country code + number, digits only
  phone: "+91 XXXXX XXXXX",
  address: "Shop address, Town, State",
  mapsUrl: "",                        // optional: a Google Maps link; blank = search by address
  currency: "₹"                       // shown before plain-number prices
};

/* ─── Decorative ikkat pattern — CSS only, no canvas ──────── */
(function initPattern() {
  // Replace canvas elements with lightweight CSS div patterns
  // No JS drawing, no blur filters, no DPR scaling = near-zero memory

  const heroBg = document.getElementById("heroBg");
  if (heroBg) {
    const div = document.createElement("div");
    div.className = "hero-pattern";
    heroBg.replaceWith(div);
  }

  const motifCanvas = document.getElementById("motifCanvas");
  if (motifCanvas) {
    const div = document.createElement("div");
    div.className = "motif-pattern";
    motifCanvas.replaceWith(div);
  }
})();

/* ─── helpers ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

function parseCSV(text){
  const rows=[]; let row=[], cell="", inQ=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(inQ){
      if(ch==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else inQ=false; }
      else cell+=ch;
    } else if(ch==='"') inQ=true;
    else if(ch===','){ row.push(cell); cell=""; }
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n') i++;
      row.push(cell); cell=""; rows.push(row); row=[];
    } else cell+=ch;
  }
  if(cell!==""||row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r=>r.some(v=>v.trim()));
}

function driveId(s){
  s=(s||"").trim();
  const m = s.match(/\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/) || s.match(/^([\w-]{20,})$/);
  return m ? m[1] : null;
}
function driveUrls(id,w){
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`,
    `https://lh3.googleusercontent.com/d/${id}=w${w}`
  ];
}
function showPrice(p){
  p=(p||"").trim();
  if(!p) return "";
  return /^[\d.,\s]+$/.test(p) ? CONFIG.currency + p : p;
}
function isSoldOut(v){ return /^(no|sold|sold out|unavailable|0)$/i.test((v||"").trim()); }

function setImg(img, urls){
  let i=0;
  img.onerror=()=>{ if(i<urls.length-1){ img.src=urls[++i]; } else { img.onerror=null; img.style.visibility="hidden"; } };
  img.src=urls[0];
}

/* ─── data ────────────────────────────────────────────────── */
const RESERVED = ["name","photo","photos","price","description","available"];

function rowsToItems(rows){
  const head = rows[0].map(h=>h.trim());
  const key = head.map(h=>h.toLowerCase());
  return rows.slice(1).map((r,idx)=>{
    const get = k => { const j=key.indexOf(k); return j>=0 ? (r[j]||"").trim() : ""; };
    const photoCell = get("photo") || get("photos");
    const photos = photoCell.split(/[\n,;]+/).map(driveId).filter(Boolean).map(id=>({thumb:driveUrls(id,600), full:driveUrls(id,1200)}));
    const details=[];
    head.forEach((h,j)=>{ if(!RESERVED.includes(key[j]) && (r[j]||"").trim()) details.push([h,(r[j]||"").trim()]); });
    return {
      id: idx, name: get("name") || "Untitled design", photos,
      price: showPrice(get("price")), description: get("description"),
      soldOut: isSoldOut(get("available")), details
    };
  }).filter(it=>it.photos.length || it.name!=="Untitled design");
}

/* ─── sample designs ──────────────────────────────────────── */
// Tiny inline SVGs as placeholders — no canvas, no memory spike
function sampleSvg(bg, accent, accent2) {
  accent2 = accent2 || accent;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='375'>
    <defs>
      <pattern id='warp' width='6' height='6' patternUnits='userSpaceOnUse'>
        <rect width='6' height='6' fill='none'/>
        <rect width='1' height='6' fill='${accent}' opacity='0.12'/>
      </pattern>
      <pattern id='weft' width='6' height='6' patternUnits='userSpaceOnUse'>
        <rect width='6' height='1' fill='${accent}' opacity='0.09'/>
      </pattern>
    </defs>
    <rect width='300' height='375' fill='${bg}'/>
    <rect width='300' height='375' fill='url(#warp)'/>
    <rect width='300' height='375' fill='url(#weft)'/>
    <!-- pallu band -->
    <rect x='0' y='300' width='300' height='75' fill='${accent}' opacity='0.22'/>
    <line x1='0' y1='300' x2='300' y2='300' stroke='${accent}' stroke-width='1.5' opacity='0.5'/>
    <!-- central motif row -->
    <g opacity='0.7'>
      <polygon points='75,110 100,150 75,190 50,150' fill='${accent}' opacity='0.55'/>
      <polygon points='150,90 185,150 150,210 115,150' fill='${accent2}' opacity='0.65'/>
      <polygon points='225,110 250,150 225,190 200,150' fill='${accent}' opacity='0.55'/>
    </g>
    <!-- inner motifs -->
    <polygon points='150,112 173,150 150,188 127,150' fill='${bg}' opacity='0.4'/>
    <!-- border lines -->
    <rect x='14' y='14' width='272' height='347' fill='none' stroke='${accent}' stroke-width='1' opacity='0.25' rx='2'/>
    <rect x='22' y='22' width='256' height='331' fill='none' stroke='${accent}' stroke-width='0.5' opacity='0.15' rx='1'/>
    <!-- zari dots in pallu -->
    <circle cx='75' cy='332' r='4' fill='${accent}' opacity='0.7'/>
    <circle cx='150' cy='332' r='4' fill='${accent}' opacity='0.7'/>
    <circle cx='225' cy='332' r='4' fill='${accent}' opacity='0.7'/>
    <circle cx='75' cy='356' r='3' fill='${accent2}' opacity='0.5'/>
    <circle cx='150' cy='356' r='3' fill='${accent2}' opacity='0.5'/>
    <circle cx='225' cy='356' r='3' fill='${accent2}' opacity='0.5'/>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function sampleItems(){
  const mk=(id,name,price,desc,det,bg,accent,sold)=>({id,name,price,description:desc,soldOut:!!sold,details:det,
    photos:[{thumb:[sampleSvg(bg,accent)],full:[sampleSvg(bg,accent)]}]});
  return [
    mk(0,"Indigo Diamond Saree","₹4,200","Classic double-ikat weave in deep indigo with kora motifs. Replace these with your real designs by connecting your Google Sheet.",[["Fabric","Cotton"],["Colours","Indigo, kora, madder"],["Length","5.5 m + blouse"]],"#1B2A57","#C89B4A","#E3C48C"),
    mk(1,"Madder Red Dupatta","₹1,650","Vibrant natural-dye red with geometric buti pattern.",[["Fabric","Cotton"],["Colours","Madder red, black"],["Length","2.4 m"]],"#6d2020","#E2BC78","#f5c8a0"),
    mk(2,"Black & Gold Fabric","₹650 per metre","Rich black base with zari-effect gold warp stripes.",[["Fabric","Cotton"],["Width","44 in"],["MOQ","5 metres"]],"#1a1410","#C89B4A","#E3C48C"),
    mk(3,"Moss Green Saree","₹5,100","Earthy moss-green with temple border pallu in kora.",[["Fabric","Cotton silk"],["Colours","Moss green, kora"],["Length","5.5 m + blouse"]],"#283a22","#C89B4A","#b5c99a",true),
    mk(4,"Rust Ikat Yardage","₹780 per metre","Traditional rust-and-cream chevron ikat for dress fabric.",[["Fabric","Cotton"],["Width","44 in"]],"#7a2e18","#E3C48C","#f5c8a0"),
    mk(5,"Navy & Gold Saree","₹6,200","Deep navy with zari borders and classic diamond motifs.",[["Fabric","Silk cotton"],["Colours","Navy, gold"],["Length","5.5 m + blouse"]],"#1a2644","#C89B4A","#E3C48C")
  ];
}

/* ─── search ──────────────────────────────────────────────── */
let query = "";

function filtered(){
  if(!query) return ITEMS;
  const q = query.toLowerCase();
  return ITEMS.filter(it => {
    const haystack = [it.name, it.description, it.price,
      ...it.details.map(([k,v]) => k + " " + v)].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function applySearch(){
  const items = filtered();
  renderGrid(items);
  const nr = $("noResults");
  if(items.length === 0 && query){ $("noResultsQ").textContent = query; nr.hidden = false; }
  else { nr.hidden = true; }
  $("count").textContent = items.length + (items.length === 1 ? " design" : " designs");
}

/* ─── render ──────────────────────────────────────────────── */
let ITEMS = [];

function renderGrid(items){
  items = items || ITEMS;
  const grid = $("grid");
  grid.innerHTML = "";
  items.forEach(it => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "item"; btn.type = "button";
    btn.setAttribute("aria-label", "View details: " + it.name);

    const thumb = document.createElement("div"); thumb.className = "thumb";
    if(it.photos.length){
      const img = document.createElement("img");
      img.alt = it.name; img.loading = "lazy"; img.decoding = "async";
      setImg(img, it.photos[0].thumb);
      thumb.appendChild(img);
    }
    if(it.soldOut){
      const b = document.createElement("span"); b.className = "badge"; b.textContent = "Sold out";
      thumb.appendChild(b);
    }
    const ov = document.createElement("div"); ov.className = "thumb-overlay";
    ov.innerHTML = `<span>View details ↗</span>`;
    thumb.appendChild(ov);

    const cap = document.createElement("div"); cap.className = "cap";
    const n = document.createElement("span"); n.className = "cap-name"; n.textContent = it.name; cap.appendChild(n);
    if(it.price){ const p = document.createElement("span"); p.className = "cap-price"; p.textContent = it.price; cap.appendChild(p); }

    btn.append(thumb, cap);
    btn.addEventListener("click", () => openDesign(it));
    li.appendChild(btn); grid.appendChild(li);
  });
}

/* ─── dialog ──────────────────────────────────────────────── */
const dlg = $("dlg");
function waLink(text){ return `https://wa.me/${CONFIG.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(text)}`; }

function openDesign(it){
  $("dlgTitle").textContent = it.name;
  $("dlgPrice").textContent = it.price; $("dlgPrice").hidden = !it.price;
  $("dlgDesc").textContent = it.description; $("dlgDesc").hidden = !it.description;

  const dl = $("dlgDetails"); dl.innerHTML = "";
  it.details.forEach(([k,v])=>{
    const row = document.createElement("div");
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    row.append(dt, dd); dl.appendChild(row);
  });
  dl.hidden = !it.details.length;

  const main = $("dlgMain"), thumbs = $("dlgThumbs"); thumbs.innerHTML = "";
  main.alt = it.name;
  const show = (ph, btnEl) => {
    main.style.visibility = "visible"; setImg(main, ph.full);
    thumbs.querySelectorAll("button").forEach(b => b.removeAttribute("aria-current"));
    if(btnEl) btnEl.setAttribute("aria-current", "true");
  };
  if(it.photos.length){
    it.photos.forEach((ph, i) => {
      if(it.photos.length > 1){
        const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Photo " + (i+1));
        const im = document.createElement("img"); im.alt = ""; setImg(im, ph.thumb); b.appendChild(im);
        b.addEventListener("click", () => show(ph, b)); thumbs.appendChild(b);
        if(i === 0) b.setAttribute("aria-current", "true");
      }
    });
    show(it.photos[0], thumbs.querySelector("button"));
  }
  thumbs.hidden = it.photos.length < 2;
  $("dlgWa").href = waLink(`Hello, I'm interested in "${it.name}"${it.price ? " (" + it.price + ")" : ""}. Is it available?`);
  dlg.showModal();
}
$("dlgClose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", e => { if(e.target === dlg) dlg.close(); });

/* ─── search events ───────────────────────────────────────── */
$("searchInput").addEventListener("input", e => {
  query = e.target.value.trim();
  $("clearBtn").classList.toggle("visible", query.length > 0);
  applySearch();
});
$("clearBtn").addEventListener("click", () => {
  query = ""; $("searchInput").value = "";
  $("clearBtn").classList.remove("visible");
  applySearch();
});

/* ─── boot ────────────────────────────────────────────────── */
function applyConfig(){
  const sn = CONFIG.shopName;
  document.title = sn + " — Handloom Ikkat";
  $("shopName").innerHTML = sn.replace(/\s+(\S+)\s*$/, (_, last) => `<br><em>${last}</em>`) || sn;
  $("navBrand").textContent = sn;
  $("tagline").textContent = CONFIG.tagline;
  $("footName").textContent = sn;
  $("year").textContent = new Date().getFullYear();
  $("phoneLink").textContent = CONFIG.phone;
  $("phoneLink").href = "tel:" + CONFIG.phone.replace(/[^\d+]/g, "");
  $("address").textContent = CONFIG.address;
  $("mapLink").href = CONFIG.mapsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.address);
  $("waGeneral").href = waLink("Hello, I'd like to know more about your handloom designs.");
}

async function boot(){
  applyConfig();
  const state = $("state");
  if(!CONFIG.sheetCsvUrl){
    ITEMS = sampleItems();
    $("notice").innerHTML = `<p class="notice">
      <strong>Sample designs shown.</strong>
      To display your real collection:<br>
      1. Create a Google Sheet with columns: <em>Name, Photo, Price, Description, Available</em><br>
      2. In the <strong>Photo</strong> column, paste Google Drive share links
         (set each file to <em>"Anyone with the link"</em> can view).<br>
      3. Publish the Sheet as CSV (File → Share → Publish to web → CSV)
         and paste that URL into <code>sheetCsvUrl</code> in app.js.
    </p>`;
    state.hidden = true; applySearch(); return;
  }
  try{
    const res = await fetch(CONFIG.sheetCsvUrl, { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const rows = parseCSV(await res.text());
    if(rows.length < 2){ state.textContent = "No designs yet. Add rows to your Google Sheet and refresh."; return; }
    ITEMS = rowsToItems(rows);
    state.hidden = true; applySearch();
  } catch(err){
    console.error(err);
    state.innerHTML = "Couldn't load designs. Make sure your Google Sheet is <strong>published as CSV</strong> (File → Share → Publish to web → CSV) and the URL in CONFIG is correct, then refresh.";
  }
}
boot();
