import { useColorScheme } from 'nativewind';
import { tokensFor, type ThemeTokens } from './tokens';

/**
 * Resolved theme for the current OS color scheme. NativeWind drives the
 * `dark:`/media switching for classes; this hook is for JS-side needs
 * (StatusBar, gradient stops, native color props).
 */
export function useTheme(): { scheme: 'light' | 'dark'; tokens: ThemeTokens } {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  return { scheme, tokens: tokensFor(scheme) };
}
