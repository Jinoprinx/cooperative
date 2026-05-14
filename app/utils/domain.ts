export const getMainDomain = (): string => {
  if (typeof window === 'undefined') return '';
  
  const currentHost = window.location.host; // includes port
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  let mainDomain = currentHost;
  const parts = hostname.split('.');

  // 1. Handle localhost subdomains (e.g., tenant.localhost:3000)
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    mainDomain = `localhost${port}`;
  } 
  // 2. Handle lvh.me subdomains (e.g., tenant.lvh.me:3000)
  else if (hostname.endsWith('lvh.me')) {
    mainDomain = `lvh.me${port}`;
  }
  // 3. Handle Vercel deployments (e.g., tenant.project.vercel.app)
  else if (hostname.endsWith('.vercel.app')) {
    // If it has more than 2 parts before .vercel.app, it's a subdomain
    // project.vercel.app has 3 parts (project, vercel, app)
    if (parts.length > 3) {
      mainDomain = parts.slice(-3).join('.') + port;
    } else {
      mainDomain = currentHost;
    }
  } 
  // 4. Standard domains (e.g., tenant.cooperatives.io)
  else if (parts.length > 2) {
    mainDomain = parts.slice(-2).join('.') + port;
  }
  else {
    mainDomain = currentHost;
  }

  return mainDomain;
};
