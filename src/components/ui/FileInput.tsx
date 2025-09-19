import { useRef } from 'preact/hooks';
import IconFile from '../icons/file.svg?react';
import IconTrash from '../icons/trash.svg?react';
import Button from './Button';

interface FileInputProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
}

function FileInput({
  files,
  onFilesChange,
  maxFiles = 3,
  disabled = false,
  label = 'Attach files',
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      onFilesChange([...files, ...newFiles].slice(0, maxFiles));
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">
        {label} (optional, max {maxFiles})
      </div>
      <div className="flex flex-col gap-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex gap-2 items-center p-2 bg-gray-50 rounded"
          >
            <IconFile className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <span className="text-xs opacity-60 flex-shrink-0">
              {(file.size / 1024).toFixed(2)}KB
            </span>
            <Button variant="icon" onClick={() => removeFile(index)} disabled={disabled}>
              <IconTrash className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {files.length < maxFiles && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openFileDialog}
            className="flex items-center gap-2 w-fit"
            disabled={disabled}
          >
            <span className="text-2xl">+</span>
            <span className="text-sm">Add file</span>
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default FileInput;
