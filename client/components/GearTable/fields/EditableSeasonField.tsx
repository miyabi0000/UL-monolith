import React from 'react'
import SeasonBar from '../../SeasonBar'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'

interface EditableSeasonFieldProps extends BaseFieldProps {
  seasons: string[]
  onChange: (seasons: string[]) => void
  isEditing: boolean
}

/**
 * 季節セレクタ。編集中のクリックが行全体の編集解除にバブルしないよう
 * stopPropagation / preventDefault を明示的に行う（この挙動は load-bearing）。
 */
export const EditableSeasonField: React.FC<EditableSeasonFieldProps> = ({
  seasons,
  onChange,
  isEditing,
  isChanged,
}) => {
  return (
    <div
      className={`flex justify-center ${isChanged ? 'border-2 rounded p-1' : ''}`}
      style={isChanged ? { borderColor: ERROR_TONE.solid } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseDown={(e) => {
        if (isEditing) {
          e.stopPropagation()
        }
      }}
    >
      <SeasonBar seasons={seasons} isEditing={isEditing} size="sm" onChange={onChange} />
    </div>
  )
}
