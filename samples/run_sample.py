from suml import suml2pic

from specgen import merge_rdf, voc_to_spec, read_mcf, pretty_print, render_template, get_charstring, get_supported_schemas, transform_to_picture

from specgen.extractvoc import convert
from specgen.extractap import convert_csv
from specgen.extractcontributors import convert_contributor_csv
from specgen.extractap_from_rdf import convertap_from_rdf
from specgen.extractdiagram import convert_to_diagram
import tempfile
import os
import codecs
import unittest
import csv
import logging
import sys
import lxml.etree as ET

THISDIR = os.path.dirname(os.path.realpath(__file__))


def msg(test_id, test_description):
    """convenience function to print out test id and desc"""
    return '%s: %s' % (test_id, test_description)


class SpecGenTest(unittest.TestCase):
    """Test suite for package specgen"""

    def setUp(self):
        """setup test fixtures, etc."""

        print(msg(self.id(), self.shortDescription()))

    def tearDown(self):
        """return to pristine state"""

        pass

    def test_csv_to_diagram(self):
        """Test CSV2AP_DIAGRAM"""

        test_files = [
            './Organisatie Basis AP.tsv',
            './Dienstencataloog AP.tsv'
        ]

        for t in test_files:
            # CSV -{1}> XML
            csv = get_abspath(t)
            converted = convert_to_diagram(csv)
            print(converted)
            # converted = "[note: You can stick notes on diagrams too!{bg:cornsilk}],[Customer]<>1-orders 0..*>[Order], [Order]++*->[LineItem], [Order]-1>[DeliveryMethod], [Order]-*>[Product], [Category]<->[Product], [DeliveryMethod]^[National], [DeliveryMethod]^[International]"
            _, xp = tempfile.mkstemp()
            with open(xp, 'wb') as fout:
                 transform_to_picture(converted, fout, {'png': True})
            print(os.path.realpath(xp))


    def test_ap_from_rdf(self):
        """Test RDF2AP_CSV"""

        test_files = [
            './adres.ttl'
        ]

        for t in test_files:
            rdf = get_abspath(t)
            _, xp = tempfile.mkstemp()
            csv_output = convertap_from_rdf(rdf, xp)
            print(csv_output)
            with open(xp, 'w') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=csv_output.pop(0))
                writer.writeheader()
                for row in csv_output:
                    writer.writerow(row)
            print(os.path.realpath(xp))

    def test_rdf_lossless(self):
        """Test RDF2VOC_HTML"""

        test_files = [
            './locn.ttl',
            './export.ttl'
        ]

        for t in test_files:
            # RDF -{1}> XML
            rdf = get_abspath(t)
            result = convert(rdf)
            _, fp = tempfile.mkstemp()

            with codecs.open(fp, 'w', encoding='utf-8') as f:
                f.write(u'%s' % result)
            f.close()

            # {1}
            xml = render_template(fp, schema='vocabulary')

            _, xp = tempfile.mkstemp()
            f = open(xp, 'wb')
            xml.write(f)
            f.close()
            print(os.path.realpath(xp))

    def test_rdf_lossless_nl(self):
        """Test RDF2VOC_HTML_NL"""

        test_files = [
            './generiek.ttl',
            './persoon.ttl',
            './adres.ttl',

        ]

        for t in test_files:
            # RDF -{1}> XML
            rdf = get_abspath(t)
            result = convert(rdf)
            _, fp = tempfile.mkstemp()

            with codecs.open(fp, 'w', encoding='utf-8') as f:
                f.write(u'%s' % result)
            f.close()

            # {1}
            xml = render_template(fp, schema='vocabularynl')

            _, xp = tempfile.mkstemp()
            f = open(xp, 'wb')
            xml.write(f)
            f.close()
            print(os.path.realpath(xp))

    def test_csv_lossless(self):
        """Test CSV2AP_HTML"""

        test_files = [
            './Organisatie Basis AP.tsv',
            './Dienstencataloog AP.tsv'
        ]

        contributor_file = './stakeholders.tsv'

        for t in test_files:
            # CSV -{1}> XML
            csv = get_abspath(t)
            converted = convert_csv(csv)
            voc = converted[1]
            result = converted[0]
            result += convert_contributor_csv(contributor_file, voc)
            _, fp = tempfile.mkstemp()

            with codecs.open(fp, 'w', encoding='utf-8') as f:
                f.write(u'%s' % result)
            f.close()

            # {1}
            xml = render_template(fp, schema='ap')

            _, xp = tempfile.mkstemp()
            f = open(xp, 'wb')
            xml.write(f)
            f.close()
            print(os.path.realpath(xp))

    def test_contributor_csv_lossless(self):
        """Test CONTRIBUTORCSV2RDF"""

        test_files = [
            './stakeholders.tsv'
        ]

        for t in test_files:
            # CSV -{1}> XML
            csv = get_abspath(t)
            result = convert_contributor_csv(csv, 'Adres')
            _, fp = tempfile.mkstemp()

            with codecs.open(fp, 'w', encoding='utf-8') as f:
                f.write(u'%s' % result)
            f.close()

            # {1}
            xml = render_template(fp, schema='contributors')

            _, xp = tempfile.mkstemp()
            f = open(xp, 'wb')
            xml.write(f)
            f.close()
            print(os.path.realpath(xp))

            rdf = get_abspath('./persoon.ttl')
            merged_rdf = merge_rdf(rdf, xp)
            _, rp = tempfile.mkstemp()
            f = open(rp, 'wb')
            f.write(merged_rdf)
            f.close()
            print(os.path.realpath(rp))


def get_abspath(filepath):
    """helper function absolute file access"""

    return os.path.join(THISDIR, filepath)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr)
    logging.getLogger("SomeTest.testSomething").setLevel(logging.DEBUG)
    unittest.main()
