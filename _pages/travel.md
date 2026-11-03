---
layout: page
title: Footprints
permalink: /travel/
description: 一张持续点亮的世界地图，记录去过的城市与故事。
nav: true
nav_order: 4
---

<!-- Travel Footprints. Keep scripts in this order: Leaflet > MapLibre > bridge > site JS. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css" crossorigin="anonymous">
<link rel="stylesheet" href="{{ '/assets/css/travel-map.css' | relative_url }}">

<div id="travel-app" class="ft-app" data-cities-url="{{ '/assets/data/visited-cities.json' | relative_url }}" data-baseurl="{{ site.baseurl }}">
  <header class="ft-header">
    <div class="ft-intro">
      <p class="ft-kicker">THE WORLD IS A BOOK · MY FOOTPRINTS</p>
      <h2>Every place has a story<span class="ft-accent">.</span></h2>
      <p class="ft-description">用颜色点亮走过的城市。每一片发光的区域，都是一段旅途的记忆。</p>
    </div>
    <div class="ft-stats" aria-live="polite">
      <div><strong id="ft-city-count">0</strong><span>Cities</span></div>
      <div><strong id="ft-country-count">0</strong><span>Countries / Regions</span></div>
    </div>
  </header>

  <p id="ft-demo-notice" class="ft-demo-notice" hidden>当前包含<strong>演示城市</strong>，不代表真实旅行经历。请先修改 <code>assets/data/visited-cities.json</code> 再正式发布。</p>

  <div class="ft-layout">
    <section class="ft-map-frame" aria-label="全球旅行足迹交互地图">
      <div id="ft-map" role="application" aria-label="可缩放的地图。已访问城市的行政区域会高亮，点击查看记录。"></div>
      <div class="ft-map-top">
        <div class="ft-legend"><span class="ft-legend-dot"></span> Visited areas</div>
        <div class="ft-map-actions">
          <button id="ft-world-view" class="ft-map-action" type="button" aria-label="切换到世界地图">世界</button>
          <button id="ft-china-view" class="ft-map-action" type="button" aria-label="切换到中国视图">中国</button>
          <button id="ft-fit-visited" class="ft-map-action" type="button" aria-label="缩放查看所有访问城市">足迹</button>
        </div>
      </div>
      <div id="ft-map-status" class="ft-map-status" role="status" hidden></div>
      <div class="ft-timeline" id="ft-timeline">
        <div class="ft-year-head">
          <span>足迹时间轴</span>
          <strong id="ft-year-label">全部年份</strong>
        </div>
        <input id="ft-year-range" type="range" min="0" max="0" step="1" value="0" aria-label="按截至年份筛选到访城市">
        <div class="ft-year-ends"><span id="ft-year-min">—</span><span id="ft-year-max">全部</span></div>
      </div>
    </section>

    <aside class="ft-sidebar" aria-label="旅行城市列表和城市详情">
      <div class="ft-sidebar-heading">
        <div><h3>Places I've been</h3><p>探索我的城市足迹</p></div>
        <span id="ft-visible-count" class="ft-visible-count" aria-live="polite">0</span>
      </div>
      <label class="ft-sr-only" for="ft-search">搜索城市、国家或旅行故事</label>
      <input id="ft-search" class="ft-search" type="search" placeholder="搜索城市 / 国家 / 关键词…" autocomplete="off">
      <div id="ft-city-list" class="ft-city-list" aria-label="城市列表"></div>
      <section id="ft-detail" class="ft-detail" aria-label="选中城市的旅行记录" aria-live="polite">
        <p class="ft-empty">点击地图上的发光城市或右侧列表，查看旅行记录。</p>
      </section>
    </aside>
  </div>

  <p class="ft-attribution-note">地图：<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>。演示城市边界数据来源及许可见 <a href="https://github.com/Lchiffon/leafletCN" target="_blank" rel="noopener noreferrer">leafletCN (GPL-2)</a>；边界仅供旅行可视化，非最新官方行政区划依据。</p>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/travel-map.js' | relative_url }}"></script>
