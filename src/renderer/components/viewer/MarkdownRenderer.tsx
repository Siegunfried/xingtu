import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}

// Pre-render LaTeX formulas to HTML using KaTeX before markdown processing
function preRenderMath(text: string): string {
  let result = text

  // First replace block formulas with placeholders to protect them
  const blocks: string[] = []
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match: string, math: string) => {
    const m = math.trim()
    if (!m) return ''
    blocks.push(m)
    return `%%MATHBLOCK${blocks.length - 1}%%`
  })
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match: string, math: string) => {
    const m = math.trim()
    if (!m) return ''
    blocks.push(m)
    return `%%MATHBLOCK${blocks.length - 1}%%`
  })

  // Render inline formulas: $...$ and \(...\)
  result = result.replace(/\$([^\$\n]+?)\$|\\\(([\s\S]*?)\\\)/g,
    (_match: string, dollarMath?: string, bracketMath?: string) => {
      const math = (dollarMath || bracketMath || '').trim()
      if (!math) return _match
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false })
      } catch {
        return `<code>${math}</code>`
      }
    }
  )

  // Restore block formulas
  result = result.replace(/%%MATHBLOCK(\d+)%%/g, (_match: string, idx: string) => {
    const math = blocks[parseInt(idx)]
    if (!math) return ''
    try {
      return katex.renderToString(math, { displayMode: true, throwOnError: false })
    } catch {
      return `<pre><code>${math}</code></pre>`
    }
  })

  return result
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const rendered = useMemo(() => preRenderMath(content), [content])

  return (
    <div className="markdown-content text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {rendered}
      </ReactMarkdown>
    </div>
  )
}
