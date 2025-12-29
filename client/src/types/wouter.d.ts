/**
 * Type declaration for wouter
 * Fixes TypeScript error: Cannot find module 'wouter'
 */
declare module 'wouter' {
  export function useLocation(): [string, (path: string) => void];
  export function useRoute(pattern: string): [boolean, Record<string, string> | null];
  export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }): JSX.Element;
  export function Route(props: { path: string; component?: React.ComponentType; children?: React.ReactNode }): JSX.Element;
  export function Switch(props: { children: React.ReactNode }): JSX.Element;
  export function Redirect(props: { to: string }): null;
  export function Router(props: { children: React.ReactNode }): JSX.Element;
}

