'use client';

export function setupHydrationErrorSuppression() {
  if (typeof window === 'undefined') return;

  // Suppress ALL console output related to hydration
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // Override all console methods to filter hydration errors
  const createFilteredMethod = (originalMethod: Function) => {
    return (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Hydration') || 
         message.includes('Text content does not match server-rendered HTML') ||
         message.includes('Expected server HTML to contain a matching') ||
         message.includes('Warning: Text content did not match') ||
         message.includes('Warning: Expected server HTML to contain') ||
         message.includes('Warning: An error occurred during hydration') ||
         message.includes('Warning: The server rendered HTML didn\'t match the client') ||
         message.includes('Warning: ReactDOM.render is no longer supported') ||
         message.includes('Warning: render(): Rendering components directly into document.body') ||
         message.includes('Warning: Each child in a list should have a unique "key" prop') ||
         message.includes('Warning: Can\'t perform a React state update on an unmounted component') ||
         message.includes('Hydration failed because the server rendered HTML didn\'t match the client') ||
         message.includes('As a result this tree will be regenerated on the client') ||
         message.includes('This can happen if a SSR-ed Client Component used') ||
         message.includes('A server/client branch') ||
         message.includes('Variable input such as') ||
         message.includes('Date formatting in a user\'s locale') ||
         message.includes('External changing data without sending a snapshot') ||
         message.includes('Invalid HTML tag nesting') ||
         message.includes('browser extension installed which messes with the HTML'))
      ) {
        // Suppress all hydration-related messages silently
        return;
      }
      originalMethod.apply(console, args);
    };
  };

  console.error = createFilteredMethod(originalError);
  console.warn = createFilteredMethod(originalWarn);
  console.log = createFilteredMethod(originalLog);
  console.info = createFilteredMethod(originalInfo);
  console.debug = createFilteredMethod(originalDebug);

  // Handle unhandled promise rejections that might be hydration-related
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason;
    if (
      typeof message === 'string' &&
      (message.includes('Hydration') || 
       message.includes('Text content does not match server-rendered HTML') ||
       message.includes('Hydration failed because the server rendered HTML didn\'t match the client'))
    ) {
      event.preventDefault();
      return;
    }
  });

  // Handle global errors that might be hydration-related
  window.addEventListener('error', (event) => {
    const message = event.message;
    if (
      typeof message === 'string' &&
      (message.includes('Hydration') || 
       message.includes('Text content does not match server-rendered HTML') ||
       message.includes('Hydration failed because the server rendered HTML didn\'t match the client'))
    ) {
      event.preventDefault();
      return;
    }
  });

  // Override React's internal error reporting
  if (typeof window !== 'undefined' && (window as any).React) {
    const originalReactError = (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    if (originalReactError && originalReactError.ReactCurrentOwner) {
      // Suppress React's internal error reporting for hydration issues
      const originalReportError = originalReactError.reportError;
      if (originalReportError) {
        originalReactError.reportError = (error: any) => {
          if (error && error.message && error.message.includes('Hydration')) {
            return;
          }
          originalReportError(error);
        };
      }
    }
  }
}

export function isHydrationError(error: any): boolean {
  const message = error?.message || error?.toString() || '';
  return (
    message.includes('Hydration') || 
    message.includes('Text content does not match server-rendered HTML') ||
    message.includes('Expected server HTML to contain a matching') ||
    message.includes('Warning: Text content did not match') ||
    message.includes('Warning: Expected server HTML to contain') ||
    message.includes('Warning: An error occurred during hydration') ||
    message.includes('Warning: The server rendered HTML didn\'t match the client') ||
    message.includes('Hydration failed because the server rendered HTML didn\'t match the client')
  );
} 