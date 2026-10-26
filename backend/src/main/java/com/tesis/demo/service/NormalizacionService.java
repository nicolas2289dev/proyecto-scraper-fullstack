package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.Producto;

import java.util.Collection;

/**
 * Servicio centralizado de normalización inteligente.
 * Responsable de:
 * 1. Parsear el texto crudo de tienda para extraer campos atómicos (marca, variante, peso).
 * 2. Generar una huella determinista ({@link #generarClave}) para unificar productos entre tiendas.
 * 3. Comparar candidatos existentes de forma tolerante a errores tipográficos en la marca (Jaro-Winkler).
 */
public interface NormalizacionService {

    /**
     * Parsea el texto crudo de una tarjeta de producto de supermercado
     * y extrae los campos atómicos normalizados, sin pistas adicionales.
     *
     * @param textoCrudo       Texto tal como aparece en la web (ej: "Fideos Spaghetti Lucchetti x 500 gramos")
     * @param palabraClave     Término genérico de búsqueda (ej: "fideo") usado como ancla del nombreGenerico
     * @return ProductoNormalizadoDto con los campos extraídos
     */
    ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave);

    /**
     * Variante enriquecida de {@link #normalizar(String, String)}.
     *
     * <p>La marca se determina en este orden: (1) la informada por la tienda, (2) la más larga del
     * diccionario de marcas conocidas que aparezca en el título. Si ninguna aplica, queda null
     * (nunca se infiere por el orden de las palabras).</p>
     *
     * @param textoCrudo      Texto del título en la tienda
     * @param palabraClave    Término de búsqueda (nombre genérico)
     * @param marcaTienda     Marca informada por la tienda (puede ser null)
     * @param pesoHint        Peso pre-parseado por el scraper, usado solo si el título no lo contiene (puede ser null)
     * @param unidadHint      Unidad del peso pre-parseado (puede ser null)
     * @param marcasConocidas Diccionario de marcas conocidas (puede ser null o vacío)
     */
    ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave, String marcaTienda,
                                      Double pesoHint, String unidadHint, Collection<String> marcasConocidas);

    /**
     * Genera la huella determinista de un producto: nombre genérico, marca, peso canónico
     * (kg→g, l→ml) y tokens de variante ordenados, todo sin acentos ni mayúsculas.
     * Dos productos con la misma huella se consideran el mismo producto físico.
     */
    String generarClave(String nombreGenerico, String marca, String varianteEspecifica,
                        Double pesoValor, String pesoUnidad);

    /**
     * Calcula la similitud Jaro-Winkler entre dos strings.
     * Retorna un valor entre 0.0 (sin similitud) y 1.0 (idénticos).
     *
     * @param s1 Primer string
     * @param s2 Segundo string
     * @return Similitud normalizada [0.0 - 1.0]
     */
    double jaroWinklerSimilarity(String s1, String s2);

    /**
     * Determina si un producto candidato de la BD es el mismo que el producto normalizado recibido.
     * Reglas (todas deben cumplirse): peso canónico idéntico (incluyendo ausencia en ambos),
     * misma variante (tokens equivalentes sin importar el orden) y marca con similitud
     * Jaro-Winkler ≥ umbral (ambas ausentes también cuenta como igual).
     *
     * @param candidato  Producto existente en la BD
     * @param normalizado Producto normalizado recién extraído por el scraper
     * @param umbral     Umbral mínimo de similitud para la marca (recomendado: 0.92)
     * @return true si se considera el mismo producto
     */
    boolean esSimilar(Producto candidato, ProductoNormalizadoDto normalizado, double umbral);

    /**
     * Valida si el texto crudo del título del producto devuelto por el supermercado
     * es compatible con la palabra clave buscada (evitando falsos positivos).
     *
     * @param textoCrudo   Nombre del producto en la tienda (ej: "Caballa Puglisi en Aceite 380gr")
     * @param palabraClave Término buscado (ej: "sardinas")
     * @return true si es compatible, false de lo contrario
     */
    boolean esItemCompatible(String textoCrudo, String palabraClave);
}
