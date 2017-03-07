#!/usr/bin/env python

import click

from lxml import etree as ET
from specgen import get_supported_schemas, render_template, voc_to_spec, voc_to_ap

SUPPORTED_SCHEMAS = get_supported_schemas()

@click.command()
@click.option('--rdf',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Vocabulary RDF file (.ttl/.rdf/.json/.jsonld/.nt/.nq/.n3)')
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


def process_args(rdf, ap, schema, schema_local, output):
    print(ap)
    if rdf is not None:
        if not ap:
            xml_output = voc_to_spec(rdf, schema=schema,
                                     schema_local=schema_local)
        else:
            xml_output = voc_to_ap(rdf, schema=schema,
                                     schema_local=schema_local)

        if output is None:
            click.echo_via_pager(ET.tostring(xml_output.getroot()))
        else:
            xml_output.write(output)

    else:
        raise click.UsageError('Missing arguments')


if __name__ == '__main__':
    process_args()
