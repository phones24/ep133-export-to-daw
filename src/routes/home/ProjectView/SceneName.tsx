import useSceneName from '~/hooks/useSceneName';
import { useEffect, useRef, useState } from 'preact/hooks';
import Input from '~/components/ui/Input';
import IconEdit from '~/components/icons/edit.svg?react';
import IconSave from '~/components/icons/check.svg?react';
import IconCancel from '~/components/icons/close.svg?react';
import Button from '~/components/ui/Button.tsx';

function SceneName({ projectId, defaultName }: { projectId: string; defaultName: string }) {
  const { sceneName, setSceneName } = useSceneName(projectId, defaultName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [temporalSceneName, setTemporalSceneName] = useState(sceneName);
  const inputRef = useRef<HTMLInputElement & { props: { value: string } }>(null);

  const handleCancel = () => {
    setTemporalSceneName(sceneName);
    setIsRenaming(false);
  };

  const handleSave = () => {
    const value = inputRef.current?.props.value;
    setSceneName(value ?? sceneName);
    setIsRenaming(false);
  };

  const handleRename = (e: Event) => {
    setTemporalSceneName((e.target as HTMLInputElement).value);
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

  return (
    <div className="bg-brand p-2 font-semibold text-white inline-flex gap-2">
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
          <div
            className="inline sticky left-0 overflow-hidden truncate max-w-[300px]"
            title={sceneName}
          >
            {sceneName}
          </div>
          <Button variant="ghost" size="xs" onClick={() => setIsRenaming(true)} title="Rename">
            <IconEdit className="w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export default SceneName;
