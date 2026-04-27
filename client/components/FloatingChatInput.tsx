import React, { useRef, useState } from 'react';
import { chatMessageSchema } from '../utils/validation';

/**
 * FloatingChatInput — 画面下にガラス透明で常駐する Advisor 入力欄。
 *
 * デスクトップは下中央にピル、モバイルは下端横長で表示。
 * 既定は半透明 + 弱い shadow。フォーカス / ホバー / 文字入力で背景が濃くなり、
 * Send ボタンは入力空 & 未ホバー時は半透明（"関連 UI もホバー" の Minimal 化）。
 *
 * Enter 送信で `onSubmit(text)` が呼ばれる前提（親が ChatSidebar を Advisor で開く）。
 * `chatOpen=true` の間は非表示（サイドバーと入力欄の二重表示を避ける）。
 */
interface Props {
  onSubmit: (text: string) => void;
  chatOpen: boolean;
}

const FloatingChatInput: React.FC<Props> = ({ onSubmit, chatOpen }) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (chatOpen) return null;

  const submit = () => {
    // chatMessageSchema は trim + min 1 / max 2000 を強制
    const result = chatMessageSchema.safeParse({ text: value });
    if (!result.success) return;
    onSubmit(result.data.text);
    setValue('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // active = フォーカス or ホバー or 入力済み → ガラスを濃くする
  const hasText = value.trim().length > 0;
  const active = focused || hovered || hasText;

  return (
    <div
      className="fixed z-30 bottom-3 left-1/2 -translate-x-1/2 w-[min(560px,calc(100vw-1.5rem))]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-end gap-2 px-3 py-2 rounded-control transition-all duration-200"
        style={{
          background: active
            ? 'color-mix(in srgb, var(--surface-level-0) 95%, transparent)'
            : 'color-mix(in srgb, var(--surface-level-0) 60%, transparent)',
          backdropFilter: 'blur(12px) saturate(140%)',
          WebkitBackdropFilter: 'blur(12px) saturate(140%)',
          border: '1px solid var(--stroke-subtle)',
          boxShadow: active ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        }}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI advisor…"
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none max-h-32"
          style={{ color: 'var(--ink-primary)' }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!hasText}
          aria-label="Send to AI advisor"
          className="h-control w-control inline-flex items-center justify-center rounded-control transition-all duration-200"
          style={{
            background: hasText ? 'var(--mondrian-black)' : 'transparent',
            color: hasText ? 'var(--ink-inverse)' : 'var(--ink-muted)',
            opacity: active || hasText ? 1 : 0.4,
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FloatingChatInput;
