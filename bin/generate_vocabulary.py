#!/usr/bin/env python

import click

from lxml import etree as ET
from specgen import get_supported_schemas, render_template, voc_to_spec, voc_to_ap

SUPPORTED_SCHEMAS = get_supported_schemas()

@click.command()
@click.option('--rdf',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Vocabulary RDF file (.ttl/.rdf/.json/.jsonld/.nt/.nq/.n3)')
@click.option('--csv',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Application Profile CSV file (.csv)')
@click.option('--output', type=click.File('wb'),
              help='Name of output file')
@click.option('--ap', is_flag=True, help='Output full AP instead of vocabulary')
@click.option('--schema',
              type=click.Choice(SUPPORTED_SCHEMAS),
              help='Metadata schema')
@click.option('--schema_local',
              type=click.Path(exists=True, resolve_path=True,
                              dir_okay=True, file_okay=False),
              help='Locally defined metadata schema')


def process_args(rdf, csv, ap, schema, schema_local, output):
    if not ap:
        if rdf is not None:
            xml_output = voc_to_spec(rdf, schema=schema,
                                 schema_local=schema_local)
        else:
            raise click.UsageError(
                'Missing arguments input RDF --rdf {path}')

    elif ap and csv is not None:
        xml_output = voc_to_ap(csv, schema=schema,
                                 schema_local=schema_local)
    else:
        raise click.UsageError(
            'Missing arguments input CSV --csv {path} or RDF --rdf {path}')

    if output is None:
        click.echo_via_pager(ET.tostring(xml_output.getroot()))
    else:
        xml_output.write(output)


if __name__ == '__main__':
    process_args()
