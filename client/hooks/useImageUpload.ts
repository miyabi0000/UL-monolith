import { useState } from 'react';

/**
 * 画像アップロード機能を提供するカスタムフック
 * ドラッグ&ドロップとファイル選択の両方に対応
 */
export function useImageUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /**
   * ドラッグオーバーハンドラー
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /**
   * ドラッグリーブハンドラー
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * ドロップハンドラー
   */
  const handleDrop = (e: React.DragEvent, onImageSelect: (base64: string) => void) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file, onImageSelect);
    }
  };

  /**
   * ファイル選択ハンドラー
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, onImageSelect: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file, onImageSelect);
    }
  };

  /**
   * 画像ファイルをBase64に変換して処理
   */
  const processImageFile = (file: File, onImageSelect: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      onImageSelect(base64String);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 画像プレビューを設定（URL抽出時などに使用）
   */
  const setPreview = (url: string | null) => {
    setImagePreview(url);
  };

  /**
   * 画像を削除
   */
  const removeImage = (onImageRemove: () => void) => {
    setImagePreview(null);
    onImageRemove();
  };

  return {
    isDragging,
    imagePreview,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImageSelect,
    setPreview,
    removeImage
  };
}
