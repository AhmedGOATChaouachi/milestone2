/* ─────────────────────────────────────────────────────────────────────────
   Second-Degree Connection Explorer — enhanced app.js v2
   COM-480 Data Visualization, EPFL
   ───────────────────────────────────────────────────────────────────────── */

const data = window.MILESTONE_DATA;

const palette = {
  root:         "#1aa89d",
  first:        "#6b8ec6",
  second:       "#d67b52",
  secondStrong: "#c47c2e",
  amber:        "#c47c2e",
  muted:        "rgba(220, 228, 255, 0.14)",
  bridge:       "#7a70d8",
  grid:         "rgba(220, 228, 255, 0.1)",
  ink:          "#132033",
  violet:       "#7a70d8",
  outline:      "rgba(220, 228, 255, 0.18)",
  ring:         "rgba(220, 228, 255, 0.1)",
};

// ─── Tweaks defaults (must be valid JSON between the markers) ──────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chargeStrength": 220,
  "nodeSizeScale": 1,
  "showRingLabels": true,
  "dimUnrelated": true,
  "accentTheme": "default"
}/*EDITMODE-END*/;

let tweaks = { ...TWEAK_DEFAULTS };

const state = {
  selectedCaseId:    String(data.prototype.cases[0].user.id),
  selectedCandidateId: null,
  focusedBridgeId:   null,
  filterMode:        "any",
  topN:              12,
  filters: {
    same_country:   false,
    same_age_group: false,
  },
};

const gfx = {
  svg:          null,
  simulation:   null,
  linkSel:      null,
  nodeSel:      null,
  rootLabelSel: null,
};

let graphController = null;
const tooltip = document.getElementById("tooltip");

// ─── Boot ──────────────────────────────────────────────────────────────────
boot();

function boot() {
  if ("scrollRestoration" in window.history)
    window.history.scrollRestoration = "manual";

  // Restore state from localStorage
  try {
    const saved = localStorage.getItem("sdce_state");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.selectedCaseId)    state.selectedCaseId    = s.selectedCaseId;
      if (s.filterMode)        state.filterMode        = s.filterMode;
      if (s.topN)              state.topN              = s.topN;
      if (s.filters)           Object.assign(state.filters, s.filters);
    }
    const savedTweaks = localStorage.getItem("sdce_tweaks");
    if (savedTweaks) Object.assign(tweaks, JSON.parse(savedTweaks));
  } catch (_) {}

  document.querySelector("#caveat-text").textContent = data.caveats[1] || data.caveats[0] || "";

  renderOverviewStrip();
  renderSummaryChips();
  renderInsights();
  renderQualityGrid();
  renderCaseSelector();
  renderFilterMode();
  renderFilters();
  bindRange();
  bindNav();
  bindStoryMode();
  bindTweaks();
  applyTheme(tweaks.accentTheme);
  render();

  scrollToHashTarget();
  window.addEventListener("load",       scrollToHashTarget);
  window.addEventListener("pageshow",   scrollToHashTarget);
  window.addEventListener("hashchange", scrollToHashTarget);
}

function persistState() {
  try {
    localStorage.setItem("sdce_state", JSON.stringify({
      selectedCaseId: state.selectedCaseId,
      filterMode:     state.filterMode,
      topN:           state.topN,
      filters:        state.filters,
    }));
  } catch (_) {}
}

// ─── Nav ──────────────────────────────────────────────────────────────────
function bindNav() {
  const nav = document.getElementById("site-nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 32);
  }, { passive: true });
}

function scrollToHashTarget() {
  const hash = window.location.hash;
  if (!hash) return;
  const el = document.querySelector(hash);
  if (el) {
    setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 74;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 60);
  }
}

// ─── Overview strip with animated counters ─────────────────────────────────
function renderOverviewStrip() {
  const container = document.querySelector("#overview-strip");
  const items = [
    ["users",               "users"],
    ["connected_users",     "connected users"],
    ["unique_friendships",  "friendships"],
    ["median_degree",       "median degree"],
    ["median_second_degree","median 2nd-degree reach"],
  ];

  container.replaceChildren();
  items.forEach(([key, label], i) => {
    const raw  = data.overview[key];
    const card = document.createElement("article");
    card.className = "hero-stat";
    card.style.animationDelay = `${i * 80}ms`;
    card.innerHTML = `<strong><span class="stat-num" data-target="${raw}">0</span></strong><span>${label}</span>`;
    container.appendChild(card);
  });

  // Animate numbers counting up after a short delay
  setTimeout(() => animateCounters(), 200);
}

function animateCounters() {
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = Number(el.dataset.target);
    const dur    = 1100;
    const start  = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCompact(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatCompact(target);
    }
    requestAnimationFrame(tick);
    el.closest(".hero-stat").classList.add("animated");
  });
}

function renderSummaryChips() {
  const container = document.querySelector("#summary-chips");
  const chips = [
    `${percent(data.summaries.friend_country_match_rate_mean)} avg friend-country match`,
    `${percent(data.summaries.friend_age_group_match_rate_mean)} avg friend-age match`,
    `${formatCompact(data.summaries.second_degree["90%"])} second-degree reach at P90`,
    `${formatCompact(data.summaries.shared_both_second_degree["50%"])} median "both traits" overlap`,
  ];
  container.replaceChildren();
  chips.forEach((text, i) => {
    const chip = document.createElement("span");
    chip.className = `chip${i % 2 === 1 ? " alt" : i === 2 ? " blue" : ""}`;
    chip.textContent = text;
    container.appendChild(chip);
  });
}

function renderInsights() {
  const container = document.querySelector("#insight-list");
  container.replaceChildren();
  const titles = ["Read the reach", "Look for shared traits", "Watch the scale"];
  data.insights.forEach((insight, i) => {
    const card = document.createElement("article");
    card.className = "insight-card";
    card.innerHTML = `
      <span class="insight-index">${String(i + 1).padStart(2, "0")}</span>
      <strong>${titles[i] || `Lens ${i + 1}`}</strong>
      <p>${insight}</p>`;
    container.appendChild(card);
  });
}

function renderQualityGrid() {
  const container = document.querySelector("#quality-grid");
  const items = [
    [data.quality_checks.missing_age,          "users with missing age"],
    [data.quality_checks.missing_country,      "missing country"],
    [data.quality_checks.missing_gender,       "missing gender"],
    [data.quality_checks.users_with_degree_zero, "isolated users"],
  ];
  container.replaceChildren();
  items.forEach(([value, label]) => {
    const card = document.createElement("article");
    card.className = "quality-stat";
    card.innerHTML = `<strong>${formatCompact(value)}</strong><p>${label}</p>`;
    container.appendChild(card);
  });
}

// ─── Controls ──────────────────────────────────────────────────────────────
function renderCaseSelector() {
  const select = document.querySelector("#case-select");
  select.replaceChildren();
  data.prototype.cases.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.user.id);
    option.textContent = `User ${item.user.id} · ${item.user.country || "unknown"} · ${item.user.age_group || "unknown"}`;
    select.appendChild(option);
  });
  select.value = state.selectedCaseId;
  select.addEventListener("change", (e) => {
    state.selectedCaseId      = e.target.value;
    state.selectedCandidateId = null;
    state.focusedBridgeId     = null;
    gfx.svg = null;
    persistState();
    render();
  });
}

function renderFilterMode() {
  const container = document.querySelector("#filter-mode");
  container.replaceChildren();
  [["any","Match any checked trait"], ["all","Match all checked traits"]].forEach(([value, label]) => {
    const wrapper = document.createElement("label");
    wrapper.className = state.filterMode === value ? "active" : "";
    wrapper.innerHTML = `<input type="radio" name="filter_mode" value="${value}">${label}`;
    wrapper.querySelector("input").checked = state.filterMode === value;
    wrapper.addEventListener("click", () => {
      state.filterMode = value;
      renderFilterMode();
      persistState();
      render();
    });
    container.appendChild(wrapper);
  });
}

function renderFilters() {
  const filterList = document.querySelector("#filter-list");
  filterList.replaceChildren();
  data.prototype.supported_filters.forEach((filter) => {
    const row = document.createElement("label");
    row.className = "filter-item";
    row.innerHTML = `
      <input type="checkbox" data-filter="${filter.id}">
      <div class="filter-copy">
        <strong>${filter.label}</strong>
        <p>Filter the two-hop neighborhood by this trait.</p>
      </div>`;
    const input = row.querySelector("input");
    input.checked = state.filters[filter.id];
    input.addEventListener("change", (e) => {
      state.filters[filter.id]  = e.target.checked;
      state.selectedCandidateId = null;
      state.focusedBridgeId     = null;
      persistState();
      render();
    });
    filterList.appendChild(row);
  });
  data.prototype.planned_filters.forEach((filter) => {
    const row = document.createElement("label");
    row.className = "filter-item disabled";
    row.innerHTML = `
      <input type="checkbox" disabled>
      <div class="filter-copy">
        <strong>${filter.label}</strong>
        <p>${filter.note}</p>
      </div>`;
    filterList.appendChild(row);
  });
}

