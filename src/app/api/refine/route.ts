import { NextResponse } from 'next/server'

export const maxDuration = 180 // 3 minutes for local LLMs

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tasks } = body
    console.log('Refine Request received. Task count:', tasks?.length)
    
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks are required' }, { status: 400 })
    }

    // Format task list for AI
    const taskList = tasks.map((t: any) => `ID: ${t.id} / 제목: ${t.title}${t.project_name ? ` / 프로젝트: ${t.project_name}` : ''}`).join('\n')
    
    const prompt = `
당신은 팀장급 실무 전문가입니다. 다음 업무 리스트의 각 항목에 대해, 실무 문맥을 반영한 '세련된' 세부 수행 내용을 **2~3개씩 아주 간결하게** 작성해주세요.

[입력 데이터]
${taskList}

[작성 지침]
1. 각 업무 ID별로 **최대 3개**의 짧고 강력한 세부 블릿을 작성하세요.
2. 문장은 아주 간결하게 끝내세요 (예: ~ 보완 완료, ~ 정리 등).
3. 반드시 아래 형식을 지켜 답변하세요.

형식:
[ID: 업무ID]
- 세부내용1
- 세부내용2

[ID: 업무ID]
- 세부내용1
...
`

    const ollamaBaseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
    const apiKey = process.env.GEMINI_API_KEY
    
    let rawResponse = ''
    let usedOllama = false

    // 1. Try Ollama First (Local or Tunnel)
    console.log(`Checking Ollama at ${ollamaBaseUrl}...`)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for generation

      const ollamaRes = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: prompt,
          stream: false,
          options: { temperature: 0.2, num_predict: 400 }
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (ollamaRes.ok) {
        const data = await ollamaRes.json()
        rawResponse = data.response || ''
        usedOllama = true
        console.log('Successfully used Ollama for refinement.')
      }
    } catch (err) {
      console.log('Ollama not available or timed out, falling back to Gemini...')
    }

    // 2. Fallback to Gemini if Ollama failed
    let lastGeminiError = '';
    if (!usedOllama && apiKey) {
      console.log('Calling Gemini API (Fallback)...')
      
      const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-3-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ]

      let response: Response | null = null

      for (const modelName of modelsToTry) {
        try {
          // v1과 v1beta 엔드포인트를 순차적으로 시도
          const versions = ['v1', 'v1beta']
          let success = false
          
          for (const version of versions) {
            console.log(`Trying Gemini model: ${modelName} (${version})...`)
            const res = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
              })
            })

            if (res.ok) {
              response = res
              success = true
              console.log(`Successfully connected using Gemini model: ${modelName} via ${version}`)
              break
            } else {
              const errorText = await res.text()
              lastGeminiError = `Status: ${res.status}, Body: ${errorText.substring(0, 150)}`
              console.error(`Gemini Error (${modelName} ${version}):`, lastGeminiError)
              if (res.status !== 404) {
                // 404가 아닌 다른 오류(예: 401, 429)면 해당 모델은 가망이 없으므로 다음 모델로
                break
              }
            }
          }
          
          if (success) break
        } catch (err: any) {
          console.error(`Error calling Gemini ${modelName}:`, err)
          lastGeminiError = err?.message || String(err)
        }
      }

      if (response && response.ok) {
        const data = await response.json()
        rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
    }

    // 3. Final Error Check
    if (!rawResponse) {
      if (!usedOllama) {
        if (!apiKey) {
          throw new Error('Vercel 환경변수에 GEMINI_API_KEY가 등록되지 않았거나 적용되지 않았습니다. (Redeploy 필요)')
        } else {
          throw new Error(`Gemini API 키가 설정되어 있으나 응답을 받지 못했습니다. 상세 사유: ${lastGeminiError}`)
        }
      }
      throw new Error('AI 응답을 생성할 수 없습니다. Ollama 서버가 실행 중인지 또는 Gemini API 키가 유효한지 확인해주세요.')
    }

    console.log('AI Response received. Length:', rawResponse.length)

    // Parse the custom format into Record<string, string[]>
    const result: Record<string, string[]> = {}
    const sections = rawResponse.split(/\[ID: /)
    
    sections.forEach((section: string) => {
      if (!section.trim()) return
      
      const idMatch = section.match(/^([^\]]+)\]/)
      if (idMatch) {
        const id = idMatch[1].trim()
        const lines = section
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1).trim())
        
        if (lines.length > 0) {
          result[id] = lines
        }
      }
    })

    console.log('Parsed AI Result keys:', Object.keys(result))
    return NextResponse.json({ result })

  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI 정제 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
