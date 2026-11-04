/* Footprints: one MapLibre map, backed by OpenFreeMap and local GeoJSON. */
(() => {
  "use strict";
  const app = document.getElementById("travel-app");
  if (!app) return;
  const $ = (id) => document.getElementById(id);
  const base = (app.dataset.baseurl || "").replace(/\/$/, "");
  const ui = { status: $("ft-map-status"), setup: $("ft-setup-notice"), list: $("ft-city-list"), detail: $("ft-detail"), search: $("ft-search"), slider: $("ft-year-range") };
  let cities = [], visible = [], years = [], selected = null, hovered = null, map = null, ready = false;
  const boundaries = new Map(), markers = new Map();
  const make = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  const asset = (path) => {
    if (typeof path !== "string" || !path.trim()) return null;
    try { const url = new URL(path.startsWith("/assets/") ? base + path : path, location.origin + base + "/"); return url.protocol === "https:" || (url.origin === location.origin && url.protocol === "http:") ? url.href : null; } catch { return null; }
  };
  const year = (city) => { const m = String(city.date || "").match(/^(\d{4})/); return m ? Number(m[1]) : null; };
  const subtitle = (city) => [city.region, city.country].filter(Boolean).join(" · ");
  function status(message, error = false) { ui.status.textContent = message; ui.status.hidden = !message; ui.status.classList.toggle("is-error", error); }
  function details(city) {
    ui.detail.replaceChildren();
    if (!city) { ui.detail.append(make("p", "ft-empty", "选择地图上的区域或城市卡片，查看旅行记录。")); return; }
    const title = make("div", "ft-detail-title"); title.append(make("h4", "", city.name));
    if (city.demo) title.append(make("span", "ft-detail-demo", "演示记录"));
    ui.detail.append(title, make("p", "ft-detail-subtitle", subtitle(city)));
    const tags = make("div", "ft-detail-info");
    if (city.date) tags.append(make("span", "", `📅 ${city.date}`));
    if (city.category) tags.append(make("span", "", city.category));
    ui.detail.append(tags);
    if (city.description) ui.detail.append(make("p", "ft-detail-description", city.description));
    const gallery = make("div", "ft-gallery");
    (Array.isArray(city.photos) ? city.photos : []).forEach((photo, i) => {
      const url = asset(photo); if (!url) return;
      const link = make("a", "ft-photo"), img = make("img"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; img.src = url; img.alt = `${city.name}旅行照片 ${i + 1}`; img.loading = "lazy"; link.append(img); gallery.append(link);
    });
    if (gallery.childNodes.length) ui.detail.append(gallery);
  }
  function list() {
    ui.list.replaceChildren();
    const query = ui.search.value.trim().toLocaleLowerCase();
    const shown = visible.filter((city) => [city.name, city.region, city.country, city.category, city.description].filter(Boolean).join(" ").toLocaleLowerCase().includes(query));
    $("ft-visible-count").textContent = shown.length;
    if (!shown.length) ui.list.append(make("p", "ft-empty", "没有符合条件的城市。调整关键词或年份试试。"));
    shown.forEach((city, i) => {
      const card = make("button", "ft-city-card"); card.type = "button"; card.classList.toggle("is-selected", selected === city.id);
      const head = make("span", "ft-city-card-top"); head.append(make("span", "ft-city-no", String(i + 1).padStart(2, "0")), make("strong", "ft-city-name", city.name));
      if (city.demo) head.append(make("span", "ft-demo-tag", "演示"));
      card.append(head, make("span", "ft-city-meta", subtitle(city))); if (city.date) card.append(make("span", "ft-city-date", city.date));
      card.addEventListener("click", () => select(city.id, true)); ui.list.append(card);
    });
  }
  function collection() {
    const features = [];
    visible.forEach((city) => {
      const geo = boundaries.get(city.id); if (!geo) return;
      const parts = geo.type === "FeatureCollection" ? geo.features : geo.type === "Feature" ? [geo] : [{ geometry: geo }];
      parts.forEach((part) => { if (["Polygon", "MultiPolygon"].includes(part.geometry?.type)) features.push({ type: "Feature", properties: { id: city.id }, geometry: part.geometry }); });
    });
    return { type: "FeatureCollection", features };
  }
  function update() {
    const index = Number(ui.slider.value), until = index < years.length ? years[index] : null;
    $("ft-year-label").textContent = until === null ? "全部年份" : `截至 ${until} 年`;
    visible = until === null ? [...cities] : cities.filter((c) => year(c) === null || year(c) <= until);
    $("ft-city-count").textContent = visible.length;
    $("ft-country-count").textContent = new Set(visible.map((c) => c.countryCode || c.country).filter(Boolean)).size;
    if (selected && !visible.some((c) => c.id === selected)) { selected = null; details(null); }
    list(); refreshMap();
  }
  function refreshMap() {
    if (!ready) return;
    map.getSource("footprints").setData(collection());
    const ids = new Set(visible.map((c) => c.id));
    markers.forEach((marker, id) => { marker.hidden = !ids.has(id); marker.classList.toggle("is-selected", id === selected); });
    for (const layer of ["footprints-fill", "footprints-edge", "footprints-glow"]) if (map.getLayer(layer)) map.setPaintProperty(layer, layer === "footprints-fill" ? "fill-opacity" : "line-opacity", ["case", ["==", ["get", "id"], selected || ""], layer === "footprints-fill" ? 0.65 : 1, ["==", ["get", "id"], hovered || ""], layer === "footprints-fill" ? 0.56 : 0.95, layer === "footprints-fill" ? 0.43 : layer === "footprints-glow" ? 0.22 : 0.8]);
  }
  function boundsFor(city) {
    const geo = boundaries.get(city.id); let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    function scan(node) { if (!Array.isArray(node)) return; if (typeof node[0] === "number" && typeof node[1] === "number") { west = Math.min(west, node[0]); east = Math.max(east, node[0]); south = Math.min(south, node[1]); north = Math.max(north, node[1]); } else node.forEach(scan); }
    if (geo) (geo.type === "FeatureCollection" ? geo.features : [geo]).forEach((f) => scan((f.geometry || f).coordinates));
    return Number.isFinite(west) && east - west < 180 ? [[west, south], [east, north]] : [[city.coordinates[1], city.coordinates[0]], [city.coordinates[1], city.coordinates[0]]];
  }
  function select(id, fly) {
    const city = visible.find((c) => c.id === id); if (!city) return;
    selected = id; list(); details(city); refreshMap();
    if (fly && ready) map.fitBounds(boundsFor(city), { padding: 70, maxZoom: 9, duration: 700 });
  }
  function fitVisited() {
    if (!ready || !visible.length) return;
    const bounds = visible.map(boundsFor), west = Math.min(...bounds.map((b) => b[0][0])), east = Math.max(...bounds.map((b) => b[1][0]));
    // A world view is safer than an ambiguous bounding box across the antimeridian.
    if (east - west > 180) { map.flyTo({ center: [0, 20], zoom: 1.2 }); return; }
    map.fitBounds([[west, Math.min(...bounds.map((b) => b[0][1]))], [east, Math.max(...bounds.map((b) => b[1][1]))]], { padding: 70, maxZoom: 8, duration: 700 });
  }
  function startMap(style) {
    if (!window.maplibregl || typeof window.maplibregl.Map !== "function") { status("地图组件加载失败，请检查网络或浏览器设置；城市列表仍可使用。", true); return; }
    try {
      map = new maplibregl.Map({ container: "ft-world-map", style, center: [105, 25], zoom: 1.5, minZoom: 1, maxZoom: 16, renderWorldCopies: false });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      const timer = setTimeout(() => { if (!ready) status("地图加载超时，请检查网络或内容安全策略后刷新；城市列表仍可使用。", true); }, 15000);
      map.on("load", () => {
        clearTimeout(timer); ready = true; status("");
        map.addSource("footprints", { type: "geojson", data: collection() });
        const before = map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
        map.addLayer({ id: "footprints-fill", type: "fill", source: "footprints", paint: { "fill-color": "#16c7d8", "fill-opacity": 0.43 } }, before);
        map.addLayer({ id: "footprints-glow", type: "line", source: "footprints", paint: { "line-color": "#16c7d8", "line-width": 5, "line-blur": 3, "line-opacity": 0.22 } }, before);
        map.addLayer({ id: "footprints-edge", type: "line", source: "footprints", paint: { "line-color": "#78f4ff", "line-width": 1.5, "line-opacity": 0.8 } }, before);
        map.on("click", "footprints-fill", (event) => select(event.features?.[0]?.properties?.id, true));
        map.on("mousemove", "footprints-fill", (event) => { const id = event.features?.[0]?.properties?.id; if (hovered !== id) { hovered = id; refreshMap(); } map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "footprints-fill", () => { hovered = null; map.getCanvas().style.cursor = ""; refreshMap(); });
        cities.forEach((city) => {
          const button = make("button", "ft-world-marker"); button.type = "button"; button.setAttribute("aria-label", `查看${city.name}的旅行记录`); button.append(make("span", "ft-world-dot"), make("span", "ft-world-label", city.name));
          button.addEventListener("click", (event) => { event.stopPropagation(); select(city.id, true); });
          new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat([city.coordinates[1], city.coordinates[0]]).addTo(map); markers.set(city.id, button);
        });
        const markerVisibility = () => markers.forEach((el, id) => { el.classList.toggle("ft-marker-distant", map.getZoom() >= 5 && boundaries.has(id)); });
        map.on("zoom", markerVisibility); markerVisibility(); refreshMap();
      });
      map.on("error", (event) => { console.warn("Footprints map resource error", event.error); if (ready) status("部分地图资源加载失败，请检查网络后刷新。", true); });
    } catch (error) { console.warn("Footprints map initialization failed", error); status("地图无法启动，请检查 WebGL、网络或浏览器设置；城市列表仍可使用。", true); }
  }
  async function init() {
    status("正在加载地图与足迹…");
    try {
      const [cityResponse, configResponse] = await Promise.all([fetch(app.dataset.citiesUrl), fetch(app.dataset.configUrl)]);
      if (!cityResponse.ok || !configResponse.ok) throw new Error("数据请求失败");
      const data = await cityResponse.json(), config = await configResponse.json();
      if (!Array.isArray(data)) throw new Error("城市数据格式错误");
      cities = data.filter((c) => c && typeof c.id === "string" && typeof c.name === "string" && Array.isArray(c.coordinates) && c.coordinates.length === 2 && c.coordinates.every(Number.isFinite) && Math.abs(c.coordinates[0]) <= 90 && Math.abs(c.coordinates[1]) <= 180);
      years = [...new Set(cities.map(year).filter((y) => y !== null))].sort((a, b) => a - b);
      ui.slider.max = years.length; ui.slider.value = years.length; $("ft-year-min").textContent = years[0] || "—"; $("ft-timeline").hidden = !years.length;
      $("ft-demo-notice").hidden = !cities.some((c) => c.demo); update(); startMap(config.worldStyle || "https://tiles.openfreemap.org/styles/dark");
      const failures = [];
      await Promise.all(cities.map(async (city) => {
        if (!city.boundary) return;
        try { const url = asset(city.boundary); if (!url) throw new Error("URL"); const response = await fetch(url); if (!response.ok) throw new Error(`HTTP ${response.status}`); const geo = await response.json(); const parts = geo.type === "FeatureCollection" ? geo.features : [geo]; if (!parts.length || !parts.every((f) => ["Polygon", "MultiPolygon"].includes((f.geometry || f)?.type))) throw new Error("GeoJSON"); boundaries.set(city.id, geo); } catch { failures.push(city.name); }
      }));
      if (failures.length) { ui.setup.textContent = `以下城市的边界加载失败，地图将使用标记：${failures.join("、")}。请检查边界文件与网络。`; ui.setup.hidden = false; }
      refreshMap();
    } catch (error) { console.warn("Footprints data error", error); status("足迹数据加载失败，请检查数据文件和网络后刷新。", true); }
  }
  ui.search.addEventListener("input", list); ui.slider.addEventListener("input", update);
  $("ft-world-view").addEventListener("click", () => { if (ready) map.flyTo({ center: [0, 20], zoom: 1.2, duration: 700 }); });
  $("ft-fit-visited").addEventListener("click", fitVisited);
  init();
})();
