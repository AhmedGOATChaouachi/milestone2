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

let graphController = null;

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
  if (selected) {
    return selected;
  }

  state.selectedCandidateId = String(visibleCandidates[0].id);
  return visibleCandidates[0];
}

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
        : `No filters are active. The shortlist shows the strongest ${formatCompact(visibleCandidates.length)} candidates by bridge strength and shared traits.`,
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

function renderHeroVisual(selectedCase, visibleCandidates, selectedCandidate) {
  const container = document.querySelector("#hero-visual");
  if (!container) {
    return;
  }

  const width = 520;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const firstRadius = 58;
  const secondRadius = 108;
  const focusCandidate = selectedCandidate || visibleCandidates[0] || selectedCase.candidates[0] || null;
  const focusMutualIds = new Set(focusCandidate ? focusCandidate.mutual_friend_ids : []);
  const firstNodes = [...selectedCase.direct_friends]
    .sort((a, b) => Number(focusMutualIds.has(b.id)) - Number(focusMutualIds.has(a.id)) || b.bridge_count - a.bridge_count || b.degree - a.degree)
    .slice(0, 6);
  const focusBridgeId = firstNodes.find((node) => focusMutualIds.has(node.id))?.id ?? null;
  const secondNodes = [
    ...(focusCandidate ? [focusCandidate] : []),
    ...visibleCandidates
      .filter((candidate) => !focusCandidate || candidate.id !== focusCandidate.id)
      .slice(0, 7),
  ].slice(0, 8);

  const positions = new Map();
  positions.set(selectedCase.user.id, { x: centerX, y: centerY });

  firstNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(firstNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * firstRadius,
      y: centerY + Math.sin(angle) * firstRadius,
    });
  });

  secondNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(secondNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * secondRadius,
      y: centerY + Math.sin(angle) * secondRadius,
    });
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
    const circle = createCircle(target.x, target.y, index === 0 && focusCandidate ? 10 : 8, fill);
    svg.appendChild(circle);

    if (index === 0 && focusCandidate) {
      svg.appendChild(createHalo(target.x, target.y, 15));
      svg.appendChild(createText("reachable", target.x + 18, target.y + 6, "node-label", "start"));
    }
  });

  firstNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const highlighted = focusBridgeId === node.id;
    const circle = createCircle(pos.x, pos.y, highlighted ? 9 : 8, highlighted ? palette.bridge : palette.first);
    svg.appendChild(circle);
    if (highlighted) {
      svg.appendChild(createText("bridge", pos.x + 16, pos.y - 6, "node-label", "start"));
    }
  });

  svg.appendChild(createCircle(centerX, centerY, 16, palette.root));
  svg.appendChild(createText("you", centerX, centerY + 30, "node-label", "middle"));
  container.replaceChildren(svg);
}

