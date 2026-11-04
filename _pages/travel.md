---
layout: page
title: Footprints
permalink: /travel/
description: 我的城市足迹 · 天地图
nav: true
nav_order: 4
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css">
<link rel="stylesheet" href="{{ '/assets/css/travel-map.css' | relative_url }}?v=5.1.0">

<div id="travel-app" class="ft-app"
     data-cities-url="{{ '/assets/data/visited-cities.json' | relative_url }}"
     data-config-url="{{ '/assets/data/travel-config.json' | relative_url }}"
     data-baseurl="{{ site.baseurl }}"
     data-worker-url="{{ '/assets/js/maplibre-gl-csp-worker-5.24.0.min.js' | relative_url }}">
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
      <div id="ft-world-map" class="ft-map-canvas" aria-label="天地图全球地图"></div>

      <div class="ft-map-top">
        <div class="ft-legend"><span class="ft-legend-dot"></span> Visited areas</div>
        <div class="ft-map-actions">
          <button id="ft-world-view" class="ft-map-action" type="button">世界</button>
          <button id="ft-fit-visited" class="ft-map-action" type="button">查看全部足迹</button>
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
  <p class="ft-attribution-note">底图及行政区划服务：<a href="https://www.tianditu.gov.cn/">天地图</a>。使用前请核实所选服务的审图号、授权和足迹图层的公开展示要求；本地示例边界来源见 <a href="{{ '/assets/data/travel-boundaries/README_SOURCES.md' | relative_url }}">边界说明</a>。</p>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl-csp.js"></script>
<script defer src="{{ '/assets/js/travel-map.js' | relative_url }}?v=5.1.0"></script>
