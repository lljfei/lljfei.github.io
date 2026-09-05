<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  exclude-result-prefixes="atom">
  <xsl:output method="html" encoding="UTF-8"/>

  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="atom:feed/atom:title"/> · RSS</title>
        <style>
          :root {
            color-scheme: light;
            --feed-bg: #f4f0e8;
            --feed-surface: #fffdf8;
            --feed-ink: #151412;
            --feed-muted: #756f64;
            --feed-line: rgba(21, 20, 18, .14);
            --feed-gold: #a66f1e;
            --feed-accent: #c84b36;
            --feed-shadow: 0 20px 60px rgba(54, 45, 31, .12);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              color-scheme: dark;
              --feed-bg: #11100e;
              --feed-surface: #191714;
              --feed-ink: #f4efe5;
              --feed-muted: #bbb2a4;
              --feed-line: rgba(244, 239, 229, .16);
              --feed-gold: #f0c878;
              --feed-accent: #e06a51;
              --feed-shadow: 0 24px 72px rgba(0, 0, 0, .32);
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            background: var(--feed-bg);
            color: var(--feed-ink);
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
            line-height: 1.7;
          }
          a { color: var(--feed-gold); text-decoration-thickness: 1px; text-underline-offset: 4px; }
          a:hover { color: var(--feed-accent); }
          .feed-shell { width: min(920px, calc(100% - 32px)); margin: 0 auto; padding: 56px 0 72px; }
          .feed-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 28px;
            border-bottom: 1px solid var(--feed-line);
          }
          .eyebrow { margin: 0 0 8px; color: var(--feed-accent); font-size: .75rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
          h1 { margin: 0; font-family: Georgia, "Noto Serif SC", serif; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.15; }
          .feed-home { white-space: nowrap; }
          .feed-intro { margin: 28px 0 36px; color: var(--feed-muted); }
          .feed-intro p { max-width: 650px; margin: 0; }
          .feed-list { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; }
          .feed-entry { padding: 26px 28px; border: 1px solid var(--feed-line); border-radius: 14px; background: var(--feed-surface); box-shadow: var(--feed-shadow); }
          .entry-meta { margin: 0 0 8px; color: var(--feed-muted); font-size: .78rem; letter-spacing: .03em; }
          .entry-meta span { display: inline-block; margin-left: 8px; }
          h2 { margin: 0 0 10px; font-family: Georgia, "Noto Serif SC", serif; font-size: clamp(1.35rem, 3vw, 1.8rem); line-height: 1.35; }
          h2 a { color: var(--feed-ink); text-decoration: none; }
          h2 a:hover { color: var(--feed-accent); }
          .entry-summary { margin: 0 0 18px; color: var(--feed-muted); }
          .entry-link { font-size: .88rem; font-weight: 600; }
          .feed-footer { margin-top: 36px; color: var(--feed-muted); font-size: .82rem; }
          @media (max-width: 640px) {
            .feed-shell { width: min(100% - 24px, 920px); padding-top: 32px; }
            .feed-header { align-items: flex-start; flex-direction: column; gap: 14px; }
            .feed-entry { padding: 22px 20px; }
          }
        </style>
      </head>
      <body>
        <main class="feed-shell">
          <header class="feed-header">
            <div>
              <p class="eyebrow">RSS / ATOM FEED</p>
              <h1><xsl:value-of select="atom:feed/atom:title"/></h1>
            </div>
            <a class="feed-home" href="{atom:feed/atom:link[@rel='alternate'][1]/@href}">访问博客 →</a>
          </header>

          <section class="feed-intro">
            <p><xsl:value-of select="atom:feed/atom:subtitle"/></p>
          </section>

          <section aria-label="文章列表">
            <ol class="feed-list">
              <xsl:for-each select="atom:feed/atom:entry">
                <li>
                  <article class="feed-entry">
                    <p class="entry-meta">
                      <time datetime="{atom:updated}"><xsl:value-of select="substring(atom:published, 1, 10)"/></time>
                      <xsl:for-each select="atom:category">
                        <span><xsl:value-of select="@term"/></span>
                      </xsl:for-each>
                    </p>
                    <h2><a href="{atom:link[not(@rel)][1]/@href}"><xsl:value-of select="atom:title"/></a></h2>
                    <p class="entry-summary"><xsl:value-of select="atom:summary"/></p>
                    <a class="entry-link" href="{atom:link[not(@rel)][1]/@href}">阅读原文 →</a>
                  </article>
                </li>
              </xsl:for-each>
            </ol>
          </section>

          <footer class="feed-footer">
            <p>这是一个 Atom 订阅源，也可以复制地址到你常用的 RSS 阅读器。</p>
          </footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
