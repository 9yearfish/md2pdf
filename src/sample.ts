/** Shown on first visit so the viewer has something to render immediately. */
export const SAMPLE_DOCUMENT = `# md2pdf 示例文档

这是一个**完全在浏览器里运行**的 Markdown 转 PDF 工具。你的文档不会上传到任何服务器 —— 排版引擎、字体、转换过程全部在这个标签页里完成。

左边编辑，右边就是最终的 PDF。点下载拿到的，就是你正在看的这份文件。

## 流程图

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[markdown-it 解析]
  B --> C{含流程图?}
  C -- 是 --> D[Mermaid 渲染 SVG]
  C -- 否 --> E[生成 Typst 源码]
  D --> E
  E --> F[(PDF)]
\`\`\`

流程图是以**矢量**嵌入的，放大不会糊，图里的文字也能被选中和搜索。

## 文字排版

支持 *斜体*、**粗体**、***粗斜体***、~~删除线~~、\`行内代码\`，以及[链接](https://example.com)。中英文混排时会自动处理断行，不会出现多余空格。

> 引用块用来强调一段话。
>
> 也可以有多个段落。

## 列表

1. 有序列表
2. 第二项
   - 嵌套的无序列表
   - 另一项
3. 第三项

- [x] 已完成的任务
- [ ] 待办事项
- [ ] 另一个待办

## 代码

\`\`\`python
def fibonacci(n: int) -> int:
    """语法高亮由 Typst 内置的 syntect 提供。"""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## 表格

| 特性 | 说明 | 状态 |
|:-----|:----:|-----:|
| 中文排版 | 真文字，可选可搜 | 支持 |
| 流程图 | 原生矢量嵌入 | 支持 |
| 数学公式 | 计划中 | 暂无 |

## 脚注

排版引擎用的是 Typst[^1]，它负责分页、目录、页码和书签。

[^1]: 一个现代的排版系统，编译成 WebAssembly 后可以在浏览器里运行。

---

最后一行。
`;
