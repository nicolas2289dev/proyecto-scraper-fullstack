package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.Producto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Golden set con títulos reales de Comodín, Día y Vea: el mismo producto físico debe producir
 * la misma huella sin importar el orden de las palabras del título.
 */
class NormalizacionServiceTest {

    private final NormalizacionServiceImpl service = new NormalizacionServiceImpl();

    private String clave(ProductoNormalizadoDto n) {
        return service.generarClave(n.getNombreGenerico(), n.getMarca(), n.getVarianteEspecifica(),
                n.getPesoValor(), n.getPesoUnidad());
    }

    private ProductoNormalizadoDto conHint(String titulo, String marcaTienda) {
        return service.normalizar(titulo, "picadillo", marcaTienda, null, null, null);
    }

    @Test
    void vea_conMarcaInformada_noConfundeMarcaConVariante() {
        // Caso reportado: antes quedaba marca="Carne", variante="Swift"
        ProductoNormalizadoDto n = conHint("Picadillo De Carne Swift 90 Gr", "SWIFT");

        assertEquals("Swift", n.getMarca());
        assertEquals("Carne", n.getVarianteEspecifica());
        assertEquals(90.0, n.getPesoValor());
        assertEquals("g", n.getPesoUnidad());
    }

    @Test
    void vea_sinMarcaInformada_usaDiccionarioDeMarcas() {
        ProductoNormalizadoDto n = service.normalizar("Picadillo De Carne Swift 90 Gr", "picadillo",
                null, null, null, List.of("Swift", "La Blanca"));

        assertEquals("Swift", n.getMarca());
        assertEquals("Carne", n.getVarianteEspecifica());
    }

    @Test
    void sinMarcaConocida_noInventaMarcaPorElOrden() {
        ProductoNormalizadoDto n = service.normalizar("Picadillo De Carne Swift 90 Gr", "picadillo");

        assertNull(n.getMarca());
        assertNotNull(n.getVarianteEspecifica());
    }

    @Test
    void mismoProductoEnTresTiendas_generaLaMismaHuella() {
        ProductoNormalizadoDto comodin = conHint("Picadillo Swift De Carne x 90 Gr", "Swift");
        ProductoNormalizadoDto dia = conHint("Picadillo Swift de Carne 90 Gr.", "SWIFT");
        ProductoNormalizadoDto vea = conHint("Picadillo De Carne Swift 90 Gr", "SWIFT");

        assertEquals(clave(comodin), clave(dia));
        assertEquals(clave(comodin), clave(vea));
    }

    @Test
    void marcaCompuesta_laBlanca_seUnificaConDistintoOrden() {
        ProductoNormalizadoDto comodin = conHint("Picadillo La Blanca de Carne x 90 Gr", "La Blanca");
        ProductoNormalizadoDto vea = conHint("Picadillo de Carne 90 Grs La Blanca", "LA BLANCA");

        assertEquals("La Blanca", vea.getMarca());
        assertEquals(clave(comodin), clave(vea));
    }

    @Test
    void variantesDistintas_generanHuellasDistintas() {
        ProductoNormalizadoDto normal = conHint("Picadillo De Carne Swift 90 Gr", "SWIFT");
        ProductoNormalizadoDto picante = conHint("Picadillo Sabor Picante 90 Grs Swift", "SWIFT");
        ProductoNormalizadoDto ahumado = conHint("Picadillo Swift De Carne Ahumado X 90 Gr.", "SWIFT");

        assertNotEquals(clave(normal), clave(picante));
        assertNotEquals(clave(normal), clave(ahumado));
    }

    @Test
    void pesosDistintos_generanHuellasDistintas() {
        ProductoNormalizadoDto g90 = conHint("Picadillo De Carne Swift 90 Gr", "SWIFT");
        ProductoNormalizadoDto g85 = conHint("Picadillo De Carne Swift 85 Gr", "SWIFT");

        assertNotEquals(clave(g90), clave(g85));
    }

    @Test
    void packDeUnidades_seDistingueDelProductoIndividual() {
        ProductoNormalizadoDto pack = conHint("Picadillo Swift X 3 Un", "SWIFT");
        ProductoNormalizadoDto individual = conHint("Picadillo Swift 90 Gr", "SWIFT");

        assertTrue(pack.getVarianteEspecifica().toLowerCase().contains("pack"));
        assertNull(pack.getPesoValor());
        assertNotEquals(clave(pack), clave(individual));
    }

