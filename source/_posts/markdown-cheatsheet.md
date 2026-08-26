---
title: Markdown 写作速查 —— 在博客上能用到的一切排版
date: 2026-08-26 11:00:00
tags:
  - Markdown
  - 写作
categories:
  - 技术笔记
katex: true
---

本博客所有文章都使用 Markdown 书写。这篇是给未来的自己（也可能是你）准备的排版速查表，顺便测试一下博客的各种渲染效果。

## 标题与段落

用 `#` 到 `######` 表示一到六级标题，段落之间空一行即可。

## 文字样式

**加粗**、*斜体*、~~删除线~~、`行内代码`，以及 [行内链接](https://hexo.io/)。

## 引用

> 这是一段引用。
>
> 引用可以有多段。

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套项

有序列表：

1. 第一步
2. 第二步
3. 第三步

## 代码块

行内代码用反引号包裹，代码块使用三个反引号并声明语言以获得语法高亮：

```javascript
// 一段普通的 JavaScript
function greet(name) {
  return `你好，${name}！`;
}

console.log(greet('李神'));
```

```python
# 一段普通的 Python
def fibonacci(n: int):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fibonacci(10)))
```

```bash
# 本地启动博客
hexo server
```

## 表格

| 命令 | 作用 |
| --- | --- |
| `hexo new "标题"` | 新建文章 |
| `hexo server` | 本地预览 |
| `hexo generate` | 生成静态文件 |
| `hexo clean` | 清理缓存 |

## 数学公式（可选）

若主题开启了公式渲染，可以写行内公式 $E = mc^2$，也可以写块级公式：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## 分割线

---

以上就是日常写作 99% 会用到的语法。剩下的 1%，用到的时候再查文档也不迟。