function bindRange() {
  const input  = document.querySelector("#topn-range");
  const output = document.querySelector("#topn-value");
  input.value  = String(state.topN);
  output.textContent = String(state.topN);
  input.addEventListener("input", (e) => {
    state.topN              = Number(e.target.value);
    output.textContent      = String(state.topN);
    state.selectedCandidateId = null;
    state.focusedBridgeId   = null;
    persistState();
    render();
  });
}

// ─── Story mode ────────────────────────────────────────────────────────────
function bindStoryMode() {
  const overlay   = document.getElementById("story-overlay");
  const openBtn   = document.getElementById("story-mode-btn");
  const closeBtn  = document.getElementById("story-close");
  const prevBtn   = document.getElementById("story-prev");
  const nextBtn   = document.getElementById("story-next");
  const titleEl   = document.getElementById("story-panel-title");
  const descEl    = document.getElementById("story-desc");
  const counterEl = document.getElementById("story-counter");
  const dotsEl    = document.getElementById("story-step-dots");
  const visualEl  = document.getElementById("story-visual");

  const steps = buildStorySteps();
  let cur = 0;

  function showStep(idx) {
    cur = Math.max(0, Math.min(idx, steps.length - 1));
    const s = steps[cur];
    titleEl.textContent     = s.title;
    descEl.textContent      = s.desc;
    counterEl.textContent   = `${cur + 1} / ${steps.length}`;
    prevBtn.disabled        = cur === 0;
    nextBtn.textContent     = cur === steps.length - 1 ? "Done ✓" : "Next →";
    nextBtn.className       = `story-nav-btn primary`;

    // Render visual
    visualEl.replaceChildren();
    if (s.visual) s.visual(visualEl);

    // Dots
    dotsEl.replaceChildren();
    steps.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = `story-dot${i === cur ? " active" : ""}`;
      dot.addEventListener("click", () => showStep(i));
      dotsEl.appendChild(dot);
    });
  }

  openBtn.addEventListener("click", () => {
    overlay.style.display = "flex";
    showStep(0);
  });
  closeBtn.addEventListener("click", () => { overlay.style.display = "none"; });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.style.display = "none"; });
  prevBtn.addEventListener("click", () => showStep(cur - 1));
  nextBtn.addEventListener("click", () => {
    if (cur === steps.length - 1) {
      overlay.style.display = "none";
      document.getElementById("explorer").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      showStep(cur + 1);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.style.display !== "none") {
      if (e.key === "ArrowRight") showStep(cur + 1);
      if (e.key === "ArrowLeft")  showStep(cur - 1);
      if (e.key === "Escape")     overlay.style.display = "none";
    }
  });
}

function buildStorySteps() {
  const d  = data;
  const c0 = d.prototype.cases[0];

  return [
    {
      title: "75,969 users · one graph",
      desc:  `The Last.fm UK friendship graph contains ${formatCompact(d.overview.users)} users and ${formatCompact(d.overview.unique_friendships)} friendships. The median user has ${d.overview.median_degree} direct friends — but ${formatCompact(d.overview.median_second_degree)} people are reachable in just one extra hop.`,
      visual: (el) => drawStoryMiniGraph(el, "overview"),
    },
    {
      title: "The ego at the center",
      desc:  `We call the selected person the "ego". This explorer lets you pick from 5 exemplar ego users, each with a different country, age group, and degree. The ego sits at the center of the force-directed graph.`,
      visual: (el) => drawStoryMiniGraph(el, "ego"),
    },
    {
      title: "Bridge friends — the first ring",
      desc:  `The ego's direct friends form the first ring. We call them "bridge friends" because they bridge the ego toward the wider second-degree neighborhood. User ${c0.user.id} has ${c0.summary.direct_friends} bridge friends.`,
      visual: (el) => drawStoryMiniGraph(el, "bridges"),
    },
    {
      title: "Candidates — the second ring",
      desc:  `Friends-of-friends who aren't already direct friends are "candidates." User ${c0.user.id} can reach ${formatCompact(c0.summary.second_degree_count)} candidates in two hops. We rank them by score: mutual friends + shared traits (country, age group).`,
      visual: (el) => drawStoryMiniGraph(el, "candidates"),
    },
    {
      title: "Filter & explore",
      desc:  `Use the filter controls to narrow candidates by shared country or age group. Click a bridge friend to spotlight which candidates they open. Click a candidate to lock it in the detail panel. Drag nodes to rearrange. Now try it!`,
      visual: (el) => drawStoryMiniGraph(el, "full"),
    },
  ];
}

function drawStoryMiniGraph(container, mode) {
  const W = 560, H = 200;
  const cx = W / 2, cy = H / 2;
  const R1 = 58, R2 = 110;
  const svg = createSvg(W, H);

  const c0 = data.prototype.cases[0];
  const bridges  = c0.direct_friends.slice(0, 6);
  const cands    = c0.candidates.slice(0, 8);

  const showBridges   = ["bridges","candidates","full"].includes(mode);
  const showCandidates = ["candidates","full"].includes(mode);
  const showRings      = ["bridges","candidates","full"].includes(mode);

  // rings
  if (showRings) {
    svg.appendChild(createRing(cx, cy, R1));
    svg.appendChild(createRing(cx, cy, R2));
  }

  // candidate nodes
  if (showCandidates) {
    cands.forEach((node, i) => {
      const angle = (Math.PI * 2 * i) / cands.length - Math.PI / 2;
      const x = cx + Math.cos(angle) * R2;
      const y = cy + Math.sin(angle) * R2;
      // link to bridge
      const bridgeIdx = bridges.findIndex(b => node.mutual_friend_ids.includes(b.id));
      if (bridgeIdx >= 0) {
        const bAngle = (Math.PI * 2 * bridgeIdx) / bridges.length - Math.PI / 2;
        svg.appendChild(createLine(
          cx + Math.cos(bAngle) * R1, cy + Math.sin(bAngle) * R1,
          x, y, palette.muted, 1.2, 0.5
        ));
      }
      svg.appendChild(createCircle(x, y, node.shared_attribute_count >= 2 ? 8 : 7,
        node.shared_attribute_count >= 2 ? palette.secondStrong : palette.second));
    });
  }

  // bridge nodes
  if (showBridges) {
    bridges.forEach((node, i) => {
      const angle = (Math.PI * 2 * i) / bridges.length - Math.PI / 2;
      const x = cx + Math.cos(angle) * R1;
      const y = cy + Math.sin(angle) * R1;
      svg.appendChild(createLine(cx, cy, x, y, palette.muted, 1.4, 0.55));
      svg.appendChild(createCircle(x, y, 8, palette.first));
    });
  }

  // ego
  svg.appendChild(createCircle(cx, cy, mode === "ego" ? 24 : 18, palette.root));
  if (mode === "overview") {
    svg.appendChild(createText("75,969 users", cx, cy - 30, "annotation", "middle"));
    svg.appendChild(createText("389,639 friendships", cx, cy + 44, "annotation", "middle"));
  }
  if (mode === "ego") {
    svg.appendChild(createText("ego", cx, cy + 38, "node-label", "middle"));
  }

  container.appendChild(svg);
}

