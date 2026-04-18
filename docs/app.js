const data = window.MILESTONE_DATA;

const palette = {
  root: "#146c66",
  first: "#6b8fb5",
  second: "#d67b52",
  secondStrong: "#b7853e",
  amber: "#b7853e",
  muted: "rgba(231, 238, 255, 0.14)",
  bridge: "#7266b0",
  grid: "rgba(231, 238, 255, 0.12)",
  ink: "#132033",
  violet: "#7266b0",
  outline: "rgba(231, 238, 255, 0.18)",
  ring: "rgba(231, 238, 255, 0.12)",
};

const state = {
  selectedCaseId: String(data.prototype.cases[0].user.id),
  selectedCandidateId: null,
  focusedBridgeId: null,
  filterMode: "any",
  topN: 12,
  filters: {
    same_country: false,
    same_age_group: false,
  },
};

// Persistent D3 graph state (survives between render() calls)
const gfx = {
  svg: null,
  simulation: null,
  linkSel: null,
  nodeSel: null,
  rootLabelSel: null,
};

let graphController = null;
const tooltip = document.getElementById("tooltip");

boot();

function boot() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  document.querySelector("#caveat-text").textContent = data.caveats[1];
  renderOverviewStrip();
  renderSummaryChips();
  renderInsights();
  renderQualityGrid();
  renderCaseSelector();
  renderFilterMode();
  renderFilters();
  bindRange();
  render();
  scrollToHashTarget();
  window.addEventListener("load", scrollToHashTarget);
  window.addEventListener("pageshow", scrollToHashTarget);
  window.addEventListener("hashchange", scrollToHashTarget);
}

// ─── Overview strip ──────────────────────────────────────────────────────────

