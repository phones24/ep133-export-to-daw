import { useEffect } from 'preact/hooks';
import { StructuredData, updatePageStructuredData } from '~/lib/pageStructuredData';

const SITE_URL = 'https://ep133-to-daw.cc';

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  structuredData?: StructuredData;
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Keeps the document head in sync during client-side navigation. The initial
 * HTML already contains the home-page tags; this updates them for /faq and
 * marks client-side 404s as noindex.
 */
export function usePageMeta({
  title,
  description,
  path,
  noindex = false,
  structuredData,
}: PageMetaOptions) {
  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    );
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', `${SITE_URL}${path}`);
    upsertCanonical(`${SITE_URL}${path}`);
    updatePageStructuredData(path, noindex, structuredData);
  }, [title, description, path, noindex, structuredData]);
}
