import React, { useEffect, useRef, useState } from 'react'
import type { Pack } from '../utils/types'
import { useOutsideClick } from '../hooks/useOutsideClick'

interface PackInfoSectionProps {
  pack: Pack | null
  itemCount: number
  onUpdate?: (updates: { name: string; routeName?: string; description?: string; isPublic?: boolean }) => void
  onDelete?: () => void
  onCopyLink?: () => void
  onOpenPublic?: () => void
}

/**
 * Pack Info セクション。
 *
 * 閲覧時は `name` と items 数を 1 行で表示、三点リーダー (⋯) ボタンで
 * インライン編集フォームを展開する。旧 PackSettingsModal の置き換え。
 *
 * 編集可能フィールド:
 *  - Name
 *  - Map location / URL (routeName)
 *  - Description
 *
 * セカンダリアクション: Open (公開URLを新規タブ) / Copy Link / Delete
 */
const PackInfoSection: React.FC<PackInfoSectionProps> = ({
  pack,
  itemCount,
  onUpdate,
  onDelete,
  onCopyLink,
  onOpenPublic,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // 編集中の下書き値
  const [name, setName] = useState(pack?.name ?? '')
  const [routeName, setRouteName] = useState(pack?.routeName ?? '')
  const [description, setDescription] = useState(pack?.description ?? '')
  const [isPublic, setIsPublic] = useState(pack?.isPublic ?? false)

  const menuRef = useRef<HTMLDivElement>(null)

  // pack 変更時に下書きを同期
  useEffect(() => {
    setName(pack?.name ?? '')
    setRouteName(pack?.routeName ?? '')
    setDescription(pack?.description ?? '')
    setIsPublic(pack?.isPublic ?? false)
    // パック切替時は編集モードから抜ける
    setIsEditing(false)
    setMenuOpen(false)
  }, [pack?.id])

  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen)

  const hasChanges =
    name.trim() !== (pack?.name ?? '') ||
    routeName.trim() !== (pack?.routeName ?? '') ||
    description.trim() !== (pack?.description ?? '') ||
    isPublic !== (pack?.isPublic ?? false)

  const canSave = !!onUpdate && hasChanges && name.trim() !== ''

  const handleSave = () => {
    if (!canSave || !onUpdate) return
    onUpdate({
      name: name.trim(),
      routeName: routeName.trim() || undefined,
      description: description.trim() || undefined,
      isPublic,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(pack?.name ?? '')
    setRouteName(pack?.routeName ?? '')
    setDescription(pack?.description ?? '')
    setIsPublic(pack?.isPublic ?? false)
    setIsEditing(false)
  }

  // 公開時のみ「公開ページを開く」「公開リンクをコピー」を表示
  const showShareActions = !!pack?.isPublic
  const showOpenPublic = showShareActions && !!onOpenPublic
  const showCopyLink = showShareActions && !!onCopyLink

  if (!pack) return null

  return (
    <section className="px-1">
      {/* ヘッダー行: パック名 + ⋯ メニュー */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
          {pack.name}
          <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">· {itemCount} items</span>
        </h3>

        {/* ⋯ (three-dots) メニュー */}
        {(onUpdate || onDelete || showCopyLink || showOpenPublic) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Pack actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Pack actions"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-40 rounded-md bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 py-1 z-20"
              >
                {onUpdate && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => { setIsEditing(true); setMenuOpen(false) }}
                  >
                    Edit
                  </button>
                )}
                {showOpenPublic && onOpenPublic && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => { onOpenPublic(); setMenuOpen(false) }}
                  >
                    Open public page
                  </button>
                )}
                {showCopyLink && onCopyLink && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => { onCopyLink(); setMenuOpen(false) }}
                  >
                    Copy public link
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-gray-700"
                    onClick={() => { onDelete(); setMenuOpen(false) }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 閲覧時: description を 1 行だけ表示 */}
      {!isEditing && pack.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{pack.description}</p>
      )}

      {/* 編集時: インラインフォーム */}
      {isEditing && (
        <div className="mt-2 grid gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div>
            <label className="text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1">
              Name
            </label>
            <input
              className="input w-full text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pack name"
            />
          </div>
          <div>
            <label className="text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1">
              Map location / URL
            </label>
            <input
              className="input w-full text-xs"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. 高尾山 or https://maps.google.com/..."
            />
            <p className="mt-0.5 text-3xs text-gray-400 dark:text-gray-500">
              Google Maps で検索可能な地名/URL。空欄時は Route Map を非表示。
            </p>
          </div>
          <div>
            <label className="text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1">
              Description
            </label>
            <textarea
              className="input w-full min-h-[60px] text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明"
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-xs text-gray-700 dark:text-gray-200">Make this pack public</span>
              <span className="block text-3xs text-gray-400 dark:text-gray-500">
                ON にするとリンクを知っている人なら誰でも閲覧できます。OFF の場合 /p/&lt;id&gt; を開いても 404 になります。
              </span>
            </span>
          </label>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn-secondary h-7 px-2.5 text-2xs"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary h-7 px-2.5 text-2xs"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default PackInfoSection
