export interface ContentBlock {
  id: string
  type: 'h1' | 'h2' | 'h3' | 'p' | 'code' | 'list' | 'quote' | 'empty'
  text: string
  globalStart: number
  globalEnd: number
}

// Split raw content into numbered blocks with global positions
export function parseBlocks(rawText: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = rawText.split('\n')
  let globalPos = 0
  let blockIdx = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      blocks.push({
        id: `b-${blockIdx++}`, type: 'empty', text: '',
        globalStart: globalPos, globalEnd: globalPos,
      })
      globalPos += line.length + 1
      i++
      continue
    }

    // Headings
    if (trimmed.match(/^#{1,3}\s/)) {
      const level = trimmed.match(/^(#{1,3})/)![1].length
      blocks.push({
        id: `b-${blockIdx++}`,
        type: `h${level}` as 'h1' | 'h2' | 'h3',
        text: line,
        globalStart: globalPos,
        globalEnd: globalPos + line.length,
      })
      globalPos += line.length + 1
      i++
      continue
    }

    // Code blocks
    if (trimmed.startsWith('```')) {
      const startPos = globalPos
      let codeText = line
      globalPos += line.length + 1
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeText += '\n' + lines[i]
        globalPos += lines[i].length + 1
        i++
      }
      if (i < lines.length) {
        codeText += '\n' + lines[i]
        globalPos += lines[i].length + 1
        i++
      }
      blocks.push({
        id: `b-${blockIdx++}`, type: 'code', text: codeText,
        globalStart: startPos, globalEnd: startPos + codeText.length,
      })
      continue
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      const startPos = globalPos
      let quoteText = line
      globalPos += line.length + 1
      i++
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteText += '\n' + lines[i]
        globalPos += lines[i].length + 1
        i++
      }
      blocks.push({
        id: `b-${blockIdx++}`, type: 'quote', text: quoteText,
        globalStart: startPos, globalEnd: startPos + quoteText.length,
      })
      continue
    }

    // Lists
    if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+[.)]\s/)) {
      const startPos = globalPos
      let listText = line
      globalPos += line.length + 1
      i++
      while (i < lines.length) {
        const next = lines[i].trim()
        if (next.match(/^[-*+]\s/) || next.match(/^\d+[.)]\s/)) {
          listText += '\n' + lines[i]
          globalPos += lines[i].length + 1
          i++
        } else if (next && !next.match(/^(#{1,3}\s|```|>)/)) {
          // continuation line
          listText += '\n' + lines[i]
          globalPos += lines[i].length + 1
          i++
        } else {
          break
        }
      }
      blocks.push({
        id: `b-${blockIdx++}`, type: 'list', text: listText,
        globalStart: startPos, globalEnd: startPos + listText.length,
      })
      continue
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const startPos = globalPos
    let paraText = line
    globalPos += line.length + 1
    i++
    while (i < lines.length) {
      const next = lines[i]
      const nt = next.trim()
      if (!nt || nt.match(/^(#{1,3}\s|```|>|[-*+]\s|\d+[.)]\s)/)) break
      paraText += '\n' + next
      globalPos += next.length + 1
      i++
    }
    blocks.push({
      id: `b-${blockIdx++}`, type: 'p', text: paraText,
      globalStart: startPos, globalEnd: startPos + paraText.length,
    })
  }

  return blocks
}
