import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class Main {
    private static final int DEFAULT_PORT = 8080;
    private static final Path FRONTEND = Paths.get(".").toAbsolutePath().normalize();

    private static final Map<String, User> usersDb = new HashMap<>();

    static class User {
        String username;
        String email;
        String password;
        String level;

        User(String username, String email, String password, String level) {
            this.username = username;
            this.email = email;
            this.password = password;
            this.level = level;
        }
    }

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : DEFAULT_PORT;
        
        usersDb.put("playerone@gmail.com", new User("PlayerOne", "playerone@gmail.com", "123456", "Nivel 15"));

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/dashboard", Main::dashboardApi);
        server.createContext("/api/login", Main::loginApi);
        server.createContext("/api/register", Main::registerApi);
        server.createContext("/", Main::staticFiles);
        server.setExecutor(null);

        System.out.println("GameTournament iniciado en http://localhost:" + port);
        server.start();
    }

    private static void loginApi(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json; charset=UTF-8", "{\"error\":\"Método no permitido\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String email = parseJsonField(body, "email");
        String password = parseJsonField(body, "password");

        if (email == null || password == null) {
            send(exchange, 400, "application/json; charset=UTF-8", "{\"error\":\"Campos incompletos\"}");
            return;
        }

        User user = usersDb.get(email.toLowerCase());
        if (user != null && user.password.equals(password)) {
            String token = UUID.randomUUID().toString();
            String json = String.format("{\"success\":true,\"token\":\"%s\",\"user\":{\"username\":\"%s\",\"email\":\"%s\",\"level\":\"%s\"}}",
                    token, user.username, user.email, user.level);
            send(exchange, 200, "application/json; charset=UTF-8", json);
        } else {
            send(exchange, 401, "application/json; charset=UTF-8", "{\"error\":\"Credenciales incorrectas\"}");
        }
    }

    private static void registerApi(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json; charset=UTF-8", "{\"error\":\"Método no permitido\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String username = parseJsonField(body, "username");
        String email = parseJsonField(body, "email");
        String password = parseJsonField(body, "password");

        if (username == null || email == null || password == null) {
            send(exchange, 400, "application/json; charset=UTF-8", "{\"error\":\"Todos los campos son obligatorios\"}");
            return;
        }

        if (usersDb.containsKey(email.toLowerCase())) {
            send(exchange, 400, "application/json; charset=UTF-8", "{\"error\":\"El correo ya está registrado\"}");
            return;
        }

        User newUser = new User(username, email.toLowerCase(), password, "Nivel 1");
        usersDb.put(email.toLowerCase(), newUser);

        String token = UUID.randomUUID().toString();
        String json = String.format("{\"success\":true,\"token\":\"%s\",\"user\":{\"username\":\"%s\",\"email\":\"%s\",\"level\":\"%s\"}}",
                token, newUser.username, newUser.email, newUser.level);
        send(exchange, 201, "application/json; charset=UTF-8", json);
    }

    private static void dashboardApi(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json; charset=UTF-8", "{\"error\":\"Método no permitido\"}");
            return;
        }

        String json = """
        {
          "stats": { "wins": 28, "losses": 12, "played": 40, "winRate": 70 },
          "history": [
            {"result":"Victoria","game":"Valorant","opponent":"vs Black Dragons","score":"13 - 7","date":"01/10/2026","icon":"fa-crosshairs"},
            {"result":"Derrota","game":"CS:GO","opponent":"vs Night Owls","score":"8 - 16","date":"29/09/2026","icon":"fa-bomb"},
            {"result":"Victoria","game":"League of Legends","opponent":"vs Steel Soldiers","score":"2 - 1","date":"27/09/2026","icon":"fa-shield-halved"}
          ],
          "ranking": [
            {"rank":1,"name":"Shadow Reapers","short":"SR","points":1560},
            {"rank":2,"name":"Storm Warriors","short":"SW","points":1250},
            {"rank":3,"name":"Red Phoenix","short":"RP","points":1180},
            {"rank":4,"name":"Black Dragons","short":"BD","points":1050},
            {"rank":5,"name":"Night Owls","short":"NO","points":980}
          ],
          "tournaments": [
            {"name":"Valorant Night Cup","game":"Valorant","teams":16,"prize":"$500","date":"10 Oct 2026","status":"Abierto"},
            {"name":"Clash Masters","game":"CS:GO","teams":8,"prize":"$300","date":"18 Oct 2026","status":"Próximo"},
            {"name":"Legends Arena","game":"League of Legends","teams":12,"prize":"$750","date":"25 Oct 2026","status":"Inscripciones"}
          ]
        }
        """;

        send(exchange, 200, "application/json; charset=UTF-8", json);
    }

    private static void staticFiles(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();
        if (requestPath.equals("/")) requestPath = "/index.html";

        Path file = FRONTEND.resolve(requestPath.substring(1)).normalize();
        if (!file.startsWith(FRONTEND) || !Files.exists(file) || Files.isDirectory(file)) {
            send(exchange, 404, "text/plain; charset=UTF-8", "404 - Recurso no encontrado");
            return;
        }

        String contentType = Files.probeContentType(file);
        if (contentType == null) contentType = guessContentType(file);
        byte[] data = Files.readAllBytes(file);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, data.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(data);
        }
    }

    private static String guessContentType(Path file) {
        String name = file.getFileName().toString().toLowerCase();
        if (name.endsWith(".css")) return "text/css; charset=UTF-8";
        if (name.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (name.endsWith(".html")) return "text/html; charset=UTF-8";
        return "application/octet-stream";
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static String parseJsonField(String json, String field) {
        String key = "\"" + field + "\"";
        int keyIndex = json.indexOf(key);
        if (keyIndex == -1) return null;
        int colonIndex = json.indexOf(":", keyIndex);
        if (colonIndex == -1) return null;
        int startQuote = json.indexOf("\"", colonIndex);
        if (startQuote == -1) return null;
        int endQuote = json.indexOf("\"", startQuote + 1);
        if (endQuote == -1) return null;
        return json.substring(startQuote + 1, endQuote);
    }

    private static void send(HttpExchange exchange, int status, String contentType, String body) throws IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, data.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(data);
        }
    }
}