import codecs
import logging
import os
import re
import sys
import tempfile
from datetime import datetime
from io import BytesIO
from xml.dom import minidom

import rdflib
from rdflib import Literal, BNode, URIRef
from rdflib.namespace import FOAF, DCTERMS, RDF
from jinja2 import Environment, FileSystemLoader
from jinja2.exceptions import TemplateNotFound
from six.moves.configparser import ConfigParser

from extractap import convert_csv
from extractobjectcatalog import convert_oj
from extractap_from_rdf import convertap_from_rdf
from extractcontributors import convert_contributor_csv
from extractvoc import convert

__version__ = '0.1.1'

LOGGER = logging.getLogger(__name__)

TEMPLATES = os.path.abspath(os.path.join(os.path.dirname(__file__), '../templates'))


def get_charstring(option, section_items, language,
                   language_alternate=None):
    """convenience function to return unilingual or multilingual value(s)"""

    section_items = dict(section_items)
    option_value1 = ""
    option_value2 = ""

    if language_alternate is None or not language_alternate:  # unilingual
        option_tmp = '{}_{}'.format(option, language)
        if option_tmp in section_items:
            option_value1 = section_items[option_tmp]
        else:
            try:
                option_value1 = section_items[option]
            except KeyError:
                pass  # default=None

        i = 0
        while i < len(re.findall(',', option_value1)):
            i += 1
            option_value2 += ','

    else:  # multilingual
        option_tmp = '{}_{}'.format(option, language)
        if option_tmp in section_items:
            option_value1 = section_items[option_tmp]
        else:
            try:
                option_value1 = section_items[option]
            except KeyError:
                pass  # default=None
        option_tmp2 = '{}_{}'.format(option, language_alternate)
        if option_tmp2 in section_items:
            option_value2 = section_items[option_tmp2]

    return [option_value1, option_value2]


def get_distribution_language(section):
    """derive language of a given distribution construct"""

    try:
        return section.split(':')[1].split('_')[1]
    except IndexError:
        return 'en'


def normalize_datestring(datestring, fmt='default'):
    """groks date string into ISO8601"""

    re1 = r'\$Date: (?P<year>\d{4})'
    re2 = r'\$Date: (?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2})'
    re3 = r'(?P<start>.*)\$Date: (?P<year>\d{4}).*\$(?P<end>.*)'

    if datestring.startswith('$Date'):  # svn Date keyword
        if fmt == 'year':
            mo = re.match(re1, datestring)
            return mo.group('year')
        else:  # default
            mo = re.match(re2, datestring)
            return '%sT%s' % mo.group('date', 'time')
    elif datestring.find('$Date') != -1:  # svn Date keyword embedded
        if fmt == 'year':
            mo = re.match(re3, datestring)
            return '%s%s%s' % mo.group('start', 'year', 'end')
    return datestring


def read_mcf(mcf):
    """
    Returns a dict representation of the passed configuration file.
    The dict is structured as follows (section-name -> (attribute-name -> value)).
    Note that all attribute-names are converted to lower case as part of this processing.
    """

    if mcf is None:
        return None

    mcf_list = []

    def makelist(mcf2):
        """recursive function for MCF by reference inclusion"""
        c = ConfigParser()
        LOGGER.debug('reading {}'.format(mcf2))
        with codecs.open(mcf2, encoding='utf-8') as fh:
            if sys.version_info >= (3, 0):
                c.read_file(fh)
            else:
                c.readfp(fh)
            mcf_dict = c.__dict__['_sections']
            for section in mcf_dict.keys():
                if 'base_mcf' in mcf_dict[section]:
                    base_mcf_path = get_abspath(mcf,
                                                mcf_dict[section]['base_mcf'])
                    makelist(base_mcf_path)
                    mcf_list.append(mcf2)
                else:  # leaf
                    mcf_list.append(mcf2)

    makelist(mcf)

    c = ConfigParser()

    for mcf_file in mcf_list:
        LOGGER.debug('reading {}'.format(mcf))
        with codecs.open(mcf_file, encoding='utf-8') as fh:
            if sys.version_info >= (3, 0):
                c.read_file(fh)
            else:
                c.readfp(fh)
    mcf_dict = c.__dict__['_sections']
    return mcf_dict


def pretty_print(xml):
    """clean up indentation and spacing"""

    LOGGER.debug('pretty-printing XML')
    val = minidom.parseString(xml)
    return '\n'.join([l for l in
                      val.toprettyxml(indent=' ' * 2).split('\n') if
                      l.strip()])


def render_template(mcf, schema, schema_folder=None, **kwargs):
    """convenience function to render Jinja2 template"""

    LOGGER.debug('Evaluating schema path')
    if schema is None:
        msg = 'schema required'
        LOGGER.exception(msg)
        raise RuntimeError(msg)

    template_folders = [TEMPLATES]
    if schema_folder:
        # Ensure the user passed folder has higher priority than the built-in templates
        template_folders = [schema_folder] + template_folders

    def debug(text):
        print(text)

    env = Environment(loader=FileSystemLoader(template_folders), autoescape=True)
    env.filters['normalize_datestring'] = normalize_datestring
    env.filters['get_distribution_language'] = get_distribution_language
    env.filters['get_charstring'] = get_charstring
    env.filters['debug'] = debug
    env.globals.update(zip=zip)
    env.globals.update(get_charstring=get_charstring)
    env.globals.update(normalize_datestring=normalize_datestring)

    try:
        LOGGER.debug('Loading template')
        template = env.get_template(schema)
    except TemplateNotFound:
        msg = 'Missing metadata template'
        LOGGER.exception(msg)
        raise RuntimeError(msg)

    LOGGER.debug('Processing template')
    xml = template.render(record=read_mcf(mcf),
                          software_version=__version__,
                          **kwargs).encode('utf-8')

    return xml


