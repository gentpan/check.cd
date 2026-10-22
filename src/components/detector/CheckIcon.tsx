const paths = {
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z',
  network: 'M5 5h5v5H5zM14 14h5v5h-5zM7.5 10v6.5H14M10 7.5h6.5V14',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  browser: 'M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01',
  language: 'M3 5h10M8 3v2M5 5c0 5 3 8 7 10M11 5c0 5-3 8-8 10M14 21l4-10 4 10M15.5 17h5',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  screen: 'M3 4h18v13H3zM8 21h8M12 17v4',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  touch: 'M9 12V5a2 2 0 0 1 4 0v6l3-1 4 3-2 8h-7l-6-7a2 2 0 0 1 3-2l1 1',
  font: 'M4 20 11 4h2l7 16M7 14h10',
  fingerprint: 'M4 11a8 8 0 0 1 16 0M7 12a5 5 0 0 1 10 0v4M10 19v-7a2 2 0 0 1 4 0v8M4 15v3M7 15v6M20 14v5',
  audio: 'M4 9v6M8 5v14M12 3v18M16 7v10M20 10v4',
  link: 'm10 14 4-4M9 16l-2 2a4 4 0 0 1-5-5l4-4a4 4 0 0 1 6 0M15 8l2-2a4 4 0 0 1 5 5l-4 4a4 4 0 0 1-6 0',
  storage: 'M4 5c0-3 16-3 16 0s-16 3-16 0Zm0 0v14c0 3 16 3 16 0V5M4 12c0 3 16 3 16 0',
  sparkle: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
};
const icons:Record<string,keyof typeof paths> = {country:'globe',ipAddress:'network',ipType:'network',ipMarks:'shield',aiSubscription:'sparkle',proxyCountry:'network',clientProfile:'browser',userAgent:'browser',language:'language',languageVariant:'language',locale:'globe',timezone:'clock',timezoneOffset:'clock',emojiStyle:'font',screen:'screen',viewport:'screen',hardware:'chip',touch:'touch',chineseFonts:'font',vendorFonts:'font',canvasFp:'fingerprint',webgl:'chip',audioFp:'audio',automation:'chip',permissions:'shield',plugins:'browser',storage:'storage',langTz:'link',tzIp:'link',uaPlatform:'link',glOs:'link'};
export function CheckIcon({id,className='size-5'}:{id:string;className?:string}) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[icons[id] ?? 'sparkle']} /></svg>;
}
