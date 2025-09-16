// Only load dotenv in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const { trace } = require("@opentelemetry/api");
const { initTelemetry, telemetryMiddleware } = require("./lib/telemetry");
const { generateEntityImageDirect } = require("./lib/image-generation");

// Initialize telemetry before anything else
initTelemetry();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(telemetryMiddleware);

// Security middleware
function validateSecret(req, res, next) {
  const secret = req.headers["x-imgen-secret"];

  if (!process.env.IMGEN_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!secret || secret !== process.env.IMGEN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// URL validation middleware
function validateUrl(req, res, next) {
  const { url } = req.body;

  if (!url) {
    return next();
  }

  const allowedUrls = process.env.ALLOWED_URLS;
  if (!allowedUrls) {
    return res.status(500).json({ error: "Server configuration error: ALLOWED_URLS not set" });
  }

  const allowedList = allowedUrls.split(',').map(u => u.trim());
  const requestUrl = new URL(url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  const isAllowed = allowedList.some(allowedUrl => {
    try {
      const allowed = new URL(allowedUrl);
      const allowedOrigin = `${allowed.protocol}//${allowed.host}`;
      return requestOrigin === allowedOrigin;
    } catch {
      return false;
    }
  });

  if (!isAllowed) {
    return res.status(403).json({
      error: "URL not allowed",
      requestedUrl: requestOrigin,
      allowedUrls: allowedList
    });
  }

  next();
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "imgen",
    timestamp: new Date().toISOString(),
  });
});

// Main image generation endpoint
app.post("/generate", validateSecret, validateUrl, async (req, res) => {
  const tracer = trace.getTracer("imgen-server");

  return tracer.startActiveSpan("POST /generate", async (span) => {
    try {
      const { type, id, url } = req.body;

      if (!type || !id || !url) {
        span.setAttributes({
          "request.validation_error": "Missing required fields",
          "request.has_type": !!type,
          "request.has_id": !!id,
          "request.has_url": !!url,
        });
        span.setStatus({ code: 2, message: "Missing required fields" });
        return res.status(400).json({
          error: "Missing required fields: type, id, url",
        });
      }

      if (!["monster", "companion", "item"].includes(type)) {
        span.setAttributes({
          "request.validation_error": "Invalid entity type",
          "request.type": type,
        });
        span.setStatus({ code: 2, message: "Invalid entity type" });
        return res.status(400).json({
          error: "Invalid type. Must be monster, companion, or item",
        });
      }

      span.setAttributes({
        "request.entity_type": type,
        "request.entity_id": id,
        "request.url": url,
      });

      console.log(`Generating image for ${type} ${id} from ${url}`);

      const startTime = Date.now();

      const imageBuffer = await generateEntityImageDirect({
        url,
        entityId: id,
        entityType: type,
      });

      const generationTime = Date.now() - startTime;

      span.setAttributes({
        "image.generation_time_ms": generationTime,
        "image.buffer_size": imageBuffer.length,
        "response.status": 200,
      });

      span.setStatus({ code: 1 }); // OK

      console.log(
        `Generated ${imageBuffer.length} byte image for ${type} ${id} in ${generationTime}ms`
      );

      res.set({
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length,
        "Cache-Control": "public, max-age=3600",
      });

      res.send(imageBuffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      span.setAttributes({
        "error.message": errorMessage,
        "error.type":
          error instanceof Error ? error.constructor.name : "Unknown",
        "response.status": 500,
      });

      if (errorStack) {
        span.setAttributes({ "error.stack": errorStack });
      }

      span.setStatus({ code: 2, message: errorMessage }); // ERROR

      console.error("Image generation error:", {
        error: errorMessage,
        stack: errorStack,
        requestBody: req.body,
      });

      res.status(500).json({
        error: "Image generation failed",
        details: errorMessage,
      });
    } finally {
      span.end();
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((error, _req, res, _next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Image generation service listening on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});