function renderOverviewStrip() {
  const container = document.querySelector("#overview-strip");
  const items = [
    ["users", "users"],
    ["connected_users", "connected users"],
    ["unique_friendships", "unique friendships"],
    ["median_degree", "median direct degree"],
    ["median_second_degree", "median second-degree reach"],
  ];

  container.replaceChildren();
  items.forEach(([key, label]) => {
    const card = document.createElement("article");
    card.className = "hero-stat";
    card.innerHTML = `<strong>${formatCompact(data.overview[key])}</strong><span>${label}</span>`;
    container.appendChild(card);
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
  chips.forEach((text, index) => {
    const chip = document.createElement("span");
    chip.className = `chip${index % 2 === 1 ? " alt" : index === 2 ? " blue" : ""}`;
    chip.textContent = text;
    container.appendChild(chip);
  });
}

function renderInsights() {
  const container = document.querySelector("#insight-list");
  container.replaceChildren();
  const titles = ["Read the reach", "Look for shared traits", "Watch the scale"];
  data.insights.forEach((insight, index) => {
    const card = document.createElement("article");
    card.className = "insight-card";
    card.innerHTML = `
      <span class="insight-index">${String(index + 1).padStart(2, "0")}</span>
      <strong>${titles[index] || `Lens ${index + 1}`}</strong>
      <p>${insight}</p>
    `;
    container.appendChild(card);
  });
}

function renderQualityGrid() {
  const container = document.querySelector("#quality-grid");
  const items = [
    [data.quality_checks.missing_age, "users with missing age"],
    [data.quality_checks.missing_country, "users with missing country"],
    [data.quality_checks.missing_gender, "users with missing gender"],
    [data.quality_checks.users_with_degree_zero, "isolated users outside the connected graph"],
  ];

  container.replaceChildren();
  items.forEach(([value, label]) => {
    const card = document.createElement("article");
    card.className = "quality-stat";
    card.innerHTML = `<strong>${formatCompact(value)}</strong><p>${label}</p>`;
    container.appendChild(card);
  });
}

// ─── Controls ────────────────────────────────────────────────────────────────

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
  select.addEventListener("change", (event) => {
    state.selectedCaseId = event.target.value;
    state.selectedCandidateId = null;
    state.focusedBridgeId = null;
    // Reset D3 SVG so a fresh reveal animation plays
    gfx.svg = null;
    render();
  });
}

function renderFilterMode() {
  const container = document.querySelector("#filter-mode");
  container.replaceChildren();
  [["any", "Match any checked trait"], ["all", "Match all checked traits"]].forEach(([value, label]) => {
    const wrapper = document.createElement("label");
    wrapper.className = state.filterMode === value ? "active" : "";
    wrapper.innerHTML = `<input type="radio" name="filter_mode" value="${value}">${label}`;
    wrapper.querySelector("input").checked = state.filterMode === value;
    wrapper.addEventListener("click", () => {
      state.filterMode = value;
      renderFilterMode();
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
        <p>Use this trait to thin the two-hop neighborhood.</p>
      </div>
    `;
    const input = row.querySelector("input");
    input.checked = state.filters[filter.id];
    input.addEventListener("change", (event) => {
      state.filters[filter.id] = event.target.checked;
      state.selectedCandidateId = null;
      state.focusedBridgeId = null;
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
      </div>
    `;
    filterList.appendChild(row);
  });
}

function bindRange() {
  const input = document.querySelector("#topn-range");
  const output = document.querySelector("#topn-value");
  input.value = String(state.topN);
  output.textContent = String(state.topN);
  input.addEventListener("input", (event) => {
    state.topN = Number(event.target.value);
    output.textContent = String(state.topN);
    state.selectedCandidateId = null;
    state.focusedBridgeId = null;
    render();
  });
}

// ─── Render orchestration ─────────────────────────────────────────────────────

function render() {
  const selectedCase = getSelectedCase();
  const visibleCandidates = getVisibleCandidates(selectedCase);
  const selectedCandidate = getSelectedCandidate(visibleCandidates);

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
  const activeFilters = Object.entries(state.filters).filter(([, isActive]) => isActive);

  let candidates = [...selectedCase.candidates];
  if (activeFilters.length) {
    candidates = candidates.filter((candidate) => {
      const results = activeFilters.map(([filterId]) => Boolean(candidate[filterId]));
      return state.filterMode === "all" ? results.every(Boolean) : results.some(Boolean);
    });
  }

  if (state.focusedBridgeId) {
    candidates = candidates.filter((candidate) => candidate.mutual_friend_ids.includes(Number(state.focusedBridgeId)));
  }

  candidates.sort((a, b) => b.score - a.score || b.mutual_friends - a.mutual_friends || b.degree - a.degree);
  return candidates.slice(0, state.topN);
}

function getSelectedCandidate(visibleCandidates) {
  if (!visibleCandidates.length) {
    state.selectedCandidateId = null;
    return null;
  }

  const selected = visibleCandidates.find((candidate) => String(candidate.id) === String(state.selectedCandidateId));
  if (selected) return selected;

  state.selectedCandidateId = String(visibleCandidates[0].id);
  return visibleCandidates[0];
}

// ─── Ego card ────────────────────────────────────────────────────────────────

function renderEgoCard(selectedCase) {
  const container = document.querySelector("#ego-card");
  container.replaceChildren();

  const card = document.createElement("article");
  card.className = "ego-card-block";
  card.innerHTML = `
    <strong>User ${selectedCase.user.id}</strong>
    <p>${selectedCase.user.country || "unknown country"} / ${selectedCase.user.age_group || "unknown age group"} / degree ${selectedCase.user.degree}</p>
    <div class="ego-meta">
      <span class="chip">direct ${selectedCase.summary.direct_friends}</span>
      <span class="chip blue">second ${selectedCase.summary.second_degree_count}</span>
      <span class="chip alt">both traits ${selectedCase.summary.same_both_second_degree}</span>
    </div>
  `;
  container.appendChild(card);
}

// ─── Bridge list ──────────────────────────────────────────────────────────────

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
        <p>${friend.country || "unknown"} / ${friend.age_group || "unknown"} / degree ${friend.degree}</p>
        <div class="bridge-meta">
          <span class="chip">${friend.bridge_count} visible bridges</span>
          ${focusedBridgeId === friend.id ? '<span class="chip alt">focus active</span>' : ""}
        </div>
      </button>
    `;
    const button = item.querySelector("button");
    button.addEventListener("mouseenter", () => graphController?.previewBridge(friend.id));
    button.addEventListener("mouseleave", () => graphController?.clear());
    button.addEventListener("click", () => {
      state.focusedBridgeId = focusedBridgeId === friend.id ? null : String(friend.id);
      state.selectedCandidateId = null;
      render();
    });
    container.appendChild(item);
  });
}

// ─── Stage metrics ────────────────────────────────────────────────────────────

function renderStageMetrics(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#stage-metrics");
  container.replaceChildren();

  const activeFilters = Object.entries(state.filters)
    .filter(([, isActive]) => isActive)
    .map(([filterId]) => labelFromFilterId(filterId));

  const metrics = [
    { label: "direct friends", value: formatCompact(selectedCase.summary.direct_friends) },
    { label: "two-hop pool", value: formatCompact(selectedCase.summary.second_degree_count) },
    { label: "visible now", value: formatCompact(visibleCandidates.length) },
    {
      label: "active focus",
      value: state.focusedBridgeId
        ? `bridge ${state.focusedBridgeId}`
        : activeFilters.length
          ? `${state.filterMode === "all" ? "all" : "any"}: ${activeFilters.join(" + ")}`
          : "open pool",
    },
  ];

  metrics.forEach((metric) => {
    const card = document.createElement("article");
    card.className = "stage-stat";
    card.innerHTML = `<strong>${metric.value}</strong><span>${metric.label}</span>`;
    container.appendChild(card);
  });

  updateStageTitle(selectedCase, selectedCandidate, {
    mode: selectedCandidate ? "selected" : "none",
    candidate: selectedCandidate,
    bridgeId: state.focusedBridgeId ? Number(state.focusedBridgeId) : null,
    candidateIds: new Set(selectedCandidate ? [selectedCandidate.id] : []),
  });
}

// ─── Storyline ───────────────────────────────────────────────────────────────

function renderStoryline(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#storyline");
  container.replaceChildren();

  const activeFilters = Object.entries(state.filters)
    .filter(([, isActive]) => isActive)
    .map(([filterId]) => labelFromFilterId(filterId));
  const topBridge = [...selectedCase.direct_friends]
    .sort((a, b) => b.bridge_count - a.bridge_count || b.degree - a.degree)[0];

  const cards = [
    {
      step: "A",
      title: `Start with User ${selectedCase.user.id}`,
      text: `${formatCompact(selectedCase.summary.direct_friends)} direct friends form the first ring around the selected person.`,
    },
    {
      step: "B",
      title: topBridge ? `Bridge through User ${topBridge.id}` : "Bridge through the first ring",
      text: `${formatCompact(selectedCase.summary.second_degree_count)} people are reachable in two hops before any filtering is applied.`,
    },
    {
      step: "C",
      title: selectedCandidate ? `Focus on User ${selectedCandidate.id}` : "Rank the best reachable candidates",
      text: activeFilters.length
        ? `${state.filterMode === "all" ? "Candidates must match all checked traits." : "Candidates can match any checked trait."} ${formatCompact(visibleCandidates.length)} candidates remain visible.`
        : `No filters active. Showing the strongest ${formatCompact(visibleCandidates.length)} candidates by bridge strength and shared traits.`,
    },
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "story-card";
    card.innerHTML = `
      <span class="story-step">${item.step}</span>
      <strong class="story-title">${item.title}</strong>
      <p>${item.text}</p>
    `;
    container.appendChild(card);
  });
}

// ─── Hero visual (small preview graph) ───────────────────────────────────────

function renderHeroVisual(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#hero-visual");
  if (!container) return;

  const width = 520, height = 300;
  const centerX = width / 2, centerY = height / 2 + 12;
  const firstRadius = 58, secondRadius = 108;
  const focusCandidate = selectedCandidate || visibleCandidates[0] || selectedCase.candidates[0] || null;
  const focusMutualIds = new Set(focusCandidate ? focusCandidate.mutual_friend_ids : []);
  const firstNodes = [...selectedCase.direct_friends]
    .sort((a, b) => Number(focusMutualIds.has(b.id)) - Number(focusMutualIds.has(a.id)) || b.bridge_count - a.bridge_count || b.degree - a.degree)
    .slice(0, 6);
  const focusBridgeId = firstNodes.find((node) => focusMutualIds.has(node.id))?.id ?? null;
  const secondNodes = [
    ...(focusCandidate ? [focusCandidate] : []),
    ...visibleCandidates.filter((c) => !focusCandidate || c.id !== focusCandidate.id).slice(0, 7),
  ].slice(0, 8);

  const positions = new Map();
  positions.set(selectedCase.user.id, { x: centerX, y: centerY });
  firstNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(firstNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: centerX + Math.cos(angle) * firstRadius, y: centerY + Math.sin(angle) * firstRadius });
  });
  secondNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(secondNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, { x: centerX + Math.cos(angle) * secondRadius, y: centerY + Math.sin(angle) * secondRadius });
  });

  const svg = createSvg(width, height);
  svg.appendChild(createRing(centerX, centerY, firstRadius));
  svg.appendChild(createRing(centerX, centerY, secondRadius));
  svg.appendChild(createText("1 hop", centerX, centerY - firstRadius - 10, "ring-label", "middle"));
  svg.appendChild(createText("2 hops", centerX, centerY - secondRadius - 10, "ring-label", "middle"));

  firstNodes.forEach((node) => {
    const source = positions.get(selectedCase.user.id);
    const target = positions.get(node.id);
    const highlighted = focusMutualIds.has(node.id);
    svg.appendChild(createLine(source.x, source.y, target.x, target.y, highlighted ? palette.bridge : palette.muted, highlighted ? 2.6 : 1.3, highlighted ? 0.94 : 0.55));
  });

  secondNodes.forEach((node, index) => {
    const target = positions.get(node.id);
    const linkedFriends = firstNodes.filter((friend) => node.mutual_friend_ids.includes(friend.id));
    linkedFriends.slice(0, node === focusCandidate ? 4 : 1).forEach((friend) => {
      const source = positions.get(friend.id);
      const highlighted = focusCandidate && node.id === focusCandidate.id && focusMutualIds.has(friend.id);
      svg.appendChild(createLine(source.x, source.y, target.x, target.y, highlighted ? palette.bridge : palette.muted, highlighted ? 2.8 : 1.2, highlighted ? 0.94 : 0.42));
    });
    const fill = index === 0 && focusCandidate ? palette.secondStrong : palette.second;
    svg.appendChild(createCircle(target.x, target.y, index === 0 && focusCandidate ? 10 : 8, fill));
    if (index === 0 && focusCandidate) {
      svg.appendChild(createHalo(target.x, target.y, 15));
      svg.appendChild(createText("reachable", target.x + 18, target.y + 6, "node-label", "start"));
    }
  });

  firstNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const highlighted = focusBridgeId === node.id;
    svg.appendChild(createCircle(pos.x, pos.y, highlighted ? 9 : 8, highlighted ? palette.bridge : palette.first));
    if (highlighted) svg.appendChild(createText("bridge", pos.x + 16, pos.y - 6, "node-label", "start"));
  });

  svg.appendChild(createCircle(centerX, centerY, 16, palette.root));
  svg.appendChild(createText("you", centerX, centerY + 30, "node-label", "middle"));
  container.replaceChildren(svg);
}

// ─── Main D3 force-directed graph ─────────────────────────────────────────────

function renderGraph(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#graph");
  const W = 1080, H = 760;
  const cx = W / 2, cy = H / 2;
  const R1 = 170, R2 = 325;
  const focusedBridgeId = state.focusedBridgeId ? Number(state.focusedBridgeId) : null;

  const rootData = selectedCase.user;
  const bridgeData = [...selectedCase.direct_friends].sort(
    (a, b) => b.bridge_count - a.bridge_count || a.id - b.id
  );
  const candidateData = visibleCandidates;

  // Build nodes. Ring positions are the starting point for the force simulation.
  const nodes = [
    {
      id: rootData.id, group: 0, data: rootData,
      x: cx, y: cy, fx: cx, fy: cy, animDelay: 0,
    },
    ...bridgeData.map((d, i) => ({
      id: d.id, group: 1, data: d, animDelay: 220 + i * 28,
      x: cx + Math.cos((Math.PI * 2 * i) / Math.max(bridgeData.length, 1) - Math.PI / 2) * R1,
      y: cy + Math.sin((Math.PI * 2 * i) / Math.max(bridgeData.length, 1) - Math.PI / 2) * R1,
    })),
    ...candidateData.map((d, i) => ({
      id: d.id, group: 2, data: d, animDelay: 500 + i * 18,
      x: cx + Math.cos((Math.PI * 2 * i) / Math.max(candidateData.length, 1) - Math.PI / 2) * R2,
      y: cy + Math.sin((Math.PI * 2 * i) / Math.max(candidateData.length, 1) - Math.PI / 2) * R2,
    })),
  ];

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = selectedCase.edges
    .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // Create SVG once; reset when case changes (triggered by renderCaseSelector)
  if (!gfx.svg) {
    container.innerHTML = "";
    gfx.svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img");
    gfx.svg.append("g").attr("class", "g-rings");
    gfx.svg.append("g").attr("class", "g-links");
    gfx.svg.append("g").attr("class", "g-nodes");
    gfx.svg.append("g").attr("class", "g-labels");
    gfx.svg.append("g").attr("class", "g-legend");
    renderGraphLegend(gfx.svg.select(".g-legend"), W - 220, 48);
  }

  const svg = gfx.svg;

  // Static ring guides
  const ringsG = svg.select(".g-rings");
  ringsG.selectAll("*").remove();
  [[R1, "1 hop"], [R2, "2 hops"]].forEach(([r, lbl]) => {
    ringsG.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", r)
      .attr("fill", "none").attr("stroke", palette.ring)
      .attr("stroke-width", 1.4).attr("stroke-dasharray", "7 8");
    ringsG.append("text")
      .attr("x", cx).attr("y", cy - r - 10)
      .attr("text-anchor", "middle").attr("class", "ring-label").text(lbl);
  });

  // Stop previous simulation before creating a new one
  if (gfx.simulation) gfx.simulation.stop();

  gfx.simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).strength(0.1).distance(60))
    .force("charge", d3.forceManyBody().strength((d) =>
      d.group === 0 ? -1200 : d.group === 1 ? -220 : -90
    ))
    .force("radial1", d3.forceRadial(R1, cx, cy).strength((d) => d.group === 1 ? 0.9 : 0))
    .force("radial2", d3.forceRadial(R2, cx, cy).strength((d) => d.group === 2 ? 0.8 : 0))
    .force("collide", d3.forceCollide((d) => d.group === 0 ? 38 : d.group === 1 ? 24 : 18))
    .alphaDecay(0.022)
    .velocityDecay(0.38);

  // ── Links ──────────────────────────────────────────────────────────────────

  gfx.linkSel = svg.select(".g-links").selectAll("line")
    .data(links, (d) => {
      const s = typeof d.source === "object" ? d.source.id : d.source;
      const t = typeof d.target === "object" ? d.target.id : d.target;
      return `${s}-${t}`;
    })
    .join(
      (enter) => enter.append("line")
        .attr("stroke", palette.muted)
        .attr("stroke-width", 1.2)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0)
        .call((sel) => sel.transition().duration(400).delay(680).attr("opacity", 0.38)),
      (update) => update,
      (exit) => exit.transition().duration(250).attr("opacity", 0).remove()
    );

  // ── Nodes (progressive reveal: ego → bridges → candidates) ────────────────

  gfx.nodeSel = svg.select(".g-nodes").selectAll("circle")
    .data(nodes, (d) => d.id)
    .join(
      (enter) => enter.append("circle")
        .attr("r", 0)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", (d) => nodeBaseColor(d))
        .attr("stroke", palette.outline)
        .attr("stroke-width", 1.4)
        .style("cursor", "pointer")
        .call(nodeDrag())
        .on("mouseenter", nodeMouseEnter)
        .on("mouseleave", nodeMouseLeave)
        .on("click", nodeClick)
        .call((sel) => sel.transition()
          .duration(480)
          .delay((d) => d.animDelay)
          .attr("r", (d) => nodeBaseR(d))
        ),
      (update) => update
        .call(nodeDrag())
        .on("mouseenter", nodeMouseEnter)
        .on("mouseleave", nodeMouseLeave)
        .on("click", nodeClick)
        .call((sel) => sel.transition().duration(550)
          .attr("r", (d) => nodeBaseR(d))
          .attr("fill", (d) => nodeBaseColor(d))
        ),
      (exit) => exit
        .call((sel) => sel.transition().duration(280).attr("r", 0).attr("opacity", 0).remove())
    );

  // ── Root label ─────────────────────────────────────────────────────────────

  gfx.rootLabelSel = svg.select(".g-labels").selectAll("text.root-label")
    .data([nodes[0]], (d) => d.id)
    .join(
      (enter) => enter.append("text")
        .attr("class", "root-label node-label")
        .attr("text-anchor", "middle")
        .attr("opacity", 0)
        .text((d) => `A${d.id}`)
        .call((sel) => sel.transition().delay(0).duration(400).attr("opacity", 1)),
      (update) => update.text((d) => `A${d.id}`),
      (exit) => exit.remove()
    );

  // ── Simulation tick ────────────────────────────────────────────────────────

  gfx.simulation.on("tick", () => {
    gfx.linkSel
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    gfx.nodeSel
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    gfx.rootLabelSel
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 48);
  });

  // ── Graph controller (used by bridge/candidate list hover) ─────────────────

  graphController = {
    previewBridge(id) { applyHighlight({ kind: "bridge", id }); },
    previewCandidate(id) { applyHighlight({ kind: "candidate", id }); },
    clear() { applyHighlight(null); },
  };

  applyHighlight(null);

  // ── Helpers inside renderGraph ─────────────────────────────────────────────

  function nodeBaseR(d) {
    return d.group === 0 ? 30 : d.group === 1 ? 13 : 12;
  }

  function nodeBaseColor(d) {
    if (d.group === 0) return palette.root;
    if (d.group === 1) return palette.first;
    return d.data && d.data.shared_attribute_count >= 2 ? palette.secondStrong : palette.second;
  }

  function nodeDrag() {
    return d3.drag()
      .on("start", (event, d) => {
        if (!event.active) gfx.simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) gfx.simulation.alphaTarget(0);
        if (d.group !== 0) { d.fx = null; d.fy = null; }
      });
  }

  function nodeMouseEnter(event, d) {
    if (d.group === 0) return;
    applyHighlight({ kind: d.group === 1 ? "bridge" : "candidate", id: d.id });

    // Rich tooltip
    const label = d.group === 1
      ? `<strong>Bridge · User ${d.id}</strong>${d.data.country || ""} / ${d.data.age_group || ""}<br>${d.data.bridge_count} visible bridge path(s)`
      : `<strong>Candidate · User ${d.id}</strong>${d.data.country || ""} / ${d.data.age_group || ""}<br>${d.data.mutual_friends} mutual friend(s) · score ${d.data.score}`;

    tooltip.innerHTML = label;
    tooltip.style.display = "block";
    tooltip.style.opacity = "1";
  }

  function nodeMouseLeave() {
    applyHighlight(null);
    tooltip.style.display = "none";
  }

  function nodeClick(event, d) {
    tooltip.style.display = "none";
    if (d.group === 0) {
      state.focusedBridgeId = null;
      render();
    } else if (d.group === 1) {
      state.focusedBridgeId = focusedBridgeId === d.id ? null : String(d.id);
      state.selectedCandidateId = null;
      render();
    } else {
      state.selectedCandidateId = String(d.id);
      render();
    }
  }

  function applyHighlight(hover) {
    const ctx = buildInteractionContext(hover, candidateData, focusedBridgeId, selectedCandidate, rootData.id);

    if (gfx.linkSel) {
      gfx.linkSel
        .attr("stroke", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
                     (s === rootData.id || t === rootData.id ||
                      ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          return hi ? palette.bridge : palette.muted;
        })
        .attr("stroke-width", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
                     (s === rootData.id || t === rootData.id ||
                      ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          return hi ? 3.2 : 1.2;
        })
        .attr("opacity", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hi = (ctx.bridgeIds.has(s) || ctx.bridgeIds.has(t)) &&
                     (s === rootData.id || t === rootData.id ||
                      ctx.candidateIds.has(s) || ctx.candidateIds.has(t));
          if (ctx.mode === "none") return 0.38;
          return hi ? 0.96 : 0.07;
        });
    }

    if (gfx.nodeSel) {
      gfx.nodeSel
        .attr("fill", (d) => {
          if (d.group === 0) return palette.root;
          if (d.group === 1) return ctx.bridgeIds.has(d.id) ? palette.bridge : palette.first;
          return d.data && d.data.shared_attribute_count >= 2 ? palette.secondStrong : palette.second;
        })
        .attr("r", (d) => {
          if (d.group === 0) return 30;
          if (d.group === 1) return ctx.bridgeIds.has(d.id) ? 17 : 13;
          const active = ctx.candidateIds.has(d.id);
          const locked = selectedCandidate && d.id === selectedCandidate.id;
          return active ? 18 : locked ? 15 : 12;
        })
        .attr("opacity", (d) => {
          if (d.group === 0) return 0.96;
          if (ctx.mode === "none") return 0.95;
          if (d.group === 1) return ctx.bridgeIds.has(d.id) ? 1 : 0.46;
          return ctx.candidateIds.has(d.id) ? 1 : 0.32;
        })
        .attr("stroke", (d) => {
          if (d.group === 1 && ctx.bridgeIds.has(d.id)) return "rgba(114, 102, 176, 0.9)";
          if (d.group === 2 && ctx.candidateIds.has(d.id)) return "rgba(217, 166, 79, 0.7)";
          return palette.outline;
        })
        .attr("stroke-width", (d) => {
          if ((d.group === 1 && ctx.bridgeIds.has(d.id)) ||
              (d.group === 2 && ctx.candidateIds.has(d.id))) return 2.8;
          return 1.4;
        });
    }

    setGraphHint(describeGraphHint(ctx));
    syncInteractionPanels(selectedCase, visibleCandidates, selectedCandidate, ctx);
  }
}

// ── Tooltip follows mouse ───────────────────────────────────────────────────

document.addEventListener("mousemove", (e) => {
  if (tooltip.style.display === "block") {
    tooltip.style.left = (e.clientX + 14) + "px";
    tooltip.style.top = (e.clientY - 8) + "px";
  }
});

// ── Build interaction context (lifted out of renderGraph) ──────────────────

function buildInteractionContext(hover, candidateData, focusedBridgeId, selectedCandidate, rootId) {
  if (hover && hover.kind === "candidate") {
    const candidate = candidateData.find((n) => n.id === hover.id);
    if (candidate) {
      return {
        mode: "candidate",
        bridgeIds: new Set(candidate.mutual_friend_ids),
        candidateIds: new Set([candidate.id]),
        bridgeId: null,
        candidate,
      };
    }
  }

  const bridgeId = hover && hover.kind === "bridge" ? hover.id : focusedBridgeId;
  if (bridgeId) {
    return {
      mode: "bridge",
      bridgeIds: new Set([bridgeId]),
      candidateIds: new Set(
        candidateData.filter((c) => c.mutual_friend_ids.includes(bridgeId)).map((c) => c.id)
      ),
      bridgeId,
      candidate: null,
    };
  }

  if (selectedCandidate) {
    return {
      mode: "selected",
      bridgeIds: new Set(selectedCandidate.mutual_friend_ids),
      candidateIds: new Set([selectedCandidate.id]),
      bridgeId: null,
      candidate: selectedCandidate,
    };
  }

  return { mode: "none", bridgeIds: new Set(), candidateIds: new Set(), bridgeId: null, candidate: null };
}

// ── Graph legend (static, rendered once) ──────────────────────────────────

function renderGraphLegend(g, x, y) {
  [
    ["ego user", palette.root],
    ["bridge friend", palette.first],
    ["candidate", palette.second],
    ["strong trait match", palette.secondStrong],
    ["active path", palette.bridge],
  ].forEach(([label, color], i) => {
    const cy = y + i * 24;
    g.append("circle")
      .attr("cx", x).attr("cy", cy).attr("r", 6)
      .attr("fill", color).attr("stroke", palette.outline).attr("stroke-width", 1.4);
    g.append("text")
      .attr("x", x + 16).attr("y", cy + 4)
      .attr("class", "axis-label").text(label);
  });
}

// ─── Path explainer & candidate panels ───────────────────────────────────────

function renderPathExplainer(selectedCase, selectedCandidate, visibleCandidates, isPreview = false, bridgeId = null) {
  const container = document.querySelector("#path-explainer");
  container.replaceChildren();

  const card = document.createElement("article");
  card.className = "path-card";

  if (!selectedCandidate) {
    card.innerHTML = `<strong>No candidate selected</strong><p>Relax the filters or raise the candidate cap to bring more of the second-degree layer back into view.</p>`;
    container.appendChild(card);
    return;
  }

  const reasons = [];
  if (selectedCandidate.same_country) reasons.push("same country");
  if (selectedCandidate.same_age_group) reasons.push("same age group");
  if (!reasons.length) reasons.push("structural reach through mutual friends only");

  card.innerHTML = `
    <strong>${isPreview ? "Previewed path" : "Path explanation"}</strong>
    <p>
      User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through
      ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}.
      This candidate is interesting because of ${reasons.join(" and ")}.
    </p>
    <div class="detail-meta">
      <span class="chip blue">${formatCompact(visibleCandidates.length)} visible candidates</span>
      <span class="chip">${formatCompact(selectedCase.summary.second_degree_count)} total second-degree</span>
      ${bridgeId ? `<span class="chip alt">via bridge ${bridgeId}</span>` : ""}
    </div>
  `;
  container.appendChild(card);
}

function renderCandidateDetail(selectedCase, selectedCandidate, isPreview = false) {
  const container = document.querySelector("#candidate-detail");
  container.replaceChildren();

  if (!selectedCandidate) {
    const empty = document.createElement("article");
    empty.className = "detail-card";
    empty.innerHTML = `<strong>No candidate in focus</strong><p>Adjust the filters or choose another case to inspect a reachable second-degree match.</p>`;
    container.appendChild(empty);
    return;
  }

  const bridgeFriends = selectedCandidate.mutual_friend_ids
    .map((friendId) => selectedCase.direct_friends.find((friend) => friend.id === friendId))
    .filter(Boolean);

  const card = document.createElement("article");
  card.className = "detail-card";
  card.innerHTML = `
    <strong>User ${selectedCandidate.id}</strong>
    <p>${selectedCandidate.country || "unknown country"} / ${selectedCandidate.age_group || "unknown age group"} / degree ${selectedCandidate.degree}</p>
    <div class="detail-meta">
      <span class="chip blue">${isPreview ? "hover preview" : "locked spotlight"}</span>
      ${selectedCandidate.same_country ? '<span class="chip">same country</span>' : ""}
      ${selectedCandidate.same_age_group ? '<span class="chip alt">same age group</span>' : ""}
      <span class="chip blue">${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}</span>
      <span class="chip alt">score ${selectedCandidate.score}</span>
    </div>
  `;
  container.appendChild(card);

  const bridgeCard = document.createElement("article");
  bridgeCard.className = "detail-card";
  bridgeCard.innerHTML = `<strong>Mutual bridge friends</strong><p>${bridgeFriends.length ? "These direct friends create the reachable path to the selected candidate." : "No bridge details available."}</p>`;
  const meta = document.createElement("div");
  meta.className = "detail-meta";
  bridgeFriends.forEach((friend) => {
    const chip = document.createElement("span");
    chip.className = "chip blue";
    chip.textContent = `User ${friend.id}`;
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
    empty.innerHTML = `<strong>No visible candidates</strong><p>The current filter combination removes all second-degree matches.</p>`;
    container.appendChild(empty);
    return;
  }

  const maxScore = Math.max(...visibleCandidates.map((c) => c.score), 1);

  visibleCandidates.forEach((candidate, index) => {
    const row = document.createElement("article");
    row.className = `candidate-row${selectedCandidate && selectedCandidate.id === candidate.id ? " active" : ""}`;
    row.dataset.candidateId = String(candidate.id);
    row.innerHTML = `
      <button type="button">
        <strong>#${index + 1} · User ${candidate.id}</strong>
        <p>${candidate.country || "unknown"} / ${candidate.age_group || "unknown"} / ${candidate.mutual_friends} mutual friend${candidate.mutual_friends === 1 ? "" : "s"}</p>
        <div class="candidate-meta">
          ${candidate.same_country ? '<span class="chip">same country</span>' : ""}
          ${candidate.same_age_group ? '<span class="chip alt">same age group</span>' : ""}
          <span class="chip blue">${candidate.shared_attribute_count} shared trait(s)</span>
        </div>
        <div class="score-rail"><div class="score-fill" style="width:${(candidate.score / maxScore) * 100}%"></div></div>
      </button>
    `;
    const button = row.querySelector("button");
    button.addEventListener("mouseenter", () => graphController?.previewCandidate(candidate.id));
    button.addEventListener("mouseleave", () => graphController?.clear());
    button.addEventListener("click", () => {
      state.selectedCandidateId = String(candidate.id);
      render();
    });
    container.appendChild(row);
  });
}

// ─── Atlas section ────────────────────────────────────────────────────────────

function renderAtlas(selectedCase, visibleCandidates, selectedCandidate) {
  renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, {
    mode: selectedCandidate ? "selected" : "none",
    candidate: selectedCandidate,
    bridgeId: state.focusedBridgeId ? Number(state.focusedBridgeId) : null,
  });
  renderGroupedCaseChart("#chart-cases", data.charts.prototype_case_sizes, selectedCase.user.id);
  renderD3Bars("#chart-degree", data.charts.degree_histogram, palette.first);
  renderD3Bars("#chart-second", data.charts.second_degree_histogram, palette.second);
  renderD3Bars("#chart-shared", data.charts.shared_attribute_histogram, palette.amber);
  renderD3Bars("#chart-age", data.charts.age_group_distribution, palette.root);
  renderD3Bars("#chart-countries", data.charts.top_countries, palette.violet);
}

function renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, context = { mode: "none", bridgeId: null }) {
  const container = document.querySelector("#atlas-focus");
  if (!container) return;

  const label = context.mode === "candidate" ? "Hover Preview"
    : context.mode === "bridge" ? "Bridge Focus" : "Live Case";

  const card = document.createElement("article");
  card.className = "atlas-focus-card";
  card.innerHTML = `
    <p class="eyebrow">${label}</p>
    <strong>User ${selectedCase.user.id}${selectedCandidate ? ` → User ${selectedCandidate.id}` : ""}</strong>
    <p>${selectedCase.user.country || "unknown"} / ${selectedCase.user.age_group || "unknown"} / ${formatCompact(selectedCase.summary.second_degree_count)} total second-degree</p>
    <div class="detail-meta">
      <span class="chip blue">${formatCompact(visibleCandidates.length)} visible now</span>
      ${context.bridgeId ? `<span class="chip alt">bridge ${context.bridgeId}</span>` : '<span class="chip">full neighborhood</span>'}
      ${selectedCandidate ? `<span class="chip alt">${selectedCandidate.mutual_friends} mutual friends</span>` : ""}
    </div>
  `;
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
    const isActive = item.classList.contains("active");
    item.classList.toggle("preview", context.bridgeIds && context.bridgeIds.has(bridgeId) && !isActive);
  });
  document.querySelectorAll(".candidate-row").forEach((item) => {
    const candidateId = Number(item.dataset.candidateId);
    const isActive = selectedCandidate && selectedCandidate.id === candidateId;
    item.classList.toggle("preview", context.candidateIds && context.candidateIds.has(candidateId) && !isActive);
  });
}

function updateStageTitle(selectedCase, selectedCandidate, context) {
  const el = document.querySelector("#stage-title");
  if (!el) return;

  if (context.mode === "candidate" && context.candidate) {
    el.textContent = `Previewing User ${selectedCase.user.id} → User ${context.candidate.id} through ${context.candidate.mutual_friends} mutual friend${context.candidate.mutual_friends === 1 ? "" : "s"}`;
    return;
  }
  if (context.mode === "bridge" && context.bridgeId) {
    const count = context.candidateIds ? context.candidateIds.size : 0;
    el.textContent = `Bridge User ${context.bridgeId} opens ${count} visible candidate${count === 1 ? "" : "s"}`;
    return;
  }
  if (selectedCandidate) {
    el.textContent = `User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}`;
    return;
  }
  el.textContent = "No visible second-degree candidates for the current filter combination";
}

// ─── D3 animated bar charts ───────────────────────────────────────────────────

function renderD3Bars(selector, items, color) {
  const container = document.querySelector(selector);
  if (!container || !items || !items.length) return;

  const W = 520, H = 320;
  const m = { top: 24, right: 14, bottom: 80, left: 52 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;

  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([0, iW]).padding(0.24);
  const y = d3.scaleLinear().domain([0, d3.max(items, (d) => d.value) * 1.08]).nice().range([iH, 0]);

  const svgSel = d3.select(container).selectAll("svg").data([null]).join("svg")
    .attr("viewBox", `0 0 ${W} ${H}`);

  const g = svgSel.selectAll("g.chart-inner").data([null]).join("g")
    .attr("class", "chart-inner")
    .attr("transform", `translate(${m.left},${m.top})`);

  // Grid lines
  g.selectAll(".d3-grid").data(y.ticks(4)).join("line")
    .attr("class", "d3-grid")
    .attr("x1", 0).attr("x2", iW)
    .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
    .attr("stroke", palette.grid);

  // Bars with entrance animation
  g.selectAll(".d3-bar").data(items, (d) => d.label)
    .join(
      (enter) => enter.append("rect")
        .attr("class", "d3-bar")
        .attr("x", (d) => x(d.label))
        .attr("width", x.bandwidth())
        .attr("y", iH).attr("height", 0)
        .attr("rx", 8).attr("fill", color)
        .call((sel) => sel.transition().duration(700).delay((d, i) => i * 45)
          .attr("y", (d) => y(d.value))
          .attr("height", (d) => Math.max(iH - y(d.value), 0))
        ),
      (update) => update.transition().duration(500)
        .attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
        .attr("y", (d) => y(d.value)).attr("height", (d) => Math.max(iH - y(d.value), 0))
        .attr("fill", color),
      (exit) => exit.transition().duration(280).attr("height", 0).attr("y", iH).remove()
    );

  // X-axis tick labels (rotated if many)
  if (items.length <= 14) {
    g.selectAll(".d3-tick").data(items, (d) => d.label)
      .join("text")
      .attr("class", "d3-tick axis-label")
      .attr("text-anchor", items.length > 7 ? "end" : "middle")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", iH + 20)
      .attr("transform", items.length > 7
        ? (d) => `rotate(-35 ${x(d.label) + x.bandwidth() / 2} ${iH + 20})`
        : null
      )
      .text((d) => d.label);
  }

  // Value annotation on top of bar (only for small datasets)
  if (items.length <= 8) {
    g.selectAll(".d3-val").data(items, (d) => d.label)
      .join("text")
      .attr("class", "d3-val value-label")
      .attr("text-anchor", "middle")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 6)
      .text((d) => formatCompact(d.value));
  }
}

function renderGroupedCaseChart(selector, items, activeUserId) {
  const container = document.querySelector(selector);
  if (!container || !items || !items.length) return;

  const W = 1120, H = 360;
  const m = { top: 30, right: 18, bottom: 60, left: 52 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;

  const groups = ["direct_friends", "second_degree_count", "same_country_second_degree", "same_age_group_second_degree", "same_both_second_degree"];
  const colors = [palette.first, palette.second, palette.root, palette.amber, palette.bridge];
  const legendLabels = ["direct", "second", "same country", "same age", "both"];

  const xOuter = d3.scaleBand().domain(items.map((d) => String(d.label))).range([0, iW]).padding(0.18);
  const xInner = d3.scaleBand().domain(groups).range([0, xOuter.bandwidth()]).padding(0.08);
  const maxVal = d3.max(items.flatMap((item) => groups.map((g) => item[g])));
  const y = d3.scaleLinear().domain([0, maxVal * 1.08]).nice().range([iH, 0]);

  const svgSel = d3.select(container).selectAll("svg").data([null]).join("svg")
    .attr("viewBox", `0 0 ${W} ${H}`);

  const g = svgSel.selectAll("g.case-inner").data([null]).join("g")
    .attr("class", "case-inner")
    .attr("transform", `translate(${m.left},${m.top})`);

  // Grid
  g.selectAll(".d3-grid").data(y.ticks(4)).join("line")
    .attr("class", "d3-grid")
    .attr("x1", 0).attr("x2", iW)
    .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
    .attr("stroke", palette.grid);

  // Active case highlight
  g.selectAll(".active-bg").data(items.filter((d) => String(d.label).includes(String(activeUserId))))
    .join("rect").attr("class", "active-bg")
    .attr("x", (d) => xOuter(String(d.label)) - 4)
    .attr("y", 0)
    .attr("width", xOuter.bandwidth() + 8)
    .attr("height", iH + 12)
    .attr("rx", 16)
    .attr("fill", "rgba(129, 226, 216, 0.07)");

  // Grouped bars
  const caseGs = g.selectAll(".case-group").data(items, (d) => d.label)
    .join("g")
    .attr("class", "case-group")
    .attr("transform", (d) => `translate(${xOuter(String(d.label))},0)`)
    .attr("opacity", (d) => String(d.label).includes(String(activeUserId)) ? 1 : 0.6);

  groups.forEach((key, ki) => {
    caseGs.selectAll(`.bar-${ki}`).data((d) => [d], (d) => d.label)
      .join(
        (enter) => enter.append("rect")
          .attr("class", `bar-${ki}`)
          .attr("x", xInner(key)).attr("width", xInner.bandwidth())
          .attr("y", iH).attr("height", 0)
          .attr("rx", 6).attr("fill", colors[ki])
          .call((sel) => sel.transition().duration(700).delay(ki * 80 + 200)
            .attr("y", (d) => y(d[key]))
            .attr("height", (d) => Math.max(iH - y(d[key]), 0))
          ),
        (update) => update.transition().duration(500)
          .attr("y", (d) => y(d[key]))
          .attr("height", (d) => Math.max(iH - y(d[key]), 0))
          .attr("fill", colors[ki]),
        (exit) => exit.transition().duration(280).attr("height", 0).attr("y", iH).remove()
      );
  });

  // X labels
  g.selectAll(".case-label").data(items, (d) => d.label)
    .join("text").attr("class", "case-label axis-label")
    .attr("x", (d) => xOuter(String(d.label)) + xOuter.bandwidth() / 2)
    .attr("y", iH + 22)
    .attr("text-anchor", "middle")
    .attr("opacity", (d) => String(d.label).includes(String(activeUserId)) ? 1 : 0.7)
    .text((d) => d.label);

  // Legend
  const legendG = svgSel.selectAll(".case-legend").data([null]).join("g")
    .attr("class", "case-legend")
    .attr("transform", `translate(${m.left},12)`);

  legendLabels.forEach((lbl, i) => {
    const lx = i * 160;
    legendG.selectAll(`.lg-dot-${i}`).data([null]).join("circle")
      .attr("class", `lg-dot-${i}`)
      .attr("cx", lx).attr("cy", 0).attr("r", 6).attr("fill", colors[i]);
    legendG.selectAll(`.lg-txt-${i}`).data([null]).join("text")
      .attr("class", `lg-txt-${i} axis-label`)
      .attr("x", lx + 14).attr("y", 4).text(lbl);
  });
}

// ─── SVG helpers (used by hero visual) ───────────────────────────────────────

function createSvg(width, height) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  return svg;
}

function createLine(x1, y1, x2, y2, stroke, strokeWidth, opacity = 1) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1); line.setAttribute("y1", y1);
  line.setAttribute("x2", x2); line.setAttribute("y2", y2);
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", strokeWidth);
  line.setAttribute("opacity", opacity);
  line.setAttribute("stroke-linecap", "round");
  return line;
}

function createCircle(cx, cy, r, fill) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx); circle.setAttribute("cy", cy);
  circle.setAttribute("r", r); circle.setAttribute("fill", fill);
  circle.setAttribute("stroke", palette.outline);
  circle.setAttribute("stroke-width", "1.4");
  return circle;
}

function createRing(cx, cy, r) {
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", cx); ring.setAttribute("cy", cy); ring.setAttribute("r", r);
  ring.setAttribute("fill", "none"); ring.setAttribute("stroke", palette.ring);
  ring.setAttribute("stroke-width", "1.4"); ring.setAttribute("stroke-dasharray", "7 8");
  return ring;
}

function createHalo(cx, cy, r) {
  const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  halo.setAttribute("cx", cx); halo.setAttribute("cy", cy); halo.setAttribute("r", r);
  halo.setAttribute("fill", "none");
  halo.setAttribute("stroke", "rgba(183, 133, 62, 0.42)");
  halo.setAttribute("stroke-width", "3");
  return halo;
}

function createText(text, x, y, className, anchor = "start", rotate = 0) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.textContent = text;
  label.setAttribute("x", x); label.setAttribute("y", y);
  label.setAttribute("class", className);
  label.setAttribute("text-anchor", anchor);
  if (rotate !== 0) label.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
  return label;
}

// ─── Graph hint bar ───────────────────────────────────────────────────────────

function setGraphHint(message) {
  const el = document.querySelector("#graph-hint");
  if (el) el.textContent = message;
}

function describeGraphHint(context) {
  if (context.mode === "candidate" && context.candidate) {
    return `Previewing User ${context.candidate.id}. Click to lock the path and update the spotlight.`;
  }
  if (context.mode === "bridge" && context.bridgeId) {
    return `Bridge focus on User ${context.bridgeId}. Click the same bridge again or click the ego node to release.`;
  }
  if (context.mode === "selected" && context.candidate) {
    return `User ${context.candidate.id} is locked in the spotlight. Hover any node to preview, or click a bridge to filter.`;
  }
  return "Hover any node to preview paths. Click a candidate to lock it. Click a bridge to focus the shortlist. Drag nodes to explore.";
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCompact(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function percent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function labelFromFilterId(filterId) {
  return filterId.replace("same_", "").replaceAll("_", " ");
}

function scrollToHashTarget() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  [0, 120, 320].forEach((delay) => {
    window.setTimeout(() => { target.scrollIntoView({ block: "start" }); }, delay);
  });
}
