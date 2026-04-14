import React, { useState, useRef, useEffect } from 'react'
import { extractFromPrompt, enhanceUrlDataWithPrompt, extractCategoryFromPrompt, extractFromUrl, APIError } from '../services/llmService'
import { COLORS, SHADOW, FONT_SCALE, SPACING_SCALE, RADIUS_SCALE, BORDERS } from '../utils/designSystem'
import { alpha } from '../styles/tokens'
import { useWeightUnit } from '../contexts/WeightUnitContext'
import { formatWeight } from '../utils/weightUnit'

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
  onGearExtracted?: (gearData: any) => void
  categories?: any[]
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, onGearExtracted, categories = [] }) => {
  const { unit: weightUnit } = useWeightUnit()
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
      let assistantResponse: string = ''
      let shouldExtractGear = false
      let mockGearData: any = null

      const promptType = classifyPrompt(currentInput)

      switch (promptType) {
          case 'url':
            try {
              const extractedData = await extractFromUrl(currentInput, categories)
              const matchedCategory = categories.find(cat => cat.name === extractedData.suggestedCategory)
              assistantResponse = `Successfully extracted product info from URL!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdding to your gear list!`
              shouldExtractGear = true
              mockGearData = {
                name: extractedData.name,
                brand: extractedData.brand,
                productUrl: currentInput,
                categoryId: matchedCategory?.id,
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
              const extractedData = await extractFromPrompt(currentInput, categories)
              const matchedCategory = categories.find(cat => cat.name === extractedData.suggestedCategory)
              assistantResponse = `Gear info extracted!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdding to your gear list!`
              shouldExtractGear = true
              mockGearData = {
                name: extractedData.name,
                brand: extractedData.brand,
                productUrl: '',
                categoryId: matchedCategory?.id,
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
                const urlData = await extractFromUrl(url, categories)
                // Enhance with prompt info
                const enhancedData = await enhanceUrlDataWithPrompt(urlData, currentInput)
                const matchedCategory = categories.find(cat => cat.name === enhancedData.suggestedCategory)

                assistantResponse = `Processed URL with additional info!\n\nProduct: ${enhancedData.name}\nBrand: ${enhancedData.brand}\nWeight: ${formatWeight(enhancedData.weightGrams ?? null, weightUnit)}\nPrice: ¥${Math.round(enhancedData.priceCents! / 100).toLocaleString()}\nCategory: ${enhancedData.suggestedCategory}\n\nAdding to your gear list!`
                shouldExtractGear = true
                mockGearData = {
                  name: enhancedData.name,
                  brand: enhancedData.brand,
                  productUrl: url,
                  categoryId: matchedCategory?.id,
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
                urls.map(url => extractFromUrl(url, categories))
              )

              // Classify success/failure based on data quality
              const successResults: any[] = []
              const failedUrls: string[] = []

              results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                  const data = result.value

                  // Check if the result is actually valid (not a fallback)
                  const isFallback = data.source === 'fallback' ||
                                    !data.name ||
                                    data.name.includes('Failed to Extract') ||
                                    data.name.includes('Product from')

                  if (!isFallback) {
                    successResults.push({
                      url: urls[index],
                      data: result.value
                    })
                  } else {
                    failedUrls.push(urls[index])
                  }
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
                  assistantResponse += `  Weight: ${item.data.weightGrams ? formatWeight(item.data.weightGrams, weightUnit) : 'Estimating...'}\n`
                  assistantResponse += `  Price: ${item.data.priceCents ? `¥${Math.round(item.data.priceCents / 100).toLocaleString()}` : 'Estimating...'}\n`
                  assistantResponse += `  Category: ${item.data.suggestedCategory}\n\n`
                })

                // Bulk register multiple gears
                shouldExtractGear = true
                mockGearData = successResults.map(item => {
                  const matchedCategory = categories.find(cat => cat.name === item.data.suggestedCategory)
                  return {
                    name: item.data.name,
                    brand: item.data.brand,
                    productUrl: item.url,
                    imageUrl: item.data.imageUrl,
                    categoryId: matchedCategory?.id,
                    requiredQuantity: 1,
                    ownedQuantity: 0,
                    weightGrams: item.data.weightGrams,
                    priceCents: item.data.priceCents,
                    season: '',
                    priority: 3
                  }
                })
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

      // Add gear data if extracted
      if (shouldExtractGear && mockGearData && onGearExtracted) {
        // Array: multiple gears, Object: single gear
        if (Array.isArray(mockGearData)) {
          mockGearData.forEach(gear => onGearExtracted(gear))
        } else {
          onGearExtracted(mockGearData)
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      let assistantResponse: string
      if (error instanceof APIError) {
        assistantResponse = `System error: ${error.message}\n\nThere was a communication issue with the backend API.\nPlease try again after a short while.\n\n${error.status ? `HTTP Status: ${error.status}` : ''}`
      } else {
        assistantResponse = `An error occurred during processing: ${error instanceof Error ? error.message : 'unknown error'}\n\nIf the problem persists, please contact the system administrator.`
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
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
      {/* Overlay */}
      <div
        className="flex-1 bg-black bg-opacity-20 backdrop-blur-sm transition-all duration-150"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div
        className="w-96 lg:w-[420px] flex flex-col animate-in slide-in-from-right duration-200 ease-out"
        style={{
          backgroundColor: COLORS.white,
          boxShadow: `-4px 0 6px -1px ${alpha(COLORS.gray[900], 0.1)}`,
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
            borderBottom: BORDERS.default,
          }}
        >
          <div>
            <h3 className="font-semibold" style={{ fontSize: `${FONT_SCALE.base}px`, color: COLORS.text.primary }}>AI Gear Assistant</h3>
            <p
              style={{ fontSize: `${FONT_SCALE.sm}px`, color: COLORS.text.secondary, marginTop: '4px' }}
            >
              Auto-extract & Smart Analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-opacity hover:opacity-70"
            style={{
              color: COLORS.text.secondary,
              fontSize: `${FONT_SCALE.lg}px`,
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Area */}
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
                        backgroundColor: COLORS.gray[700],
                        color: COLORS.white,
                        boxShadow: SHADOW
                      }
                    : {
                        backgroundColor: COLORS.white,
                        color: COLORS.text.primary,
                        boxShadow: SHADOW
                      })
                }}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 opacity-70`}
                  style={{
                    color: message.role === 'user' ? alpha(COLORS.white, 0.8) : COLORS.text.secondary
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
                  backgroundColor: COLORS.white,
                  color: COLORS.text.primary,
                  boxShadow: SHADOW
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"
                    style={{ borderColor: COLORS.gray[700] }}
                  ></div>
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
            borderTop: BORDERS.default,
            backgroundColor: COLORS.gray[50]
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
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: COLORS.white,
                boxShadow: SHADOW,
                color: COLORS.text.primary,
                fontSize: `${FONT_SCALE.sm}px`,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.gray[700],
                boxShadow: SHADOW,
                fontSize: `${FONT_SCALE.sm}px`,
              }}
            >
              Send
            </button>
          </div>
          <p
            className="mt-3 leading-relaxed"
            style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
          >
            Example: "Arc'teryx Beta AR" / "Shelter category" / Product URLs
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatPopup