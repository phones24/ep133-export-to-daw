import clsx from 'clsx';
import useDevice from '../hooks/useDevice';
import useProject from '../hooks/useProject';
import { EFFECTS_SHORT } from '../lib/constants';

function Knob({ className }: { className?: string }) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="121"
      height="117"
      viewBox="0 0 121 117"
      className={className}
    >
      <path
        d="M0 0 C8.91 0 17.82 0 27 0 C28.32 2.64 29.64 5.28 31 8 C35.01629283 12.90880235 37.83738043 13.91869021 44 17 C44 25.91 44 34.82 44 44 C37.33124081 43.1664051 33.81260421 42.47573783 28.1875 39.625 C27.4960791 39.2748584 26.8046582 38.9247168 26.09228516 38.56396484 C14.28021969 32.23989081 6.21007705 22.04282388 1.125 9.75 C0 6 0 6 0 0 Z "
        fill="#EE5922"
        transform="translate(8,66)"
      />
      <path
        d="M0 0 C0 8.91 0 17.82 0 27 C-4.455 29.475 -4.455 29.475 -9 32 C-12.0487268 35.16164261 -14.36272153 37.63506632 -16.20678711 41.5847168 C-18 44 -18 44 -20.72729492 44.56762695 C-21.80084229 44.54144287 -22.87438965 44.51525879 -23.98046875 44.48828125 C-25.14384766 44.47216797 -26.30722656 44.45605469 -27.50585938 44.43945312 C-29.32827148 44.37661133 -29.32827148 44.37661133 -31.1875 44.3125 C-32.41404297 44.28994141 -33.64058594 44.26738281 -34.90429688 44.24414062 C-37.93741559 44.18513053 -40.96810222 44.10284592 -44 44 C-42.953127 30.34340939 -36.25738171 19.88244924 -26 11 C-18.43888217 5.17414622 -9.73059956 0 0 0 Z "
        fill="#E22818"
        transform="translate(52,6)"
      />
      <path
        d="M0 0 C8.91 0 17.82 0 27 0 C24.76978015 13.38131907 19.01934678 24.61798427 8.41015625 33.37109375 C1.26322866 38.20135113 -8.28083542 44 -17 44 C-17.29121422 39.62641047 -17.46824053 35.25530741 -17.625 30.875 C-17.75068359 29.01875 -17.75068359 29.01875 -17.87890625 27.125 C-17.97636817 23.49941673 -17.94674493 20.50568395 -17 17 C-14.62226415 14.71718053 -12.46766207 13.49948845 -9.45849609 12.17871094 C-4.38972694 9.74852052 -2.43529654 4.87059307 0 0 Z "
        fill="#5293B3"
        transform="translate(84,66)"
      />
      <path
        d="M0 0 C13.52550105 1.47109462 24.37025022 7.21229311 33.3125 17.6875 C39.01920519 25.29644025 42.96213662 33.51607601 44 43 C39.62641047 43.29121422 35.25530741 43.46824053 30.875 43.625 C29.6375 43.70878906 28.4 43.79257812 27.125 43.87890625 C23.49964573 43.97636201 20.5053268 43.94733952 17 43 C14.73546791 40.6186564 13.53191706 38.46677964 12.23364258 35.45849609 C10.22572817 31.45697263 6.85331072 29.97184344 3 28 C2.01 27.34 1.02 26.68 0 26 C-0.34057617 23.38623047 -0.34057617 23.38623047 -0.29296875 20.1171875 C-0.2784668 18.36728516 -0.2784668 18.36728516 -0.26367188 16.58203125 C-0.23853516 15.35871094 -0.21339844 14.13539062 -0.1875 12.875 C-0.17396484 11.64394531 -0.16042969 10.41289062 -0.14648438 9.14453125 C-0.11103543 6.09592157 -0.06162079 3.048175 0 0 Z "
        fill="#BB487C"
        transform="translate(67,7)"
      />
    </svg>
  );
}

function valueToPercent(value: number | undefined) {
  if (value === undefined) {
    return 0;
  }

  const val = Math.round(value * 100);

  return `${val < 10 ? '0' : ''}${val.toFixed(1)}%`;
}

function Value({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <p className="flex gap-1 text-white px-3 w-fit min-h-0 items-center">
      {label}:<span className="font-bold">{value || 'N/A'}</span>
    </p>
  );
}

function ProjectMeta({ projectId }: { projectId?: string }) {
  const { data } = useProject(projectId);
  const { device } = useDevice();

  return (
    <div className={clsx('bg-[#333] flex gap-4 text-xl', (!data || !device) && 'opacity-70')}>
      <Value label="TEMPO" value={data?.settings.bpm || 'N/A'} />

      <Value label="SCENES" value={data?.scenes.length ?? 'N/A'} />

      <div className="text-white px-3 w-fit min-h-0 flex gap-1  items-center">
        FX:
        <span className="font-bold">
          {data?.effects.effectType !== undefined ? EFFECTS_SHORT[data?.effects.effectType] : 'N/A'}
        </span>
        <div className="flex gap-1 items-center ml-4">
          <Knob className="size-5" />
          {data?.effects.param1 !== undefined ? valueToPercent(data?.effects.param1) : 'N/A'}
          <Knob className="size-5 ml-2" />
          {data?.effects.param2 !== undefined ? valueToPercent(data?.effects.param2) : 'N/A'}
        </div>
      </div>
    </div>
  );
}

export default ProjectMeta;
