import React, { useState, useRef, useEffect } from 'react'
import { extractFromPrompt, enhanceUrlDataWithPrompt, extractCategoryFromPrompt, extractFromUrl, checkAPIHealth, APIError } from '../services/llmService'
import { COLORS, getSquareSeparatorStyle, getLiquidGlassStyle } from '../utils/designSystem'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type PromptType = 'url' | 'add_gear' | 'add_category' | 'url_with_prompt' | 'multiple_urls' | 'general'

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
  gearItems?: any[]
  categories?: any[]
  onGearExtracted?: (gearData: any) => void
  currentGearList?: any[] // For gear list analysis
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, onGearExtracted }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! Welcome to the AI-powered Gear Management System. Available features:\n\n**Gear Registration**\n• Brand + Product name\n  Example: "Arc\'teryx Beta AR"\n\n**Category Management**  \n• Add new categories\n  Example: "Shelter category"\n\n**URL Analysis**\n• Single URL extraction\n• Batch processing for multiple URLs ✨NEW\n• URL + additional info\n  Example: "URL + actual weight 230g"\n\nYou can paste multiple URLs at once for batch registration!',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll message area to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Extract multiple URLs from text
  const extractMultipleUrls = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex) || []
    // Remove duplicates
    return [...new Set(urls)]
  }

  // Classify user prompt
  const classifyPrompt = (prompt: string): PromptType => {
    const urls = extractMultipleUrls(prompt)
    const lowerPrompt = prompt.toLowerCase()

    // Multiple URLs pattern
    if (urls.length > 1) {
      return 'multiple_urls'
    }

    // URL + additional info pattern
    if (urls.length === 1 && prompt.length > urls[0].length + 10) {
      return 'url_with_prompt'
    }

    // Pure single URL pattern
    if (urls.length === 1 && /^https?:\/\/.+$/.test(prompt.trim())) {
      return 'url'
    }

    // Category pattern (English or Japanese)
    if (lowerPrompt.includes('category') || lowerPrompt.includes('カテゴリ')) {
      return 'add_category'
    }

    // Gear pattern (contains brand name)
    if (containsBrand(prompt)) {
      return 'add_gear'
    }

    return 'general'
  }

  // Check if brand name is included
  const containsBrand = (prompt: string): boolean => {
    const brandPatterns = [
      'Arc\'teryx', 'Patagonia', 'Montbell', 'REI', 'Osprey', 'Deuter', 'Gregory',
      'The North Face', 'Marmot', 'Mountain Hardwear', 'Outdoor Research', 'Black Diamond',
      'Petzl', 'MSR', 'Jetboil', 'Platypus', 'Hydro Flask', 'Nalgene', 'Merrell',
      'Salomon', 'Altra', 'Hoka', 'La Sportiva', 'Scarpa', 'Mammut', 'Rab',
      'Western Mountaineering', 'Big Agnes', 'Sea to Summit', 'Therm-a-Rest', 'NEMO',
      'Zpacks', 'Hyperlite Mountain Gear', 'Gossamer Gear', 'Six Moon Designs'
    ]
    
    return brandPatterns.some(brand => 
      prompt.toLowerCase().includes(brand.toLowerCase())
    )
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    try {
      let assistantResponse: string
      let shouldExtractGear = false
      let mockGearData: any = null

      const promptType = classifyPrompt(currentInput)

        switch (promptType) {
          case 'url':
            try {
              const extractedData = await extractFromUrl(currentInput)
              assistantResponse = `Successfully extracted product info from URL!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? `${extractedData.weightGrams}g` : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdding to your gear list!`
              shouldExtractGear = true
              mockGearData = {
                name: extractedData.name,
                brand: extractedData.brand,
                productUrl: currentInput,
                requiredQuantity: 1,
                ownedQuantity: 0,
                weightGrams: extractedData.weightGrams,
                priceCents: extractedData.priceCents,
                season: '',
                priority: 3
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `URL parsing error: ${error.message}\n\nThere might be a communication issue with the backend.`
              } else {
                assistantResponse = `URL parsing error: ${error instanceof Error ? error.message : 'Failed to extract info from URL'}\n\nPlease provide a valid URL.`
              }
            }
            break

          case 'add_gear':
            try {
              const extractedData = await extractFromPrompt(currentInput)
              assistantResponse = `Gear info extracted!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? `${extractedData.weightGrams}g` : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdding to your gear list!`
              shouldExtractGear = true
              mockGearData = {
                name: extractedData.name,
                brand: extractedData.brand,
                productUrl: '',
                requiredQuantity: 1,
                ownedQuantity: 0,
                weightGrams: extractedData.weightGrams,
                priceCents: extractedData.priceCents,
                season: '',
                priority: 3
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `API error: ${error.message}\n\nThere might be a communication issue with the backend.\n\n${error.status ? `Status: ${error.status}` : ''}`
              } else {
                assistantResponse = `Error: ${error instanceof Error ? error.message : 'Failed to extract gear info'}\n\nPlease use correct format.\nExample: "Arc'teryx Beta AR"`
              }
            }
            break

          case 'add_category':
            try {
              const categoryData = await extractCategoryFromPrompt(currentInput)
              if (categoryData) {
                assistantResponse = `Category created!\n\nCategory: ${categoryData.englishName}\nJapanese: ${categoryData.name}\n\nNew category is now available.`
              } else {
                assistantResponse = `Could not identify category name.\n\nExample: "Shelter category" or "Cooking gear"`
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `API error: ${error.message}\n\nThere might be a communication issue with the backend.`
              } else {
                assistantResponse = `Category processing error: ${error instanceof Error ? error.message : 'Failed to create category'}`
              }
            }
            break

          case 'url_with_prompt':
            try {
              // Extract URL
              const urlMatch = currentInput.match(/(https?:\/\/[^\s]+)/)
              if (urlMatch) {
                const url = urlMatch[1]
                // Get basic URL info
                const urlData = await extractFromUrl(url)
                // Enhance with prompt info
                const enhancedData = await enhanceUrlDataWithPrompt(urlData, currentInput)

                assistantResponse = `Processed URL with additional info!\n\nProduct: ${enhancedData.name}\nBrand: ${enhancedData.brand}\nWeight: ${enhancedData.weightGrams}g\nPrice: ¥${Math.round(enhancedData.priceCents! / 100).toLocaleString()}\nCategory: ${enhancedData.suggestedCategory}\n\nAdding to your gear list!`
                shouldExtractGear = true
                mockGearData = {
                  name: enhancedData.name,
                  brand: enhancedData.brand,
                  productUrl: url,
                  requiredQuantity: 1,
                  ownedQuantity: 0,
                  weightGrams: enhancedData.weightGrams,
                  priceCents: enhancedData.priceCents,
                  season: '',
                  priority: 3
                }
              } else {
                assistantResponse = `URL not found.\n\nExample: "https://example.com/product + actual weight230g"`
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `API error: ${error.message}\n\nThere is an issue processing the URL in the backend.\nThe site may be inaccessible or scraping may be blocked.`
              } else {
                assistantResponse = `URL processing error: ${error instanceof Error ? error.message : 'Failed to process URL'}`
              }
            }
            break

          case 'multiple_urls':
            try {
              const urls = extractMultipleUrls(currentInput)
              assistantResponse = `${urls.length} URLs detected. Starting parallel processing...\n\n`

              // Process all URLs in parallel
              const results = await Promise.allSettled(
                urls.map(url => extractFromUrl(url))
              )

              // Classify success/failure
              const successResults: any[] = []
              const failedUrls: string[] = []

              results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                  successResults.push({
                    url: urls[index],
                    data: result.value
                  })
                } else {
                  failedUrls.push(urls[index])
                }
              })

              // Create response
              if (successResults.length > 0) {
                assistantResponse += `✅ Success: ${successResults.length} items\n\n`
                successResults.forEach((item, idx) => {
                  assistantResponse += `**${idx + 1}. ${item.data.name}**\n`
                  assistantResponse += `  Brand: ${item.data.brand || 'Unknown'}\n`
                  assistantResponse += `  Weight: ${item.data.weightGrams ? `${item.data.weightGrams}g` : 'Estimating...'}\n`
                  assistantResponse += `  Price: ${item.data.priceCents ? `¥${Math.round(item.data.priceCents / 100).toLocaleString()}` : 'Estimating...'}\n`
                  assistantResponse += `  Category: ${item.data.suggestedCategory}\n\n`
                })

                // Bulk register multiple gears
                shouldExtractGear = true
                mockGearData = successResults.map(item => ({
                  name: item.data.name,
                  brand: item.data.brand,
                  productUrl: item.url,
                  requiredQuantity: 1,
                  ownedQuantity: 0,
                  weightGrams: item.data.weightGrams,
                  priceCents: item.data.priceCents,
                  season: '',
                  priority: 3
                }))
              }

              if (failedUrls.length > 0) {
                assistantResponse += `\n❌ Failed: ${failedUrls.length} items\n`
                failedUrls.forEach((url, idx) => {
                  assistantResponse += `  ${idx + 1}. ${url.substring(0, 50)}...\n`
                })
              }

              assistantResponse += `\n${successResults.length} gear items added to your list.`
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `Batch processing error: ${error.message}\n\nThere's a communication issue with the backend.`
              } else {
                assistantResponse = `Multiple URL processing error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`
              }
            }
            break


          default:
            assistantResponse = `Let me help you manage your gear!\n\nAvailable features:\n• Brand + Product name\n  Example: "Arc'teryx Beta AR"\n• Add categories\n  Example: "Shelter category"\n• Process product URLs\n  Example: Paste URLs`
            break
        }
      } catch (error) {
        if (error instanceof APIError) {
          assistantResponse = `System error: ${error.message}\n\nThere was a communication issue with the backend API.\nPlease try again after a short while.\n\n${error.status ? `HTTP Status: ${error.status}` : ''}`
        } else {
          assistantResponse = `An error occurred during processing: ${error instanceof Error ? error.message : 'unknown error'}\n\nIf the problem persists, please contact the system administrator.`
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // ギアデータの
      if (shouldExtractGear && mockGearData && onGearExtracted) {
        // 配列の場合は複数ギア、オブジェクトの場合は単一ギア
        if (Array.isArray(mockGearData)) {
          mockGearData.forEach(gear => onGearExtracted(gear))
        } else {
          onGearExtracted(mockGearData)
        }
      }

      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* オーバーレイ */}
      <div
        className="flex-1 bg-black bg-opacity-20 backdrop-blur-sm transition-all duration-150"
        onClick={onClose}
      />

      {/* チャットパネル */}
      <div
        className="w-96 lg:w-[420px] flex flex-col animate-in slide-in-from-right duration-200 ease-out shadow-2xl"
        style={{
          ...getSquareSeparatorStyle(),
          borderLeft: `2px solid ${COLORS.primary.medium}`,
          borderRadius: '0',
        }}
      >
        {/* ヘッダー */}
        <div
          className="p-5 border-b flex justify-between items-center backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderBottomColor: 'rgba(255, 255, 255, 0.2)',
            color: COLORS.white
          }}
        >
          <div>
            <h3 className="text-base font-bold tracking-tight">AI ギアアシスタント</h3>
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              URLから自動抽出・スマート分析
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
            style={{
              ...getLiquidGlassStyle(),
              color: COLORS.white,
              fontSize: '18px'
            }}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle('hover'));
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle());
            }}
          >
            ✕
          </button>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 backdrop-blur-sm">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${
                  message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={{
                  ...(message.role === 'user'
                    ? {
                        backgroundColor: COLORS.primary.dark,
                        color: COLORS.white,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }
                    : {
                        ...getSquareSeparatorStyle(),
                        color: COLORS.text.primary,
                        border: `1px solid rgba(255, 255, 255, 0.3)`
                      })
                }}
              >
                <div className={`${message.role === 'user' ? 'text-sm' : 'text-sm'} whitespace-pre-wrap leading-relaxed`}>
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 opacity-70`}
                  style={{
                    color: message.role === 'user' ? 'rgba(255, 255, 255, 0.8)' : COLORS.text.secondary
                  }}
                >
                  {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div
                className="p-4 rounded-2xl rounded-bl-md transition-all duration-200"
                style={{
                  ...getSquareSeparatorStyle(),
                  color: COLORS.text.primary,
                  border: `1px solid rgba(255, 255, 255, 0.3)`
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"
                    style={{ borderColor: COLORS.primary.medium }}
                  ></div>
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div
          className="p-5 border-t backdrop-blur-md"
          style={{
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter product URL or instructions..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 text-sm transition-all duration-200 disabled:opacity-50"
              style={{
                ...getSquareSeparatorStyle(),
                borderRadius: '12px',
                color: COLORS.text.primary,
                fontSize: '14px',
                '::placeholder': {
                  color: COLORS.text.secondary
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                backgroundColor: COLORS.primary.dark,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
Send
            </button>
          </div>
          <p
            className="text-xs mt-3 leading-relaxed"
            style={{ color: COLORS.text.secondary }}
          >
Example: "Arc'teryx Beta AR" / "Shelter category" / Product URLs
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatPopup