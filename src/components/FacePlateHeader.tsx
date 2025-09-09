import useDevice from '../hooks/useDevice';

function FacePlateHeader() {
  const { device } = useDevice();

  return (
    <div className="flex gap-2 bg-[#dbdddb] px-3 py-2 border-1 border-black">
      <img src="/ep133.png" className="h-[100px] w-auto" alt="ep133" />
      <div className="flex flex-col gap-2 relative">
        <p className="text-[30px] font-medium leading-6">
          EP-133 K.O. II: <i>Export To DAW</i>
        </p>
        <p className="text-xs">Export your projects to Ableton Live, DAWproject or MIDI</p>

        <div className="absolute left-0 bottom-0">
          {!device && (
            <div className="flex gap-2 items-center">
              <div className="border-1 border-black bg-gray-300 size-4 rounded-full" />
              No device connected
            </div>
          )}

          {!!device && (
            <div className="flex gap-2 items-center">
              <div className="border-1 border-black bg-[#ef4e27] size-4 rounded-full" />
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
