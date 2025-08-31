import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'EXIT_CODE_ANALYSIS.md')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Configure marked for better table rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
    
    // Convert markdown to HTML
    const htmlContent = marked(fileContent)
    
    // Add custom styles for better table display
    const styledContent = `
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          background: rgb(31, 41, 55);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        th {
          background: rgb(55, 65, 81);
          color: rgb(209, 213, 219);
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid rgb(75, 85, 99);
        }
        td {
          padding: 0.75rem;
          border-bottom: 1px solid rgb(55, 65, 81);
          color: rgb(229, 231, 235);
        }
        tr:hover {
          background: rgb(55, 65, 81);
        }
        h1 {
          color: rgb(239, 68, 68);
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          border-bottom: 2px solid rgb(239, 68, 68);
          padding-bottom: 0.5rem;
        }
        h2 {
          color: rgb(251, 146, 60);
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        h3 {
          color: rgb(250, 204, 21);
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        h4 {
          color: rgb(134, 239, 172);
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        strong {
          color: rgb(248, 113, 113);
          font-weight: 600;
        }
        ul, ol {
          margin: 1rem 0;
          padding-left: 2rem;
          color: rgb(229, 231, 235);
        }
        li {
          margin: 0.5rem 0;
        }
        hr {
          border-color: rgb(75, 85, 99);
          margin: 2rem 0;
        }
        code {
          background: rgb(55, 65, 81);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          color: rgb(167, 243, 208);
        }
        blockquote {
          border-left: 4px solid rgb(239, 68, 68);
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgb(209, 213, 219);
          font-style: italic;
        }
        .pass {
          color: rgb(134, 239, 172);
        }
        .fail {
          color: rgb(248, 113, 113);
        }
      </style>
      ${htmlContent}
    `
    
    return new NextResponse(styledContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error reading analysis file:', error)
    return NextResponse.json(
      { error: 'Failed to load analysis' },
      { status: 500 }
    )
  }
}
