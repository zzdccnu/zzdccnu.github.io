---
layout: about
title: about
permalink: /
subtitle: <a href='#'>Affiliations</a>. 华中师范大学 · 数字媒体技术 · AI for Science

profile:
  align: right
  image: prof_pic.png
  image_circular: false # crops the image to make it circular
  more_info: >
    <p>华中师范大学</p>
    <p>湖北省武汉市洪山区</p>
    <p>雄楚大道382号, 430079</p>

selected_papers: false # includes a list of papers marked as "selected={true}"
social: false # includes social icons at the bottom of the page

announcements:
  enabled: true # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: true
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

你好！我是小石(Koishi)，目前在华中师范大学攻读数字媒体技术专业，我对探索前沿的人工智能技术有着浓厚的兴趣。

我的研究方向主要聚焦于**计算机视觉、图像处理以及AI4S**。在过去的科研经历中，我致力于通过深度学习技术解决实际场景中的复杂问题：

**大语言模型越狱检测**：针对大模型易受提示词注入攻击的问题，我设计了一种多语义相似度特征融合提取机制，在保证推理速度的前提下，将越狱成功率从约 5% 显著降低至 1% 左右。相关成果以学生第一作者身份发表于《信息网络安全》，并另有一篇SCI2区论文在投。

**基于隐写术的指纹防御体系**：我曾基于自编码器与VGG16网络，提出过一种融合隐写机制的安全增强方案，以抵抗指纹系统中的新型重建攻击。该工作目前以学生第二作者身份在《软件学报》(CCF-T1)一轮返修中。

在科研之外，我也积极参与各类学科竞赛，曾获得第十八届全国大学生计算机设计大赛国家级二等奖、第七届全球校园人工智能算法精英大赛国家级三等奖等多项荣誉。生活中的我热爱交流与分享，积极参与各类会议活动与各种志愿活动。

在这个主页上，我将不定期分享我最新的科研进展、项目代码以及学习心得。如果你对我的研究方向感兴趣，或者有任何想要探讨的学术问题，非常欢迎通过底部的联系方式与我交流！

<section id="github-contributions-section" class="gh-activity">
  <div class="gh-activity-title">
    <h2>GitHub Contributions</h2>
    <a href="https://github.com/koishi514-Z" target="_blank" rel="noopener">
      @koishi514-Z ↗
    </a>
  </div>

  <div class="gh-card">
    <div id="gh-total" class="gh-summary">Loading contributions...</div>

    <div class="gh-scroll">
      <div id="gh-chart" class="gh-chart">
        <div id="gh-months" class="gh-months"></div>

        <div class="gh-chart-body">
          <div class="gh-weekdays">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          <div id="gh-grid" class="gh-grid"></div>
        </div>
      </div>
    </div>

    <div class="gh-footer">
      <span>Less</span>
      <span class="gh-legend-cell" data-level="0"></span>
      <span class="gh-legend-cell" data-level="1"></span>
      <span class="gh-legend-cell" data-level="2"></span>
      <span class="gh-legend-cell" data-level="3"></span>
      <span class="gh-legend-cell" data-level="4"></span>
      <span>More</span>
    </div>
  </div>
</section>

