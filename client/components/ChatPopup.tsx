import React, { useState, useRef, useEffect } from 'react'
import { extractFromPrompt, enhanceUrlDataWithPrompt, extractCategoryFromPrompt, extractFromUrl, checkAPIHealth, APIError } from '../services/llmService'
import { COLORS } from '../utils/colors'
import { getSquareSeparatorStyle, getLiquidGlassStyle } from '../utils/colorHelpers'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type PromptType = 'url' | 'add_gear' | 'add_category' | 'url_with_prompt' | 'general'

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
  onGearExtracted?: (gearData: any) => void
  currentGearList?: any[] // ギアリスト分析用
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, onGearExtracted, currentGearList = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは！AI搭載ギア管理システムです。以下の機能をご利用いただけます：\n\n**ギア登録**\n• ブランド名 + 製品名\n  例: "Arc\'teryx Beta AR 追加"\n\n**カテゴリ管理**  \n• カテゴリの追加\n  例: "シェルター カテゴリ追加"\n\n**URL解析**\n• 商品URLから自動抽出\n• URL + 追加情報\n  例: "URL + 実測230g"\n\nバックエンドAPIと連携して動作します。',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // メッセージエリアを下にスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // チャットを開いた時にインプットにフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // プロンプト分類
  const classifyPrompt = (prompt: string): PromptType => {
    
    // URL + 追加情報のパターン
    if (prompt.includes('http') && prompt.length > 50) {
      return 'url_with_prompt'
    }
    
    // 純粋なURLパターン
    if (/^https?:\/\/.+$/.test(prompt.trim())) {
      return 'url'
    }
    
    // カテゴリ追加パターン
    if (prompt.includes('カテゴリ') || 
        (prompt.includes('追加') && !containsBrand(prompt))) {
      return 'add_category'
    }
    
    // ギア追加パターン（ブランド名が含まれる）
    if (containsBrand(prompt)) {
      return 'add_gear'
    }
    
    return 'general'
  }

  // ブランド名が含まれているかチェック
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

    setTimeout(async () => {
      let assistantResponse: string
      let shouldExtractGear = false
      let mockGearData: any = null

      try {
        const promptType = classifyPrompt(currentInput)

        switch (promptType) {
          case 'url':
            try {
              const extractedData = await extractFromUrl(currentInput)
              assistantResponse = `URL から商品情報を抽出しました！\n\n商品名: ${extractedData.name}\nブランド: ${extractedData.brand || '不明'}\n重量: ${extractedData.weightGrams ? `${extractedData.weightGrams}g` : '推定中'}\n価格: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : '推定中'}\nカテゴリ: ${extractedData.suggestedCategory}\n\nこの情報でギアリストに追加しますか？`
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
                assistantResponse = `URL解析エラー: ${error.message}\n\nバックエンドとの通信に問題がある可能性があります。`
              } else {
                assistantResponse = `URL解析エラー: ${error instanceof Error ? error.message : 'URL からの情報抽出に失敗しました'}\n\n有効なURL を入力してください。`
              }
            }
            break

          case 'add_gear':
            try {
              const extractedData = await extractFromPrompt(currentInput)
              assistantResponse = `ギア情報を抽出しました！\n\n商品名: ${extractedData.name}\nブランド: ${extractedData.brand || '不明'}\n重量: ${extractedData.weightGrams ? `${extractedData.weightGrams}g` : '推定中'}\n価格: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : '推定中'}\nカテゴリ: ${extractedData.suggestedCategory}\n\nこの情報でギアリストに追加しますか？`
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
                assistantResponse = `API エラー: ${error.message}\n\nバックエンドとの通信に問題がある可能性があります。\n\n${error.status ? `ステータス: ${error.status}` : ''}`
              } else {
                assistantResponse = `エラー: ${error instanceof Error ? error.message : 'ギア情報の抽出に失敗しました'}\n\n正しい形式で入力してください。\n例: "Arc'teryx Beta AR 追加"`
              }
            }
            break

          case 'add_category':
            try {
              const categoryData = await extractCategoryFromPrompt(currentInput)
              if (categoryData) {
                assistantResponse = `カテゴリを作成しました！\n\nカテゴリ名: ${categoryData.englishName}\n日本語名: ${categoryData.name}\n\n新しいカテゴリが使用可能になりました。`
              } else {
                assistantResponse = `カテゴリ名を特定できませんでした。\n\n例: "シェルター カテゴリ追加" や "調理器具 追加"`
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `API エラー: ${error.message}\n\nバックエンドとの通信に問題がある可能性があります。`
              } else {
                assistantResponse = `カテゴリ処理エラー: ${error instanceof Error ? error.message : 'カテゴリの作成に失敗しました'}`
              }
            }
            break

          case 'url_with_prompt':
            try {
              // URLを抽出
              const urlMatch = currentInput.match(/(https?:\/\/[^\s]+)/)
              if (urlMatch) {
                const url = urlMatch[1]
                // URL基本情報を取得
                const urlData = await extractFromUrl(url)
                // プロンプト情報で拡張
                const enhancedData = await enhanceUrlDataWithPrompt(urlData, currentInput)
                
                assistantResponse = `URL + 追加情報を処理しました！\n\n商品名: ${enhancedData.name}\nブランド: ${enhancedData.brand}\n重量: ${enhancedData.weightGrams}g\n価格: ¥${Math.round(enhancedData.priceCents! / 100).toLocaleString()}\nカテゴリ: ${enhancedData.suggestedCategory}\n\nこの情報でギアリストに追加しますか？`
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
                assistantResponse = `URLが見つかりませんでした。\n\n例: "https://example.com/product + 実測230g"`
              }
            } catch (error) {
              if (error instanceof APIError) {
                assistantResponse = `API エラー: ${error.message}\n\nバックエンドでのURL処理に問題があります。\nサイトがアクセスできないか、スクレイピングがブロックされている可能性があります。`
              } else {
                assistantResponse = `URL処理エラー: ${error instanceof Error ? error.message : 'URLの処理に失敗しました'}`
              }
            }
            break


          default:
            assistantResponse = `ギア管理のお手伝いをします！\n\n使用できる機能：\n• ブランド名 + 製品名で追加\n  例: "Arc'teryx Beta AR 追加"\n• カテゴリの追加\n  例: "シェルター カテゴリ追加"\n• 商品URLの処理\n  例: URLを貼り付け`
            break
        }
      } catch (error) {
        if (error instanceof APIError) {
          assistantResponse = `システムエラー: ${error.message}\n\nバックエンドAPIとの通信に問題が発生しました。\nしばらく時間をおいてから再度お試しください。\n\n${error.status ? `HTTP Status: ${error.status}` : ''}`
        } else {
          assistantResponse = `処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}\n\n問題が継続する場合は、システム管理者にお問い合わせください。`
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // ギアデータの追加
      if (shouldExtractGear && mockGearData && onGearExtracted) {
        onGearExtracted(mockGearData)
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
        className="flex-1 bg-black bg-opacity-20 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* チャットパネル */}
      <div
        className="w-96 lg:w-[420px] flex flex-col animate-in slide-in-from-right duration-500 ease-out shadow-2xl"
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
            <h3 className="text-lg font-bold tracking-tight">AI ギアアシスタント</h3>
            <p
              className="text-sm mt-1"
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
                  <span className="text-sm font-medium">分析中...</span>
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
              placeholder="商品URL または指示を入力..."
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
送信
            </button>
          </div>
          <p
            className="text-xs mt-3 leading-relaxed"
            style={{ color: COLORS.text.secondary }}
          >
例: "Arc'teryx Beta AR 追加" / "シェルター カテゴリ追加" / Amazon URL
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatPopup