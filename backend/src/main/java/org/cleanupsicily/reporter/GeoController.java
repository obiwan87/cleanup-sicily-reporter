package org.cleanupsicily.reporter;

import org.jetbrains.annotations.Nullable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
public class GeoController {

    private static final Pattern COORDINATE_REGEX = Pattern.compile("@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)");

    @GetMapping("/api/decode-google-maps-uri")
    public ResponseEntity<?> decodeGoogleMapsUri(@RequestParam(name = "uri") String uriString) {
        URI uri;

        try {
            uri = URI.create(uriString);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Not a valid URI");
        }

        if(uri.getHost().contains("google") && uri.getPath().contains("maps") && uri.getPath().contains("@")) {
            var coords = extractCoords(uri);
            if (coords != null) {
                return ResponseEntity.ok(coords);
            }
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers;

        try {
            headers = restTemplate.headForHeaders(uri);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to resolve URI: " + e.getMessage());
        }

        URI finalUri = headers.getLocation();
        if (finalUri == null) {
            return ResponseEntity.badRequest().body("Could not follow redirect to Google Maps");
        }

        Map<String, Object> coords = extractCoords(finalUri);
        if(coords == null) {
            return ResponseEntity.badRequest().body("Could not extract coordinates");
        }

        return ResponseEntity.ok(coords);
    }

    private static @Nullable Map<String, Object> extractCoords(URI finalUri) {
        Map<String, Object> coords;
        String finalUrl = URLDecoder.decode(finalUri.toString(), StandardCharsets.UTF_8);
        Matcher matcher = COORDINATE_REGEX.matcher(finalUrl);

        if (!matcher.find()) {
            coords = null;
        } else {
            double lat = Double.parseDouble(matcher.group(1));
            double lon = Double.parseDouble(matcher.group(2));
            coords = Map.of(
                    "lat", lat,
                    "lon", lon
            );
        }
        return coords;
    }
}
