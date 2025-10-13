/// <reference types="preact" />

import { JSX as PreactJSX } from 'preact';

declare global {
  namespace JSX {
    interface IntrinsicElements extends PreactJSX.IntrinsicElements {}
    interface IntrinsicAttributes extends PreactJSX.IntrinsicAttributes {}
    interface Element extends PreactJSX.Element {}
    interface ElementClass extends PreactJSX.ElementClass {}
  }
}