<style>
  .gh-activity {
    margin-top: 2.5rem;
  }

  .gh-activity-title {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .gh-activity-title h2 {
    margin: 0;
  }

  .gh-activity-title a {
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .gh-card {
    --gh-0: #ebedf0;
    --gh-1: #9be9a8;
    --gh-2: #40c463;
    --gh-3: #30a14e;
    --gh-4: #216e39;

    padding: 1rem;
    color: var(--global-text-color);
    background: var(--global-bg-color);
    border: 1px solid var(--global-divider-color);
    border-radius: 10px;
  }

  html[data-theme="dark"] .gh-card {
    --gh-0: #21262d;
    --gh-1: #0e4429;
    --gh-2: #006d32;
    --gh-3: #26a641;
    --gh-4: #39d353;
  }

  .gh-summary {
    margin-bottom: 0.9rem;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .gh-scroll {
    overflow-x: auto;
    padding-bottom: 0.4rem;
  }

  .gh-chart {
    width: max-content;
    min-width: 100%;
  }

  .gh-months {
    position: relative;
    height: 22px;
    margin-left: 36px;
    font-size: 11px;
    line-height: 16px;
    color: var(--global-text-color-light);
  }

  .gh-months span {
    position: absolute;
    top: 0;
    white-space: nowrap;
  }

  .gh-chart-body {
    display: flex;
    gap: 8px;
  }

  .gh-weekdays {
    display: grid;
    grid-template-rows: repeat(7, 12px);
    gap: 3px;
    width: 28px;
    font-size: 10px;
    line-height: 12px;
    color: var(--global-text-color-light);
  }

  .gh-grid {
    display: grid;
    grid-template-rows: repeat(7, 12px);
    grid-auto-flow: column;
    grid-auto-columns: 12px;
    gap: 3px;
  }

  .gh-cell,
  .gh-placeholder,
  .gh-legend-cell {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  .gh-placeholder {
    visibility: hidden;
  }

  .gh-cell {
    background: var(--gh-0);
    outline: 1px solid color-mix(in srgb, var(--global-divider-color) 60%, transparent);
    outline-offset: -1px;
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
  }

  .gh-cell:hover {
    z-index: 1;
    transform: scale(1.35);
    filter: brightness(1.08);
  }

  .gh-cell[data-level="0"],
  .gh-legend-cell[data-level="0"] {
    background: var(--gh-0);
  }

  .gh-cell[data-level="1"],
  .gh-legend-cell[data-level="1"] {
    background: var(--gh-1);
  }

  .gh-cell[data-level="2"],
  .gh-legend-cell[data-level="2"] {
    background: var(--gh-2);
  }

  .gh-cell[data-level="3"],
  .gh-legend-cell[data-level="3"] {
    background: var(--gh-3);
  }

  .gh-cell[data-level="4"],
  .gh-legend-cell[data-level="4"] {
    background: var(--gh-4);
  }

  .gh-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    margin-top: 0.75rem;
    font-size: 11px;
    color: var(--global-text-color-light);
  }

  .gh-error {
    color: #cf222e;
  }

  @media (max-width: 576px) {
    .gh-card {
      padding: 0.8rem;
    }

    .gh-activity-title {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.2rem;
    }
  }
</style>

<script>
  document.addEventListener("DOMContentLoaded", async function () {
    const username = "koishi514-Z";
    const section = document.getElementById("github-contributions-section");
    const article = document.querySelector(".post article");
    const grid = document.getElementById("gh-grid");
    const months = document.getElementById("gh-months");
    const totalElement = document.getElementById("gh-total");
    const chart = document.getElementById("gh-chart");

    // 移动到首页所有模块之后
    if (section && article) {
      article.appendChild(section);
    }

    const cacheKey = "gh-contributions-" + username;
    const cacheDuration = 24 * 60 * 60 * 1000;

    async function loadContributionData() {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);

        if (Date.now() - parsed.timestamp < cacheDuration) {
          return parsed.data;
        }
      }

      const response = await fetch(
        "https://github-contributions-api.jogruber.de/v4/" +
          encodeURIComponent(username) +
          "?y=last"
      );

      if (!response.ok) {
        throw new Error("Unable to load GitHub contributions");
      }

      const data = await response.json();

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: data
        })
      );

      return data;
    }

    function renderCalendar(data) {
      grid.innerHTML = "";
      months.innerHTML = "";

      const contributions = data.contributions || [];

      if (!contributions.length) {
        throw new Error("No contribution data");
      }

      const firstDate = new Date(contributions[0].date + "T00:00:00Z");
      const leadingDays = firstDate.getUTCDay();
      const totalCells = leadingDays + contributions.length;
      const weekCount = Math.ceil(totalCells / 7);

      grid.style.gridTemplateColumns = `repeat(${weekCount}, 12px)`;
      chart.style.minWidth = `${36 + weekCount * 15}px`;

      for (let i = 0; i < leadingDays; i++) {
        const placeholder = document.createElement("span");
        placeholder.className = "gh-placeholder";
        grid.appendChild(placeholder);
      }

      let previousMonth = -1;

      contributions.forEach(function (item, index) {
        const date = new Date(item.date + "T00:00:00Z");
        const month = date.getUTCMonth();

        if (month !== previousMonth) {
          const monthLabel = document.createElement("span");
          const week = Math.floor((leadingDays + index) / 7) + 1;

          monthLabel.textContent = date.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC"
          });

          monthLabel.style.left = `${(week - 1) * 15}px`;
          months.appendChild(monthLabel);
          previousMonth = month;
        }

        const cell = document.createElement("span");
        cell.className = "gh-cell";
        cell.dataset.level = item.level;
        cell.title =
          `${item.count} contribution${item.count === 1 ? "" : "s"} on ${item.date}`;

        grid.appendChild(cell);
      });

      const total = contributions.reduce(function (sum, item) {
        return sum + item.count;
      }, 0);

      totalElement.textContent =
        `${total} contribution${total === 1 ? "" : "s"} in the last year`;
    }

    try {
      const data = await loadContributionData();
      renderCalendar(data);
    } catch (error) {
      totalElement.textContent = "Unable to load GitHub contributions.";
      totalElement.classList.add("gh-error");
      console.error(error);
    }
  });
</script>
