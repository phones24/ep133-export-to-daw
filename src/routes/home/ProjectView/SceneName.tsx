import { useEffect, useRef, useState } from 'preact/hooks';
import IconSave from '~/components/icons/check.svg?react';
import IconCancel from '~/components/icons/close.svg?react';
import IconEdit from '~/components/icons/edit.svg?react';
import Button from '~/components/ui/Button.tsx';
import Input from '~/components/ui/Input';
import useSceneName, { getDefaultSceneName } from '~/hooks/useSceneName';

function SceneName({ projectId, defaultName }: { projectId: string; defaultName: string }) {
  const { sceneName, setSceneName } = useSceneName(projectId, defaultName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [temporalSceneName, setTemporalSceneName] = useState(sceneName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCancel = () => {
    setTemporalSceneName(sceneName);
    setIsRenaming(false);
  };

  const handleSave = () => {
    setSceneName(temporalSceneName);
    setIsRenaming(false);

    if (temporalSceneName.trim() === '') {
      setTemporalSceneName(getDefaultSceneName(defaultName));
    }
  };

  const handleRename = (e: Event) => {
    setTemporalSceneName((e.target as HTMLInputElement).value);
  };

  const handleRenameClick = () => {
    setTemporalSceneName(sceneName);
    setIsRenaming(true);
  };

  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }

    if (e.key === 'Enter') {
      handleSave();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  return (
    <div className="bg-brand p-2 w-full flex">
      <div className="font-semibold w-fit text-white gap-2 flex sticky left-0">
        {isRenaming ? (
          <>
            <Input
              type="text"
              value={temporalSceneName}
              onChange={handleRename}
              className="text-black text-sm py-0 h-full"
              ref={inputRef}
            />
            <Button variant="ghost" size="xs" onClick={handleSave} title="Save">
              <IconSave className="w-4" />
            </Button>
            <Button variant="ghost" size="xs" onClick={handleCancel} title="Cancel">
              <IconCancel className="w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="overflow-hidden truncate max-w-75" title={sceneName}>
              {sceneName}
            </div>
            <Button variant="ghost" size="xs" onClick={handleRenameClick} title="Rename">
              <IconEdit className="w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default SceneName;
