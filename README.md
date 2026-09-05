# 李神的个人博客 (Lishen's Blog) 🚀

<div align="center">

![Hexo](https://img.shields.io/badge/Hexo-8.x-blue?style=flat-square&logo=hexo)
![Theme](https://img.shields.io/badge/Theme-Butterfly%205.7-orange?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen?style=flat-square&logo=github)
![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey?style=flat-square)

**保持热爱，奔赴山海 —— 记录技术、思考与生活**

[🌐 访问线上站点](https://lljfei.github.io) · [📝 查看博文归档](https://lljfei.github.io/archives/) · [🤝 友情链接](https://lljfei.github.io/link/) · [👋 关于李神](https://lljfei.github.io/about/)

</div>

---

## 📖 项目简介

本仓库为 **李神的个人独立博客** 源码，基于现代静态站点生成框架 [Hexo 8](https://hexo.io/) 与卡片式美学主题 [Butterfly](https://butterfly.js.org/) 构建，通过 GitHub Actions 实现全自动 CI/CD 构建并部署至 GitHub Pages。

### 🌟 核心特色与功能

- 🎨 **现代化 UI/UX 设计**：采用黑金与暖纸色的编辑式布局，适配手机阅读、完整文章标题和深浅色模式。
- 🌓 **智能暗色模式 (Dark Mode)**：支持跟随系统偏好或按需一键切换。
- 📊 **数据统计集成**：
  - 文章字数统计与预估阅读时长（`hexo-wordcount`）；
  - 全站与文章 UV / PV 访客浏览量统计（不蒜子 Busuanzi）；
  - 站点稳定运行时间动态计时。
- 🔀 **图表与公式渲染**：
  - 支持 **Mermaid** 流程图、序列图与时序架构图直接渲染；
  - 支持 **KaTeX** 数学公式高效渲染。
- 🔍 **全站本地极速搜索**：基于 `hexo-generator-searchdb` 的即时搜索与关键词高亮，支持弹窗键盘操作与关闭后的焦点恢复。
- 🏷️ **标签快速筛选**：按名称筛选标签，显示匹配数量与无结果提示，支持一键清除。
- ⌨️ **可访问导航**：跳过导航直接进入内容；移动菜单支持 Esc 关闭、Tab 焦点循环与当前栏目提示。
- 🤝 **丰富的互动页面**：
  - 友情链接展示页 (`/link/`)；
  - 现代化技术栈与个人装备关于页 (`/about/`)；
  - 分类、标签、时间轴全景归档。
- 🤖 **SEO 与爬虫友好**：集成 `sitemap.xml`、`atom.xml` RSS 订阅与标准化 `robots.txt`。

---

## 🛠️ 本地开发与写作

### 1. 安装依赖

```bash
npm install
```

### 2. 内容配置

- 文章 front-matter 的 `description` 用作首页摘要；未填写时自动截取 160 字。
- 关于页尚未配置真实邮箱，添加联系方式时请同步更新友链申请说明。
- 主题依赖保留在 `node_modules`，定制逻辑与样式位于 `source/js/custom.js` 和 `source/css/custom.css`。

### 3. 常用命令

| 命令 | 描述 |
| :--- | :--- |
| `npm run server` | 启动本地预览服务器（默认访问 `http://localhost:4000`） |
| `npm run build` | 重新生成静态页面到 `public/` 目录 |
| `npm run clean` | 清除 Hexo 编译缓存 `db.json` 与 `public/` |
| `npx hexo new post "文章标题"` | 在 `source/_posts/` 下生成新文章 |
| `npx hexo new draft "草稿标题"` | 创建草稿；使用 `npx hexo publish "标题"` 转正 |

---

## 📁 目录结构

```text
lishen-blog/
├── .github/workflows/    # GitHub Actions 自动化部署工作流
├── scaffolds/             # 文章创建模板 (post, page, draft)
├── source/                # 站点源文件与 Markdown 文章
│   ├── _data/             # 外部数据源 (link.yml 友链等)
│   ├── _posts/            # 正式博文 Markdown 文件
│   ├── about/             # 关于我页面
│   ├── link/              # 友情链接页面
│   ├── categories/        # 全站分类页
│   ├── tags/              # 全站标签页
│   ├── css/               # 自定义样式 (custom.css)
│   ├── js/                # 自定义脚本 (custom.js)
│   ├── img/               # 静态图片与矢量图标 (avatar.svg)
│   └── robots.txt         # 搜索引擎爬虫抓取规则
├── _config.yml            # Hexo 站点主配置文件
├── _config.butterfly.yml  # Butterfly 主题定制覆盖配置文件
├── package.json           # 项目依赖与 npm scripts
└── README.md              # 项目说明文档
```

---

## 🚀 部署流程

项目已接入 GitHub Actions 自动化流水线。

只需将修改提交并推送到远程仓库的 `main` 分支，GitHub Actions 将自动执行构建并将生成的 `public/` 静态网页发布至 `gh-pages` 分支。

```bash
git add .
git commit -m "feat: 丰富与优化博客配置与内容"
git push origin main
```

---

## 📄 版权协议

本站所有原创博文均采用 [知识共享 署名-非商业性使用-相同方式共享 4.0 国际许可协议 (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)。
