export const getMainDomain = (): string => {
  if (typeof window === 'undefined') return '';
  
  const currentHost = window.location.host; // includes port
  let mainDomain = currentHost;
  const parts = currentHost.split('.');

  if (currentHost.includes('lvh.me')) {
    mainDomain = currentHost.includes(':') 
      ? `lvh.me:${currentHost.split(':')[1]}` 
      : 'lvh.me';
  } else if (currentHost.includes('localhost')) {
    mainDomain = currentHost.includes(':') 
      ? `localhost:${currentHost.split(':')[1]}` 
      : 'localhost';
  } else if (currentHost.endsWith('.vercel.app')) {
    // tenant.project.vercel.app -> project.vercel.app
    mainDomain = parts.slice(-3).join('.');
  } else {
    // For standard domains like tenant.cooperatives.io -> cooperatives.io
    // If it's already cooperatives.io, it just returns cooperatives.io
    // Also preserves port if there's any weird production port config
    const hostname = currentHost.split(':')[0];
    const hostParts = hostname.split('.');
    let base = hostParts.slice(-2).join('.');
    
    if (currentHost.includes(':')) {
        base = `${base}:${currentHost.split(':')[1]}`;
    }
    mainDomain = base;
  }

  return mainDomain;
};
