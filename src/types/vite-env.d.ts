/// <reference types="vite/client" />

declare module '*.svg?react' {
  import { JSX } from 'preact';
  const SVG: (props: JSX.SVGProps<SVGSVGElement>) => JSX.Element;
  export default SVG;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
