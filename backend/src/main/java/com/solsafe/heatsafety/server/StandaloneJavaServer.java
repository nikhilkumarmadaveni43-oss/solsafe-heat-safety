package com.solsafe.heatsafety.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Instant;
import java.util.concurrent.Executors;

/**
 * Zero-Dependency JDK 21 HTTP Server Entrypoint for SolSafe HeatSafety.
 *
 * Allows running the Full Stack Java application directly with standard `javac` and `java`
 * on port 8050 even in environments where Apache Maven is not installed on the system PATH.
 */
public class StandaloneJavaServer {

    private static final int PORT = 8050;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", PORT), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        // REST API Health Check Endpoint
        server.createContext("/api/health", exchange -> {
            addCorsHeaders(exchange);
            String json = String.format(
                    "{\"status\":\"UP\",\"service\":\"SolSafe Java 21 Microclimate & Routing Server\",\"runtime\":\"Java %s\",\"timestamp\":\"%s\"}",
                    System.getProperty("java.version"), Instant.now().toString()
            );
            sendJson(exchange, 200, json);
        });

        // Serve static JSON datasets from backend/src/main/resources/data/
        server.createContext("/api/raw_data/hyderabad_network", exchange ->
                serveResourceFile(exchange, "backend/src/main/resources/data/hyderabad_network.json"));
        server.createContext("/api/raw_data/hyderabad_oases", exchange ->
                serveResourceFile(exchange, "backend/src/main/resources/data/hyderabad_oases.json"));

        // Serve Frontend Static Files from ./frontend
        server.createContext("/", new StaticFrontendHandler());

        server.start();
        System.out.println("=======================================================================");
        System.out.println("  SolSafe Full Stack Java 21 Server Running on http://localhost:" + PORT);
        System.out.println("  Java Runtime : JDK " + System.getProperty("java.version") + " (Virtual Threads Enabled)");
        System.out.println("  Health Check : http://localhost:" + PORT + "/api/health");
        System.out.println("=======================================================================");
    }

    private static void serveResourceFile(HttpExchange exchange, String filePath) throws IOException {
        addCorsHeaders(exchange);
        File f = new File(filePath);
        if (!f.exists()) {
            sendJson(exchange, 404, "{\"error\":\"Resource not found\"}");
            return;
        }
        byte[] bytes = Files.readAllBytes(f.toPath());
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static class StaticFrontendHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String path = exchange.getRequestURI().getPath();
            if (path.startsWith("/api/")) {
                sendJson(exchange, 404, "{\"status\":404,\"mode\":\"delegated_to_edge_engine\"}");
                return;
            }
            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }
            if (path.startsWith("/frontend/")) {
                path = path.substring("/frontend".length());
            }

            File frontendDir = new File("frontend").getCanonicalFile();
            File targetFile = new File(frontendDir, path).getCanonicalFile();

            if (!targetFile.getPath().startsWith(frontendDir.getPath()) || !targetFile.exists() || targetFile.isDirectory()) {
                targetFile = new File(frontendDir, "index.html");
            }

            String contentType = guessContentType(targetFile.getName());
            byte[] bytes = Files.readAllBytes(targetFile.toPath());
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String guessContentType(String name) {
            if (name.endsWith(".html")) return "text/html; charset=UTF-8";
            if (name.endsWith(".css")) return "text/css; charset=UTF-8";
            if (name.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (name.endsWith(".json")) return "application/json; charset=UTF-8";
            if (name.endsWith(".svg")) return "image/svg+xml";
            return "application/octet-stream";
        }
    }
}
