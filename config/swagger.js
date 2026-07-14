import { getApiUrl, getLocalApiUrl, getLiveApiUrl } from "../utils/env.js";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Zarshan Backend API",
      version: "1.0.0",
      description: "REST API documentation for SocialFlow — the Zarshan Social Media Management SaaS backend.",
    },
    servers: [
      { url: getApiUrl(), description: "Current environment" },
      { url: getLocalApiUrl(), description: "Local development" },
      { url: getLiveApiUrl(), description: "Live (Railway)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
});

export default swaggerSpec;
