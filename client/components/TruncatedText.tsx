import React, { useState } from 'react';
import { getTruncatedTextStyle, getExpandedTextStyle } from '../utils/colorHelpers';
import { COLORS } from '../utils/colors';

interface TruncatedTextProps {
  text: string;
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxWidth = '200px',
  className = '',
  style = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const shouldTruncate = text.length > 30; // 30文字以上で省略

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
        className={`${className} transition-all duration-300`}
        style={{
          ...style,
          ...getTruncatedTextStyle(maxWidth),
          ...(isHovered ? { color: COLORS.primary.dark } : {})
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
        <div
          className="z-50"
          style={{
            ...getExpandedTextStyle(),
            color: COLORS.text.primary,
            top: '100%',
            left: '0',
            marginTop: '4px',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default TruncatedText;