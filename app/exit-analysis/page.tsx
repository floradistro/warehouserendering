'use client'

import { useEffect, useState } from 'react'

export default function ExitAnalysisPage() {
  const [content, setContent] = useState<string>('')
  
  useEffect(() => {
    // Read the markdown file
    fetch('/api/exit-analysis')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Failed to load analysis:', err))
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  )
}
