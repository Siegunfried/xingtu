import React from 'react'
import type { ContentBlock } from '@/services/blockParser'
import MarkdownRenderer from './MarkdownRenderer'

interface Props {
  blocks: ContentBlock[]
}

export default function StructuredRenderer({ blocks }: Props) {
  return (
    <div className="text-sm leading-relaxed">
      {blocks.map((block) => {
        if (block.type === 'empty') {
          return <div key={block.id} data-block-id={block.id} className="h-3" />
        }

        return (
          <div key={block.id} data-block-id={block.id}>
            <MarkdownRenderer content={block.text} />
          </div>
        )
      })}
    </div>
  )
}