def voc_to_spec(rdf, schema, schema_folder=None):
    """
    Converts a RDF file into a rendered template using the specified schema

    :param rdf: an RDF file
    :param schema: one of the built-in templates
    :param schema_folder: directory containing non built-in templates
    :return: string of the rendered template
    """
    contributors, result = convert(rdf)
    _, fp = tempfile.mkstemp()

    with codecs.open(fp, 'w', encoding='utf-8') as f:
        f.write(u'%s' % result)
    f.close()

    return render_template(fp, schema, schema_folder, contributors=contributors)


def voc_to_spec_from_rdf(rdf, title):
    return convertap_from_rdf(rdf, title)


def csv_catalog_to_ap(csv, schema, title, name, csv_contributor=None, csv_column=None, schema_folder=None):
    """
    Renders the CSV catalog using the specified template. In case csv_contributor and csv_column is set,
    contributor info is added to the template.

    :param csv: utf-8 encoded csv file of a entity/property/ontology catalog
    :param title: the title of the AP, to be used in the rendered template
    :param csv_contributor: utf-8 encoded file of contributors
    :param csv_column: column name containing the role of each contributor
    :param schema: built in template name
    :param schema_folder: directory containing non-built-in template
    :return: string rendering of the template
    """
    entities_dict = convert_csv(csv)

    if csv_contributor is not None and csv_column is not None:
        contributors = convert_contributor_csv(csv_contributor, csv_column)
    else:
        contributors = {}

    return render_template(None, schema, schema_folder, title=title, name=name,
                           entities=entities_dict, contributors=contributors, now=datetime.utcnow())

def csv_catalog_to_objectcatalog(csv, schema, title, csv_contributor=None, csv_column=None, schema_folder=None):
    """
    Renders the codelist catalog using the specified template. In case csv_contributor and csv_column is set,
    contributor info is added to the template.

    :param csv: utf-8 encoded csv file of a entity/property/ontology catalog
    :param title: the title of the AP, to be used in the rendered template
    :param csv_contributor: utf-8 encoded file of contributors
    :param csv_column: column name containing the role of each contributor
    :param schema: built in template name
    :param schema_folder: directory containing non-built-in template
    :return: string rendering of the template
    """
    entities_dict = convert_oj(csv)

    if csv_contributor is not None and csv_column is not None:
        contributors = convert_contributor_csv(csv_contributor, csv_column)
    else:
        contributors = {}

    return render_template(None, schema, schema_folder, title=title,
                           entities=entities_dict, contributors=contributors, now=datetime.utcnow())


def add_contributors_to_rdf(csv, column, voc):
    """
    Add contributor statements to the ontology included in voc (which is a file containing rdf somewhere on disk)

    :param csv: path to utf-8 encoded file of contributors
    :param column: header of the contributor role in the csv
    :param voc: path to utf-8 encoded file with the ontology to add contributors to
    :return: the resulting ontology in turtle format as a string
    """
    g = rdflib.Graph()
    if voc.endswith('.ttl'):
        g.parse(os.path.realpath(voc), format='turtle')
    else:
        g.parse(os.path.realpath(voc))
    contributors = convert_contributor_csv(csv, column)

    qres = g.query(
        """
        select ?s where {
            ?s a owl:Ontology.
        }
        """
    )
    if len(qres) != 1:
        raise ValueError('RDF input should contain exactly 1 owl:Ontology')
    for row in qres:
        ontology = row['s']

    license = URIRef('https://overheid.vlaanderen.be/sites/default/files/documenten/ict-egov/licenties/hergebruik/modellicentie_gratis_hergebruik_v1_0.html')
    mediator = BNode()
    g.add((ontology, DCTERMS.license, license))
    g.add((ontology, DCTERMS.mediator, mediator))
    g.add((mediator, FOAF.name, Literal('Data Vlaanderen')))
    g.add((mediator, FOAF.mbox, URIRef('mailto:oslo@kb.vlaanderen.be')))
    g.add((mediator, FOAF.homepage, URIRef('https://data.vlaanderen.be')))

    for contributor in contributors:
        cnode = BNode()
        affiliation = BNode()
        affiliationPredicate = URIRef('http://schema.org/affiliation')
        if contributor['role'] == 'C':
            contributor_type = DCTERMS.contributor
        elif contributor['role'] == 'E':
            contributor_type = URIRef('http://www.w3.org/2001/02pd/rec54#editor')
        elif contributor['role'] == 'A':
            contributor_type = FOAF.maker
        else:
            continue
        g.add((ontology, contributor_type, cnode))
        g.add((cnode, RDF.type, FOAF.Person))
        g.add((cnode, FOAF.firstName, Literal(contributor['first_name'])))
        g.add((cnode, FOAF.lastName, Literal(contributor['last_name'])))
        g.add((cnode, affiliationPredicate, affiliation))
        g.add((affiliation, FOAF.name, Literal(contributor['affiliation_name'])))
        if contributor['affiliation_website'] is not None and len(contributor['affiliation_website']) != 0:
            g.add((affiliation, FOAF.homepage, URIRef(contributor['affiliation_website'])))
        if contributor['email'] is not None and len(contributor['email']) != 0:
            g.add((cnode, FOAF.mbox, URIRef('mailto:%s' % contributor['email'])))
        
    return g.serialize(format='turtle')


def get_supported_schemas():
    """returns a list of supported schemas"""

    LOGGER.debug('Generating list of supported schemas')
    return os.listdir(TEMPLATES)


def get_abspath(mcf, filepath):
    """helper function absolute file access"""

    abspath = os.path.dirname(os.path.realpath(mcf))
    return os.path.join(abspath, filepath)
