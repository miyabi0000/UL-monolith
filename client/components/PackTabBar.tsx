import React, { useState } from 'react';

interface PackTabBarProps {
  packList: Array<{ id: string; name: string }>;
  selectedPackId: string | null;
  onSelectPack: (packId: string | null) => void;
  onCreatePack?: (name: string) => void;
  onDeletePack?: (packId: string) => void;
}

const PackTabBar: React.FC<PackTabBarProps> = ({
  packList,
  selectedPackId,
  onSelectPack,
  onCreatePack,
  onDeletePack,
}) => {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPackName, setNewPackName] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newPackName.trim();
    if (!trimmed || !onCreatePack) return;
    onCreatePack(trimmed);
    setNewPackName('');
    setShowCreateInput(false);
  };

  const tabClass = (isActive: boolean) => [
    'pack-tab-shape relative -mb-px h-9 px-5 text-xs font-semibold transition-all duration-150 inline-flex items-center justify-center',
    isActive
      ? 'text-gray-900 dark:text-gray-100'
      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
  ].join(' ');

  return (
    <div className="px-4 pt-2 border-b border-gray-200 dark:border-gray-700">
      <div
        role="tablist"
        aria-label="Pack Tabs"
        className="flex items-end gap-x-1"
      >
        {/* All Gear タブ */}
        <button
          type="button"
          role="tab"
          aria-selected={!selectedPackId}
          className={tabClass(!selectedPackId)}
          onClick={() => onSelectPack(null)}
        >
          All Gear
        </button>

        {/* Pack タブ */}
        {packList.map((pack) => (
          <button
            key={pack.id}
            type="button"
            role="tab"
            aria-selected={selectedPackId === pack.id}
            className={tabClass(selectedPackId === pack.id)}
            onClick={() => onSelectPack(pack.id)}
          >
            {pack.name}
          </button>
        ))}

        {/* 新規パック: インライン編集タブ or + ボタン */}
        {showCreateInput ? (
          <form
            onSubmit={handleSubmit}
            className="pack-tab-shape -mb-px h-8 px-4 flex items-center gap-1.5 bg-white border border-gray-200 border-b-white dark:bg-gray-800 dark:border-gray-600 dark:border-b-gray-800"
          >
            <input
              className="h-5 w-28 text-xs font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Pack name..."
              value={newPackName}
              onChange={(e) => setNewPackName(e.target.value)}
              required
              autoFocus
            />
            <span className="flex items-center gap-1">
              <button
                type="submit"
                disabled={!newPackName.trim()}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
                title="Save"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                onClick={() => { setShowCreateInput(false); setNewPackName(''); }}
                title="Cancel"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </form>
        ) : onCreatePack ? (
          <button
            type="button"
            className="-mb-px ml-1 w-6 h-6 self-end mb-0.5 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 hover:text-gray-900 dark:hover:text-white transition-all duration-150"
            onClick={() => setShowCreateInput(true)}
            title="New pack"
            aria-label="New pack"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : null}

      </div>
    </div>
  );
};

export default PackTabBar;
