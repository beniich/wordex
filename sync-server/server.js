const { Server } = require("@hocuspocus/server");
const { Logger } = require("@hocuspocus/extension-logger");
const { Redis } = require("@hocuspocus/extension-redis");
// const { Database } = require("@hocuspocus/extension-database");
const http = require("http");

// Configuration environment variables
const PORT = process.env.PORT || 1234;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const server = Server.configure({
  port: PORT,
  extensions: [
    new Logger(),
    // Redis is crucial for scaling across multiple NodeJS instances
    new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
    }),
    /*
    new Database({
      // Fetch data from FastAPI backend
      fetch: async ({ documentName }) => {
        try {
          const res = await fetch(`http://localhost:8000/api/documents/${documentName}/state`);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            return new Uint8Array(arrayBuffer);
          }
        } catch (err) {
          console.error("Error fetching doc:", err);
        }
        return null; // Start with empty doc if not found
      },
      // Store data to FastAPI backend
      store: async ({ documentName, state }) => {
        try {
          await fetch(`http://localhost:8000/api/documents/${documentName}/state`, {
            method: "POST",
            body: state,
            headers: { "Content-Type": "application/octet-stream" }
          });
        } catch (err) {
          console.error("Error saving doc:", err);
        }
      },
    })
    */
  ],

  async onConnect(data) {
    // Validate JWT token here via requestParams or data.requestHeaders
    const { requestHeaders, requestParameters } = data;
    const token = requestParameters.get('token');
    
    // Quick validation (to be integrated deeply with FastAPI's JWT verification if needed)
    if (!token && process.env.NODE_ENV === "production") {
      throw new Error("Not authorized");
    }
  },

  async onAuthenticate(data) {
    const { token } = data;
    // Map the token to a user profile
    // Return custom data that will be accessible in the awareness state
    return {
      user: {
        id: token || "anonymous-user",
        name: token ? `User-${token.substring(0, 4)}` : "Guest",
      }
    };
  }
});

server.listen().then(({ port }) => {
  console.log(`🚀 Hocuspocus sync-server running at ws://127.0.0.1:${port}`);
});
