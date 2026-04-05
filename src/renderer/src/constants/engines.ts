export interface SearchEngine {
  id: string
  name: string
  buildUrl: (query: string) => string
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google Images',
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`
  },
  {
    id: 'bing',
    name: 'Bing Images',
    buildUrl: (q) => `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`
  },
  {
    id: 'yandex',
    name: 'Yandex Images',
    buildUrl: (q) => `https://yandex.com/images/search?text=${encodeURIComponent(q)}`
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    buildUrl: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    buildUrl: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}`
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    buildUrl: (q) => `https://dribbble.com/search/${encodeURIComponent(q)}`
  },
  {
    id: 'pexels',
    name: 'Pexels',
    buildUrl: (q) => `https://www.pexels.com/search/${encodeURIComponent(q)}/`
  },
  {
    id: 'behance',
    name: 'Behance',
    buildUrl: (q) => `https://www.behance.net/search/projects?search=${encodeURIComponent(q)}`
  },
  {
    id: 'instagram',
    name: 'Instagram',
    buildUrl: (q) => `https://www.instagram.com/explore/tags/${encodeURIComponent(q)}/`
  }
]

export const ENGINE_IDS = SEARCH_ENGINES.map((e) => e.id)
