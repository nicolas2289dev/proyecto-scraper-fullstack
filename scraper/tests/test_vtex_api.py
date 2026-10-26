"""Tests del parser de la API de catálogo VTEX (sin red)."""
import unittest

from src.utils.vtex_api import build_vtex_search_url, parse_vtex_products


def _producto_vtex(nombre="Picadillo De Carne Swift 90 Gr", marca="SWIFT", ean="7790360720115",
                   precio=1199.99, stock=25, link="https://www.vea.com.ar/picadillo-de-carne-swift-90-gr/p"):
    return {
        "productName": nombre,
        "brand": marca,
        "link": link,
        "linkText": "picadillo-de-carne-swift-90-gr",
        "items": [{
            "ean": ean,
            "images": [{"imageUrl": "https://vea.vtexassets.com/arquivos/ids/1/img.jpg"}],
            "sellers": [{"commertialOffer": {"Price": precio, "ListPrice": precio + 100, "AvailableQuantity": stock}}],
        }],
    }


class VtexApiTest(unittest.TestCase):

    def test_build_url_codifica_la_palabra_clave(self):
        url = build_vtex_search_url("https://www.vea.com.ar/", "dulce de leche")
        self.assertEqual(
            "https://www.vea.com.ar/api/catalog_system/pub/products/search?ft=dulce%20de%20leche&_from=0&_to=49",
            url,
        )

    def test_parsea_marca_ean_precio_e_imagen(self):
        res = parse_vtex_products([_producto_vtex()], "https://www.vea.com.ar")

        self.assertEqual(1, len(res))
        p = res[0]
        self.assertEqual("Picadillo De Carne Swift 90 Gr", p["titulo"])
        self.assertEqual("SWIFT", p["marca"])
        self.assertEqual("7790360720115", p["ean"])
        self.assertEqual(1199.99, p["precio"])
        self.assertTrue(p["disponible"])
        self.assertTrue(p["url_imagen"].endswith("img.jpg"))

    def test_mismo_ean_en_distintas_tiendas(self):
        comodin = parse_vtex_products(
            [_producto_vtex("Picadillo Swift De Carne x 90 Gr", "Swift", link="https://www.comodinencasa.com.ar/p1/p")],
            "https://www.comodinencasa.com.ar")[0]
        vea = parse_vtex_products([_producto_vtex()], "https://www.vea.com.ar")[0]

        self.assertEqual(comodin["ean"], vea["ean"])

    def test_filtra_sin_stock_por_defecto(self):
        res = parse_vtex_products([_producto_vtex(stock=0)], "https://www.vea.com.ar")
        self.assertEqual([], res)

    def test_sin_stock_marca_no_disponible_si_no_se_filtra(self):
        res = parse_vtex_products([_producto_vtex(stock=0)], "https://www.vea.com.ar", only_available=False)

        self.assertEqual(1, len(res))
        self.assertFalse(res[0]["disponible"])
        self.assertEqual(1199.99, res[0]["precio"])

    def test_precio_cero_es_none(self):
        res = parse_vtex_products([_producto_vtex(precio=0, stock=0)], "https://www.vea.com.ar", only_available=False)

        self.assertEqual(1, len(res))
        self.assertIsNone(res[0]["precio"])
        self.assertFalse(res[0]["disponible"])

    def test_url_relativa_se_arma_con_link_text(self):
        prod = _producto_vtex(link="")
        res = parse_vtex_products([prod], "https://www.vea.com.ar/")

        self.assertEqual("https://www.vea.com.ar/picadillo-de-carne-swift-90-gr/p", res[0]["url"])

    def test_descarta_productos_sin_titulo_o_sin_url(self):
        sin_titulo = _producto_vtex(nombre="")
        sin_url = {"productName": "X", "items": []}

        self.assertEqual([], parse_vtex_products([sin_titulo, sin_url, "basura", None], "https://x.com"))

    def test_respuesta_invalida_devuelve_lista_vacia(self):
        self.assertEqual([], parse_vtex_products({"error": "x"}, "https://x.com"))
        self.assertEqual([], parse_vtex_products(None, "https://x.com"))

    def test_producto_sin_ean_ni_marca(self):
        prod = _producto_vtex(marca=None, ean="")
        res = parse_vtex_products([prod], "https://www.vea.com.ar")[0]

        self.assertIsNone(res["ean"])
        self.assertIsNone(res["marca"])


if __name__ == "__main__":
    unittest.main()
