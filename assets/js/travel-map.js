/* Travel Map · Leaflet + MapLibre/OpenFreeMap + local GeoJSON city footprints */
(() => {
  "use strict";

  const app = document.getElementById("travel-app");
  if (!app) return;
  const $ = (id) => document.getElementById(id);
  const ui = {
    map: $("ft-map"), status: $("ft-map-status"), demo: $("ft-demo-notice"),
    cityCount: $("ft-city-count"), countryCount: $("ft-country-count"),
    visibleCount: $("ft-visible-count"), list: $("ft-city-list"),
    detail: $("ft-detail"), search: $("ft-search"),
    yearRange: $("ft-year-range"), yearLabel: $("ft-year-label"),
    yearMin: $("ft-year-min"), yearMax: $("ft-year-max"),
    worldView: $("ft-world-view"), chinaView: $("ft-china-view"),
    fitVisited: $("ft-fit-visited"), timeline: $("ft-timeline"),
  };
  const baseurl = (app.dataset.baseurl || "").replace(/\/$/, "");
  const WORLD_BOUNDS = [[-58, -179], [77, 179]];
  const CHINA_BOUNDS = [[17, 73], [54, 135]];
  const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
  const activeItems = new Map();
  const cachedBoundaries = new Map();
  let cities = [];
  let filteredByYear = [];
  let years = [];
  let selectedId = null;
  let map = null;
  let baseMapReady = false;

  const make = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = String(value);
    return el;
  };
  function status(message, error = false) {
    ui.status.textContent = message || "";
    ui.status.classList.toggle("is-error", error);
    ui.status.hidden = !message;
  }
  function resolveAsset(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const candidate = value.startsWith("/assets/") ? `${baseurl}${value}` : value;
      const url = new URL(candidate, window.location.origin + baseurl + "/");
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch (_e) { return null; }
  }
  function validCity(city) {
    return city && typeof city.id === "string" && !!city.id.trim() &&
      typeof city.name === "string" && !!city.name.trim() &&
      Array.isArray(city.coordinates) && city.coordinates.length === 2 &&
      city.coordinates.every((n) => typeof n === "number" && Number.isFinite(n)) &&
      Math.abs(city.coordinates[0]) <= 90 && Math.abs(city.coordinates[1]) <= 180;
  }
  const cityYear = (city) => {
    const match = typeof city.date === "string" && city.date.match(/^(\d{4})/);
    return match ? Number(match[1]) : null;
  };
  const citySubtitle = (city) => [city.region, city.country].filter(Boolean).join(" · ");
  const countryCount = (group) => new Set(group.map((city) => city.country).filter(Boolean)).size;

  function showWorld(animated = true) {
    if (!map) return;
    map.invalidateSize();
    map.fitBounds(WORLD_BOUNDS, { padding: [12, 12], maxZoom: 2.5, animate: animated });
    viewButton("world");
  }
  function showChina(animated = true) {
    if (!map) return;
    map.invalidateSize();
    map.fitBounds(CHINA_BOUNDS, { padding: [16, 16], maxZoom: 5, animate: animated });
    viewButton("china");
  }
  function showVisited(animated = true) {
    if (!map) return;
    const points = filteredByYear.map((city) => city.coordinates);
    if (!points.length) return showWorld(animated);
    if (points.length === 1) {
      map.flyTo(points[0], 6, { animate: animated, duration: 0.9 });
    } else {
      // Fit all visited cities, and leave substantial padding for their polygons.
      map.fitBounds(L.latLngBounds(points).pad(0.48), {
        padding: [20, 20], maxZoom: 6, animate: animated,
      });
    }
    viewButton("visited");
  }
  function viewButton(which) {
    [ui.worldView, ui.chinaView, ui.fitVisited].forEach((el) => el.classList.remove("is-active"));
    const el = { world: ui.worldView, china: ui.chinaView, visited: ui.fitVisited }[which];
    if (el) el.classList.add("is-active");
  }
  function buildMap() {
    if (!window.L) {
      status("Leaflet 未加载。请检查网络连接是否阻止了 CDN。", true);
      return false;
    }
    map = L.map(ui.map, {
      zoomControl: false, attributionControl: true, scrollWheelZoom: false,
      preferCanvas: false, zoomSnap: 0.25, zoomDelta: 0.5,
      minZoom: 1, maxZoom: 16, worldCopyJump: false,
      maxBounds: [[-85, -540], [85, 540]], maxBoundsViscosity: 0.7,
    }).setView([23, 105], 3);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.attributionControl.setPrefix(false);

    map.createPane("ft-boundaries").style.zIndex = "410";
    map.createPane("ft-markers").style.zIndex = "630";
    map.createPane("ft-labels").style.zIndex = "640";
    for (const id of ["ft-world-view", "ft-china-view", "ft-fit-visited", "ft-timeline"]) {
      L.DomEvent.disableClickPropagation($(id));
      L.DomEvent.disableScrollPropagation($(id));
    }
    const glAvailable = !!(window.maplibregl && typeof L.maplibreGL === "function" &&
      typeof window.maplibregl.supported === "function" && window.maplibregl.supported());

    if (glAvailable) {
      try {
        const layer = L.maplibreGL({ style: STYLE_URL, interactive: false });
        layer.addTo(map);
        const glMap = layer.getMaplibreMap();
        glMap.on("load", () => {
          baseMapReady = true;
          if (ui.status.textContent === "正在加载足迹城市…") status("");
        });
        glMap.on("error", (event) => {
          if (!baseMapReady && event?.error) status("矢量地图暂时无法连接，城市区域仍可查看。", true);
        });
      } catch (err) {
        console.warn("MapLibre layer failed:", err);
        addRasterFallback();
      }
    } else {
      addRasterFallback();
    }
    // Keep base-map provider attribution visible even if the style lacks it.
    map.attributionControl.addAttribution(
      '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'
    );
    window.addEventListener("resize", () => map.invalidateSize());
    return true;
  }
  function addRasterFallback() {
    // A CSS-free fallback for older browsers / no WebGL. Can be removed if undesired.
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19, attribution: '© <a href="https://carto.com/">CARTO</a>',
      errorTileUrl: "",
    }).addTo(map);
    baseMapReady = true;
  }
  function popupNode(city) {
    const node = make("div", "ft-popup");
    node.append(make("strong", "", city.name));
    if (citySubtitle(city)) node.append(make("span", "", citySubtitle(city)));
    if (city.date) node.append(make("small", "", city.date));
    return node;
  }
  function addMarker(city) {
    // Marker is still useful in global view, where a whole city is sub-pixel.
    const marker = L.circleMarker(city.coordinates, {
      pane: "ft-markers", className: "ft-map-dot", radius: 6,
      weight: 2.2, color: "#d1ffff", opacity: 1,
      fillColor: "#10d8e5", fillOpacity: 0.98,
    }).addTo(map);
    marker.bindTooltip(city.name, { direction: "top", offset: [0, -8] });
    marker.bindPopup(popupNode(city), { maxWidth: 250 });
    marker.on("click", () => selectCity(city.id, false));
    const label = L.marker(city.coordinates, {
      pane: "ft-labels", interactive: false, keyboard: false,
      icon: L.divIcon({ className: "ft-map-label", html: "", iconSize: [0, 0] }),
    }).addTo(map);
    // Use textContent instead of HTML interpolation to prevent injected markup.
    if (label.getElement()) label.getElement().textContent = city.name;
    activeItems.set(city.id, { marker, label, polygon: null });
  }
  async function addBoundary(city) {
    if (!city.boundary) return;
    const url = resolveAsset(city.boundary);
    if (!url) { console.warn("Invalid boundary URL", city.id); return; }
    try {
      let json = cachedBoundaries.get(url);
      if (!json) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
        if (!["Feature", "FeatureCollection", "Polygon", "MultiPolygon"].includes(json.type)) {
          throw new Error("Invalid GeoJSON type");
        }
        cachedBoundaries.set(url, json);
      }
      const layer = L.geoJSON(json, {
        pane: "ft-boundaries", interactive: true, smoothFactor: 0.35,
        style: {
          color: "#69f3ff", weight: 1.45, opacity: 0.95,
          fillColor: "#13d1de", fillOpacity: 0.47,
        },
        onEachFeature: (_feature, area) => {
          area.on("click", () => selectCity(city.id, false));
          area.on("mouseover", () => {
            area.setStyle({ fillOpacity: 0.70, weight: 2.1 });
          });
          area.on("mouseout", () => {
            area.setStyle({ fillOpacity: 0.47, weight: 1.45 });
          });
        },
      }).addTo(map);
      activeItems.get(city.id).polygon = layer;
      if (!filteredByYear.some((value) => value.id === city.id)) map.removeLayer(layer);
      else activeItems.get(city.id).marker.bringToFront();
    } catch (err) {
      console.warn(`Failed to load boundary for ${city.name}:`, err);
      return false;
    }
    return true;
  }
  function renderList() {
    const keyword = ui.search.value.trim().toLocaleLowerCase();
    ui.list.replaceChildren();
    const shown = filteredByYear.filter((city) =>
      [city.name, city.region, city.country, city.category, city.description]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(keyword)
    );
    ui.visibleCount.textContent = String(shown.length);
    if (!shown.length) {
      ui.list.append(make("p", "ft-empty", "没有符合条件的城市，试着更换关键词或年份。"));
      return;
    }
    shown.forEach((city, idx) => {
      const card = make("button", "ft-city-card");
      card.type = "button";
      card.dataset.cityId = city.id;
      card.classList.toggle("is-selected", city.id === selectedId);
      const head = make("span", "ft-city-card-top");
      head.append(make("span", "ft-city-no", String(idx + 1).padStart(2, "0")));
      head.append(make("strong", "ft-city-name", city.name));
      if (city.demo) head.append(make("span", "ft-demo-tag", "演示"));
      card.append(head);
      card.append(make("span", "ft-city-meta", citySubtitle(city)));
      if (city.date) card.append(make("span", "ft-city-date", city.date));
      card.addEventListener("click", () => selectCity(city.id));
      ui.list.append(card);
    });
  }
  function renderDetail(city) {
    ui.detail.replaceChildren();
    if (!city) {
      ui.detail.append(make("p", "ft-empty", "点击城市或区域，查看旅行故事。"));
      return;
    }
    const title = make("div", "ft-detail-title");
    title.append(make("h4", "", city.name));
    if (city.demo) title.append(make("span", "ft-detail-demo", "演示记录"));
    ui.detail.append(title);
    ui.detail.append(make("p", "ft-detail-subtitle", citySubtitle(city)));
    const info = make("div", "ft-detail-info");
    if (city.date) info.append(make("span", "", `📅 ${city.date}`));
    if (city.category) info.append(make("span", "", city.category));
    if (info.childNodes.length) ui.detail.append(info);
    if (city.description) ui.detail.append(make("p", "ft-detail-description", city.description));
    if (Array.isArray(city.photos) && city.photos.length) {
      const gallery = make("div", "ft-gallery");
      city.photos.forEach((photo, index) => {
        const src = resolveAsset(photo);
        if (!src) return;
        const a = make("a", "ft-photo");
        a.href = src;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        const img = make("img");
        img.src = src; img.alt = `${city.name}旅行照片 ${index + 1}`;
        img.loading = "lazy";
        a.append(img); gallery.append(a);
      });
      if (gallery.childNodes.length) ui.detail.append(gallery);
    }
  }
  function selectCity(id, fly = true) {
    const city = filteredByYear.find((c) => c.id === id);
    if (!city) return;
    selectedId = id;
    renderList();
    renderDetail(city);
    const item = activeItems.get(id);
    if (item?.polygon) {
      item.polygon.bringToFront();
      if (fly && item.polygon.getBounds().isValid()) {
        map.flyToBounds(item.polygon.getBounds().pad(0.38), { maxZoom: 9, duration: 0.9 });
      }
    } else if (fly) {
      map.flyTo(city.coordinates, 8, { duration: 0.9 });
    }
    if (item?.marker) {
      item.marker.bringToFront();
      if (fly) item.marker.openPopup();
    }
    viewButton(null);
  }
  function setYear() {
    const index = Number(ui.yearRange.value);
    const year = index < years.length ? years[index] : null;
    ui.yearLabel.textContent = year === null ? "全部年份" : `截至 ${year} 年`;
    filteredByYear = year === null ? [...cities] : cities.filter((c) => {
      const y = cityYear(c);
      return y === null || y <= year;
    });
    const ids = new Set(filteredByYear.map((c) => c.id));
    activeItems.forEach((item, id) => {
      const visible = ids.has(id);
      [item.marker, item.label, item.polygon].filter(Boolean).forEach((layer) => {
        const onMap = map.hasLayer(layer);
        if (visible && !onMap) layer.addTo(map);
        if (!visible && onMap) map.removeLayer(layer);
      });
    });
    if (selectedId && !ids.has(selectedId)) {
      selectedId = null;
      map.closePopup();
      renderDetail(null);
    }
    ui.cityCount.textContent = String(filteredByYear.length);
    ui.countryCount.textContent = String(countryCount(filteredByYear));
    renderList();
  }
  function updateLabelVisibility() {
    if (!map) return;
    const zoom = map.getZoom();
    // Labels supplement the base-map labels and remain readable above cyan polygons.
    activeItems.forEach((item) => {
      if (item.label?.getElement()) item.label.getElement().classList.toggle("is-visible", zoom >= 4.2);
      if (item.marker?.setRadius) item.marker.setRadius(zoom < 4.2 ? 5.8 : 4.2);
    });
  }
  async function init() {
    if (!buildMap()) return;
    status("正在加载足迹城市…");
    try {
      const response = await fetch(app.dataset.citiesUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("visited-cities.json 必须是数组");
      const seen = new Set();
      cities = data.filter((city) => {
        if (!validCity(city) || seen.has(city.id)) return false;
        seen.add(city.id);
        return true;
      });
    } catch (err) {
      console.error("Cannot load travel cities:", err);
      status("无法读取 visited-cities.json。请检查文件路径与 JSON 语法。", true);
      return;
    }
    ui.demo.hidden = !cities.some((c) => c.demo === true);
    years = [...new Set(cities.map(cityYear).filter(Number.isFinite))].sort((a, b) => a - b);
    ui.timeline.hidden = !years.length;
    ui.yearRange.min = "0";
    ui.yearRange.max = String(years.length);
    ui.yearRange.value = String(years.length);
    ui.yearMin.textContent = years.length ? String(years[0]) : "—";
    ui.yearMax.textContent = "全部";
    cities.forEach(addMarker);
    setYear();
    map.on("zoomend", updateLabelVisibility);
    updateLabelVisibility();
    const results = await Promise.allSettled(cities.map(addBoundary));
    const missing = results.filter((result, i) => !!cities[i].boundary &&
      (result.status !== "fulfilled" || result.value !== true)).length;
    if (missing) status(`${missing} 个城市的边界加载失败，仅显示城市光点。请检查本地 GeoJSON 文件。`, true);
    else status("");
    requestAnimationFrame(() => {
      map.invalidateSize();
      // China is the most useful initial view for the two sample cities.
      if (cities.length && cities.every((c) => c.country === "中国")) showChina(false);
      else showWorld(false);
      updateLabelVisibility();
    });
  }
  ui.worldView.addEventListener("click", () => showWorld());
  ui.chinaView.addEventListener("click", () => showChina());
  ui.fitVisited.addEventListener("click", () => showVisited());
  ui.search.addEventListener("input", renderList);
  ui.yearRange.addEventListener("input", () => {
    setYear();
    updateLabelVisibility();
  });
  init();
})();
