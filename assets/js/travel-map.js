/* Footprints v3: China = native AMap JS API; World = MapLibre/OpenFreeMap.
 * Both Web JS API Key and securityJsCode are intentionally loaded from public travel-config.json.
 * Public/front-end securityJsCode is INSECURE; use only if you accept credential exposure.
 * In browsers without working MapLibre, standard OSM tiles via Leaflet are the fallback.
 */
(() => {
  "use strict";
  const app = document.getElementById("travel-app");
  if (!app) return;
  const $ = (id) => document.getElementById(id);
  const ui = {
    world: $("ft-world-map"), china: $("ft-china-map"),
    status: $("ft-map-status"), setup: $("ft-setup-notice"), demo: $("ft-demo-notice"),
    cityCount: $("ft-city-count"), countryCount: $("ft-country-count"),
    visibleCount: $("ft-visible-count"), list: $("ft-city-list"), detail: $("ft-detail"),
    search: $("ft-search"), timeline: $("ft-timeline"),
    slider: $("ft-year-range"), yearLabel: $("ft-year-label"),
    yearMin: $("ft-year-min"), yearMax: $("ft-year-max"),
    worldButton: $("ft-world-view"), chinaButton: $("ft-china-view"), fitButton: $("ft-fit-visited"),
  };
  const baseurl = (app.dataset.baseurl || "").replace(/\/$/, "");
  const DEFAULT_WORLD_STYLE = "https://tiles.openfreemap.org/styles/dark";
  const CHINA_BOUNDS = [[73, 17], [135, 54]]; // MapLibre: [[west, south], [east, north]]
  const WORLD_BOUNDS = [[-168, -58], [178, 78]];
  const COLOR = { fill: "#12d5df", stroke: "#77f8ff" };
  const geoCache = new Map();
  const worldMarkers = new Map();
  const fallbackItems = new Map();
  const chinaItems = new Map();
  let config = {}, cities = [], years = [], visibleCities = [], selectedId = null;
  let mode = "world", worldMap = null, worldReady = false, worldFallback = null;
  let worldTimer = null, worldFailures = 0, worldStarted = false;
  let chinaMap = null, chinaLoading = null, chinaLoaded = false;
  let boundaries = new Map(), amapSearch = null;

  const make = (tag, className, txt) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (txt !== undefined) el.textContent = String(txt);
    return el;
  };
  const yearOf = (c) => {
    const m = String(c.date || "").match(/^(\d{4})/);
    return m ? Number(m[1]) : null;
  };
  const chinaCity = (c) => c.countryCode === "CN" || c.country === "中国";
  const subtitle = (c) => [c.region, c.country].filter(Boolean).join(" · ");
  const countCountries = (list) => new Set(list.map((c) => c.countryCode || c.country).filter(Boolean)).size;
  const validCity = (c) => c && typeof c.id === "string" && c.id.trim() &&
    typeof c.name === "string" && c.name.trim() &&
    Array.isArray(c.coordinates) && c.coordinates.length === 2 &&
    c.coordinates.every((x) => typeof x === "number" && Number.isFinite(x)) &&
    Math.abs(c.coordinates[0]) <= 90 && Math.abs(c.coordinates[1]) <= 180;

  function assetURL(raw) {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const s = raw.startsWith("/assets/") ? baseurl + raw : raw;
      const url = new URL(s, window.location.origin + baseurl + "/");
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  function showStatus(message, isError = false) {
    ui.status.textContent = message || "";
    ui.status.classList.toggle("is-error", !!isError);
    ui.status.hidden = !message;
  }
  function showSetup(message) {
    ui.setup.textContent = message || "";
    ui.setup.hidden = !message;
  }
  function readVisible() {
    const n = Number(ui.slider.value);
    const year = years.length && n < years.length ? years[n] : null;
    ui.yearLabel.textContent = year === null ? "全部年份" : `截至 ${year} 年`;
    visibleCities = year === null ? [...cities] : cities.filter((c) => yearOf(c) === null || yearOf(c) <= year);
    ui.cityCount.textContent = String(visibleCities.length);
    ui.countryCount.textContent = String(countCountries(visibleCities));
    ui.demo.hidden = !cities.some((c) => c.demo === true);
    if (selectedId && !visibleCities.some((c) => c.id === selectedId)) {
      selectedId = null;
      renderDetails(null);
    }
    renderList();
    updateWorldLayers();
    updateChinaLayers();
  }
  function renderList() {
    ui.list.replaceChildren();
    const q = ui.search.value.trim().toLocaleLowerCase();
    const shown = visibleCities.filter((c) =>
      [c.name, c.region, c.country, c.category, c.description]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(q));
    ui.visibleCount.textContent = String(shown.length);
    if (!shown.length) {
      ui.list.append(make("p", "ft-empty", "没有符合条件的城市。调整关键词或年份试试。"));
      return;
    }
    shown.forEach((city, i) => {
      const card = make("button", "ft-city-card");
      card.type = "button";
      card.classList.toggle("is-selected", selectedId === city.id);
      const head = make("span", "ft-city-card-top");
      head.append(make("span", "ft-city-no", String(i + 1).padStart(2, "0")));
      head.append(make("strong", "ft-city-name", city.name));
      if (city.demo) head.append(make("span", "ft-demo-tag", "演示"));
      card.append(head, make("span", "ft-city-meta", subtitle(city)));
      if (city.date) card.append(make("span", "ft-city-date", city.date));
      card.addEventListener("click", () => selectCity(city.id, true));
      ui.list.append(card);
    });
  }
  function renderDetails(city) {
    ui.detail.replaceChildren();
    if (!city) {
      ui.detail.append(make("p", "ft-empty", "选择地图上的区域或城市卡片，查看旅行记录。"));
      return;
    }
    const head = make("div", "ft-detail-title");
    head.append(make("h4", "", city.name));
    if (city.demo) head.append(make("span", "ft-detail-demo", "演示记录"));
    ui.detail.append(head, make("p", "ft-detail-subtitle", subtitle(city)));
    const tags = make("div", "ft-detail-info");
    if (city.date) tags.append(make("span", "", `📅 ${city.date}`));
    if (city.category) tags.append(make("span", "", city.category));
    if (tags.childNodes.length) ui.detail.append(tags);
    if (city.description) ui.detail.append(make("p", "ft-detail-description", city.description));
    if (Array.isArray(city.photos) && city.photos.length) {
      const gallery = make("div", "ft-gallery");
      for (const [i, photo] of city.photos.entries()) {
        const url = assetURL(photo);
        if (!url) continue;
        const link = make("a", "ft-photo");
        link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
        const img = make("img");
        img.src = url; img.alt = `${city.name}旅行照片 ${i + 1}`; img.loading = "lazy";
        link.append(img); gallery.append(link);
      }
      if (gallery.childNodes.length) ui.detail.append(gallery);
    }
  }
  async function selectCity(id, fly) {
    const city = visibleCities.find((c) => c.id === id);
    if (!city) return;
    selectedId = id;
    renderList(); renderDetails(city);
    if (mode === "china" && !chinaCity(city)) await switchMode("world");
    if (!fly) return;
    if (mode === "china" && chinaMap) {
      const item = chinaItems.get(id);
      const polygons = item?.polygons || [];
      if (polygons.length) chinaMap.setFitView(polygons, false, [48, 65]);
      else if (item?.marker) chinaMap.setZoomAndCenter(9, item.marker.getCenter());
    } else if (worldFallback) {
      const item = fallbackItems.get(id);
      if (item?.polygon && item.polygon.getBounds().isValid()) {
        worldFallback.flyToBounds(item.polygon.getBounds().pad(.28), { maxZoom: 9 });
      } else worldFallback.flyTo(city.coordinates, 8);
    } else if (worldMap && worldReady) {
      const data = boundaries.get(id);
      const bbox = data && geoBounds(data);
      if (bbox) worldMap.fitBounds(bbox, { padding: 70, maxZoom: 9, duration: 700 });
      else worldMap.flyTo({ center: [city.coordinates[1], city.coordinates[0]], zoom: 8, duration: 700 });
    }
  }
  function geoBounds(data) {
    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    function scan(node) {
      if (!Array.isArray(node) || !node.length) return;
      if (typeof node[0] === "number" && typeof node[1] === "number") {
        const [lng, lat] = node;
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          west = Math.min(west, lng); east = Math.max(east, lng);
          south = Math.min(south, lat); north = Math.max(north, lat);
        }
      } else node.forEach(scan);
    }
    if (data.type === "FeatureCollection") data.features.forEach((f) => scan(f.geometry?.coordinates));
    else scan((data.type === "Feature" ? data.geometry : data)?.coordinates);
    if (![west, east, south, north].every(Number.isFinite)) return null;
    return [[west, south], [east, north]];
  }
  async function loadBoundaries() {
    await Promise.all(cities.map(async (city) => {
      const url = assetURL(city.boundary);
      if (!url) return;
      try {
        let geo = geoCache.get(url);
        if (!geo) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          geo = await response.json();
          if (!["Feature", "FeatureCollection", "Polygon", "MultiPolygon"].includes(geo.type)) throw new Error("Invalid GeoJSON");
          geoCache.set(url, geo);
        }
        boundaries.set(city.id, geo);
      } catch (e) {
        console.warn(`GeoJSON unavailable for ${city.name}`, e);
      }
    }));
    updateWorldLayers();
    updateFallbackLayers();
  }
  function collectionForVisible() {
    const features = [];
    for (const city of visibleCities) {
      const geo = boundaries.get(city.id);
      if (!geo) continue;
      const parts = geo.type === "FeatureCollection" ? geo.features :
        geo.type === "Feature" ? [geo] : [{ geometry: geo }];
      for (const part of parts) {
        if (!["Polygon", "MultiPolygon"].includes(part.geometry?.type)) continue;
        features.push({ type: "Feature", properties: { id: city.id, name: city.name }, geometry: part.geometry });
      }
    }
    return { type: "FeatureCollection", features };
  }
  // --- World: OpenFreeMap Dark with native MapLibre polygons -------------------
  function startWorld() {
    if (worldStarted) return;
    worldStarted = true;
    if (!window.maplibregl ||
    (typeof maplibregl.supported === "function" &&
      !maplibregl.supported())) {
      startLeafletFallback("当前设备不支持矢量地图，已使用开源瓦片底图。");
      return;
    }
    try {
      worldMap = new maplibregl.Map({
        container: ui.world,
        style: config.worldStyle || DEFAULT_WORLD_STYLE,
        center: [105, 30], zoom: 2, minZoom: 1, maxZoom: 16,
        attributionControl: true, renderWorldCopies: false,
      });
      worldMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      worldMap.on("load", () => {
        worldReady = true;
        clearTimeout(worldTimer);
        worldMap.addSource("footprints", { type: "geojson", data: collectionForVisible() });
        worldMap.addLayer({ id: "footprints-fill", type: "fill", source: "footprints", paint: {
          "fill-color": COLOR.fill, "fill-opacity": .54,
        }});
        worldMap.addLayer({ id: "footprints-edge", type: "line", source: "footprints", paint: {
          "line-color": COLOR.stroke, "line-opacity": .98, "line-width": 1.6,
        }});
        worldMap.on("click", "footprints-fill", (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (id) selectCity(id, false);
        });
        worldMap.on("mouseenter", "footprints-fill", () => { worldMap.getCanvas().style.cursor = "pointer"; });
        worldMap.on("mouseleave", "footprints-fill", () => { worldMap.getCanvas().style.cursor = ""; });
        worldMap.on("zoomend", refreshWorldLabels);
        cities.forEach(addWorldMarker);
        updateWorldLayers();
        refreshWorldLabels();
        if (mode !== "china") { worldMap.resize(); fitCurrentView(false); }
        showStatus("");
      });
      worldMap.on("error", (ev) => {
        if (worldReady || worldFallback) return;
        worldFailures++;
        console.warn("OpenFreeMap error", ev.error || ev);
        if (worldFailures >= 4) startLeafletFallback("OpenFreeMap 无法连接，已切换到 OSM 备用底图。");
      });
      worldTimer = setTimeout(() => {
        if (!worldReady && !worldFallback) startLeafletFallback("OpenFreeMap 加载超时，已切换到 OSM 备用底图。");
      }, 12000);
    } catch (err) {
      console.warn("MapLibre startup failed", err);
      startLeafletFallback("矢量地图未能启动，已切换到 OSM 备用底图。");
    }
  }
  function addWorldMarker(city) {
    if (!worldMap || worldMarkers.has(city.id)) return;
    const root = make("button", "ft-world-marker");
    root.type = "button";
    root.setAttribute("aria-label", `查看${city.name}的旅行记录`);
    root.append(make("span", "ft-world-dot"), make("span", "ft-world-label", city.name));
    root.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); selectCity(city.id, true); });
    const marker = new maplibregl.Marker({ element: root, anchor: "bottom" })
      .setLngLat([city.coordinates[1], city.coordinates[0]]).addTo(worldMap);
    worldMarkers.set(city.id, { root, marker });
  }
  function refreshWorldLabels() {
    const zoom = worldMap?.getZoom() || 0;
    worldMarkers.forEach((item) => item.root.classList.toggle("show-label", zoom >= 4.4));
  }
  function updateWorldLayers() {
    if (worldReady && worldMap?.getSource("footprints")) {
      worldMap.getSource("footprints").setData(collectionForVisible());
      const selected = new Set(visibleCities.map((c) => c.id));
      worldMarkers.forEach((obj, id) => { obj.root.hidden = !selected.has(id); });
    }
    updateFallbackLayers();
  }
  // If MapLibre/WebGL or its style fails, switch only this view to Leaflet+OSM.
  function startLeafletFallback(message) {
    if (worldFallback) return;
    clearTimeout(worldTimer);
    try { if (worldMap) worldMap.remove(); } catch (e) { console.warn(e); }
    worldMap = null; worldReady = false;
    if (!window.L) {
      showStatus("开源地图组件加载失败。请检查网络或浏览器拦截设置。", true);
      return;
    }
    ui.world.classList.add("ft-world-fallback");
    worldFallback = L.map(ui.world, { minZoom: 1, maxZoom: 16, scrollWheelZoom: false })
      .setView([30, 105], 3);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(worldFallback);
    updateFallbackLayers();
    if (mode !== "china") { worldFallback.invalidateSize(); fitCurrentView(false); }
    showStatus(message);
  }
  function updateFallbackLayers() {
    if (!worldFallback) return;
    const keep = new Set(visibleCities.map((c) => c.id));
    for (const city of cities) {
      let item = fallbackItems.get(city.id);
      if (!item) {
        const marker = L.circleMarker(city.coordinates, {
          radius: 5.5, weight: 2, color: "#c1ffff", fillColor: COLOR.fill, fillOpacity: 1,
        }).on("click", () => selectCity(city.id, true));
        item = { marker, polygon: null };
        fallbackItems.set(city.id, item);
      }
      if (!item.polygon && boundaries.has(city.id)) {
        item.polygon = L.geoJSON(boundaries.get(city.id), {
          style: { color: COLOR.stroke, fillColor: COLOR.fill, fillOpacity: .55, weight: 1.4 },
          onEachFeature: (_f, layer) => { layer.on("click", () => selectCity(city.id, false)); },
        });
      }
      for (const layer of [item.polygon, item.marker].filter(Boolean)) {
        if (keep.has(city.id) && !worldFallback.hasLayer(layer)) layer.addTo(worldFallback);
        else if (!keep.has(city.id) && worldFallback.hasLayer(layer)) worldFallback.removeLayer(layer);
      }
      if (worldFallback.hasLayer(item.marker)) item.marker.bringToFront();
    }
  }
  function fitWorld(bounds, animated) {
    if (worldFallback) {
      const latlng = [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]];
      worldFallback.invalidateSize();
      worldFallback.fitBounds(latlng, { padding: [20, 20], animate: animated });
    } else if (worldMap && worldReady) {
      worldMap.resize();
      worldMap.fitBounds(bounds, { padding: 30, maxZoom: 8, duration: animated ? 700 : 0 });
    }
  }
  function fitCurrentView(animated) {
    if (mode === "china") {
      if (chinaMap) {
        const overlays = visibleCities.filter(chinaCity)
          .flatMap((c) => chinaItems.get(c.id)?.polygons || []);
        if (overlays.length) chinaMap.setFitView(overlays, false, [50, 90]);
        else chinaMap.setZoomAndCenter(4, [105, 36], !animated ? 0 : 450);
      }
      return;
    }
    if (mode === "china-preview") {
      fitWorld(CHINA_BOUNDS, animated);
      return;
    }
    fitWorld(WORLD_BOUNDS, animated);
  }
  function fitVisited() {
    if (mode === "china" && chinaMap) { fitCurrentView(true); return; }
    const included = visibleCities.filter((c) => mode !== "china-preview" || chinaCity(c));
    if (!included.length) { fitCurrentView(true); return; }
    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    for (const city of included) {
      const b = boundaries.has(city.id) ? geoBounds(boundaries.get(city.id)) : null;
      const [w, s, e, n] = b ? [b[0][0], b[0][1], b[1][0], b[1][1]] :
        [city.coordinates[1], city.coordinates[0], city.coordinates[1], city.coordinates[0]];
      west = Math.min(west, w); east = Math.max(east, e);
      south = Math.min(south, s); north = Math.max(north, n);
    }
    const dw = Math.max(east - west, .8), dh = Math.max(north - south, .8);
    fitWorld([[west - dw * .28, south - dh * .28], [east + dw * .28, north + dh * .28]], true);
  }
  // --- China: AMap official JS API + live DistrictSearch city boundaries -------
  function hasAMapConfig() {
    return typeof config.amapKey === "string" && !!config.amapKey.trim() &&
      typeof config.amapSecurityJsCode === "string" && !!config.amapSecurityJsCode.trim();
  }
  function loadAMap() {
    if (chinaLoading) return chinaLoading;
    if (!hasAMapConfig()) return Promise.reject(new Error("没有配置高德 Web JS API Key 和安全密钥"));
    chinaLoading = new Promise((resolve, reject) => {
      // Official AMap plaintext option. WARNING: visible in browser and public GitHub.
      // This MUST be set before loading webapi.amap.com/maps.
      window._AMapSecurityConfig = { securityJsCode: config.amapSecurityJsCode.trim() };
      const script = document.createElement("script");
      script.src = "https://webapi.amap.com/maps?v=2.0&key=" + encodeURIComponent(config.amapKey) +
        "&plugin=AMap.DistrictSearch";
      script.async = true;
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) { settled = true; reject(new Error("高德脚本加载超时")); }
      }, 14000);
      script.onload = () => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        window.AMap ? resolve(window.AMap) : reject(new Error("高德脚本未初始化"));
      };
      script.onerror = () => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        reject(new Error("无法加载高德地图 JS API，请检查 Key、网络和域名白名单"));
      };
      document.head.append(script);
    });
    return chinaLoading;
  }
  async function buildChina() {
    if (chinaLoaded && chinaMap) return;
    const AMap = await loadAMap();
    if (chinaMap) return;
    chinaMap = new AMap.Map("ft-china-map", {
      viewMode: "2D", center: [105, 36], zoom: 4, zooms: [3, 18],
      mapStyle: "amap://styles/darkblue", resizeEnable: true,
    });
    amapSearch = new AMap.DistrictSearch({ subdistrict: 0, extensions: "all", level: "city" });
    chinaLoaded = true;
    // Independent AMap boundaries use GCJ-02 coordinates returned by AMap itself.
    await Promise.all(cities.filter(chinaCity).map(addAMapCity));
    updateChinaLayers();
    if (mode === "china") {
      chinaMap.resize();
      fitCurrentView(false);
    }
  }
  function addAMapCity(city) {
    if (!city.adcode && !city.name) return Promise.resolve(false);
    if (chinaItems.has(city.id)) return Promise.resolve(true);
    return new Promise((resolve) => {
      const AMap = window.AMap;
      const district = new AMap.DistrictSearch({
        subdistrict: 0, extensions: "all", level: city.amapLevel || "city",
      });
      district.search(city.adcode || city.name, (code, result) => {
        const values = result?.districtList || [];
        const districtResult = values.find((d) => String(d.adcode) === String(city.adcode)) || values[0];
        const paths = districtResult?.boundaries;
        if (code !== "complete" || !paths?.length) {
          console.warn("AMap DistrictSearch failed:", city.name, code, result);
          resolve(false); return;
        }
        const polys = paths.map((path) => new AMap.Polygon({
          path: [path], map: chinaMap, fillColor: COLOR.fill, fillOpacity: .50,
          strokeColor: COLOR.stroke, strokeOpacity: 1, strokeWeight: 1.6,
          bubble: false, zIndex: 65,
        }));
        for (const p of polys) {
          p.on("click", () => selectCity(city.id, false));
          p.on("mouseover", () => p.setOptions({ fillOpacity: .77, strokeWeight: 2.3 }));
          p.on("mouseout", () => p.setOptions({ fillOpacity: .50, strokeWeight: 1.6 }));
        }
        const center = districtResult.center || (polys[0]?.getBounds()?.getCenter());
        let marker = null;
        if (center) {
          marker = new AMap.CircleMarker({
            map: chinaMap, center, radius: 5.5,
            strokeColor: "#dfffff", strokeWeight: 2,
            fillColor: COLOR.fill, fillOpacity: 1, zIndex: 80,
          });
          marker.on("click", () => selectCity(city.id, true));
        }
        chinaItems.set(city.id, { polygons: polys, marker });
        updateChinaLayers();
        resolve(true);
      });
    });
  }
  function updateChinaLayers() {
    if (!chinaMap) return;
    const set = new Set(visibleCities.map((c) => c.id));
    chinaItems.forEach((item, id) => {
      for (const obj of [...item.polygons, item.marker].filter(Boolean)) {
        obj.setMap(set.has(id) ? chinaMap : null);
      }
    });
  }
  // Switches are explicit: two separate maps, no GCJ-02 / WGS84 overlay mixing.
  async function switchMode(next) {
    if (next === "china" && !hasAMapConfig()) {
      mode = "china-preview";
      ui.world.hidden = false; ui.china.hidden = true;
      selectTab("china");
      showSetup("中国视图尚未配置高德 Web JS API Key 与 securityJsCode：目前使用开源地图预览。填写 assets/data/travel-config.json 后将自动启用高德底图与城市边界（凭据会公开，请设置域名白名单）。");
      startWorld();
      if (worldReady || worldFallback) fitCurrentView(true);
      return;
    }
    if (next === "china") {
      mode = "china";
      ui.china.hidden = false; ui.world.hidden = true;
      selectTab("china");
      showSetup("");
      showStatus("正在加载高德地图及中国行政边界…");
      try {
        await buildChina();
        if (mode !== "china") return;
        showStatus(chinaItems.size ? "" : "高德地图已打开，但城市边界未返回；请检查 Key、安全密钥、域名白名单和额度。", !chinaItems.size);
        chinaMap.resize();
        fitCurrentView(true);
      } catch (e) {
        console.error("AMap startup error", e);
        // Show a working, visible map rather than a blank map.
        mode = "china-preview";
        ui.world.hidden = false; ui.china.hidden = true;
        selectTab("china");
        showSetup("高德地图连接失败，已自动回退到开源中国地图预览。请检查 Web JS API Key、securityJsCode、域名白名单及浏览器控制台。");
        startWorld();
        if (worldReady || worldFallback) fitCurrentView(false);
        showStatus("");
      }
      return;
    }
    mode = "world";
    ui.world.hidden = false; ui.china.hidden = true;
    selectTab("world");
    showSetup("");
    startWorld();
    if (worldReady || worldFallback) fitCurrentView(true);
  }
  function selectTab(tab) {
    for (const [name, button] of [["world", ui.worldButton], ["china", ui.chinaButton]]) {
      const active = name === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }
  async function init() {
    showStatus("正在加载足迹记录…");
    try {
      const [configResult, cityResult] = await Promise.all([
        fetch(app.dataset.configUrl).then((r) => { if (!r.ok) throw new Error("travel-config.json: HTTP " + r.status); return r.json(); }),
        fetch(app.dataset.citiesUrl).then((r) => { if (!r.ok) throw new Error("visited-cities.json: HTTP " + r.status); return r.json(); }),
      ]);
      config = configResult;
      if (!Array.isArray(cityResult)) throw new Error("visited-cities.json 必须是数组");
      const ids = new Set();
      cities = cityResult.filter((c) => {
        if (!validCity(c) || ids.has(c.id)) return false;
        ids.add(c.id); return true;
      });
    } catch (e) {
      console.error("Cannot initialize footprints", e);
      showStatus("足迹数据或配置加载失败：请检查 JSON 文件与 URL。", true);
      return;
    }
    years = [...new Set(cities.map(yearOf).filter(Number.isFinite))].sort((a, b) => a - b);
    ui.timeline.hidden = !years.length;
    ui.slider.min = "0"; ui.slider.max = String(years.length);
    ui.slider.value = String(years.length);
    ui.yearMin.textContent = years.length ? String(years[0]) : "—";
    ui.yearMax.textContent = "全部";
    readVisible();
    // GeoJSON overlays are local and always available, even without a High Map key.
    loadBoundaries();
    showStatus("");
    await switchMode(config.defaultMode === "world" ? "world" : "china");
    window.addEventListener("resize", () => {
      if (worldReady && !ui.world.hidden) worldMap.resize();
      if (worldFallback && !ui.world.hidden) worldFallback.invalidateSize();
      if (chinaMap && !ui.china.hidden) chinaMap.resize();
    });
  }
  ui.worldButton.addEventListener("click", () => switchMode("world"));
  ui.chinaButton.addEventListener("click", () => switchMode("china"));
  ui.fitButton.addEventListener("click", fitVisited);
  ui.search.addEventListener("input", renderList);
  ui.slider.addEventListener("input", readVisible);
  init();
})();
