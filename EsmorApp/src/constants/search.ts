/**
 * Shape used by the search sheet. Feed it localized content from the app's
 * translation layer or a future API.
 */
export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
};
