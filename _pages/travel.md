---
layout: page
title: Footprints
permalink: /travel/
description: 一张持续点亮的世界地图，记录走过的城市与故事。
nav: true
nav_order: 4
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
<link rel="stylesheet" href="{{ '/assets/css/travel-map.css' | relative_url }}">

<div id="travel-app" class="travel-app" data-cities-url="{{ '/assets/data/visited-cities.json' | relative_url }}" data-baseurl="{{ site.baseurl }}">
  <header class="travel-header">
    <div>
      <p class="travel-eyebrow">THE WORLD IS A BOOK</p>
      <h2>Every place has a story<span class="travel-header-dot">.</span></h2>
      <p class="travel-lead">点亮走过的城市，珍藏沿途的故事。点击地图上的光点或高亮区域，查看旅行记录。</p>
    </div>
    <div class="travel-stats" aria-live="polite">
      <div><strong id="travel-city-count">0</strong><span>Cities</span></div>
      <div><strong id="travel-country-count">0</strong><span>Countries / Regions</span></div>
    </div>
  </header>

  <div id="travel-demo-tip" class="travel-demo-tip" hidden>当前显示的是<strong>演示城市</strong>，不代表真实旅行经历。发布前请修改 <code>assets/data/visited-cities.json</code>。</div>

  <div class="travel-layout">
    <section class="travel-map-frame" aria-label="旅行足迹世界地图">
      <div id="travel-map" role="application" aria-label="可缩放、拖动的世界地图；点击高亮城市查看记录"></div>
      <div class="travel-map-toolbar">
        <div class="travel-map-legend"><i></i> Visited cities</div>
        <button type="button" id="travel-reset" class="travel-reset">↗ World view</button>
      </div>
      <div id="travel-map-status" class="travel-map-status" role="status">正在加载世界地图…</div>
    </section>

    <aside class="travel-panel" aria-label="旅行城市列表和记录">
      <div class="travel-panel-header">
        <h3>Places I've been</h3>
        <p>探索我的城市足迹</p>
      </div>
      <label class="travel-search-label" for="travel-search">搜索城市</label>
      <input id="travel-search" class="travel-search" type="search" placeholder="城市 / 国家 / 关键词…" autocomplete="off">
      <div id="travel-city-list" class="travel-city-list" aria-label="城市列表"></div>
      <div id="travel-detail" class="travel-detail" aria-live="polite">
        <p class="travel-detail-empty">选择一座城市，查看它的故事。</p>
      </div>
    </aside>
  </div>

  <p class="travel-source">地图底图：<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>，通过 <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">world-atlas</a> 提供。示例城市边界数据：<a href="https://github.com/Lchiffon/leafletCN" target="_blank" rel="noopener noreferrer">leafletCN</a>（GPL-2）；其他城市的数据来源请自行注明。地图使用 Leaflet 实现。</p>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/travel-map.js' | relative_url }}"></script>
