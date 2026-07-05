<div align="center">
  <img src="public/assets/img/favicon.svg" width="80" height="80">
  <h1>YOLO Explainer</h1>
  <p><strong>基于 YOLO 论文的交互式可视化学习工具</strong></p>
  <p><a href="https://arxiv.org/abs/1506.02640">You Only Look Once: Unified, Real-Time Object Detection</a> — Redmon et al., CVPR 2016</p>

  <p>
    <a href="#功能特性">功能特性</a> ·
    <a href="#快速开始">快速开始</a> ·
    <a href="#项目结构">项目结构</a> ·
    <a href="#工作原理">工作原理</a> ·
    <a href="#参考资源">参考资源</a>
  </p>
</div>

---

## 功能特性

- **交互式 7×7 网格** — 点击任意网格单元格，查看其 2 个边界框预测和 20 个类别的概率分布
- **实时检测统计** — 直观显示非极大值抑制（NMS）前后保留和抑制的框数量
- **网络架构可视化** — 展示 YOLO 24 层卷积网络的完整结构
- **NMS 可视化** — 理解重复检测框如何被消除
- **教学文章** — 深入讲解 YOLO 理论、损失函数和性能对比
- **采用 Svelte + D3.js** — 与 [CNN Explainer](https://github.com/poloclub/cnn-explainer) 相同技术栈

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/ye-click/yolo-explainer.git
cd yolo-explainer

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 **http://localhost:3000**。

## 项目结构

```
yolo-explainer/
├── public/                     # 静态资源
│   ├── index.html              # 入口 HTML
│   └── global.css              # 全局样式
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.svelte              # 根组件
│   ├── Header.svelte           # 顶部导航（Logo + 外链）
│   ├── Explainer.svelte        # 主布局容器
│   ├── config.js               # YOLO 配置（S、B、C、网络架构）
│   ├── stores.js               # Svelte 状态管理
│   ├── overview/
│   │   ├── Overview.svelte     # 主可视化视图
│   │   └── grid-draw.js        # D3.js 绘制工具
│   ├── detail-view/
│   │   ├── GridCellView.svelte # 单元格预测详情
│   │   ├── NetworkView.svelte  # 网络架构图
│   │   └── NMSView.svelte      # 非极大值抑制可视化
│   ├── article/
│   │   └── Article.svelte      # 教学文章
│   └── utils/
│       └── yolo.js             # YOLO 核心逻辑（解码、NMS、损失函数）
├── rollup.config.js            # Rollup 打包配置
└── package.json                # 依赖和脚本
```

## 工作原理

### YOLO 检测流程

YOLO 将目标检测定义为一个**单一的回归问题**——一次前向传播直接从图像像素映射到边界框坐标和类别概率，无需复杂的多阶段流水线。

### 7×7 网格系统

输入图像（448×448）被划分为 **S × S 的网格**（S=7）。每个网格单元格负责检测其中心落入该单元格内的目标。

### 输出张量

每个网格单元格预测以下内容：

| 分量 | 大小 | 说明 |
|------|------|------|
| 框 1  | 5    | x, y, w, h, 置信度 |
| 框 2  | 5    | x, y, w, h, 置信度 |
| 类别  | 20   | PASCAL VOC 上每类物体的条件概率 |

**总计：** 7 × 7 × 30 = **1470 个值**

### 非极大值抑制（NMS）

通过比较同类检测框之间的 IoU（交并比），仅保留每个目标置信度最高的预测，消除重复检测。

## 技术栈

- **框架：** [Svelte](https://svelte.dev/) v3
- **打包工具：** [Rollup](https://rollupjs.org/)
- **可视化：** [D3.js](https://d3js.org/) v5
- **CSS 框架：** [Bulma](https://bulma.io/) v0.8
- **样式方案：** Svelte 作用域 CSS + CSS 自定义属性

## 参考资源

- **论文：** [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640) — Redmon et al., CVPR 2016
- **原始项目：** [pjreddie.com/yolo](https://pjreddie.com/darknet/yolo/)
- **灵感来源：** [CNN Explainer](https://github.com/poloclub/cnn-explainer) — 本项目的交互式可视化设计思路源自该项目

## 许可

本项目仅用于教育目的。YOLO 论文及相关材料版权归原作者所有。