function renderGraph(selectedCase, visibleCandidates, selectedCandidate) {
  const width = 1080;
  const height = 760;
  const centerX = width / 2;
  const centerY = height / 2;
  const firstRadius = 170;
  const secondRadius = 325;
  const focusedBridgeId = state.focusedBridgeId ? Number(state.focusedBridgeId) : null;

  const rootNode = selectedCase.user;
  const firstNodes = [...selectedCase.direct_friends].sort((a, b) => b.bridge_count - a.bridge_count || a.id - b.id);
  const secondNodes = visibleCandidates;
  const positions = new Map();
  positions.set(rootNode.id, { x: centerX, y: centerY });

  firstNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(firstNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * firstRadius,
      y: centerY + Math.sin(angle) * firstRadius,
    });
  });

  secondNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(secondNodes.length, 1) - Math.PI / 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * secondRadius,
      y: centerY + Math.sin(angle) * secondRadius,
    });
  });

  const svg = createSvg(width, height);
  svg.appendChild(createRing(centerX, centerY, firstRadius));
  svg.appendChild(createRing(centerX, centerY, secondRadius));
  svg.appendChild(createText("1 hop", centerX, centerY - firstRadius - 10, "ring-label", "middle"));
  svg.appendChild(createText("2 hops", centerX, centerY - secondRadius - 10, "ring-label", "middle"));

  const lineEntries = [];
  const bridgeEntries = [];
  const candidateEntries = [];

  selectedCase.edges.forEach((edge) => {
    if (!positions.has(edge.source) || !positions.has(edge.target)) {
      return;
    }
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    const line = createLine(source.x, source.y, target.x, target.y, palette.muted, 1.3, 0.42);
    svg.appendChild(line);
    lineEntries.push({
      line,
      source: edge.source,
      target: edge.target,
      kind: edge.source === rootNode.id ? "root-bridge" : "bridge-candidate",
    });
  });

  firstNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const circle = createCircle(pos.x, pos.y, 13, palette.first);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${node.label} | ${node.bridge_count} visible bridge path(s)`;
    circle.appendChild(title);
    svg.appendChild(circle);
    const label = createText(`B${node.id}`, pos.x, pos.y - 24, "node-label", "middle");
    label.setAttribute("opacity", "0");
    svg.appendChild(label);

    const hit = createCircle(pos.x, pos.y, 24, "transparent");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("stroke", "transparent");
    hit.style.cursor = "pointer";
    hit.addEventListener("mouseenter", () => applyInteractionState({ kind: "bridge", id: node.id }));
    hit.addEventListener("mouseleave", () => applyInteractionState(null));
    hit.addEventListener("click", () => {
      state.focusedBridgeId = focusedBridgeId === node.id ? null : String(node.id);
      state.selectedCandidateId = null;
      render();
    });
    svg.appendChild(hit);

    bridgeEntries.push({ node, circle, label });
  });

  secondNodes.forEach((node) => {
    const pos = positions.get(node.id);
    const fill = node.shared_attribute_count >= 2 ? palette.secondStrong : palette.second;
    const circle = createCircle(pos.x, pos.y, 12, fill);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${node.label} | ${node.mutual_friends} mutual friend(s) | score ${node.score}`;
    circle.appendChild(title);
    svg.appendChild(circle);
    const halo = createHalo(pos.x, pos.y, 26);
    halo.setAttribute("opacity", "0");
    svg.appendChild(halo);
    const label = createText(`C${node.id}`, pos.x, pos.y + 34, "node-label", "middle");
    label.setAttribute("opacity", "0");
    svg.appendChild(label);

    const hit = createCircle(pos.x, pos.y, 24, "transparent");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("stroke", "transparent");
    hit.style.cursor = "pointer";
    hit.addEventListener("mouseenter", () => applyInteractionState({ kind: "candidate", id: node.id }));
    hit.addEventListener("mouseleave", () => applyInteractionState(null));
    hit.addEventListener("click", () => {
      state.selectedCandidateId = String(node.id);
      render();
    });
    svg.appendChild(hit);

    candidateEntries.push({ node, circle, halo, label, fill });
  });

  const rootCircle = createCircle(centerX, centerY, 30, palette.root);
  svg.appendChild(rootCircle);
  const rootLabel = createText(`A${rootNode.id}`, centerX, centerY + 48, "node-label", "middle");
  svg.appendChild(rootLabel);
  const rootHit = createCircle(centerX, centerY, 34, "transparent");
  rootHit.setAttribute("fill", "transparent");
  rootHit.setAttribute("stroke", "transparent");
  rootHit.style.cursor = "pointer";
  rootHit.addEventListener("click", () => {
    state.focusedBridgeId = null;
    render();
  });
  svg.appendChild(rootHit);
  svg.appendChild(createLegend(width - 220, 48));
  document.querySelector("#graph").replaceChildren(svg);

  graphController = {
    previewBridge(id) {
      applyInteractionState({ kind: "bridge", id });
    },
    previewCandidate(id) {
      applyInteractionState({ kind: "candidate", id });
    },
    clear() {
      applyInteractionState(null);
    },
  };

  applyInteractionState(null);

  function applyInteractionState(hover) {
    const context = getGraphInteractionContext(hover);

    lineEntries.forEach((entry) => {
      const isHighlighted =
        entry.kind === "root-bridge"
          ? context.bridgeIds.has(entry.target)
          : context.bridgeIds.has(entry.source) && context.candidateIds.has(entry.target);
      entry.line.setAttribute("stroke", isHighlighted ? palette.bridge : palette.muted);
      entry.line.setAttribute("stroke-width", isHighlighted ? "3.2" : "1.2");
      entry.line.setAttribute("opacity", context.mode === "none" ? "0.4" : isHighlighted ? "0.96" : "0.08");
    });

    bridgeEntries.forEach((entry) => {
      const active = context.bridgeIds.has(entry.node.id);
      entry.circle.setAttribute("fill", active ? palette.bridge : palette.first);
      entry.circle.setAttribute("r", active ? "17" : "13");
      entry.circle.setAttribute("opacity", context.mode === "none" ? "0.95" : active ? "1" : "0.48");
      entry.label.setAttribute("opacity", active ? "1" : "0");
    });

    candidateEntries.forEach((entry) => {
      const active = context.candidateIds.has(entry.node.id);
      const locked = selectedCandidate && entry.node.id === selectedCandidate.id;
      entry.circle.setAttribute("fill", entry.fill);
      entry.circle.setAttribute("r", active ? "18" : locked ? "15" : "12");
      entry.circle.setAttribute("opacity", context.mode === "none" ? "0.95" : active ? "1" : "0.34");
      entry.halo.setAttribute("opacity", active || (locked && context.mode === "selected") ? "1" : "0");
      entry.label.setAttribute("opacity", active || (locked && context.mode === "selected") ? "1" : "0");
    });

    rootCircle.setAttribute("opacity", context.mode === "none" ? "1" : "0.96");
    rootLabel.setAttribute("opacity", "1");
    setGraphHint(describeGraphHint(context));
    syncInteractionPanels(selectedCase, visibleCandidates, selectedCandidate, context);
  }

  function getGraphInteractionContext(hover) {
    if (hover && hover.kind === "candidate") {
      const candidate = secondNodes.find((node) => node.id === hover.id);
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
          secondNodes.filter((candidate) => candidate.mutual_friend_ids.includes(bridgeId)).map((candidate) => candidate.id)
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

    return {
      mode: "none",
      bridgeIds: new Set(),
      candidateIds: new Set(),
      bridgeId: null,
      candidate: null,
    };
  }
}

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
  if (selectedCandidate.same_country) {
    reasons.push("same country");
  }
  if (selectedCandidate.same_age_group) {
    reasons.push("same age group");
  }
  if (!reasons.length) {
    reasons.push("structural reach through mutual friends only");
  }

  card.innerHTML = `
    <strong>${isPreview ? "Previewed path" : "Path explanation"}</strong>
    <p>
      User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through
      ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}.
      This candidate stays interesting because of ${reasons.join(" and ")}.
    </p>
    <div class="detail-meta">
      <span class="chip blue">${formatCompact(visibleCandidates.length)} visible candidates</span>
      <span class="chip">${formatCompact(selectedCase.summary.second_degree_count)} total second-degree candidates</span>
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
    empty.innerHTML = `<strong>No visible candidates</strong><p>The current filter combination removes all second-degree matches from the shortlist.</p>`;
    container.appendChild(empty);
    return;
  }

  const maxScore = Math.max(...visibleCandidates.map((candidate) => candidate.score), 1);

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

function renderAtlas(selectedCase, visibleCandidates, selectedCandidate) {
  renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, {
    mode: selectedCandidate ? "selected" : "none",
    candidate: selectedCandidate,
    bridgeId: state.focusedBridgeId ? Number(state.focusedBridgeId) : null,
  });
  renderGroupedCaseChart("#chart-cases", data.charts.prototype_case_sizes, selectedCase.user.id);
  renderVerticalBars("#chart-degree", data.charts.degree_histogram, palette.first);
  renderVerticalBars("#chart-second", data.charts.second_degree_histogram, palette.second);
  renderVerticalBars("#chart-shared", data.charts.shared_attribute_histogram, palette.amber);
  renderVerticalBars("#chart-age", data.charts.age_group_distribution, palette.root);
  renderVerticalBars("#chart-countries", data.charts.top_countries, palette.violet);
}

function renderAtlasFocus(selectedCase, visibleCandidates, selectedCandidate, context = { mode: "none", bridgeId: null }) {
  const container = document.querySelector("#atlas-focus");
  if (!container) {
    return;
  }

  const label =
    context.mode === "candidate"
      ? "Hover Preview"
      : context.mode === "bridge"
        ? "Bridge Focus"
        : "Live Case";

  const card = document.createElement("article");
  card.className = "atlas-focus-card";
  card.innerHTML = `
    <p class="eyebrow">${label}</p>
    <strong>User ${selectedCase.user.id}${selectedCandidate ? ` -> User ${selectedCandidate.id}` : ""}</strong>
    <p>${selectedCase.user.country || "unknown"} / ${selectedCase.user.age_group || "unknown"} / ${formatCompact(selectedCase.summary.second_degree_count)} total second-degree candidates</p>
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
  const stageTitle = document.querySelector("#stage-title");
  if (!stageTitle) {
    return;
  }

  if (context.mode === "candidate" && context.candidate) {
    stageTitle.textContent = `Previewing User ${selectedCase.user.id} -> User ${context.candidate.id} through ${context.candidate.mutual_friends} mutual friend${context.candidate.mutual_friends === 1 ? "" : "s"}`;
    return;
  }

  if (context.mode === "bridge" && context.bridgeId) {
    const visibleCount = context.candidateIds ? context.candidateIds.size : 0;
    stageTitle.textContent = `Bridge User ${context.bridgeId} opens ${visibleCount} visible second-degree candidate${visibleCount === 1 ? "" : "s"}`;
    return;
  }

  if (selectedCandidate) {
    stageTitle.textContent = `User ${selectedCase.user.id} reaches User ${selectedCandidate.id} through ${selectedCandidate.mutual_friends} mutual friend${selectedCandidate.mutual_friends === 1 ? "" : "s"}`;
    return;
  }

  stageTitle.textContent = "No visible second-degree candidates for the current filter combination";
}

