import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADN2jT0wercxSNFB';

const TurnstileWidget = ({ onToken, onError, id = 'cf-turnstile' }) => {
  const containerRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const render = () => {
      if (!window.turnstile) {
        setTimeout(render, 100);
        return;
      }
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken?.(token),
        'error-callback': () => onError?.('Turnstile verification failed. Please try again.'),
        'expired-callback': () => onToken?.(null),
        theme: 'dark',
      });
    };

    render();

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onToken, onError]);

  return <div ref={containerRef} id={id} />;
};

export default TurnstileWidget;
