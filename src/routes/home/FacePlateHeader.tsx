import useTheme from '~/hooks/useTheme';
import useDevice from '../../hooks/useDevice';

function FacePlateHeader() {
  const { device } = useDevice();
  const theme = useTheme();

  return (
    <div className="flex gap-2 bg-face px-3 py-2 border border-black shadow-my">
      <img src={`/${theme.id}-on.png`} className="h-[100px] w-auto" alt={theme.id} />
      <div className="flex flex-col gap-2 relative">
        <h1 className="text-[30px] font-medium leading-6">
          {theme.name}: <i>Export To DAW</i>
        </h1>
        <h2 className="text-xs">
          Export your projects to Ableton Live, DAWproject, REAPER or MIDI
        </h2>

        <div className="absolute left-0 bottom-0 leading-4">
          {!device && (
            <div className="flex gap-2 items-center">
              <div className="border border-black bg-gray-300 size-4 rounded-full" />
              No device connected
            </div>
          )}

          {!!device && (
            <div className="flex gap-2 items-center font-xs">
              <div className="border border-black bg-brand size-3 rounded-full" />
              Connected
            </div>
          )}
        </div>
        <p className="text-xs absolute right-0 bottom-0 opacity-40">
          Firmware version: {device?.metadata.os_version || 'N/A'}
        </p>
      </div>
    </div>
  );
}

export default FacePlateHeader;
