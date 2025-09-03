declare global {
  interface Window {
    gtag: GtagFunction;
  }
}

type GtagFunction = {
  (
    command: 'config',
    targetId: string,
    config?: {
      [key: string]: any;
      anonymize_ip?: boolean;
      allow_ad_features?: boolean;
      allow_google_signals?: boolean;
      cookie_domain?: string;
      cookie_expires?: number;
      cookie_flags?: string;
      cookie_name?: string;
      cookie_prefix?: string;
      cookie_update?: boolean;
      page_title?: string;
      page_location?: string;
      send_page_view?: boolean;
      user_id?: string;
    },
  ): void;

  (command: 'set', targetId: string | 'user_properties', config: Record<string, any>): void;

  (
    command: 'event',
    action: string,
    parameters?: {
      [key: string]: any;
      event_category?: string;
      event_label?: string;
      value?: number;
      custom_map?: Record<string, string>;
      items?: Array<{
        item_id?: string;
        item_name?: string;
        affiliation?: string;
        coupon?: string;
        currency?: string;
        discount?: number;
        index?: number;
        item_brand?: string;
        item_category?: string;
        item_category2?: string;
        item_category3?: string;
        item_category4?: string;
        item_category5?: string;
        item_list_id?: string;
        item_list_name?: string;
        item_variant?: string;
        location_id?: string;
        price?: number;
        quantity?: number;
      }>;
      transaction_id?: string;
      affiliation?: string;
      currency?: string;
      tax?: number;
      shipping?: number;
      checkout_step?: number;
      checkout_option?: string;
      method?: string;
      search_term?: string;
      content_type?: string;
      content_id?: string;
    },
  ): void;

  (command: 'get', targetId: string, fieldName: string, callback: (value: any) => void): void;
};

export {};