function renderVerticalBars(selector, items, color) {
  const width = 520;
  const height = 320;
  const margin = { top: 20, right: 12, bottom: 76, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const barWidth = innerWidth / items.length;
  const svg = createSvg(width, height);

  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + (innerHeight / 4) * i;
    svg.appendChild(createLine(margin.left, y, width - margin.right, y, palette.grid, 1, 1));
  }

  items.forEach((item, index) => {
    const x = margin.left + index * barWidth + barWidth * 0.14;
    const actualBarWidth = barWidth * 0.72;
    const barHeight = (item.value / maxValue) * innerHeight;
    const y = margin.top + innerHeight - barHeight;

    svg.appendChild(createRect(x, y, actualBarWidth, barHeight, color, 10));
    if (items.length <= 10) {
      svg.appendChild(createText(String(item.label), x + actualBarWidth / 2, height - 18, "axis-label", "middle", -24));
    }
  });

  document.querySelector(selector).replaceChildren(svg);
}

function renderGroupedCaseChart(selector, items, activeUserId) {
  const width = 1120;
  const height = 360;
  const margin = { top: 24, right: 18, bottom: 58, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const groups = ["direct_friends", "second_degree_count", "same_country_second_degree", "same_age_group_second_degree", "same_both_second_degree"];
  const colors = [palette.first, palette.second, palette.root, palette.amber, palette.bridge];
  const maxValue = Math.max(...items.flatMap((item) => groups.map((group) => item[group])), 1);
  const groupWidth = innerWidth / items.length;
  const barWidth = groupWidth / groups.length;
  const svg = createSvg(width, height);

  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + (innerHeight / 4) * i;
    svg.appendChild(createLine(margin.left, y, width - margin.right, y, palette.grid, 1, 1));
  }

  items.forEach((item, groupIndex) => {
    const baseX = margin.left + groupIndex * groupWidth;
    const isActive = String(item.label).includes(String(activeUserId));
    if (isActive) {
      svg.appendChild(createRect(baseX + 4, margin.top + 8, groupWidth - 8, innerHeight + 18, "rgba(129, 226, 216, 0.08)", 18));
    }
    groups.forEach((group, index) => {
      const x = baseX + index * barWidth + barWidth * 0.15;
      const actualBarWidth = barWidth * 0.68;
      const value = item[group];
      const barHeight = (value / maxValue) * innerHeight;
      const y = margin.top + innerHeight - barHeight;
      const rect = createRect(x, y, actualBarWidth, barHeight, colors[index], 8);
      rect.setAttribute("opacity", isActive ? "1" : "0.55");
      svg.appendChild(rect);
    });
    const label = createText(item.label, baseX + groupWidth / 2, height - 16, "axis-label", "middle");
    label.setAttribute("opacity", isActive ? "1" : "0.72");
    svg.appendChild(label);
  });

  const legend = [
    ["direct", colors[0]],
    ["second", colors[1]],
    ["same country", colors[2]],
    ["same age", colors[3]],
    ["both", colors[4]],
  ];
  legend.forEach(([label, color], index) => {
    const x = margin.left + index * 160;
    const y = 18;
    svg.appendChild(createCircle(x, y, 6, color));
    svg.appendChild(createText(label, x + 14, y + 4, "axis-label", "start"));
  });

  document.querySelector(selector).replaceChildren(svg);
}