// ─── Tweaks panel ──────────────────────────────────────────────────────────
function bindTweaks() {
  const panel    = document.getElementById("tweaks-panel");
  const closeBtn = document.getElementById("tweaks-close");

  // listen for activate/deactivate from host
  window.addEventListener("message", (e) => {
    if (e.data?.type === "__activate_edit_mode")   { panel.style.display = "block"; }
    if (e.data?.type === "__deactivate_edit_mode")  { panel.style.display = "none";  }
  });
  window.parent.postMessage({ type: "__edit_mode_available" }, "*");

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
    window.parent.postMessage({ type: "__deactivate_edit_mode" }, "*");
  });

  // Charge
  const chargeIn = document.getElementById("tweak-charge");
  chargeIn.value = String(tweaks.chargeStrength);
  chargeIn.addEventListener("input", (e) => {
    tweaks.chargeStrength = Number(e.target.value);
    saveTweaks();
    if (gfx.simulation) {
      gfx.simulation.force("charge", d3.forceManyBody().strength((d) =>
        d.group === 0 ? -tweaks.chargeStrength * 5 :
        d.group === 1 ? -tweaks.chargeStrength : -tweaks.chargeStrength * 0.4
      ));
      gfx.simulation.alpha(0.3).restart();
    }
  });

  // Node size
  const sizeIn = document.getElementById("tweak-nodesize");
  sizeIn.value = String(tweaks.nodeSizeScale);
  sizeIn.addEventListener("input", (e) => {
    tweaks.nodeSizeScale = Number(e.target.value);
    saveTweaks();
    if (gfx.nodeSel) {
      gfx.nodeSel.attr("r", (d) => {
        const base = d.group === 0 ? 30 : d.group === 1 ? 13 : 12;
        return base * tweaks.nodeSizeScale;
      });
    }
  });

  // Ring labels
  const ringIn = document.getElementById("tweak-ringlabels");
  ringIn.checked = tweaks.showRingLabels;
  ringIn.addEventListener("change", (e) => {
    tweaks.showRingLabels = e.target.checked;
    saveTweaks();
    if (gfx.svg) {
      gfx.svg.selectAll(".ring-label").style("display", tweaks.showRingLabels ? null : "none");
    }
  });

  // Dim links
  const dimIn = document.getElementById("tweak-dimlinks");
  dimIn.checked = tweaks.dimUnrelated;
  dimIn.addEventListener("change", (e) => {
    tweaks.dimUnrelated = e.target.checked;
    saveTweaks();
  });

  // Themes
  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === tweaks.accentTheme);
    btn.addEventListener("click", () => {
      tweaks.accentTheme = btn.dataset.theme;
      document.querySelectorAll(".theme-dot").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyTheme(tweaks.accentTheme);
      saveTweaks();
    });
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "default" ? "" : theme;
}

function saveTweaks() {
  try { localStorage.setItem("sdce_tweaks", JSON.stringify(tweaks)); } catch (_) {}
  window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { ...tweaks } }, "*");
}

// ─── Hero visual ───────────────────────────────────────────────────────────
function renderHeroVisual(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#hero-visual");
  if (!container) return;

  const W = 520, H = 250;
  const cx = W / 2, cy = H / 2 + 4;
  const R1 = 60, R2 = 108;

  const focusCandidate = selectedCandidate || visibleCandidates[0] || selectedCase.candidates[0] || null;
  const focusMutualIds = new Set(focusCandidate ? focusCandidate.mutual_friend_ids : []);
  const firstNodes = [...selectedCase.direct_friends]
    .sort((a, b) => Number(focusMutualIds.has(b.id)) - Number(focusMutualIds.has(a.id)) || b.bridge_count - a.bridge_count)
    .slice(0, 6);
  const focusBridgeId = firstNodes.find((n) => focusMutualIds.has(n.id))?.id ?? null;
  const secondNodes = [
    ...(focusCandidate ? [focusCandidate] : []),
    ...visibleCandidates.filter((c) => !focusCandidate || c.id !== focusCandidate.id).slice(0, 7),
  ].slice(0, 8);

  const positions = new Map();
  positions.set(selectedCase.user.id, { x: cx, y: cy });
  firstNodes.forEach((node, i) => {
    const a = (Math.PI * 2 * i) / Math.max(firstNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: cx + Math.cos(a) * R1, y: cy + Math.sin(a) * R1 });
  });
  secondNodes.forEach((node, i) => {
    const a = (Math.PI * 2 * i) / Math.max(secondNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: cx + Math.cos(a) * R2, y: cy + Math.sin(a) * R2 });
  });

  const svg = createSvg(W, H);

  // Dashed rings
  svg.appendChild(createRing(cx, cy, R1));
  svg.appendChild(createRing(cx, cy, R2));

  // Ring labels: stacked in top-left corner, away from nodes
  makeSvgCornerLabel(svg, "1 hop",  12, 18, palette.first);
  makeSvgCornerLabel(svg, "2 hops", 12, 38, palette.second);

  // Links: ego → bridges
  firstNodes.forEach((node) => {
    const src = positions.get(selectedCase.user.id);
    const tgt = positions.get(node.id);
    const hi  = focusMutualIds.has(node.id);
    svg.appendChild(createLine(src.x, src.y, tgt.x, tgt.y,
      hi ? palette.bridge : palette.muted, hi ? 2.4 : 1.2, hi ? 0.9 : 0.46));
  });

  // Links + nodes: candidates
  secondNodes.forEach((node, i) => {
    const tgt = positions.get(node.id);
    const linked = firstNodes.filter((f) => node.mutual_friend_ids.includes(f.id));
    linked.slice(0, node === focusCandidate ? 4 : 1).forEach((f) => {
      const src = positions.get(f.id);
      const hi  = focusCandidate && node.id === focusCandidate.id && focusMutualIds.has(f.id);
      svg.appendChild(createLine(src.x, src.y, tgt.x, tgt.y,
        hi ? palette.bridge : palette.muted, hi ? 2.6 : 1.1, hi ? 0.9 : 0.34));
    });
    const isFocus = i === 0 && focusCandidate;
    svg.appendChild(createCircle(tgt.x, tgt.y, isFocus ? 10 : 7,
      isFocus ? palette.secondStrong : palette.second));
    if (isFocus) svg.appendChild(createHalo(tgt.x, tgt.y, 15));
  });

  // Bridge nodes
  firstNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const hi  = focusBridgeId === node.id;
    svg.appendChild(createCircle(pos.x, pos.y, hi ? 10 : 7,
      hi ? palette.bridge : palette.first));
  });

  // Ego node — always on top
  svg.appendChild(createCircle(cx, cy, 16, palette.root));

  container.replaceChildren(svg);

  // HTML legend below — clean single row, no wrapping
  const leg = document.createElement("div");
  leg.style.cssText = "display:flex;align-items:center;gap:16px;padding:10px 12px 2px;border-top:1px solid rgba(255,255,255,0.06);margin-top:8px;";
  [
    [palette.root,         "Ego"],
    [palette.first,        "Bridge friend"],
    [palette.bridge,       "Active bridge"],
    [palette.secondStrong, "Top candidate"],
    [palette.second,       "Other candidates"],
  ].forEach(([color, label]) => {
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;";
    const dot = document.createElement("span");
    dot.style.cssText = `width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;`;
    const txt = document.createElement("span");
    txt.style.cssText = "font-size:0.72rem;color:rgba(220,228,255,0.65);line-height:1;font-family:'DM Sans',sans-serif;";
    txt.textContent = label;
    item.appendChild(dot);
    item.appendChild(txt);
    leg.appendChild(item);
  });
  container.appendChild(leg);
}

// ─── Render orchestration ──────────────────────────────────────────────────
function render() {
  const selectedCase       = getSelectedCase();
  const visibleCandidates  = getVisibleCandidates(selectedCase);
  const selectedCandidate  = getSelectedCandidate(visibleCandidates);

  renderHeroVisual(selectedCase, visibleCandidates, selectedCandidate);
  renderStageMetrics(selectedCase, visibleCandidates, selectedCandidate);
  renderStoryline(selectedCase, visibleCandidates, selectedCandidate);
  renderGraph(selectedCase, visibleCandidates, selectedCandidate);
  renderEgoCard(selectedCase);
  renderBridgeList(selectedCase, selectedCandidate);
  renderPathExplainer(selectedCase, selectedCandidate, visibleCandidates);
  renderCandidateDetail(selectedCase, selectedCandidate);
  renderCandidateList(visibleCandidates, selectedCandidate);
  renderAtlas(selectedCase, visibleCandidates, selectedCandidate);
}

function getSelectedCase() {
  return data.prototype.cases.find((item) => String(item.user.id) === state.selectedCaseId);
}

function getVisibleCandidates(selectedCase) {
  const activeFilters = Object.entries(state.filters).filter(([, v]) => v);
  let candidates = [...selectedCase.candidates];
  if (activeFilters.length) {
    candidates = candidates.filter((c) => {
      const results = activeFilters.map(([id]) => Boolean(c[id]));
      return state.filterMode === "all" ? results.every(Boolean) : results.some(Boolean);
    });
  }
  if (state.focusedBridgeId) {
    candidates = candidates.filter((c) =>
      c.mutual_friend_ids.includes(Number(state.focusedBridgeId))
    );
  }
  candidates.sort((a, b) => b.score - a.score || b.mutual_friends - a.mutual_friends || b.degree - a.degree);
  return candidates.slice(0, state.topN);
}

function getSelectedCandidate(visibleCandidates) {
  if (!visibleCandidates.length) { state.selectedCandidateId = null; return null; }
  const selected = visibleCandidates.find((c) => String(c.id) === String(state.selectedCandidateId));
  if (selected) return selected;
  state.selectedCandidateId = String(visibleCandidates[0].id);
  return visibleCandidates[0];
}

