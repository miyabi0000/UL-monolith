import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult,
} from 'amazon-cognito-identity-js'

// --- Cognito設定 ---

const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined

/** Cognito環境変数が設定されているかどうか */
const isCognitoConfigured = (): boolean => {
  return !!(COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID)
}

/** CognitoUserPoolインスタンス（設定済みの場合のみ生成） */
const userPool: CognitoUserPool | null = isCognitoConfigured()
  ? new CognitoUserPool({
      UserPoolId: COGNITO_USER_POOL_ID!,
      ClientId: COGNITO_CLIENT_ID!,
    })
  : null

// --- パスワードバリデーション ---

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

// --- 型定義 ---

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
  /**
   * メールアドレスのみでのログイン（パスワードレス）
   *
   * - デモモード (Cognito 未設定時): 即座にそのメールで擬似ユーザーを作成しログイン
   * - Cognito モード: 現時点ではマジックリンク / Email OTP が未配線のためエラー
   *   を throw する (将来 Cognito Custom Auth Flow を実装予定)
   *
   * 成功時 true、失敗時 false。入力不正時も false (エラー throw せず呼び出し側で
   * メッセージ表示できるように)。
   */
  loginWithEmail: (email: string) => Promise<boolean>
  logout: () => void
  /** Cognitoサインアップ（Cognito未設定時はエラーをthrow） */
  signUp: (email: string, password: string, name?: string) => Promise<boolean>
  /** 確認コード検証（サインアップ後のメール確認用） */
  confirmSignUp: (email: string, code: string) => Promise<boolean>
  /** 現在のIDトークンを取得（未認証時はnull） */
  getIdToken: () => Promise<string | null>
  /** API呼び出し用のAuthorizationヘッダーを取得 */
  getAuthHeaders: () => Promise<Record<string, string>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// --- ヘルパー関数 ---

/**
 * CognitoUserSessionからUser型へ変換
 * IDトークンのペイロードからユーザー情報を抽出する
 */
const sessionToUser = (session: CognitoUserSession): User => {
  const idToken = session.getIdToken()
  const payload = idToken.decodePayload()
  return {
    id: payload['sub'] as string,
    email: payload['email'] as string,
    name: (payload['name'] as string) || undefined,
    createdAt: new Date((payload['auth_time'] as number) * 1000).toISOString(),
  }
}

/**
 * CognitoUser.getSession()をPromise化
 * セッションが有効ならそのまま返却、期限切れなら自動的にリフレッシュされる
 */
const getSessionAsync = (cognitoUser: CognitoUser): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    cognitoUser.getSession(
      (error: Error | null, session: CognitoUserSession | null) => {
        if (error || !session) {
          reject(error || new Error('セッション取得に失敗しました'))
          return
        }
        resolve(session)
      }
    )
  })
}

/**
 * Cognito signUp をPromise化
 */
const signUpAsync = (
  email: string,
  password: string,
  attributes: CognitoUserAttribute[]
): Promise<ISignUpResult> => {
  if (!userPool) {
    throw new Error('Cognitoが設定されていません')
  }
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err || !result) {
        reject(err || new Error('サインアップに失敗しました'))
        return
      }
      resolve(result)
    })
  })
}

/**
 * Cognito confirmRegistration をPromise化
 */
const confirmRegistrationAsync = (
  cognitoUser: CognitoUser,
  code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result as string)
    })
  })
}

