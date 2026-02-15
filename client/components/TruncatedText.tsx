import React, { useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxWidth?: string;
  maxLength?: number;
  className?: string;
  style?: React.CSSProperties;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxWidth = '200px',
  maxLength = 30,
  className = '',
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const shouldTruncate = text.length > maxLength; // 指定文字数以上で省略

  if (!shouldTruncate) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <span
        className={`${className} transition-all duration-300 inline-block overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer hover:text-gray-700`}
        style={{
          ...style,
          maxWidth: maxWidth
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsExpanded(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsExpanded(false);
        }}
        title={text} // フォールバック用ツールチップ
      >
        {text}
      </span>

      {isExpanded && isHovered && (
        <div className="absolute z-50 bg-white text-gray-900 border border-gray-200 p-2 rounded-md shadow-md top-full left-0 mt-1 max-w-xs break-words">
          {text}
        </div>
      )}
    </div>
  );
};

export default TruncatedText;