// ─── Ego card ──────────────────────────────────────────────────────────────
function renderEgoCard(selectedCase) {
  const container = document.querySelector("#ego-card");
  container.replaceChildren();
  const card = document.createElement("article");
  card.className = "ego-card-block";
  card.innerHTML = `
    <strong>User ${selectedCase.user.id}</strong>
    <p>${selectedCase.user.country || "unknown"} · ${selectedCase.user.age_group || "unknown"} · degree ${selectedCase.user.degree}</p>
    <div class="ego-meta">
      <span class="chip">direct ${selectedCase.summary.direct_friends}</span>
      <span class="chip blue">second ${formatCompact(selectedCase.summary.second_degree_count)}</span>
      <span class="chip alt">both traits ${selectedCase.summary.same_both_second_degree}</span>
    </div>`;
  container.appendChild(card);
}

// ─── Bridge list ───────────────────────────────────────────────────────────
function renderBridgeList(selectedCase, selectedCandidate) {
  const container = document.querySelector("#bridge-list");
  container.replaceChildren();
  const highlightedFriendIds = new Set(selectedCandidate ? selectedCandidate.mutual_friend_ids : []);
  const focusedBridgeId = state.focusedBridgeId ? Number(state.focusedBridgeId) : null;
  const bridgeItems = [...selectedCase.direct_friends]
    .sort((a, b) => b.bridge_count - a.bridge_count || b.degree - a.degree)
    .slice(0, 8);

  bridgeItems.forEach((friend) => {
    const item = document.createElement("article");
    item.className = `bridge-item${highlightedFriendIds.has(friend.id) || focusedBridgeId === friend.id ? " active" : ""}`;
    item.dataset.bridgeId = String(friend.id);
    item.innerHTML = `
      <button type="button">
        <strong>User ${friend.id}</strong>
        <p>${friend.country || "unknown"} · ${friend.age_group || "unknown"} · degree ${friend.degree}</p>
        <div class="bridge-meta">
          <span class="chip">${friend.bridge_count} visible bridges</span>
          ${focusedBridgeId === friend.id ? '<span class="chip alt">active focus</span>' : ""}
        </div>
      </button>`;
    const btn = item.querySelector("button");
    btn.addEventListener("mouseenter", () => graphController?.previewBridge(friend.id));
    btn.addEventListener("mouseleave", () => graphController?.clear());
    btn.addEventListener("click", () => {
      state.focusedBridgeId     = focusedBridgeId === friend.id ? null : String(friend.id);
      state.selectedCandidateId = null;
      render();
    });
    container.appendChild(item);
  });
}

// ─── Stage metrics ─────────────────────────────────────────────────────────
function renderStageMetrics(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#stage-metrics");
  container.replaceChildren();
  const activeFilters = Object.entries(state.filters)
    .filter(([, v]) => v)
    .map(([id]) => labelFromFilterId(id));

  const metrics = [
    { label: "direct friends",   value: formatCompact(selectedCase.summary.direct_friends) },
    { label: "two-hop pool",     value: formatCompact(selectedCase.summary.second_degree_count) },
    { label: "visible now",      value: formatCompact(visibleCandidates.length) },
    {
      label: "active focus",
      value: state.focusedBridgeId
        ? `bridge ${state.focusedBridgeId}`
        : activeFilters.length
          ? `${state.filterMode === "all" ? "all" : "any"}: ${activeFilters.join(" + ")}`
          : "open pool",
    },
  ];
  metrics.forEach((m) => {
    const card = document.createElement("article");
    card.className = "stage-stat";
    card.innerHTML = `<strong>${m.value}</strong><span>${m.label}</span>`;
    container.appendChild(card);
  });

  updateStageTitle(selectedCase, selectedCandidate, {
    mode: selectedCandidate ? "selected" : "none",
    candidate: selectedCandidate,
    bridgeId: state.focusedBridgeId ? Number(state.focusedBridgeId) : null,
    candidateIds: new Set(selectedCandidate ? [selectedCandidate.id] : []),
  });
}

// ─── Storyline ─────────────────────────────────────────────────────────────
function renderStoryline(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#storyline");
  container.replaceChildren();
  const activeFilters = Object.entries(state.filters)
    .filter(([, v]) => v)
    .map(([id]) => labelFromFilterId(id));
  const topBridge = [...selectedCase.direct_friends]
    .sort((a, b) => b.bridge_count - a.bridge_count || b.degree - a.degree)[0];

  const cards = [
    {
      step: "A",
      title: `User ${selectedCase.user.id}`,
      text: `${formatCompact(selectedCase.summary.direct_friends)} direct friends form the first ring.`,
    },
    {
      step: "B",
      title: topBridge ? `Bridge via User ${topBridge.id}` : "Bridge ring",
      text: `${formatCompact(selectedCase.summary.second_degree_count)} people reachable in two hops.`,
    },
    {
      step: "C",
      title: selectedCandidate ? `Candidate ${selectedCandidate.id}` : "Ranked candidates",
      text: activeFilters.length
        ? `${state.filterMode === "all" ? "All" : "Any"} of: ${activeFilters.join(", ")}. ${formatCompact(visibleCandidates.length)} visible.`
        : `${formatCompact(visibleCandidates.length)} candidates by bridge strength + shared traits.`,
    },
  ];
  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "story-card";
    card.innerHTML = `<span class="story-step">${item.step}</span><strong class="story-title">${item.title}</strong><p>${item.text}</p>`;
    container.appendChild(card);
  });
}

