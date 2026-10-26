"""Tests de los normalizadores del scraper (peso y limpieza de títulos)."""
import unittest

from src.utils.normalizers import clean_title, parse_weight


class ParseWeightTest(unittest.TestCase):

    def test_titulos_reales_de_las_tres_tiendas(self):
        casos = {
            "Picadillo Swift De Carne x 90 Gr": (90.0, "g"),
            "Picadillo Swift de Carne 90 Gr.": (90.0, "g"),
            "Picadillo De Carne Swift 90 Gr": (90.0, "g"),
            "Picadillo de Carne 90 Grs La Blanca": (90.0, "g"),
            "Picadillo Marolio X 90 Gr.": (90.0, "g"),
        }
        for titulo, (valor, unidad) in casos.items():
            with self.subTest(titulo=titulo):
                r = parse_weight(titulo)
                self.assertEqual(valor, r["peso_valor"])
                self.assertEqual(unidad, r["peso_unidad"])

    def test_sin_peso(self):
        self.assertEqual({"peso_valor": None, "peso_unidad": None}, parse_weight("Picadillo Swift X 3 Un"))

    def test_unidades_y_decimales(self):
        self.assertEqual({"peso_valor": 1.5, "peso_unidad": "l"}, parse_weight("Aceite 1,5 l"))
        self.assertEqual({"peso_valor": 1.0, "peso_unidad": "kg"}, parse_weight("Arroz Gallo 1kg"))


class CleanTitleTest(unittest.TestCase):

    def test_quita_ruido_de_interfaz(self):
        sucio = "Picadillo Swift 90 gr\nDisponible\n$ 1.280,00\nAgregar"
        self.assertEqual("Picadillo Swift 90 gr", clean_title(sucio))

    def test_quita_descuentos(self):
        self.assertEqual("Picadillo Swift 90 gr", clean_title("-20% Picadillo Swift 90 gr 20% off"))

    def test_conserva_porcentajes_del_producto(self):
        self.assertEqual("Leche 0% lactosa", clean_title("Leche 0% lactosa"))

    def test_vacio_o_none(self):
        self.assertEqual("", clean_title(None))
        self.assertEqual("", clean_title("   "))

    def test_deduplica_palabras_contiguas(self):
        self.assertEqual("Picadillo Swift de Carne 90 gr", clean_title("Picadillo Swift Swift de Carne 90 gr"))
        self.assertEqual("Picadillo Blanca Carne 90 gr", clean_title("Picadillo Blanca Blanca Carne 90 gr"))


if __name__ == "__main__":
    unittest.main()
