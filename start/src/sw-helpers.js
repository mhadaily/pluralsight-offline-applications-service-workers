const analyzeRequest = (request) => {
  const url = new URL(request.url);

  return {
    url: request.url,
    method: request.method,
    mode: request.mode,
    destination: request.destination,
    pathname: url.pathname,
    origin: url.origin,
    isAPI: url.pathname.startsWith('/api/'),
    isAsset: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/i.test(
      url.pathname
    ),
    isHTML:
      request.destination === 'document' || url.pathname.endsWith('.html'),
    isSameOrigin: url.origin === self.location.origin,
    headers: Object.fromEntries(request.headers.entries()),
  };
};

const transformJSONResponse = async (response) => {
  const data = await response.json();

  const transformedData = {
    ...data,
    _demo: {
      module: 'M1-C5',
      intercepted: true,
      timestamp: Date.now(),
      originalUrl: response.url,
    },
  };

   return new Response(JSON.stringify(transformedData, null, 2), {
     status: response.status,
     statusText: response.statusText,
     headers: {
       ...Object.fromEntries(response.headers.entries()),
       'X-Demo-Transform': 'M1-C5-JSON',
       'Content-Type': 'application/json',
     },
   });
};
