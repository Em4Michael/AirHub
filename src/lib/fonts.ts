import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

export const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500', '600', '700'],
})

// Combine all font variables for easy use in layout
export const fontVariables = `${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`