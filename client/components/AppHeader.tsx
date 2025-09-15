import React from 'react';

interface AppHeaderProps {
  onShowForm: () => void;
  onShowCategoryManager: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
  onToggleDropdown: () => void;
  onToggleCheckboxes: () => void;
  showGearDropdown: boolean;
  showCheckboxes: boolean;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowForm,
  onShowCategoryManager,
  onShowLogin,
  onLogout,
  onToggleChat,
  onToggleDropdown,
  onToggleCheckboxes,
  showGearDropdown,
  showCheckboxes,
  isAuthenticated,
  userName
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">UL Gear Manager</h1>
        <button
          onClick={onToggleChat}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
        >
          💬 Chat
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={onToggleDropdown}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            ⚙️ ギア管理
            <span className={`transform transition-transform ${showGearDropdown ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showGearDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onShowForm();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  + ギアを追加
                </button>
                <button
                  onClick={() => {
                    onShowCategoryManager();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📁 カテゴリ管理
                </button>
                <button
                  onClick={() => {
                    onToggleCheckboxes();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {showCheckboxes ? '☑️ 選択モード終了' : '☐ 選択モード'}
                </button>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">こんにちは、{userName}さん</span>
            <button
              onClick={onLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            onClick={onShowLogin}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ログイン
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;