// ─── Hero visual ───────────────────────────────────────────────────────────
function renderHeroVisual(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#hero-visual");
  if (!container) return;

  const W = 520, H = 260;
  const cx = W / 2, cy = H / 2 + 4;
  const R1 = 60, R2 = 108;

  const focusCandidate = selectedCandidate || visibleCandidates[0] || selectedCase.candidates[0] || null;
  const focusMutualIds = new Set(focusCandidate ? focusCandidate.mutual_friend_ids : []);
  const firstNodes = [...selectedCase.direct_friends]
    .sort((a, b) => Number(focusMutualIds.has(b.id)) - Number(focusMutualIds.has(a.id)) || b.bridge_count - a.bridge_count)
    .slice(0, 6);
  const focusBridgeId = firstNodes.find((n) => focusMutualIds.has(n.id))?.id ?? null;
  const secondNodes = [
    ...(focusCandidate ? [focusCandidate] : []),
    ...visibleCandidates.filter((c) => !focusCandidate || c.id !== focusCandidate.id).slice(0, 7),
  ].slice(0, 8);

  const positions = new Map();
  positions.set(selectedCase.user.id, { x: cx, y: cy });
  firstNodes.forEach((node, i) => {
    const a = (Math.PI * 2 * i) / Math.max(firstNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: cx + Math.cos(a) * R1, y: cy + Math.sin(a) * R1 });
  });
  secondNodes.forEach((node, i) => {
    const a = (Math.PI * 2 * i) / Math.max(secondNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: cx + Math.cos(a) * R2, y: cy + Math.sin(a) * R2 });
  });

  const svg = createSvg(W, H);

  // Dashed rings
  svg.appendChild(createRing(cx, cy, R1));
  svg.appendChild(createRing(cx, cy, R2));

  // Ring labels in TOP-LEFT corner, stacked — far from any node
  const label1 = makeSvgCornerLabel(svg, "1 hop", 14, 18, palette.first);
  const label2 = makeSvgCornerLabel(svg, "2 hops", 14, 38, palette.second);

  // Links: ego → bridges
  firstNodes.forEach((node) => {
    const src = positions.get(selectedCase.user.id);
    const tgt = positions.get(node.id);
    const hi  = focusMutualIds.has(node.id);
    svg.appendChild(createLine(src.x, src.y, tgt.x, tgt.y,
      hi ? palette.bridge : palette.muted, hi ? 2.4 : 1.2, hi ? 0.9 : 0.46));
  });

  // Links & nodes: candidates
  secondNodes.forEach((node, i) => {
    const tgt = positions.get(node.id);
    const linked = firstNodes.filter((f) => node.mutual_friend_ids.includes(f.id));
    linked.slice(0, node === focusCandidate ? 4 : 1).forEach((f) => {
      const src = positions.get(f.id);
      const hi  = focusCandidate && node.id === focusCandidate.id && focusMutualIds.has(f.id);
      svg.appendChild(createLine(src.x, src.y, tgt.x, tgt.y,
        hi ? palette.bridge : palette.muted, hi ? 2.6 : 1.1, hi ? 0.9 : 0.34));
    });
    const isFocus = i === 0 && focusCandidate;
    svg.appendChild(createCircle(tgt.x, tgt.y, isFocus ? 10 : 7,
      isFocus ? palette.secondStrong : palette.second));
    if (isFocus) svg.appendChild(createHalo(tgt.x, tgt.y, 15));
  });

  // Bridge nodes
  firstNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const hi  = focusBridgeId === node.id;
    svg.appendChild(createCircle(pos.x, pos.y, hi ? 10 : 7,
      hi ? palette.bridge : palette.first));
  });

  // Ego node — always on top
  svg.appendChild(createCircle(cx, cy, 16, palette.root));

  container.replaceChildren(svg);

  // ── HTML legend below the SVG (no floating text on nodes) ──────────────
  const legend = document.createElement("div");
  legend.style.cssText = "display:flex;gap:14px;padding:8px 10px 0;flex-wrap:wrap;";
  [
    { color: palette.root,        label: "ego (you)" },
    { color: palette.first,       label: "bridge friend" },
    { color: palette.bridge,      label: "active bridge" },
    { color: palette.secondStrong,label: "top candidate" },
    { color: palette.second,      label: "other candidates" },
  ].forEach(({ color, label }) => {
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;gap:6px;font-size:0.75rem;color:rgba(220,228,255,0.65);";
    item.innerHTML = `<svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="${color}"/></svg>${label}`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

// ─── Main D3 force-directed graph ──────────────────────────────────────────
function renderGraph(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#graph");
  const W = 1080, H = 760;
  const cx = W / 2, cy = H / 2;
  const R1 = 172, R2 = 328;
  const focusedBridgeId = state.focusedBridgeId ? Number(state.focusedBridgeId) : null;

  const rootData    = selectedCase.user;
  const bridgeData  = [...selectedCase.direct_friends].sort((a, b) => b.bridge_count - a.bridge_count || a.id - b.id);
  const candidateData = visibleCandidates;

  const nodes = [
    { id: rootData.id, group: 0, data: rootData, x: cx, y: cy, fx: cx, fy: cy, animDelay: 0 },
    ...bridgeData.map((d, i) => ({
      id: d.id, group: 1, data: d, animDelay: 220 + i * 26,
      x: cx + Math.cos((Math.PI * 2 * i) / Math.max(bridgeData.length, 1) - Math.PI / 2) * R1,
      y: cy + Math.sin((Math.PI * 2 * i) / Math.max(bridgeData.length, 1) - Math.PI / 2) * R1,
    })),
    ...candidateData.map((d, i) => ({
      id: d.id, group: 2, data: d, animDelay: 500 + i * 16,
      x: cx + Math.cos((Math.PI * 2 * i) / Math.max(candidateData.length, 1) - Math.PI / 2) * R2,
      y: cy + Math.sin((Math.PI * 2 * i) / Math.max(candidateData.length, 1) - Math.PI / 2) * R2,
    })),
  ];

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = selectedCase.edges
    .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // Create or reuse SVG
  if (!gfx.svg) {
    container.innerHTML = "";
    gfx.svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img");
    gfx.svg.append("g").attr("class", "g-rings");
    gfx.svg.append("g").attr("class", "g-links");
    gfx.svg.append("g").attr("class", "g-nodes");
    gfx.svg.append("g").attr("class", "g-labels");
    gfx.svg.append("g").attr("class", "g-legend");
    renderGraphLegend(gfx.svg.select(".g-legend"), W - 200, 44);
  }

  const svg = gfx.svg;

  // Rings
  const ringsG = svg.select(".g-rings");
  ringsG.selectAll("*").remove();
  [[R1, "1 hop"], [R2, "2 hops"]].forEach(([r, lbl]) => {
    ringsG.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", r)
      .attr("fill", "none")
      .attr("stroke", palette.ring)
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "6 8");
    if (tweaks.showRingLabels) {
      ringsG.append("text")
        .attr("x", cx).attr("y", cy - r - 10)
        .attr("text-anchor", "middle")
        .attr("class", "ring-label")
        .text(lbl);
    }
  });

  if (gfx.simulation) gfx.simulation.stop();

  const charge = tweaks.chargeStrength;
  gfx.simulation = d3.forceSimulation(nodes)
    .force("link",    d3.forceLink(links).id((d) => d.id).strength(0.1).distance(60))
    .force("charge",  d3.forceManyBody().strength((d) =>
      d.group === 0 ? -charge * 5 : d.group === 1 ? -charge : -charge * 0.4
    ))
    .force("radial1", d3.forceRadial(R1, cx, cy).strength((d) => d.group === 1 ? 0.88 : 0))
    .force("radial2", d3.forceRadial(R2, cx, cy).strength((d) => d.group === 2 ? 0.78 : 0))
    .force("collide", d3.forceCollide((d) => d.group === 0 ? 40 : d.group === 1 ? 24 : 18))
    .alphaDecay(0.022)
    .velocityDecay(0.38);

  // Links
  gfx.linkSel = svg.select(".g-links").selectAll("line")
    .data(links, (d) => {
      const s = typeof d.source === "object" ? d.source.id : d.source;
      const t = typeof d.target === "object" ? d.target.id : d.target;
      return `${s}-${t}`;
    })
    .join(
      (enter) => enter.append("line")
        .attr("stroke", palette.muted).attr("stroke-width", 1.2)
        .attr("stroke-linecap", "round").attr("opacity", 0)
        .call((sel) => sel.transition().duration(400).delay(680).attr("opacity", 0.38)),
      (update) => update,
      (exit) => exit.transition().duration(250).attr("opacity", 0).remove()
    );

  // Nodes
  const ns = tweaks.nodeSizeScale;
  gfx.nodeSel = svg.select(".g-nodes").selectAll("circle")
    .data(nodes, (d) => d.id)
    .join(
      (enter) => enter.append("circle")
        .attr("r", 0)
        .attr("cx", (d) => d.x).attr("cy", (d) => d.y)
        .attr("fill", (d) => nodeBaseColor(d))
        .attr("stroke", palette.outline).attr("stroke-width", 1.4)
        .style("cursor", "pointer")
        .call(nodeDrag())
        .on("mouseenter", nodeMouseEnter)
        .on("mouseleave", nodeMouseLeave)
        .on("click", nodeClick)
        .call((sel) => sel.transition().duration(460).delay((d) => d.animDelay)
          .attr("r", (d) => nodeBaseR(d) * ns)
        ),
      (update) => update
        .call(nodeDrag())
        .on("mouseenter", nodeMouseEnter).on("mouseleave", nodeMouseLeave).on("click", nodeClick)
        .call((sel) => sel.transition().duration(500)
          .attr("r", (d) => nodeBaseR(d) * ns)
          .attr("fill", (d) => nodeBaseColor(d))
        ),
      (exit) => exit.call((sel) => sel.transition().duration(260).attr("r", 0).attr("opacity", 0).remove())
    );

  // Root label
  gfx.rootLabelSel = svg.select(".g-labels").selectAll("text.root-label")
    .data([nodes[0]], (d) => d.id)
    .join(
      (enter) => enter.append("text")
        .attr("class", "root-label node-label")
        .attr("text-anchor", "middle").attr("opacity", 0)
        .text((d) => `#${d.id}`)
        .call((sel) => sel.transition().delay(0).duration(400).attr("opacity", 1)),
      (update) => update.text((d) => `#${d.id}`),
      (exit) => exit.remove()
    );

  // Tick
  gfx.simulation.on("tick", () => {
    gfx.linkSel
      .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
    gfx.nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    gfx.rootLabelSel.attr("x", (d) => d.x).attr("y", (d) => d.y + 46);
  });

  graphController = {
    previewBridge(id)   { applyHighlight({ kind: "bridge",    id }); },
    previewCandidate(id){ applyHighlight({ kind: "candidate", id }); },
    clear()             { applyHighlight(null); },
  };

  applyHighlight(null);

  // ── Helpers ────────────────────────────────────────────────────────────

  function nodeBaseR(d) {
    return d.group === 0 ? 30 : d.group === 1 ? 13 : 12;
  }

  function nodeBaseColor(d) {
    if (d.group === 0) return palette.root;
    if (d.group === 1) return palette.first;
    return d.data?.shared_attribute_count >= 2 ? palette.secondStrong : palette.second;
  }

  function nodeDrag() {
    return d3.drag()
      .on("start", (event, d) => { if (!event.active) gfx.simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end",   (event, d) => { if (!event.active) gfx.simulation.alphaTarget(0); if (d.group !== 0) { d.fx = null; d.fy = null; } });
  }

  function nodeMouseEnter(event, d) {
    if (d.group === 0) return;
    applyHighlight({ kind: d.group === 1 ? "bridge" : "candidate", id: d.id });
    const label = d.group === 1
      ? `<strong>Bridge · User ${d.id}</strong>${d.data.country || ""} · ${d.data.age_group || ""}<br>${d.data.bridge_count} visible bridge path(s)`
      : `<strong>Candidate · User ${d.id}</strong>${d.data.country || ""} · ${d.data.age_group || ""}<br>${d.data.mutual_friends} mutual friend(s) · score ${d.data.score}`;
    tooltip.innerHTML = label;
    tooltip.style.display = "block";
    tooltip.classList.add("visible");
  }

  function nodeMouseLeave() {
    applyHighlight(null);
    tooltip.style.display = "none";
    tooltip.classList.remove("visible");
  }

  function nodeClick(event, d) {
    tooltip.style.display = "none";
    tooltip.classList.remove("visible");
    if (d.group === 0) { state.focusedBridgeId = null; render(); }
    else if (d.group === 1) { state.focusedBridgeId = focusedBridgeId === d.id ? null : String(d.id); state.selectedCandidateId = null; render(); }
    else { state.selectedCandidateId = String(d.id); render(); }
  }

  function applyHighlight(hover) {
    const ctx = buildInteractionContext(hover, candidateData, focusedBridgeId, selectedCandidate, rootData.id);
    const dimLinks = tweaks.dimUnrelated;

    if (gfx.linkSel) {
      gfx.linkSel
        .attr("stroke", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
            (s === rootData.id || t === rootData.id || ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          return hi ? palette.bridge : palette.muted;
        })
        .attr("stroke-width", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
            (s === rootData.id || t === rootData.id || ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          return hi ? 3 : 1.2;
        })
        .attr("opacity", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
            (s === rootData.id || t === rootData.id || ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          if (ctx.mode === "none") return 0.36;
          return hi ? 0.94 : (dimLinks ? 0.06 : 0.24);
        });
    }

    if (gfx.nodeSel) {
      const ns2 = tweaks.nodeSizeScale;
      gfx.nodeSel
        .attr("fill", (d) => {
          if (d.group === 0) return palette.root;
          if (d.group === 1) return ctx.bridgeIds.has(d.id) ? palette.bridge : palette.first;
          return d.data?.shared_attribute_count >= 2 ? palette.secondStrong : palette.second;
        })
        .attr("r", (d) => {
          const base = d.group === 0 ? 30 : d.group === 1
            ? (ctx.bridgeIds.has(d.id) ? 17 : 13)
            : (ctx.candidateIds.has(d.id) ? 18 : (selectedCandidate && d.id === selectedCandidate.id ? 15 : 12));
          return base * ns2;
        })
        .attr("opacity", (d) => {
          if (d.group === 0) return 0.95;
          if (ctx.mode === "none") return 0.9;
          if (d.group === 1) return ctx.bridgeIds.has(d.id) ? 1 : 0.44;
          return ctx.candidateIds.has(d.id) ? 1 : 0.3;
        })
        .attr("stroke", (d) => {
          if (d.group === 1 && ctx.bridgeIds.has(d.id)) return "rgba(122,112,216,0.9)";
          if (d.group === 2 && ctx.candidateIds.has(d.id)) return "rgba(217,166,79,0.7)";
          return palette.outline;
        })
        .attr("stroke-width", (d) => {
          if ((d.group === 1 && ctx.bridgeIds.has(d.id)) || (d.group === 2 && ctx.candidateIds.has(d.id))) return 2.6;
          return 1.4;
        });
    }

    setGraphHint(describeGraphHint(ctx));
    syncInteractionPanels(selectedCase, visibleCandidates, selectedCandidate, ctx);
  }
}

// Tooltip follows mouse
document.addEventListener("mousemove", (e) => {
  if (tooltip.style.display === "block") {
    tooltip.style.left = (e.clientX + 16) + "px";
    tooltip.style.top  = (e.clientY - 10) + "px";
  }
});

// ─── Build interaction context ─────────────────────────────────────────────
function buildInteractionContext(hover, candidateData, focusedBridgeId, selectedCandidate, rootId) {
  if (hover?.kind === "candidate") {
    const candidate = candidateData.find((n) => n.id === hover.id);
    if (candidate) return { mode: "candidate", bridgeIds: new Set(candidate.mutual_friend_ids), candidateIds: new Set([candidate.id]), bridgeId: null, candidate };
  }
  const bridgeId = hover?.kind === "bridge" ? hover.id : focusedBridgeId;
  if (bridgeId) {
    return {
      mode: "bridge",
      bridgeIds: new Set([bridgeId]),
      candidateIds: new Set(candidateData.filter((c) => c.mutual_friend_ids.includes(bridgeId)).map((c) => c.id)),
      bridgeId, candidate: null,
    };
  }
  if (selectedCandidate) {
    return { mode: "selected", bridgeIds: new Set(selectedCandidate.mutual_friend_ids), candidateIds: new Set([selectedCandidate.id]), bridgeId: null, candidate: selectedCandidate };
  }
  return { mode: "none", bridgeIds: new Set(), candidateIds: new Set(), bridgeId: null, candidate: null };
}

// ─── Graph legend ──────────────────────────────────────────────────────────
function renderGraphLegend(g, x, y) {
  [
    ["ego user",          palette.root],
    ["bridge friend",     palette.first],
    ["candidate",         palette.second],
    ["strong trait match",palette.secondStrong],
    ["active path",       palette.bridge],
  ].forEach(([label, color], i) => {
    const cy2 = y + i * 22;
    g.append("circle").attr("cx", x).attr("cy", cy2).attr("r", 5).attr("fill", color).attr("stroke", palette.outline).attr("stroke-width", 1.2);
    g.append("text").attr("x", x + 14).attr("y", cy2 + 4).attr("class", "axis-label").text(label);
  });
}

// ─── Path explainer & candidate panels ────────────────────────────────────
function renderPathExplainer(selectedCase, selectedCandidate, visibleCandidates, isPreview = false, bridgeId = null) {
  const container = document.querySelector("#path-explainer");
  container.replaceChildren();
  const card = document.createElement("article");
  card.className = "path-card";
  if (!selectedCandidate) {
    card.innerHTML = `<strong>No candidate selected</strong><p>Relax the filters or raise the candidate cap to bring more of the second-degree layer into view.</p>`;
    container.appendChild(card); return;
  }
  const reasons = [];
  if (selectedCandidate.same_country)   reasons.push("same country");
  if (selectedCandidate.same_age_group) reasons.push("same age group");
  if (!reasons.length) reasons.push("structural reach through mutual friends only");
  card.innerHTML = `
    <strong>${isPreview ? "Previewed path" : "Path explanation"}</strong>
    <p>User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through
    ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}.
    This candidate is interesting because of ${reasons.join(" and ")}.</p>
    <div class="detail-meta">
      <span class="chip blue">${formatCompact(visibleCandidates.length)} visible</span>
      <span class="chip">${formatCompact(selectedCase.summary.second_degree_count)} total 2°</span>
      ${bridgeId ? `<span class="chip alt">via bridge ${bridgeId}</span>` : ""}
    </div>`;
  container.appendChild(card);
}

function renderCandidateDetail(selectedCase, selectedCandidate, isPreview = false) {
  const container = document.querySelector("#candidate-detail");
  container.replaceChildren();
  if (!selectedCandidate) {
    const empty = document.createElement("article");
    empty.className = "detail-card";
    empty.innerHTML = `<strong>No candidate in focus</strong><p>Adjust filters or choose another case to inspect a reachable second-degree match.</p>`;
    container.appendChild(empty); return;
  }
  const bridgeFriends = selectedCandidate.mutual_friend_ids
    .map((id) => selectedCase.direct_friends.find((f) => f.id === id))
    .filter(Boolean);
  const card = document.createElement("article");
  card.className = "detail-card";
  card.innerHTML = `
    <strong>User ${selectedCandidate.id}</strong>
    <p>${selectedCandidate.country || "unknown"} · ${selectedCandidate.age_group || "unknown"} · degree ${selectedCandidate.degree}</p>
    <div class="detail-meta">
      <span class="chip blue">${isPreview ? "hover preview" : "locked spotlight"}</span>
      ${selectedCandidate.same_country    ? '<span class="chip">same country</span>'    : ""}
      ${selectedCandidate.same_age_group  ? '<span class="chip alt">same age group</span>' : ""}
      <span class="chip blue">${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}</span>
      <span class="chip alt">score ${selectedCandidate.score}</span>
    </div>`;
  container.appendChild(card);

  const bridgeCard = document.createElement("article");
  bridgeCard.className = "detail-card";
  bridgeCard.innerHTML = `<strong>Mutual bridge friends</strong><p>${bridgeFriends.length ? "These direct friends create the path to the candidate." : "No bridge details."}</p>`;
  const meta = document.createElement("div");
  meta.className = "detail-meta";
  bridgeFriends.forEach((f) => {
    const chip = document.createElement("span");
    chip.className = "chip blue";
    chip.textContent = `User ${f.id}`;
    meta.appendChild(chip);
  });
  bridgeCard.appendChild(meta);
  container.appendChild(bridgeCard);
}

function renderCandidateList(visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#candidate-list");
  container.replaceChildren();
  if (!visibleCandidates.length) {
    const empty = document.createElement("article");
    empty.className = "candidate-row";
    empty.innerHTML = `<strong>No visible candidates</strong><p>The current filter combination removes all second-degree matches. Try unchecking filters or switch to "Match any".</p>`;
    container.appendChild(empty); return;
  }
  const maxScore = Math.max(...visibleCandidates.map((c) => c.score), 1);
  visibleCandidates.forEach((candidate, i) => {
    const row = document.createElement("article");
    row.className = `candidate-row${selectedCandidate?.id === candidate.id ? " active" : ""}`;
    row.dataset.candidateId = String(candidate.id);
    row.innerHTML = `
      <button type="button">
        <strong>#${i + 1} · User ${candidate.id}</strong>
        <p>${candidate.country || "unknown"} · ${candidate.age_group || "unknown"} · ${candidate.mutual_friends} mutual friend${candidate.mutual_friends === 1 ? "" : "s"}</p>
        <div class="candidate-meta">
          ${candidate.same_country   ? '<span class="chip">same country</span>'    : ""}
          ${candidate.same_age_group ? '<span class="chip alt">same age group</span>' : ""}
          <span class="chip blue">${candidate.shared_attribute_count} shared trait(s)</span>
        </div>
        <div class="score-rail"><div class="score-fill" style="width:${(candidate.score / maxScore) * 100}%"></div></div>
      </button>`;
    const btn = row.querySelector("button");
    btn.addEventListener("mouseenter", () => graphController?.previewCandidate(candidate.id));
    btn.addEventListener("mouseleave", () => graphController?.clear());
    btn.addEventListener("click", () => { state.selectedCandidateId = String(candidate.id); render(); });
    container.appendChild(row);
  });
}

// ─── Atlas ──────────────────────────────────────────────────────────────────
function renderAtlas(selectedCase, visibleCandidates, selectedCandidate) {
  renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, {
    mode: selectedCandidate ? "selected" : "none",
    candidate: selectedCandidate,
    bridgeId: state.focusedBridgeId ? Number(state.focusedBridgeId) : null,
  });
  renderGroupedCaseChart("#chart-cases", data.charts.prototype_case_sizes, selectedCase.user.id);
  renderD3Bars("#chart-degree",    data.charts.degree_histogram,            palette.first);
  renderD3Bars("#chart-second",    data.charts.second_degree_histogram,     palette.second);
  renderD3Bars("#chart-shared",    data.charts.shared_attribute_histogram,  palette.amber);
  renderD3Bars("#chart-age",       data.charts.age_group_distribution,      palette.root);
  renderD3Bars("#chart-countries", data.charts.top_countries,               palette.violet);
}

function renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, context = { mode: "none", bridgeId: null }) {
  const container = document.querySelector("#atlas-focus");
  if (!container) return;
  const label = context.mode === "candidate" ? "Hover Preview" : context.mode === "bridge" ? "Bridge Focus" : "Live Case";
  const card = document.createElement("article");
  card.className = "atlas-focus-card";
  card.innerHTML = `
    <p class="eyebrow">${label}</p>
    <strong>User ${selectedCase.user.id}${selectedCandidate ? ` → User ${selectedCandidate.id}` : ""}</strong>
    <p>${selectedCase.user.country || "unknown"} · ${selectedCase.user.age_group || "unknown"} · ${formatCompact(selectedCase.summary.second_degree_count)} total 2°</p>
    <div class="detail-meta">
      <span class="chip blue">${formatCompact(visibleCandidates.length)} visible now</span>
      ${context.bridgeId ? `<span class="chip alt">bridge ${context.bridgeId}</span>` : '<span class="chip">full neighborhood</span>'}
      ${selectedCandidate ? `<span class="chip alt">${selectedCandidate.mutual_friends} mutual friends</span>` : ""}
    </div>`;
  container.replaceChildren(card);
}

function syncInteractionPanels(selectedCase, visibleCandidates, selectedCandidate, context) {
  const focusCandidate = context.candidate || selectedCandidate || null;
  renderCandidateDetail(selectedCase, focusCandidate, context.mode === "candidate");
  renderPathExplainer(selectedCase, focusCandidate, visibleCandidates, context.mode === "candidate", context.bridgeId);
  renderAtlasFocus(selectedCase, visibleCandidates, focusCandidate, context);
  syncLinkedRows(context, selectedCandidate);
  updateStageTitle(selectedCase, focusCandidate, context);
}

function syncLinkedRows(context, selectedCandidate) {
  document.querySelectorAll(".bridge-item").forEach((item) => {
    const bridgeId = Number(item.dataset.bridgeId);
    item.classList.toggle("preview", context.bridgeIds?.has(bridgeId) && !item.classList.contains("active"));
  });
  document.querySelectorAll(".candidate-row").forEach((item) => {
    const candidateId = Number(item.dataset.candidateId);
    const isActive = selectedCandidate?.id === candidateId;
    item.classList.toggle("preview", context.candidateIds?.has(candidateId) && !isActive);
  });
}

function updateStageTitle(selectedCase, selectedCandidate, context) {
  const el = document.querySelector("#stage-title");
  if (!el) return;
  if (context.mode === "candidate" && context.candidate) {
    el.textContent = `Previewing User ${selectedCase.user.id} → User ${context.candidate.id} through ${context.candidate.mutual_friends} mutual friend${context.candidate.mutual_friends === 1 ? "" : "s"}`;
  } else if (context.mode === "bridge" && context.bridgeId) {
    const count = context.candidateIds?.size ?? 0;
    el.textContent = `Bridge User ${context.bridgeId} opens ${count} visible candidate${count === 1 ? "" : "s"}`;
  } else if (selectedCandidate) {
    el.textContent = `User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}`;
  } else {
    el.textContent = "No visible second-degree candidates for the current filter combination";
  }
}

function setGraphHint(text) {
  const el = document.querySelector("#graph-hint");
  if (el) el.textContent = text || "← Hover or click any node to explore connections";
}

function describeGraphHint(ctx) {
  if (ctx.mode === "candidate" && ctx.candidate)
    return `Candidate User ${ctx.candidate.id} · ${ctx.candidate.mutual_friends} mutual friend(s) · score ${ctx.candidate.score}`;
  if (ctx.mode === "bridge" && ctx.bridgeId)
    return `Bridge User ${ctx.bridgeId} opens ${ctx.candidateIds?.size ?? 0} visible candidate(s) — click to focus`;
  if (ctx.mode === "selected" && ctx.candidate)
    return `User ${ctx.candidate.id} selected — click again to clear`;
  return "← Hover nodes to preview connections · Click to focus · Drag to rearrange";
}

// ─── D3 animated bar charts ────────────────────────────────────────────────
function renderD3Bars(selector, items, color) {
  const container = document.querySelector(selector);
  if (!container || !items?.length) return;
  const W = 520, H = 300;
  const m = { top: 22, right: 14, bottom: 76, left: 50 };
  const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([0, iW]).padding(0.26);
  const y = d3.scaleLinear().domain([0, d3.max(items, (d) => d.value) * 1.1]).nice().range([iH, 0]);

  const svgSel = d3.select(container).selectAll("svg").data([null]).join("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svgSel.selectAll("g.chart-inner").data([null]).join("g").attr("class", "chart-inner").attr("transform", `translate(${m.left},${m.top})`);

  g.selectAll(".d3-grid").data(y.ticks(4)).join("line")
    .attr("class", "d3-grid")
    .attr("x1", 0).attr("x2", iW).attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
    .attr("stroke", palette.grid).attr("stroke-width", 1);

  g.selectAll(".d3-bar").data(items, (d) => d.label)
    .join(
      (enter) => enter.append("rect").attr("class", "d3-bar")
        .attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
        .attr("y", iH).attr("height", 0).attr("rx", 6).attr("fill", color).attr("opacity", 0.88)
        .call((sel) => sel.transition().duration(680).delay((d, i) => i * 40)
          .attr("y", (d) => y(d.value)).attr("height", (d) => Math.max(iH - y(d.value), 0))
        ),
      (update) => update.transition().duration(500)
        .attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
        .attr("y", (d) => y(d.value)).attr("height", (d) => Math.max(iH - y(d.value), 0)).attr("fill", color),
      (exit) => exit.transition().duration(260).attr("height", 0).attr("y", iH).remove()
    );

  if (items.length <= 14) {
    g.selectAll(".d3-tick").data(items, (d) => d.label)
      .join("text").attr("class", "d3-tick axis-label")
      .attr("text-anchor", items.length > 7 ? "end" : "middle")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", iH + 18)
      .attr("transform", items.length > 7 ? (d) => `rotate(-35 ${x(d.label) + x.bandwidth() / 2} ${iH + 18})` : null)
      .text((d) => d.label);
  }
  if (items.length <= 8) {
    g.selectAll(".d3-val").data(items, (d) => d.label)
      .join("text").attr("class", "d3-val value-label")
      .attr("text-anchor", "middle")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 5)
      .text((d) => formatCompact(d.value));
  }
}

function renderGroupedCaseChart(selector, items, activeUserId) {
  const container = document.querySelector(selector);
  if (!container || !items?.length) return;
  const W = 1120, H = 340;
  const m = { top: 28, right: 18, bottom: 56, left: 50 };
  const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

  const groups  = ["direct_friends","second_degree_count","same_country_second_degree","same_age_group_second_degree","same_both_second_degree"];
  const colors  = [palette.first, palette.second, palette.root, palette.amber, palette.bridge];
  const legends = ["direct","second","same country","same age","both"];

  const xOuter = d3.scaleBand().domain(items.map((d) => String(d.label))).range([0, iW]).padding(0.2);
  const xInner = d3.scaleBand().domain(groups).range([0, xOuter.bandwidth()]).padding(0.1);
  const maxVal = d3.max(items.flatMap((item) => groups.map((g) => item[g])));
  const y = d3.scaleLinear().domain([0, maxVal * 1.1]).nice().range([iH, 0]);

  const svgSel = d3.select(container).selectAll("svg").data([null]).join("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svgSel.selectAll("g.case-inner").data([null]).join("g").attr("class", "case-inner").attr("transform", `translate(${m.left},${m.top})`);

  g.selectAll(".d3-grid").data(y.ticks(4)).join("line")
    .attr("class", "d3-grid").attr("x1", 0).attr("x2", iW).attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
    .attr("stroke", palette.grid);

  g.selectAll(".active-bg").data(items.filter((d) => String(d.label).includes(String(activeUserId))))
    .join("rect").attr("class", "active-bg")
    .attr("x", (d) => xOuter(String(d.label)) - 4).attr("y", 0)
    .attr("width", xOuter.bandwidth() + 8).attr("height", iH + 10).attr("rx", 14)
    .attr("fill", "rgba(26,168,157,0.07)");

  const caseGs = g.selectAll(".case-group").data(items, (d) => d.label)
    .join("g").attr("class", "case-group")
    .attr("transform", (d) => `translate(${xOuter(String(d.label))},0)`)
    .attr("opacity", (d) => String(d.label).includes(String(activeUserId)) ? 1 : 0.58);

  groups.forEach((key, ki) => {
    caseGs.selectAll(`.bar-${ki}`).data((d) => [d], (d) => d.label)
      .join(
        (enter) => enter.append("rect").attr("class", `bar-${ki}`)
          .attr("x", xInner(key)).attr("width", xInner.bandwidth())
          .attr("y", iH).attr("height", 0).attr("rx", 5).attr("fill", colors[ki]).attr("opacity", 0.9)
          .call((sel) => sel.transition().duration(680).delay(ki * 70 + 180)
            .attr("y", (d) => y(d[key])).attr("height", (d) => Math.max(iH - y(d[key]), 0))
          ),
        (update) => update.transition().duration(500)
          .attr("y", (d) => y(d[key])).attr("height", (d) => Math.max(iH - y(d[key]), 0)).attr("fill", colors[ki]),
        (exit) => exit.transition().duration(260).attr("height", 0).attr("y", iH).remove()
      );
  });

  g.selectAll(".case-label").data(items, (d) => d.label)
    .join("text").attr("class", "case-label axis-label")
    .attr("x", (d) => xOuter(String(d.label)) + xOuter.bandwidth() / 2)
    .attr("y", iH + 20).attr("text-anchor", "middle")
    .attr("opacity", (d) => String(d.label).includes(String(activeUserId)) ? 1 : 0.65)
    .text((d) => d.label);

  // Legend
  const lx = iW - legends.length * 88 + 10;
  const legendG = svgSel.selectAll(".case-legend").data([null]).join("g")
    .attr("class", "case-legend").attr("transform", `translate(${m.left + lx},${m.top - 20})`);
  legends.forEach((lbl, i) => {
    legendG.selectAll(`.leg-${i}`).data([null]).join("rect")
      .attr("class", `leg-${i}`)
      .attr("x", i * 88).attr("y", 0).attr("width", 10).attr("height", 10)
      .attr("rx", 3).attr("fill", colors[i]);
    legendG.selectAll(`.leg-lbl-${i}`).data([null]).join("text")
      .attr("class", `leg-lbl-${i} axis-label`)
      .attr("x", i * 88 + 14).attr("y", 9).text(lbl);
  });
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────
function createSvg(width, height) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "auto");
  return svg;
}
function createCircle(cx, cy, r, fill) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", cx); el.setAttribute("cy", cy); el.setAttribute("r", r);
  el.setAttribute("fill", fill); el.setAttribute("stroke", "rgba(220,228,255,0.18)");
  el.setAttribute("stroke-width", "1.2");
  return el;
}
function createLine(x1, y1, x2, y2, stroke, strokeWidth, opacity = 1) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
  el.setAttribute("x1", x1); el.setAttribute("y1", y1);
  el.setAttribute("x2", x2); el.setAttribute("y2", y2);
  el.setAttribute("stroke", stroke); el.setAttribute("stroke-width", strokeWidth);
  el.setAttribute("stroke-linecap", "round"); el.setAttribute("opacity", opacity);
  return el;
}
function createRing(cx, cy, r) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", cx); el.setAttribute("cy", cy); el.setAttribute("r", r);
  el.setAttribute("fill", "none"); el.setAttribute("stroke", "rgba(220,228,255,0.1)");
  el.setAttribute("stroke-width", "1.2"); el.setAttribute("stroke-dasharray", "5 7");
  return el;
}
function createText(text, x, y, className, anchor = "middle") {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("x", x); el.setAttribute("y", y);
  el.setAttribute("text-anchor", anchor);
  if (className) el.setAttribute("class", className);
  el.textContent = text;
  return el;
}
function makeSvgCornerLabel(svg, text, x, y, color) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", x); dot.setAttribute("cy", y - 3); dot.setAttribute("r", 4);
  dot.setAttribute("fill", color);
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x + 10); t.setAttribute("y", y);
  t.setAttribute("class", "ring-label");
  t.setAttribute("fill", "rgba(220,228,255,0.72)");
  t.setAttribute("font-size", "10");
  t.textContent = text;
  g.appendChild(dot); g.appendChild(t);
  svg.appendChild(g);
  return g;
}