function createLegend(x, y) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  [
    ["ego user", palette.root],
    ["direct friend", palette.first],
    ["candidate", palette.second],
    ["strong trait match", palette.secondStrong],
    ["selected path", palette.bridge],
  ].forEach(([label, color], index) => {
    const cy = y + index * 24;
    group.appendChild(createCircle(x, cy, 6, color));
    group.appendChild(createText(label, x + 16, cy + 4, "axis-label", "start"));
  });
  return group;
}

function createSvg(width, height) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  return svg;
}

function createRect(x, y, width, height, fill, radius = 0) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", Math.max(width, 0));
  rect.setAttribute("height", Math.max(height, 0));
  rect.setAttribute("rx", radius);
  rect.setAttribute("fill", fill);
  return rect;
}

function createLine(x1, y1, x2, y2, stroke, strokeWidth, opacity = 1) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", strokeWidth);
  line.setAttribute("opacity", opacity);
  line.setAttribute("stroke-linecap", "round");
  return line;
}

function createCircle(cx, cy, r, fill) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", fill);
  circle.setAttribute("stroke", palette.outline);
  circle.setAttribute("stroke-width", "1.4");
  return circle;
}

function createRing(cx, cy, r) {
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", cx);
  ring.setAttribute("cy", cy);
  ring.setAttribute("r", r);
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", palette.ring);
  ring.setAttribute("stroke-width", "1.4");
  ring.setAttribute("stroke-dasharray", "7 8");
  return ring;
}

