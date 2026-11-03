/**
 * Travel Footprints / Leaflet + Natural Earth world basemap.
 * Site-specific locations live in assets/data/visited-cities.json.
 * Each boundary can be a same-origin GeoJSON file or a CORS-enabled GeoJSON URL.
 */
(() => {
  "use strict";

  const app = document.getElementById("travel-app");
  if (!app) return;

  const $ = (id) => document.getElementById(id);
  const statusEl = $("travel-map-status");
  const listEl = $("travel-city-list");
  const detailEl = $("travel-detail");
  const searchEl = $("travel-search");
  const demoTipEl = $("travel-demo-tip");
  const cityCountEl = $("travel-city-count");
  const countryCountEl = $("travel-country-count");
  const baseUrl = (app.dataset.baseurl || "").replace(/\/$/, "");
  const WORLD_CENTER = [18, 8];
  const WORLD_ZOOM = 2;
  const WORLD_DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const activeItems = new Map();
  let cities = [];
  let selectedId = null;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
    statusEl.hidden = !message;
  }

  function safeLink(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const text = value.trim();
      const raw = text.startsWith("/assets/") ? baseUrl + text : text;
      const resolved = new URL(raw, window.location.origin + baseUrl + "/");
      return ["https:", "http:"].includes(resolved.protocol) ? resolved.href : null;
    } catch (_error) {
      return null;
    }
  }

  function countryTotal(values) {
    return new Set(values.map((city) => city.country).filter(Boolean)).size;
  }

  function formatTitle(city) {
    return [city.region, city.country].filter(Boolean).join(" · ");
  }

  function updateStatistics() {
    cityCountEl.textContent = String(cities.length);
    countryCountEl.textContent = String(countryTotal(cities));
    demoTipEl.hidden = !cities.some((city) => city.demo === true);
  }

  if (!window.L || !window.topojson) {
    setStatus("地图依赖加载失败。请检查网络连接或 CDN 是否被屏蔽。", true);
    return;
  }

  // A vector-only dark basemap requires no map-tile API key.
  const map = L.map("travel-map", {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: false,
    worldCopyJump: true,
    preferCanvas: false, // SVG markers support CSS glow effects
    minZoom: 2,
    maxZoom: 12,
  }).setView(WORLD_CENTER, WORLD_ZOOM);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  map.attributionControl.addAttribution(
    '<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>'
  );
  const borderPane = map.createPane("visited-polygons");
  borderPane.style.zIndex = "410";
  const markerPane = map.createPane("visited-markers");
  markerPane.style.zIndex = "430";
  L.DomEvent.disableClickPropagation(document.querySelector(".travel-map-toolbar"));

  async function loadWorld() {
    try {
      const response = await fetch(WORLD_DATA_URL);
      if (!response.ok) throw new Error(`World map HTTP ${response.status}`);
      const topology = await response.json();
      const features = topojson.feature(topology, topology.objects.countries);
      L.geoJSON(features, {
        interactive: false,
        smoothFactor: 0.8,
        style: {
          color: "#39465f",
          weight: 0.7,
          fillColor: "#1b2940",
          fillOpacity: 0.96,
          opacity: 0.9,
        },
      }).addTo(map);
      return true;
    } catch (error) {
      console.warn("Could not load the world outline:", error);
      return false;
    }
  }

  function validCity(raw) {
    return (
      raw &&
      typeof raw.id === "string" &&
      typeof raw.name === "string" &&
      Array.isArray(raw.coordinates) &&
      raw.coordinates.length === 2 &&
      raw.coordinates.every((value) => typeof value === "number" && Number.isFinite(value)) &&
      raw.coordinates[0] >= -90 && raw.coordinates[0] <= 90 &&
      raw.coordinates[1] >= -180 && raw.coordinates[1] <= 180
    );
  }

  function renderCityList(keyword = "") {
    listEl.replaceChildren();
    const normalized = keyword.trim().toLocaleLowerCase();
    const matched = cities.filter((city) =>
      [city.name, city.country, city.region, city.category, city.description]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized)
    );

    if (!matched.length) {
      listEl.append(element("p", "travel-list-empty", cities.length ? "没有找到匹配的城市。" : "暂无城市。编辑 visited-cities.json 添加你的第一段足迹。"));
      return;
    }

    matched.forEach((city, index) => {
      const button = element("button", "travel-city-entry");
      button.type = "button";
      button.dataset.cityId = city.id;
      button.classList.toggle("is-active", city.id === selectedId);
      const top = element("span", "travel-entry-top");
      top.append(element("span", "travel-entry-number", String(index + 1).padStart(2, "0")));
      top.append(element("strong", "travel-entry-name", city.name));
      if (city.demo) top.append(element("small", "travel-sample-label", "演示"));
      button.append(top);
      button.append(element("span", "travel-entry-sub", formatTitle(city)));
      if (city.date) button.append(element("span", "travel-entry-date", city.date));
      button.addEventListener("click", () => selectCity(city.id));
      listEl.append(button);
    });
  }

  function renderDetails(city) {
    detailEl.replaceChildren();
    if (!city) {
      detailEl.append(element("p", "travel-detail-empty", "选择一座城市，查看它的故事。"));
      return;
    }
    const heading = element("div", "travel-detail-heading");
    heading.append(element("h4", "", city.name));
    if (city.demo) heading.append(element("span", "travel-detail-demo", "演示记录"));
    detailEl.append(heading);
    detailEl.append(element("p", "travel-detail-location", formatTitle(city)));

    const facts = element("div", "travel-facts");
    if (city.date) facts.append(element("span", "", `📅 ${city.date}`));
    if (city.category) facts.append(element("span", "", `✦ ${city.category}`));
    if (facts.childNodes.length) detailEl.append(facts);

    if (city.description) detailEl.append(element("p", "travel-detail-description", city.description));
    if (Array.isArray(city.photos) && city.photos.length) {
      const gallery = element("div", "travel-gallery");
      city.photos.forEach((src, index) => {
        const link = safeLink(src);
        if (!link) return;
        const anchor = element("a", "travel-gallery-link");
        anchor.href = link;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        const img = element("img");
        img.src = link;
        img.alt = `${city.name}旅行照片 ${index + 1}`;
        img.loading = "lazy";
        anchor.append(img);
        gallery.append(anchor);
      });
      if (gallery.childNodes.length) detailEl.append(gallery);
    }
  }

  function selectCity(id) {
    const city = cities.find((value) => value.id === id);
    if (!city) return;
    selectedId = id;
    renderCityList(searchEl.value);
    renderDetails(city);
    const item = activeItems.get(id);
    if (item?.polygon?.getBounds()?.isValid()) {
      map.flyToBounds(item.polygon.getBounds().pad(0.28), {
        maxZoom: 8,
        duration: 1.1,
      });
    } else {
      map.flyTo(city.coordinates, 8, { duration: 1.1 });
    }
    if (item?.marker) item.marker.openPopup();
  }

  function createPopup(city) {
    const wrapper = element("div", "travel-popup");
    wrapper.append(element("strong", "", city.name));
    wrapper.append(element("span", "", formatTitle(city)));
    if (city.date) wrapper.append(element("small", "", city.date));
    return wrapper;
  }

  async function addCity(city) {
    const item = { marker: null, polygon: null };
    activeItems.set(city.id, item);

    // Marker makes tiny cities discoverable at global scale.
    item.marker = L.circleMarker(city.coordinates, {
      pane: "visited-markers",
      className: "travel-city-dot",
      radius: 6,
      color: "#e5d4ff",
      weight: 2,
      opacity: 1,
      fillColor: "#9980ff",
      fillOpacity: 1,
    }).addTo(map);
    item.marker.bindTooltip(city.name, { direction: "top", offset: [0, -6] });
    item.marker.bindPopup(createPopup(city), { maxWidth: 240 });
    item.marker.on("click", () => selectCity(city.id));

    if (!city.boundary) return false;
    const url = safeLink(city.boundary);
    if (!url) return false;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Boundary HTTP ${response.status}`);
      const geojson = await response.json();
      if (!["Feature", "FeatureCollection", "Polygon", "MultiPolygon"].includes(geojson.type)) {
        throw new Error("Not a supported GeoJSON shape");
      }
      item.polygon = L.geoJSON(geojson, {
        pane: "visited-polygons",
        style: {
          color: "#bbaaff",
          weight: 0.8,
          opacity: 0.88,
          fillColor: "#8065eb",
          fillOpacity: 0.44,
        },
        onEachFeature: (_feature, layer) => {
          layer.on("click", () => selectCity(city.id));
          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.72, weight: 1.2 }));
          layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.44, weight: 0.8 }));
        },
      }).addTo(map);
      // Re-add the marker so it remains clickable above the area polygon.
      item.marker.bringToFront();
      return true;
    } catch (error) {
      console.warn(`Boundary unavailable for ${city.name}:`, error);
      return false;
    }
  }

  async function init() {
    const worldPromise = loadWorld();
    let citiesLoaded = false;
    try {
      const response = await fetch(app.dataset.citiesUrl);
      if (!response.ok) throw new Error(`City records HTTP ${response.status}`);
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error("City records must be a JSON array");
      const ids = new Set();
      cities = records.filter((city) => {
        if (!validCity(city) || ids.has(city.id)) return false;
        ids.add(city.id);
        return true;
      });
      updateStatistics();
      renderCityList();
      citiesLoaded = true;
    } catch (error) {
      console.error("Could not read travel records:", error);
      setStatus("城市数据加载失败，请检查 assets/data/visited-cities.json 格式。", true);
    }

    const worldLoaded = await worldPromise;
    if (!citiesLoaded) return;
    const results = await Promise.allSettled(cities.map(addCity));
    const unavailable = results.filter((result, i) =>
      Boolean(cities[i].boundary) && (result.status !== "fulfilled" || result.value !== true)
    ).length;
    if (unavailable) {
      setStatus(`${unavailable} 座城市的行政边界未能加载；光点仍可点击。请检查 GeoJSON URL 与 CORS。`, true);
    } else if (!worldLoaded) {
      setStatus("世界底图未能加载；仍可查看城市光点和区域，请检查网络。", true);
    } else {
      setStatus("");
    }
    // The page can be hidden in a tab or open from cache; force a layout update.
    requestAnimationFrame(() => map.invalidateSize());
  }

  $("travel-reset").addEventListener("click", () => {
    map.closePopup();
    map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.85 });
  });
  searchEl.addEventListener("input", () => renderCityList(searchEl.value));
  init();
})();