    @Test
    void pesoCanonico_unKiloEsIgualAMilGramos() {
        String kilo = service.generarClave("Arroz", "Gallo", null, 1.0, "kg");
        String gramos = service.generarClave("Arroz", "Gallo", null, 1000.0, "g");

        assertEquals(kilo, gramos);
        assertEquals(service.generarClave("Aceite", "Natura", null, 1.5, "l"),
                service.generarClave("Aceite", "Natura", null, 1500.0, "ml"));
    }

    @Test
    void pesoDesdeHint_soloSiElTituloNoLoTrae() {
        ProductoNormalizadoDto sinPesoEnTitulo = service.normalizar("Picadillo Swift", "picadillo",
                "Swift", 90.0, "gr", null);
        ProductoNormalizadoDto conPesoEnTitulo = service.normalizar("Picadillo Swift 85 Gr", "picadillo",
                "Swift", 90.0, "gr", null);

        assertEquals(90.0, sinPesoEnTitulo.getPesoValor());
        assertEquals("g", sinPesoEnTitulo.getPesoUnidad());
        assertEquals(85.0, conPesoEnTitulo.getPesoValor());
    }

    @Test
    void esSimilar_toleraErrorTipograficoEnMarca_peroNoEnPesoNiVariante() {
        Producto candidato = new Producto();
        candidato.setNombreGenerico("Fideo");
        candidato.setMarca("Lucchetti");
        candidato.setVarianteEspecifica("Spaghetti");
        candidato.setPesoValor(500.0);
        candidato.setPesoUnidad("g");

        ProductoNormalizadoDto conTypo = new ProductoNormalizadoDto("Fideo", "Luchetti", "Spaghetti", 500.0, "g");
        ProductoNormalizadoDto otroPeso = new ProductoNormalizadoDto("Fideo", "Lucchetti", "Spaghetti", 1.0, "kg");
        ProductoNormalizadoDto otraVariante = new ProductoNormalizadoDto("Fideo", "Lucchetti", "Mostachol", 500.0, "g");
        ProductoNormalizadoDto sinPeso = new ProductoNormalizadoDto("Fideo", "Lucchetti", "Spaghetti", null, null);

        assertTrue(service.esSimilar(candidato, conTypo, 0.92));
        assertFalse(service.esSimilar(candidato, otroPeso, 0.92));
        assertFalse(service.esSimilar(candidato, otraVariante, 0.92));
        assertFalse(service.esSimilar(candidato, sinPeso, 0.92));
    }

    @Test
    void esSimilar_ordenDeVarianteNoImporta() {
        Producto candidato = new Producto();
        candidato.setMarca("Swift");
        candidato.setVarianteEspecifica("Carne Ahumado");
        candidato.setPesoValor(90.0);
        candidato.setPesoUnidad("g");

        ProductoNormalizadoDto invertido = new ProductoNormalizadoDto("Picadillo", "Swift", "Ahumado Carne", 90.0, "g");

        assertTrue(service.esSimilar(candidato, invertido, 0.92));
    }

    @Test
    void esItemCompatible_picadilloExcluyePate() {
        assertTrue(service.esItemCompatible("Picadillo Swift de Carne 90 Gr", "picadillo"));
        assertFalse(service.esItemCompatible("Paté de Picadillo", "picadillo"));
    }

    @Test
    void deduplicacionDeTokensContiguosEnVariante() {
        ProductoNormalizadoDto n = service.normalizar("Picadillo Swift Swift de Carne 90 Gr", "picadillo");
        // "Swift Swift" debe deduplicarse a "Swift"
        assertEquals("Swift Carne", n.getVarianteEspecifica());

        ProductoNormalizadoDto n2 = service.normalizar("Picadillo La Blanca La Blanca de Carne 90 Gr", "picadillo");
        // "La Blanca La Blanca" con stopwords "La" debe deduplicarse a "Blanca Carne"
        assertEquals("Blanca Carne", n2.getVarianteEspecifica());
    }
}