function makeSvgCornerLabel(svg, text, x, y, color) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", x + 4); dot.setAttribute("cy", y - 3); dot.setAttribute("r", 4);
  dot.setAttribute("fill", color);
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x + 12); t.setAttribute("y", y);
  t.setAttribute("fill", "rgba(220,228,255,0.72)");
  t.setAttribute("font-size", "10");
  t.setAttribute("font-family", "DM Sans, sans-serif");
  t.textContent = text;
  g.appendChild(dot); g.appendChild(t);
  svg.appendChild(g);
}

function createBadgeLabel(text, x, y, anchor = "middle") {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const pad = { x: 7, y: 4 };
  const fontSize = 11;
  // Estimate text width (roughly 6.5px per char at font-size 11)
  const tw = text.length * 6.5;
  const bw = tw + pad.x * 2;
  const bh = fontSize + pad.y * 2;
  const bx = anchor === "middle" ? x - bw / 2 : anchor === "end" ? x - bw : x;
  const by = y - fontSize / 2 - pad.y;

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", bx); rect.setAttribute("y", by);
  rect.setAttribute("width", bw); rect.setAttribute("height", bh);
  rect.setAttribute("rx", 5);
  rect.setAttribute("fill", "rgba(8,15,28,0.82)");
  rect.setAttribute("stroke", "rgba(220,228,255,0.12)");
  rect.setAttribute("stroke-width", "1");

  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", anchor === "middle" ? x : anchor === "end" ? x - pad.x : x + pad.x);
  t.setAttribute("y", y + fontSize / 2 - 1);
  t.setAttribute("text-anchor", anchor === "end" ? "end" : anchor === "start" ? "start" : "middle");
  t.setAttribute("class", "ring-label");
  t.setAttribute("fill", "rgba(220,228,255,0.88)");
  t.setAttribute("font-size", fontSize);
  t.textContent = text;

  g.appendChild(rect);
  g.appendChild(t);
  return g;
}

function createHalo(cx, cy, r) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", cx); el.setAttribute("cy", cy); el.setAttribute("r", r);
  el.setAttribute("fill", "none");
  el.setAttribute("stroke", "rgba(217,166,79,0.55)"); el.setAttribute("stroke-width", "2");
  return el;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatCompact(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
function percent(v) {
  if (v === null || v === undefined) return "—%";
  return `${Math.round(v * 100)}%`;
}
function labelFromFilterId(id) {
  return id === "same_country" ? "country" : id === "same_age_group" ? "age group" : id;
}
