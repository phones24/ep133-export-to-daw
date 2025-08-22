import useDevice from '../hooks/useDevice';

function FacePlateHeader() {
  const { device } = useDevice();

  return (
    <div className="flex gap-2 bg-[#dbdddb] px-3 py-2 border-1 border-black">
      <img src="/ep133.png" className="h-[100px] w-auto" alt="ep133" />
      <div className="flex flex-col gap-2">
        <p className="text-[30px] font-semibold leading-6">
          EP-133 K.O. II: <i>Export To DAW</i>
        </p>

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
    </div>
  );
}

export default FacePlateHeader;
