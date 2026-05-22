import * as mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

export async function parseDocument(
  format: 'pdf' | 'docx' | 'txt' | 'md',
  base64Data: string
): Promise<string> {
  switch (format) {
    case 'txt':
    case 'md':
      return decodeBase64Text(base64Data)

    case 'docx':
      return parseDocx(base64Data)

    case 'pdf':
      return parsePdf(base64Data)

    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

function decodeBase64Text(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

async function parseDocx(base64: string): Promise<string> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer })
  return result.value
}

async function parsePdf(base64: string): Promise<string> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
    textParts.push(pageText)
  }

  return textParts.join('\n\n')
}
