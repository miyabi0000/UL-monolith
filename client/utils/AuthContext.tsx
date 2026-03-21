import React, { createContext, useContext, useState, ReactNode } from 'react'

/**
 * Amazon Cognito password policy validation
 * - 最小8文字
 * - 最大128文字
 * - 大文字・小文字・数字・記号を各1文字以上含む
 * - 禁止文字なし（スペースも許可）
 */
const validateCognitoPassword = (password: string): boolean => {
  // 長さチェック (8-128文字)
  if (password.length < 8 || password.length > 128) {
    return false
  }

  // 必要な文字種の存在チェック
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)  
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)

  return hasLowercase && hasUppercase && hasNumbers && hasSpecialChar
}

/**
 * パスワード要件の詳細メッセージを返す（ログインフォーム用）
 */
export const getPasswordRequirements = (): string[] => {
  return [
    '8文字以上128文字以下',
    '大文字を1文字以上含む (A-Z)',
    '小文字を1文字以上含む (a-z)', 
    '数字を1文字以上含む (0-9)',
    '記号を1文字以上含む (!@#$%^&* など)'
  ]
}

interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string): Promise<boolean> => {
    // Input validation
    if (!email || !password) {
      return false
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return false
    }
    
    // Amazon Cognito password policy validation
    if (!validateCognitoPassword(password)) {
      return false
    }
    
    // Demo authentication - in production, this would call a real API
    if (email === 'demo@example.com' && password === 'DemoPass123!') {
      const demoUser: User = {
        id: 'demo-user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date().toISOString()
      }
      setUser(demoUser)
      
      // Store in localStorage for persistence with error handling
      try {
        localStorage.setItem('auth-user', JSON.stringify(demoUser))
      } catch (error) {
        console.warn('Failed to save user data to localStorage:', error)
        // Continue without persistence - not critical for demo
      }
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem('auth-user')
    } catch (error) {
      console.warn('Failed to remove user data from localStorage:', error)
      // Non-critical error, continue with logout
    }
  }

  // Initialize auth state from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('auth-user')
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored)
          setUser(parsedUser)
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError)
          try {
            localStorage.removeItem('auth-user')
          } catch (removeError) {
            console.warn('Failed to remove invalid user data:', removeError)
          }
        }
      }
    } catch (storageError) {
      console.warn('localStorage access failed:', storageError)
      // Continue without persistence
    }
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