// --- AuthProvider ---

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  // 現在のCognitoUserを保持（トークンリフレッシュ時に必要）
  const cognitoUserRef = useRef<CognitoUser | null>(null)

  /**
   * Cognitoログイン処理
   * authenticateUser をPromise化してセッション取得まで行う
   */
  const cognitoLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!userPool) {
      return false
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    })

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })

    return new Promise<boolean>((resolve) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const userData = sessionToUser(session)
          setUser(userData)
          cognitoUserRef.current = cognitoUser
          resolve(true)
        },
        onFailure: (err: Error) => {
          console.error('Cognito認証エラー:', err)
          resolve(false)
        },
        newPasswordRequired: () => {
          // 初回ログイン時のパスワード変更要求
          // 現時点では未対応 - 必要に応じて拡張
          console.warn('新しいパスワードの設定が必要です')
          resolve(false)
        },
      })
    })
  }, [])

  /**
   * デモ認証（Cognito未設定時のフォールバック）
   */
  const demoLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (email === 'demo@example.com' && password === 'DemoPass123!') {
      const demoUser: User = {
        id: 'demo-user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date().toISOString(),
      }
      setUser(demoUser)

      // localStorageに保存（永続化）
      try {
        localStorage.setItem('auth-user', JSON.stringify(demoUser))
      } catch (error) {
        console.warn('localStorageへのユーザーデータ保存に失敗:', error)
      }
      return true
    }
    return false
  }, [])

  /**
   * メールアドレスのみでのログイン（パスワードレス）
   *
   * - デモモード: email だけで擬似ユーザーを作って即座にログイン
   * - Cognito モード: 未配線。将来 Custom Auth Flow (magic link / Email OTP) で
   *   実装する前提。呼び出し側でエラーハンドルできるよう false を返す。
   */
  const loginWithEmail = useCallback(async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return false
    }

    if (isCognitoConfigured()) {
      // TODO: Cognito Custom Auth Flow (magic link / Email OTP) を配線
      // 現時点では Cognito モードではパスワードレスログインを受け付けない
      console.warn('[Auth] Cognito モードでのパスワードレスログインは未配線です')
      return false
    }

    // デモモード: email をそのままユーザー ID / 表示名に流用
    const demoUser: User = {
      id: `demo-${trimmed}`,
      email: trimmed,
      name: trimmed.split('@')[0],
      createdAt: new Date().toISOString(),
    }
    setUser(demoUser)

    try {
      localStorage.setItem('auth-user', JSON.stringify(demoUser))
    } catch (error) {
      console.warn('localStorageへのユーザーデータ保存に失敗:', error)
    }
    return true
  }, [])

  /**
   * ログイン処理
   * Cognito設定済みの場合はCognito認証、未設定の場合はデモ認証にフォールバック
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // 入力値バリデーション
    if (!email || !password) {
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return false
    }

    // Cognitoパスワードポリシーのバリデーション
    if (!validateCognitoPassword(password)) {
      return false
    }

    if (isCognitoConfigured()) {
      return cognitoLogin(email, password)
    }
    return demoLogin(email, password)
  }, [cognitoLogin, demoLogin])

  /**
   * ログアウト処理
   */
  const logout = useCallback(() => {
    // Cognitoセッションのクリア
    if (cognitoUserRef.current) {
      cognitoUserRef.current.signOut()
      cognitoUserRef.current = null
    }

    setUser(null)

    // デモモード用のlocalStorageクリア
    try {
      localStorage.removeItem('auth-user')
    } catch (error) {
      console.warn('localStorageからのユーザーデータ削除に失敗:', error)
    }
  }, [])

  /**
   * サインアップ処理（Cognito専用）
   */
  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<boolean> => {
    if (!isCognitoConfigured()) {
      throw new Error('Cognitoが設定されていないため、サインアップは利用できません')
    }

    if (!validateCognitoPassword(password)) {
      throw new Error('パスワードがCognitoポリシーを満たしていません')
    }

    const attributes: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ]
    if (name) {
      attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }))
    }

    try {
      await signUpAsync(email, password, attributes)
      return true
    } catch (error) {
      console.error('Cognitoサインアップエラー:', error)
      throw error
    }
  }, [])

  /**
   * サインアップ確認コード検証
   */
  const confirmSignUp = useCallback(async (email: string, code: string): Promise<boolean> => {
    if (!userPool) {
      throw new Error('Cognitoが設定されていないため、確認コード検証は利用できません')
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    })

    try {
      await confirmRegistrationAsync(cognitoUser, code)
      return true
    } catch (error) {
      console.error('確認コード検証エラー:', error)
      throw error
    }
  }, [])

  /**
   * 現在のIDトークンを取得
   * セッションが期限切れの場合はCognitoが自動的にリフレッシュする
   * デモモードではnullを返す
   */
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!cognitoUserRef.current) {
      return null
    }

    try {
      const session = await getSessionAsync(cognitoUserRef.current)
      return session.getIdToken().getJwtToken()
    } catch (error) {
      console.error('IDトークン取得エラー:', error)
      // セッション無効の場合はログアウト状態にする
      setUser(null)
      cognitoUserRef.current = null
      return null
    }
  }, [])

  /**
   * API呼び出し用のAuthorizationヘッダーを返す
   * トークンがある場合は Bearer トークンを含む
   * デモモードやトークン取得失敗時は空オブジェクトを返す
   */
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getIdToken()
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }, [getIdToken])

  // --- API クライアントに認証トークンプロバイダーを登録 ---
  React.useEffect(() => {
    import('../services/api.client').then(({ setAuthTokenProvider }) => {
      setAuthTokenProvider(getIdToken)
    })
  }, [getIdToken])

  // --- 初期化: 既存セッションの復元 ---
  React.useEffect(() => {
    if (isCognitoConfigured() && userPool) {
      // Cognitoモード: UserPoolからキャッシュ済みユーザーを復元
      const currentUser = userPool.getCurrentUser()
      if (currentUser) {
        currentUser.getSession(
          (error: Error | null, session: CognitoUserSession | null) => {
            if (!error && session && session.isValid()) {
              const userData = sessionToUser(session)
              setUser(userData)
              cognitoUserRef.current = currentUser
            }
          }
        )
      }
    } else {
      // デモモード: localStorageから復元
      try {
        const stored = localStorage.getItem('auth-user')
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored) as User
            setUser(parsedUser)
          } catch (parseError) {
            console.error('保存済みユーザーデータのパースに失敗:', parseError)
            try {
              localStorage.removeItem('auth-user')
            } catch (removeError) {
              console.warn('不正なユーザーデータの削除に失敗:', removeError)
            }
          }
        }
      } catch (storageError) {
        console.warn('localStorageアクセスに失敗:', storageError)
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    logout,
    signUp,
    confirmSignUp,
    getIdToken,
    getAuthHeaders,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
