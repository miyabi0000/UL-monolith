import React, { useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick';

interface RowActionMenuProps {
  /** 「Edit」クリック時: 親が editingItemId をこの行にセット */
  onStartEdit: () => void;
  /** 「Delete」クリック時: window.confirm 後に削除 */
  onDelete: () => void;
  /** 編集中フラグ: true の時は ⋯ メニューではなく Save / Cancel ボタンを表示する */
  isEditing: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

/**
 * ギアテーブル / カードの各行に付く ⋯ アクションメニュー。
 *
 * - 非編集時: ⋯ クリックで dropdown (Edit / Delete)
 * - 編集時:   Save / Cancel ボタン に切替
 *
 * `PackInfoSection` の ⋯ パターンを踏襲し、`useOutsideClick` で閉じる。
 */
const RowActionMenu: React.FC<RowActionMenuProps> = ({
  onStartEdit,
  onDelete,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onSaveEdit}
          className="icon-btn h-7 px-2 text-xs bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900"
          title="Save"
          aria-label="Save"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="icon-btn h-7 px-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Cancel"
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="icon-btn h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="More actions"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-32 rounded-md bg-white dark:bg-gray-800 shadow-sm overflow-hidden z-50 border border-gray-100 dark:border-gray-700"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              setMenuOpen(false);
              onStartEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default RowActionMenu;
