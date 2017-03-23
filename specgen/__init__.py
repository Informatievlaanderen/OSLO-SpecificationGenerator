import codecs
import logging
import os
import re
import sys
from io import BytesIO
from xml.dom import minidom
import lxml.etree as ET
from specgen.extractvoc import convert
from specgen.extractap import convert_csv
from specgen.extractcontributors import convert_contributor_csv
import tempfile
import rdflib

from jinja2 import Environment, FileSystemLoader
from jinja2.exceptions import TemplateNotFound

from six.moves.configparser import ConfigParser

__version__ = '0.1.1'

LOGGER = logging.getLogger(__name__)

TEMPLATES = '%s%stemplates' % (os.path.dirname(os.path.realpath(__file__)),
                               os.sep)

TRANSFORMATIONS = '%s%stransformations' % (
os.path.dirname(os.path.realpath(__file__)),
os.sep)


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
    """returns dict of ConfigParser object"""

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


def render_template(mcf, schema=None, schema_local=None):
    """convenience function to render Jinja2 template"""

    LOGGER.debug('Evaluating schema path')
    if schema is None and schema_local is None:
        msg = 'schema or schema_local required'
        LOGGER.exception(msg)
        raise RuntimeError(msg)
    if schema_local is None:  # default templates dir
        abspath = '{}{}{}'.format(TEMPLATES, os.sep, schema)
    elif schema is None:  # user-defined
        abspath = schema_local

    def debug(text):
        print(text)

    LOGGER.debug('Setting up template environment {}'.format(abspath))
    env = Environment(loader=FileSystemLoader([abspath, TEMPLATES]))
    env.filters['normalize_datestring'] = normalize_datestring
    env.filters['get_distribution_language'] = get_distribution_language
    env.filters['get_charstring'] = get_charstring
    env.filters['debug'] = debug
    env.globals.update(zip=zip)
    env.globals.update(get_charstring=get_charstring)
    env.globals.update(normalize_datestring=normalize_datestring)

    try:
        LOGGER.debug('Loading template')
        template = env.get_template('main.j2')
    except TemplateNotFound:
        msg = 'Missing metadata template'
        LOGGER.exception(msg)
        raise RuntimeError(msg)

    LOGGER.debug('Processing template')
    xml = template.render(record=read_mcf(mcf),
                          software_version=__version__).encode('utf-8')

    return ET.parse(BytesIO(xml))


def voc_to_spec(rdf, schema=None, schema_local=None):
    result = convert(rdf)
    _, fp = tempfile.mkstemp()

    with codecs.open(fp, 'w', encoding='utf-8') as f:
        f.write(u'%s' % result)
    f.close()

    if schema is None:
        schema = 'vocabulary'  # Vocabulary schema by default

    return render_template(fp, schema, schema_local)


def voc_to_ap(csv, schema=None, schema_local=None):
    result = convert_csv(csv)
    _, fp = tempfile.mkstemp()

    with codecs.open(fp, 'w', encoding='utf-8') as f:
        f.write(u'%s' % result)
    f.close()

    if schema is None:
        schema = 'ap'  # ap schema by default

    return render_template(fp, schema, schema_local)


def contributor_to_rdf(csv, voc, schema=None, schema_local=None):
    result = convert_contributor_csv(csv, voc)
    _, fp = tempfile.mkstemp()

    with codecs.open(fp, 'w', encoding='utf-8') as f:
        f.write(u'%s' % result)
    f.close()

    if schema is None:
        schema = 'contributors'  # contributor schema by default

    return render_template(fp, schema, schema_local)


def merge_rdf(rdf1, rdf2):
    g = rdflib.Graph()
    if rdf1.endswith('.xml'):
        g.parse(os.path.realpath(rdf1),
                format='xml')
    else:
        g.parse(os.path.realpath(rdf1),
                format=rdflib.util.guess_format(os.path.realpath(rdf1)))
    if rdf1.endswith('.xml'):
        g.parse(os.path.realpath(rdf2),
                format='xml')
    else:
        g.parse(os.path.realpath(rdf2),
                format=rdflib.util.guess_format(os.path.realpath(rdf2)))

    return g.serialize(format='turtle')


def get_supported_schemas():
    """returns a list of supported schemas"""

    LOGGER.debug('Generating list of supported schemas')
    return os.listdir(TEMPLATES)


def get_abspath(mcf, filepath):
    """helper function absolute file access"""

    abspath = os.path.dirname(os.path.realpath(mcf))
    return os.path.join(abspath, filepath)