import React, { useState } from 'react';

const FormulaDisplay = ({ formula }: { formula: string }) => (
  <span className="text-blue-600 font-mono text-sm">{formula}</span>
);

const CellValue = ({ value }: { value: any }) => (
  <span className="text-gray-800">{String(value || '')}</span>
);

export function CellEditor({ 
  cellId, 
  initialValue, 
  onUpdate 
}: { 
  cellId: string; 
  initialValue: any; 
  onUpdate: (value: any) => void; 
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onUpdate(value);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`relative w-full h-full p-1 border border-transparent hover:border-blue-200 transition-colors cursor-cell ${
        isEditing ? 'ring-2 ring-primary ring-inset z-10 bg-white' : ''
      }`}
      onClick={() => setIsEditing(true)}
      onBlur={() => {
        onUpdate(value);
        setIsEditing(false);
      }}
    >
      {isEditing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full bg-transparent outline-none p-0 m-0 font-sans text-sm"
        />
      ) : (
        <div className="w-full h-full overflow-hidden text-sm whitespace-nowrap text-ellipsis">
          {typeof initialValue === 'string' && initialValue.startsWith('=') 
            ? <FormulaDisplay formula={initialValue} />
            : <CellValue value={initialValue} />
          }
        </div>
      )}
    </div>
  );
}
