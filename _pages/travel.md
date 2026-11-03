---
layout: page
title: Footprints
permalink: /travel/
description: 我的城市足迹 · 中国高德地图 + 全球开源地图
nav: true
nav_order: 4
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="{{ '/assets/css/travel-map.css' | relative_url }}?v=3.1.0">

<div id="travel-app" class="ft-app"
     data-cities-url="{{ '/assets/data/visited-cities.json' | relative_url }}"
     data-config-url="{{ '/assets/data/travel-config.json' | relative_url }}"
     data-baseurl="{{ site.baseurl }}">
  <header class="ft-header">
    <div class="ft-intro">
      <p class="ft-kicker">THE WORLD IS A BOOK · MY FOOTPRINTS</p>
      <h2>Every place has a story<span class="ft-accent">.</span></h2>
      <p class="ft-description">用颜色点亮走过的城市。每一片青色区域，都是一段旅途的记忆。</p>
    </div>
    <div class="ft-stats" aria-live="polite">
      <div><strong id="ft-city-count">0</strong><span>Cities</span></div>
      <div><strong id="ft-country-count">0</strong><span>Countries / Regions</span></div>
    </div>
  </header>

  <p id="ft-demo-notice" class="ft-demo-notice" hidden>当前包含<strong>演示城市</strong>，不代表真实旅行经历。正式发布前请修改 <code>assets/data/visited-cities.json</code>。</p>
  <div id="ft-setup-notice" class="ft-setup-notice" hidden role="status"></div>

  <div class="ft-layout">
    <section class="ft-map-frame" aria-label="旅行足迹地图">
      <!-- 两个地图引擎相互独立，绝不将高德和 OSM 底图混合叠加。 -->
      <div id="ft-world-map" class="ft-map-canvas" aria-label="全球开源地图"></div>
      <div id="ft-china-map" class="ft-map-canvas" aria-label="中国高德地图" hidden></div>

      <div class="ft-map-top">
        <div class="ft-legend"><span class="ft-legend-dot"></span> Visited areas</div>
        <div class="ft-map-actions">
          <button id="ft-world-view" class="ft-map-action" type="button" aria-pressed="false">世界</button>
          <button id="ft-china-view" class="ft-map-action" type="button" aria-pressed="false">中国</button>
          <button id="ft-fit-visited" class="ft-map-action" type="button">足迹</button>
        </div>
      </div>
      <div id="ft-map-status" class="ft-map-status" role="status" hidden></div>
      <div class="ft-timeline" id="ft-timeline" hidden>
        <div class="ft-year-head"><span>足迹时间轴</span><strong id="ft-year-label">全部年份</strong></div>
        <input id="ft-year-range" type="range" min="0" max="0" step="1" value="0" aria-label="按截至年份筛选城市">
        <div class="ft-year-ends"><span id="ft-year-min">—</span><span id="ft-year-max">全部</span></div>
      </div>
    </section>

    <aside class="ft-sidebar" aria-label="城市列表和旅行记录">
      <div class="ft-sidebar-heading"><div><h3>Places I've been</h3><p>探索我的城市足迹</p></div><span id="ft-visible-count" class="ft-visible-count">0</span></div>
      <label class="ft-sr-only" for="ft-search">搜索城市、国家或旅行故事</label>
      <input id="ft-search" class="ft-search" type="search" placeholder="搜索城市 / 国家 / 关键词…" autocomplete="off">
      <div id="ft-city-list" class="ft-city-list" aria-label="城市列表"></div>
      <section id="ft-detail" class="ft-detail" aria-live="polite"><p class="ft-empty">选择地图上的区域或右侧城市，查看旅行故事。</p></section>
    </aside>
  </div>
  <p class="ft-attribution-note">中国地图与行政边界：<a href="https://lbs.amap.com/" target="_blank" rel="noopener noreferrer">高德开放平台</a>（Web JS API Key + 明文安全密钥）。全球地图：<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>。历史演示边界来源与许可见 <a href="https://github.com/Lchiffon/leafletCN" target="_blank" rel="noopener noreferrer">leafletCN GPL-2</a>。地图足迹仅用于展示，不代表法定行政区划。</p>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<!-- 仅在 OpenFreeMap 无法使用时，Leaflet 会作为无需密钥的备用底图。 -->
<script defer src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script defer src="{{ '/assets/js/travel-map.js' | relative_url }}?v=3.1.0"></script>
