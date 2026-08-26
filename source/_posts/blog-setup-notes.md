---
title: 本站搭建记录：Hexo + Butterfly + GitHub Pages
date: 2026-08-26 12:00:00
tags:
  - Hexo
  - Butterfly
  - 建站
categories:
  - 技术笔记
---

这篇记录一下本博客（李神的小站）的完整搭建过程，环境为 Windows 11 + Node.js 22。

## 技术选型

| 方案 | 特点 | 结论 |
| --- | --- | --- |
| Hexo | Node.js 生态，中文社区最成熟，主题丰富 | 本站之选 |
| Hugo | 构建极快，但模板语法上手成本高 | 备选 |
| Astro | 现代化，适合前端深度定制 | 备选 |
| Halo / Ghost | 功能全但需要服务器和数据库 | 不适合静态博客 |

最终选择 **Hexo + Butterfly 主题**：纯静态、免费托管到 GitHub Pages、写作只需 Markdown。

## 搭建步骤

### 1. 初始化

```bash
npm install -g hexo-cli
hexo init lishen-blog
cd lishen-blog
npm install
```

### 2. 安装主题与插件

```bash
npm install hexo-theme-butterfly
npm install hexo-renderer-pug hexo-renderer-stylus
npm install hexo-generator-searchdb   # 本地搜索
npm install hexo-generator-feed        # RSS
```

### 3. 修改站点配置

编辑 `_config.yml`：

```yaml
title: 李神
author: 李神
language: zh-CN
timezone: Asia/Shanghai
theme: butterfly
url: https://你的用户名.github.io
```

主题定制项写在根目录 `_config.butterfly.yml`，它会覆盖主题默认配置，不用动 `node_modules` 里的文件。

### 4. 常用命令

```bash
hexo new "文章标题"   # 在 source/_posts 下生成新文章
hexo server          # 本地预览 http://localhost:4000
hexo clean && hexo generate  # 重新生成静态文件
```

### 5. 部署到 GitHub Pages

1. 在 GitHub 上创建 `你的用户名.github.io` 仓库
2. 把项目推上去，配置 `.github/workflows/deploy.yml`
3. 推送到 `main` 分支后，Action 会自动构建并把 `public/` 发布到 Pages

## 踩坑备忘

- 主题安装后必须在 `_config.yml` 里把 `theme` 从 `landscape` 改成 `butterfly`，否则渲染的还是旧主题
- 修改主题配置后如果页面没变化，先 `hexo clean` 清缓存再重新生成
- Windows 下命令都建议在项目根目录执行

---

至此，博客就算正式跑起来了。接下来，就该好好写文章了。
