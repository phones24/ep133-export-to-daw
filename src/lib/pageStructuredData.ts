const SITE_URL = 'https://ep133-to-daw.cc';

export interface StructuredData {
  '@context': string;
  '@graph': object[];
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: 'EP-133: Export To DAW',
  inLanguage: 'en',
  publisher: { '@id': `${SITE_URL}/#organization` },
};

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Randomware Audio',
  url: 'https://randomware-audio.cc/',
  sameAs: ['https://github.com/phones24', 'https://discord.gg/Zrc8UEU8Gn'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'ep133todaw@proton.me',
  },
};

const application = {
  '@type': 'WebApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'EP-133: Export To DAW',
  url: `${SITE_URL}/`,
  description:
    'Export Teenage Engineering EP-133, EP-1320 and EP-40 projects to Ableton Live, DAWproject, REAPER, MIDI or FastTracker 2 directly in your browser.',
  applicationCategory: 'MusicApplication',
  operatingSystem: 'Any modern browser',
  browserRequirements: 'Requires WebMIDI support',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Export EP-133, EP-1320 and EP-40 projects to Ableton Live',
    'Export to DAWproject, REAPER, MIDI and FastTracker 2',
    'Export projects from .pak or .ppak backup files',
    'Works offline as a progressive web app',
  ],
  screenshot: `${SITE_URL}/ep133-to-daw.png`,
  author: { '@id': `${SITE_URL}/#organization` },
  sameAs: ['https://github.com/phones24/ep133-export-to-daw'],
};

export function createFaqStructuredData(
  content: { question: string; answer: string }[],
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/faq#faq`,
        url: `${SITE_URL}/faq`,
        name: 'EP-133 Export to DAW FAQ',
        inLanguage: 'en',
        mainEntity: content.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
      website,
      organization,
    ],
  };
}

export const pageStructuredData: Record<string, StructuredData> = {
  '/': {
    '@context': 'https://schema.org',
    '@graph': [application, website, organization],
  },
};

export function serializeStructuredData(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function updatePageStructuredData(
  path: string,
  noindex = false,
  structuredData?: StructuredData,
) {
  const data = noindex ? undefined : (structuredData ?? pageStructuredData[path]);
  let script = document.head.querySelector<HTMLScriptElement>('#page-structured-data');

  if (!data) {
    script?.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = 'page-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = serializeStructuredData(data);
}
