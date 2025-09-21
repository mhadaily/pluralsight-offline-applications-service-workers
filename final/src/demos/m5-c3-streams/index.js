// [DEMO: Module 5 – Clip 3 START]
/**
 * Streams API Demo
 * Demonstrates streaming responses with Service Workers
 */

console.log('[DEMO M5-C3] 🌊 Streams demo loaded');

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle streaming HTML demo
  if (url.pathname === '/stream/html') {
    console.log('[DEMO M5-C3] 🌊 Serving streaming HTML');

    event.respondWith(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Send initial HTML structure immediately
            controller.enqueue(
              encoder.encode(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Streaming Demo - Travel Planner</title>
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                line-height: 1.6; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 2rem;
                background: #f9fafb;
              }
              .chunk { 
                margin: 1rem 0; 
                padding: 1rem; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                opacity: 0;
                animation: fadeIn 0.5s ease forwards;
              }
              @keyframes fadeIn {
                to { opacity: 1; }
              }
              .header { 
                background: #2563eb; 
                color: white; 
                padding: 2rem; 
                border-radius: 8px; 
                text-align: center; 
                margin-bottom: 2rem;
              }
              .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f4f6;
                border-radius: 50%;
                border-top-color: #2563eb;
                animation: spin 1s ease-in-out infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🌊 Streaming HTML Demo</h1>
              <p>This page is being streamed in real-time!</p>
            </div>
        `)
            );

            // Stream content chunks progressively
            let chunkCount = 1;

            const streamChunk = (content, delay) => {
              setTimeout(() => {
                controller.enqueue(
                  encoder.encode(`
              <div class="chunk">
                <h3>Chunk ${chunkCount++}</h3>
                <p>${content}</p>
                <small>Loaded at: ${new Date().toLocaleTimeString()}</small>
              </div>
            `)
                );
              }, delay);
            };

            // Send chunks with progressive delays
            streamChunk(
              '🚀 This is the first chunk of content, loaded immediately after the header.',
              200
            );

            streamChunk(
              '📦 The second chunk demonstrates how content can be loaded progressively, improving perceived performance.',
              800
            );

            streamChunk(
              '⚡ Service Workers enable powerful streaming capabilities, allowing you to send content as it becomes available.',
              1500
            );

            streamChunk(
              '🎯 This approach is perfect for server-side rendering, progressive enhancement, and optimizing Time to First Byte.',
              2200
            );

            streamChunk(
              '💡 Users can start reading and interacting with content before the entire page is loaded.',
              3000
            );

            // Add a loading indicator that gets replaced
            setTimeout(() => {
              controller.enqueue(
                encoder.encode(`
            <div class="chunk">
              <h3>Loading More Content...</h3>
              <div class="loading"></div>
              <p>Simulating a slow data fetch...</p>
            </div>
          `)
              );
            }, 3800);

            // Replace loading with final content
            setTimeout(() => {
              controller.enqueue(
                encoder.encode(`
            <script>
              // Remove the loading chunk
              const loadingChunk = document.querySelector('.chunk:last-child');
              if (loadingChunk) loadingChunk.remove();
            </script>
            <div class="chunk">
              <h3>🎉 Final Chunk</h3>
              <p>This content took longer to load, but users could read the previous content while waiting!</p>
              <p><strong>Benefits of streaming:</strong></p>
              <ul>
                <li>Faster perceived performance</li>
                <li>Better user experience</li>
                <li>Progressive content loading</li>
                <li>Reduced Time to Interactive</li>
              </ul>
              <p><a href="/#/streams">← Back to Streams</a></p>
            </div>
            </body>
            </html>
          `)
              );

              // Close the stream
              controller.close();
            }, 5000);
          },
        }),
        {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Streaming': 'true',
          },
        }
      )
    );

    return;
  }

  // Handle streaming JSON data demo
  if (url.pathname === '/stream/json') {
    console.log('[DEMO M5-C3] 🌊 Serving streaming JSON');

    event.respondWith(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Send JSON array opening
            controller.enqueue(encoder.encode('{"deals":['));

            // Mock travel deals data
            const deals = [
              { id: 1, title: 'Paris Weekend', price: 299, category: 'city' },
              { id: 2, title: 'Bali Beach', price: 599, category: 'beach' },
              { id: 3, title: 'Swiss Alps', price: 899, category: 'mountain' },
              {
                id: 4,
                title: 'Tokyo Culture',
                price: 1299,
                category: 'culture',
              },
              {
                id: 5,
                title: 'Safari Adventure',
                price: 1899,
                category: 'adventure',
              },
            ];

            // Stream each deal with a delay
            deals.forEach((deal, index) => {
              setTimeout(() => {
                const dealJson = JSON.stringify(deal);
                const comma = index < deals.length - 1 ? ',' : '';
                controller.enqueue(encoder.encode(`${dealJson}${comma}`));

                // Close the JSON and stream when done
                if (index === deals.length - 1) {
                  setTimeout(() => {
                    controller.enqueue(
                      encoder.encode(
                        '],"meta":{"total":' +
                          deals.length +
                          ',"streaming":true,"timestamp":"' +
                          new Date().toISOString() +
                          '"}}'
                      )
                    );
                    controller.close();
                  }, 300);
                }
              }, index * 400);
            });
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Streaming': 'true',
          },
        }
      )
    );

    return;
  }

  // Handle streaming text demo (like server-sent events)
  if (url.pathname === '/stream/events') {
    console.log('[DEMO M5-C3] 🌊 Serving streaming events');

    event.respondWith(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Send initial event
            controller.enqueue(
              encoder.encode(
                'data: {"type":"connected","message":"Stream started"}\n\n'
              )
            );

            let eventCount = 1;

            // Send periodic events
            const interval = setInterval(() => {
              const event = {
                type: 'update',
                id: eventCount,
                message: `Event ${eventCount}`,
                timestamp: Date.now(),
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
              eventCount++;

              // Stop after 10 events
              if (eventCount > 10) {
                clearInterval(interval);
                controller.enqueue(
                  encoder.encode(
                    'data: {"type":"complete","message":"Stream ended"}\n\n'
                  )
                );
                controller.close();
              }
            }, 1000);
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Streaming': 'true',
          },
        }
      )
    );

    return;
  }

  // Handle streaming large file simulation
  if (url.pathname === '/stream/large-file') {
    console.log('[DEMO M5-C3] 🌊 Serving streaming large file');

    event.respondWith(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            const chunkSize = 1024; // 1KB chunks
            const totalChunks = 100; // Simulate 100KB file

            let chunksSent = 0;

            const sendChunk = () => {
              if (chunksSent >= totalChunks) {
                controller.close();
                return;
              }

              // Create a chunk of data
              const chunk = 'X'.repeat(chunkSize);
              controller.enqueue(encoder.encode(chunk));
              chunksSent++;

              // Schedule next chunk
              setTimeout(sendChunk, 50); // Send chunk every 50ms
            };

            sendChunk();
          },
        }),
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': (1024 * 100).toString(),
            'X-Streaming': 'true',
          },
        }
      )
    );
  }
});

console.log('[DEMO M5-C3] 🌊 Streams demo ready');
// [DEMO: Module 5 – Clip 3 END]