function createHalo(cx, cy, r) {
  const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  halo.setAttribute("cx", cx);
  halo.setAttribute("cy", cy);
  halo.setAttribute("r", r);
  halo.setAttribute("fill", "none");
  halo.setAttribute("stroke", "rgba(183, 133, 62, 0.42)");
  halo.setAttribute("stroke-width", "3");
  return halo;
}

function createText(text, x, y, className, anchor = "start", rotate = 0) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.textContent = text;
  label.setAttribute("x", x);
  label.setAttribute("y", y);
  label.setAttribute("class", className);
  label.setAttribute("text-anchor", anchor);
  if (rotate !== 0) {
    label.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
  }
  return label;
}

function setGraphHint(message) {
  const container = document.querySelector("#graph-hint");
  if (!container) {
    return;
  }
  container.textContent = message;
}

function describeGraphHint(context) {
  if (context.mode === "candidate" && context.candidate) {
    return `Previewing User ${context.candidate.id}. Click this candidate to lock the path and update the spotlight.`;
  }

  if (context.mode === "bridge" && context.bridgeId) {
    return `Bridge focus is on User ${context.bridgeId}. Click the same bridge again, or click the center node, to release the focus.`;
  }

  if (context.mode === "selected" && context.candidate) {
    return `User ${context.candidate.id} is locked in the spotlight. Hover any node to preview another path, or click a bridge to focus the shortlist on that friend.`;
  }

  return "Hover any bridge or candidate node to preview paths. Click a candidate to lock it, or click a bridge friend to focus the shortlist on one social path.";
}

function formatCompact(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function percent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function labelFromFilterId(filterId) {
  return filterId.replace("same_", "").replaceAll("_", " ");
}

function distributeY(count, start, end) {
  if (count <= 1) {
    return [(start + end) / 2];
  }

  const span = end - start;
  return Array.from({ length: count }, (_, index) => start + (span * index) / (count - 1));
}

function scrollToHashTarget() {
  if (!window.location.hash) {
    return;
  }

  const target = document.querySelector(window.location.hash);
  if (!target) {
    return;
  }

  [0, 120, 320].forEach((delay) => {
    window.setTimeout(() => {
      target.scrollIntoView({ block: "start" });
    }, delay);
  });
}
