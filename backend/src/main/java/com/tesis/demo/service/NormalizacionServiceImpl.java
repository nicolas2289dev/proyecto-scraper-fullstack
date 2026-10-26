package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.Producto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de Normalización Inteligente.
 *
 * <p><b>Estrategia de Parseo de Peso (Regex)</b>: Captura patrones como
 * "500g", "500 gr", "500 gramos", "x 500 Gr", "1kg", "1 kilo", "500ml",
 * "1 litro", "750cc" y los normaliza a (pesoValor, pesoUnidad).</p>
 *
 * <p><b>Marca y variante</b>: se determinan por token, <i>sin depender del orden</i> de las
 * palabras del título: primero la marca informada por la tienda, luego el diccionario de
 * marcas conocidas. Lo que sobra (sin keyword, marca, peso ni conectores) es la variante.</p>
 *
 * <p><b>Huella ({@link #generarClave})</b>: criterio determinista de unificación entre tiendas.
 * Jaro-Winkler se usa solo como tolerancia a errores tipográficos en la marca
 * (ej: "Lucchetti" vs "Luchetti").</p>
 */
@Service
public class NormalizacionServiceImpl implements NormalizacionService {

    // ─── Constantes de normalización de unidades ─────────────────────────────

    /** Umbral de similitud por defecto para unificación de productos. */
    public static final double UMBRAL_DEFAULT = 0.92;

    /** Largo máximo de la huella (columna clave_normalizada: 400). */
    private static final int MAX_LARGO_CLAVE = 380;

    /**
     * Patrón Regex para extraer peso/volumen del texto crudo.
     * Captura grupo 1: valor numérico (ej: "500", "1.5", "1,5")
     * Captura grupo 2: unidad de medida (ej: "g", "gramos", "kg", "ml", "litro")
     * El prefijo "x" o "X" antes del número es opcional.
     */
    private static final Pattern PESO_PATTERN = Pattern.compile(
            "(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(g|gr|grs|gramos?|kg|kgs|kilos?|kilogramos?|ml|cc|lt|litros?)(?:\\b|\\s|$)|" +
            "(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(l)(?=\\s|$|[^a-zA-Z])",
            Pattern.CASE_INSENSITIVE
    );

    /** Packs de unidades: "x 3 un", "X3 unidades". Diferencian al pack del producto individual. */
    private static final Pattern PACK_PATTERN = Pattern.compile(
            "\\bx\\s*(\\d+)\\s*(?:un|u|uni|unid|unidad|unidades)\\b\\.?",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[\\p{L}\\p{N}]+");

    /**
     * Conectores y restos de unidades sin valor para identificar una variante.
     * Se mantienen "con" y "sin" a propósito: "con sal" y "sin sal" son productos distintos.
     */
    private static final Set<String> STOPWORDS = Set.of(
            "de", "del", "la", "el", "las", "los", "y", "e", "en", "por", "para", "al", "a", "x",
            "sabor", "un", "u", "uni", "unid", "unidad", "unidades",
            "g", "gr", "grs", "kg", "kgs", "ml", "cc", "l", "lt", "lts"
    );

    /** Token con su forma original (para mostrar) y su forma normalizada (para comparar). */
    private record Token(String original, String norm) {}

    // ─── Normalización ───────────────────────────────────────────────────────

    @Override
    public ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave) {
        return normalizar(textoCrudo, palabraClave, null, null, null, null);
    }

    @Override
    public ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave, String marcaTienda,
                                             Double pesoHint, String unidadHint,
                                             Collection<String> marcasConocidas) {
        String nombreGenerico = limpiarKeyword(palabraClave);
        String marcaHint = marcaTienda == null || marcaTienda.isBlank() ? null : marcaTienda.trim();

        if (textoCrudo == null || textoCrudo.isBlank()) {
            return new ProductoNormalizadoDto(nombreGenerico,
                    marcaHint == null ? null : capitalizarPalabras(marcaHint),
                    null, pesoHint, pesoHint == null ? null : normalizarUnidad(unidadHint));
        }

        // 1. Pre-limpiar elementos de UI que no son datos del producto
        // Ej: "Disponible", "Agregar", precios con '$', descuentos tipo "-20%" o "20% off"
        String texto = textoCrudo.trim()
                .replaceAll("(?i)\\b(disponible|agregar|no\\s+disponible|agotado|oferta|descuento)\\b", " ")
                .replaceAll("\\$[\\s\\u00A0]*[\\d.,]+", " ")
                .replaceAll("-\\d+%", " ")
                .replaceAll("(?i)\\b\\d+%\\s*(off|dto|desc\\w*)", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();

        // 2. Packs de unidades ("x 3 un") → se tratan como variante
        List<Token> variantePack = new ArrayList<>();
        Matcher pack = PACK_PATTERN.matcher(texto);
        if (pack.find()) {
            variantePack.add(new Token("Pack", "pack"));
            variantePack.add(new Token("x" + pack.group(1), "x" + pack.group(1)));
            texto = (texto.substring(0, pack.start()) + " " + texto.substring(pack.end())).trim();
        }

        // 3. Peso/volumen con regex (con respaldo en el valor pre-parseado por el scraper)
        Double pesoValor = null;
        String pesoUnidad = null;
        Matcher matcher = PESO_PATTERN.matcher(texto);
        if (matcher.find()) {
            // El patrón tiene dos alternativas: grupos 1,2 para unidades no ambiguas y grupos 3,4 para 'l'
            String valorStr = matcher.group(1) != null ? matcher.group(1) : matcher.group(3);
            String unidadStr = matcher.group(2) != null ? matcher.group(2) : matcher.group(4);
            if (valorStr != null) {
                try {
                    pesoValor = parsePesoValor(valorStr);
                } catch (NumberFormatException ignored) { /* valor inválido, ignorar */ }
            }
            if (unidadStr != null) {
                pesoUnidad = normalizarUnidad(unidadStr);
            }
            texto = (texto.substring(0, matcher.start()) + " " + texto.substring(matcher.end())).trim();
        }
        if ((pesoValor == null || pesoUnidad == null) && pesoHint != null && unidadHint != null) {
            pesoValor = pesoHint;
            pesoUnidad = normalizarUnidad(unidadHint);
        }

        // 4. Tokenizar y quitar la palabra clave (singular/plural, también multi-palabra)
        List<Token> tokens = tokenizar(texto);
        quitarSecuencia(tokens, tokenizar(nombreGenerico), true);

        // 5. Marca: informada por la tienda → diccionario → desconocida (null)
        String marca = null;
        if (marcaHint != null) {
            marca = capitalizarPalabras(marcaHint);
            quitarSecuencia(tokens, tokenizar(marcaHint), false);
        } else if (marcasConocidas != null) {
            List<String> ordenadas = marcasConocidas.stream()
                    .filter(m -> m != null && !m.isBlank())
                    .sorted(Comparator
                            .comparingInt((String m) -> tokenizar(m).size()).reversed()
                            .thenComparing(Comparator.comparingInt(String::length).reversed()))
                    .toList();
            for (String candidata : ordenadas) {
                if (quitarSecuencia(tokens, tokenizar(candidata), false)) {
                    marca = capitalizarPalabras(candidata);
                    break;
                }
            }
        }

        // 6. Variante: tokens restantes sin conectores, en el orden original del título (deduplicando tokens contiguos)
        List<Token> varianteTokens = new ArrayList<>();
        Token prevToken = null;
        for (Token t : tokens) {
            if (!STOPWORDS.contains(t.norm())) {
                if (prevToken == null || !prevToken.norm().equals(t.norm())) {
                    varianteTokens.add(t);
                    prevToken = t;
                }
            }
        }
        varianteTokens.addAll(variantePack);
        String variante = varianteTokens.stream().map(Token::original).collect(Collectors.joining(" "));

        return new ProductoNormalizadoDto(
                nombreGenerico,
                marca,
                variante.isBlank() ? null : capitalizarPalabras(variante),
                pesoValor,
                pesoUnidad
        );
    }

    // ─── Huella determinista ─────────────────────────────────────────────────

    @Override
    public String generarClave(String nombreGenerico, String marca, String varianteEspecifica,
                               Double pesoValor, String pesoUnidad) {
        String clave = String.join("|",
                unirNormalizado(nombreGenerico, "_"),
                unirNormalizado(marca, "_"),
                pesoCanonico(pesoValor, pesoUnidad),
                claveVariante(varianteEspecifica));
        return clave.length() > MAX_LARGO_CLAVE ? clave.substring(0, MAX_LARGO_CLAVE) : clave;
    }

    /** Tokens de variante sin conectores, deduplicados y ordenados: independiente del orden del título. */
    private String claveVariante(String variante) {
        if (variante == null || variante.isBlank()) return "";
        Set<String> ordenados = new TreeSet<>();
        for (Token t : tokenizar(variante)) {
            if (!STOPWORDS.contains(t.norm())) ordenados.add(t.norm());
        }
        return String.join("-", ordenados);
    }

    private String unirNormalizado(String valor, String separador) {
        if (valor == null || valor.isBlank()) return "";
        return tokenizar(valor).stream().map(Token::norm).collect(Collectors.joining(separador));
    }

    /**
     * Peso en unidad base (kg→g, l→ml) sin ceros sobrantes, p. ej. "1 kg" y "1000 g" → "1000g".
     * Cadena vacía si no hay peso.
     */
    private String pesoCanonico(Double valor, String unidad) {
        if (valor == null || unidad == null || unidad.isBlank()) return "";
        String u = normalizarUnidad(unidad);
        BigDecimal v = BigDecimal.valueOf(valor);
        if ("kg".equals(u)) {
            v = v.multiply(BigDecimal.valueOf(1000));
            u = "g";
        } else if ("l".equals(u)) {
            v = v.multiply(BigDecimal.valueOf(1000));
            u = "ml";
        }
        return v.stripTrailingZeros().toPlainString() + u;
    }

    // ─── Jaro-Winkler (implementación pura Java) ─────────────────────────────

    @Override
    public double jaroWinklerSimilarity(String s1, String s2) {
        if (s1 == null && s2 == null) return 1.0;
        if (s1 == null || s2 == null) return 0.0;

        String a = normalizarParaComparacion(s1);
        String b = normalizarParaComparacion(s2);

        if (a.equals(b)) return 1.0;
        if (a.isEmpty() || b.isEmpty()) return 0.0;

        double jaroScore = calcularJaro(a, b);

        // Calcular prefijo común (máximo 4 caracteres)
        int prefixLen = 0;
        int maxPrefix = Math.min(4, Math.min(a.length(), b.length()));
        for (int i = 0; i < maxPrefix; i++) {
            if (a.charAt(i) == b.charAt(i)) {
                prefixLen++;
            } else {
                break;
            }
        }

        // Fórmula Jaro-Winkler: jaro + (p * prefixLen * (1 - jaro))
        // p = 0.1 (factor de escala estándar)
        return jaroScore + (0.1 * prefixLen * (1.0 - jaroScore));
    }

    @Override
    public boolean esSimilar(Producto candidato, ProductoNormalizadoDto normalizado, double umbral) {
        // Peso canónico: debe ser idéntico (1 kg == 1000 g; ausencia solo equivale a ausencia)
        String pesoCandidato = pesoCanonico(candidato.getPesoValor(), candidato.getPesoUnidad());
        String pesoNuevo = pesoCanonico(normalizado.getPesoValor(), normalizado.getPesoUnidad());
        if (!pesoCandidato.equals(pesoNuevo)) return false;

        // Variante: mismos tokens sin importar el orden
        if (!claveVariante(candidato.getVarianteEspecifica())
                .equals(claveVariante(normalizado.getVarianteEspecifica()))) {
            return false;
        }

        // Marca: ambas ausentes, o similares (tolera errores tipográficos)
        boolean candidatoSinMarca = candidato.getMarca() == null || candidato.getMarca().isBlank();
        boolean nuevoSinMarca = normalizado.getMarca() == null || normalizado.getMarca().isBlank();
        if (candidatoSinMarca && nuevoSinMarca) return true;
        if (candidatoSinMarca || nuevoSinMarca) return false;
        return jaroWinklerSimilarity(candidato.getMarca(), normalizado.getMarca()) >= umbral;
    }

    @Override
    public boolean esItemCompatible(String textoCrudo, String palabraClave) {
        if (textoCrudo == null || palabraClave == null || textoCrudo.isBlank() || palabraClave.isBlank()) {
            return false;
        }

        // Normalizar a minúsculas y sin acentos
        String textoNorm = normalizarParaComparacion(textoCrudo);
        String palabraNorm = normalizarParaComparacion(palabraClave);

        // Obtener singular básico (ej. "sardinas" -> "sardina")
        String singularClave = palabraNorm.endsWith("s") && palabraNorm.length() > 1
                ? palabraNorm.substring(0, palabraNorm.length() - 1)
                : palabraNorm;

        // Filtro Positivo: ¿Contiene la palabra clave o su singular?
        boolean contieneClave = textoNorm.contains(singularClave) || textoNorm.contains(palabraNorm);

        // Flexibilidad para chocolatadas (aceptar "chocolate" + "leche" / "bebida" / "bda")
        if (palabraNorm.equals("chocolatada") && !contieneClave) {
            contieneClave = textoNorm.contains("chocolate") &&
                    (textoNorm.contains("leche") || textoNorm.contains("bebida") || textoNorm.contains("bda"));
        }

        if (!contieneClave) {
            return false;
        }

        // Filtro Negativo: Exclusiones específicas
        if (singularClave.equals("sardina")) {
            if (textoNorm.contains("atun") || textoNorm.contains("caballa") ||
                textoNorm.contains("anchoa") || textoNorm.contains("anchoita") ||
                textoNorm.contains("jurel") || textoNorm.contains("mejillon")) {
                return false;
            }
        }

        if (singularClave.equals("picadillo")) {
            if (textoNorm.contains("pate") || textoNorm.contains("foie")) {
                return false;
            }
        }

        return true;
    }


    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Tokeniza conservando la forma original (para mostrar) y la normalizada (para comparar). */
    private List<Token> tokenizar(String texto) {
        List<Token> tokens = new ArrayList<>();
        if (texto == null) return tokens;
        Matcher m = TOKEN_PATTERN.matcher(texto);
        while (m.find()) {
            String original = m.group();
            tokens.add(new Token(original, sinAcentos(original.toLowerCase())));
        }
        return tokens;
    }

    /**
     * Elimina de {@code tokens} la primera aparición (o todas, si {@code todas}) de la
     * secuencia {@code patron}. Cuando {@code tolerarPlural} es true, compara por raíz
     * ("picadillo" == "picadillos"). Devuelve true si eliminó algo.
     */
    private boolean quitarSecuencia(List<Token> tokens, List<Token> patron, boolean tolerarPlural) {
        if (patron.isEmpty() || tokens.size() < patron.size()) return false;
        boolean eliminado = false;
        int i = 0;
        while (i <= tokens.size() - patron.size()) {
            boolean coincide = true;
            for (int j = 0; j < patron.size(); j++) {
                String a = tokens.get(i + j).norm();
                String b = patron.get(j).norm();
                if (!(tolerarPlural ? raiz(a).equals(raiz(b)) : a.equals(b))) {
                    coincide = false;
                    break;
                }
            }
            if (coincide) {
                for (int j = 0; j < patron.size(); j++) tokens.remove(i);
                eliminado = true;
                if (!tolerarPlural) return true; // marca: solo una aparición
            } else {
                i++;
            }
        }
        return eliminado;
    }

    /** Raíz simple para tolerar plurales: "picadillos" → "picadillo", "panes" → "pan". */
    private String raiz(String palabra) {
        if (palabra.length() > 4 && palabra.endsWith("es")) return palabra.substring(0, palabra.length() - 2);
        if (palabra.length() > 3 && palabra.endsWith("s")) return palabra.substring(0, palabra.length() - 1);
        return palabra;
    }

    private String sinAcentos(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
    }

    /**
     * Calcula la distancia de Jaro entre dos strings normalizados.
     */
    private double calcularJaro(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();
        int matchDistance = Math.max(len1, len2) / 2 - 1;
        if (matchDistance < 0) matchDistance = 0;

        boolean[] s1Matches = new boolean[len1];
        boolean[] s2Matches = new boolean[len2];

        int matches = 0;
        int transpositions = 0;

        for (int i = 0; i < len1; i++) {
            int start = Math.max(0, i - matchDistance);
            int end = Math.min(i + matchDistance + 1, len2);
            for (int j = start; j < end; j++) {
                if (s2Matches[j] || s1.charAt(i) != s2.charAt(j)) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches == 0) return 0.0;

        int k = 0;
        for (int i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1.charAt(i) != s2.charAt(k)) transpositions++;
            k++;
        }

        return (((double) matches / len1) +
                ((double) matches / len2) +
                ((double) (matches - transpositions / 2) / matches)) / 3.0;
    }

    /**
     * Normaliza un string para comparación: minúsculas, sin acentos, sin caracteres especiales.
     */
    private String normalizarParaComparacion(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input.toLowerCase().trim(), Normalizer.Form.NFD);
        return normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                         .replaceAll("[^a-z0-9]", "");
    }

    /**
     * Normaliza la unidad de medida a un formato estándar.
     */
    private String normalizarUnidad(String unidadRaw) {
        if (unidadRaw == null) return null;
        String u = unidadRaw.toLowerCase().trim();
        if (u.matches("g|gr|grs|gramos?")) return "g";
        if (u.matches("kg|kgs|kilos?|kilogramos?")) return "kg";
        if (u.matches("ml|cc")) return "ml";
        if (u.matches("l|lt|lts|litros?")) return "l";
        return u;
    }

    private Double parsePesoValor(String raw) {
        if (raw == null) {
            return null;
        }

        String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }

        if (value.contains(",") && value.contains(".")) {
            if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
                value = value.replace(".", "").replace(',', '.');
            } else {
                value = value.replace(",", "");
            }
        } else if (value.contains(",")) {
            if (value.matches("\\d{1,3}(?:,\\d{3})+")) {
                value = value.replace(",", "");
            } else {
                value = value.replace(',', '.');
            }
        } else if (value.contains(".")) {
            if (value.matches("\\d{1,3}(?:\\.\\d{3})+")) {
                value = value.replace(".", "");
            }
        }

        return Double.parseDouble(value);
    }

    /**
     * Limpia la palabra clave buscada para usarla como nombre genérico normalizado.
     */
    private String limpiarKeyword(String keyword) {
        if (keyword == null) return "";
        // Capitalizar primera letra, el resto en minúsculas
        String k = keyword.trim().toLowerCase();
        if (k.isEmpty()) return k;
        return Character.toUpperCase(k.charAt(0)) + k.substring(1);
    }

    /**
     * Capitaliza la primera letra de cada palabra.
     */
    private String capitalizarPalabras(String input) {
        if (input == null || input.isBlank()) return input;
        String[] words = input.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
