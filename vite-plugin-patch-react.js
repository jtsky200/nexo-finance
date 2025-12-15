/**
 * Vite plugin to patch React DevTools Activity error
 */
export function patchReactDevTools() {
  return {
    name: 'patch-react-devtools',
    generateBundle(options, bundle) {
      // Patch ALL chunks that might import React
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.code) {
          // Fix broken = == patterns in all chunks
          chunk.code = chunk.code.replace(/\s*=\s*==\s*/g, ' === ');
          
          // Only do React-specific patching for React bundle
          if (!fileName.includes('vendor-react')) {
            continue;
          }
          // Replace ALL property assignments with safe checks to prevent "Cannot set properties of undefined"
          // Pattern: obj.Property = value  ->  (obj || (obj = {})).Property = value
          chunk.code = chunk.code.replace(
            /(\w+)\.(Activity|Children|Fragment|StrictMode|Suspense|version|createElement|cloneElement|isValidElement|Component|PureComponent|memo|forwardRef|lazy|useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useImperativeHandle|useLayoutEffect|useDebugValue|useDeferredValue|useTransition|useId|useSyncExternalStore|useInsertionEffect)\s*=/g,
            (match, obj, prop) => {
              return `(${obj} || (${obj} = {})).${prop} =`;
            }
          );
          
          // Also patch any property access on potentially undefined objects
          chunk.code = chunk.code.replace(
            /(\w+)\.(\w+)\s*=\s*([^;]+);/g,
            (match, obj, prop, value) => {
              // Only patch if it's a capitalized property (likely React API)
              if (prop[0] === prop[0].toUpperCase() && prop !== 'Map' && prop !== 'Set') {
                return `(${obj} || (${obj} = {})).${prop} = ${value};`;
              }
              return match;
            }
          );
        }
      }
    },
    transform(code, id) {
      // Patch React source files during transform
      if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
        // Make Activity assignments safe
        if (code.includes('Activity')) {
          // Replace unsafe Activity assignments
          code = code.replace(
            /(\w+)\.Activity\s*=/g,
            (match, obj) => {
              return `(${obj} || (${obj} = {})).Activity =`;
            }
          );
          
          // Replace property access on potentially undefined objects
          code = code.replace(
            /(\w+)\?\.Activity/g,
            '$1 && $1.Activity'
          );
        }
      }
      return { code, map: null };
    }
  };
}
