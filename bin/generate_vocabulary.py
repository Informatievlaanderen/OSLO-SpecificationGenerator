#!/usr/bin/env python

import click
import csv as csv_engine
import tempfile
import os
import pkgutil
import subprocess
from lxml import etree as ET
from specgen import get_supported_schemas, render_template, voc_to_spec, voc_to_spec_from_rdf, voc_to_ap, merge_rdf, contributor_to_rdf, csv_ap_to_diagram

SUPPORTED_SCHEMAS = get_supported_schemas()

@click.command()
@click.option('--rdf', '-r',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Vocabulary RDF file (.ttl/.rdf/.json/.jsonld/.nt/.nq/.n3)')
@click.option('--rdf_contributor',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Author RDF file (.ttl/.rdf/.json/.jsonld/.nt/.nq/.n3)')
@click.option('--csv_contributor',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Author CSV file (.csv)')
@click.option('--csv', '-c',
              type=click.Path(exists=True, resolve_path=True),
              help='Path to Author or Application Profile CSV file (.csv)')
@click.option('--output', '-o', type=click.File('wb'),
              help='Name of output file')
@click.option('--ap', is_flag=True, help='Output full AP instead of vocabulary')
@click.option('--diagram', '-d', is_flag=True, help='Output diagram of vocabulary or AP')
@click.option('--contributors', is_flag=True, help='Output RDF of authors, editors and contributors')
@click.option('--merge', is_flag=True, help='Merge RDF of vocabulary RDF with RDF of authors')
@click.option('--target', help='Vocabulary to export authors to')
@click.option('--title', help='Title of the AP')
@click.option('--schema', '-s',
              type=click.Choice(SUPPORTED_SCHEMAS),
              help='Metadata schema')
@click.option('--schema_local',
              type=click.Path(exists=True, resolve_path=True,
                              dir_okay=True, file_okay=False),
              help='Locally defined metadata schema')


def process_args(rdf, rdf_contributor, csv_contributor, csv, ap, contributors, merge, target, schema, schema_local, output, title, diagram):
    xml_output = False

    if diagram:
        if output:
            if rdf or csv:
                if rdf:
                    _, xp = tempfile.mkstemp()
                    csv_output = voc_to_spec_from_rdf(rdf, xp)
                    with open(xp, 'w') as csvfile:
                        writer = csv_engine.DictWriter(csvfile,
                                                fieldnames=csv_output.pop(0))
                        writer.writeheader()
                        for row in csv_output:
                            writer.writerow(row)
                    csv_path = os.path.realpath(xp)
                else:
                    csv_path = os.path.realpath(csv)
                converted = csv_ap_to_diagram(csv_path)
                package = os.path.dirname(pkgutil.get_loader("specgen").get_filename())
                subprocess.Popen(
                    ['java', '-jar', '%s/lib/plantuml.jar' % package, '-pipe'],
                    stdin=subprocess.PIPE,
                    stdout=output).communicate(
                    input=converted.encode('utf8')
                )

            else:
                raise click.UsageError(
                    'Missing argument: input RDF --rdf {path} or CSV --csv {path}')
        else:
            raise
            click.UsageError(
                'Missing argument for diagram output: --output {path}')

    elif not ap and not contributors and not merge:
        if rdf is not None:
            xml_output = voc_to_spec(rdf, schema=schema,
                                 schema_local=schema_local)
        else:
            raise click.UsageError(
                'Missing arguments input RDF --rdf {path}')

    elif ap and rdf is not None:
        if output is not None and title is not None:
            csv_output = voc_to_spec_from_rdf(rdf, title)
            xp = tempfile.mkdtemp()
            xp = os.path.join(xp, title)
            with open(xp, 'w') as csvfile:
                writer = csv_engine.DictWriter(csvfile, fieldnames=csv_output.pop(0))
                writer.writeheader()
                for row in csv_output:
                    writer.writerow(row)

            csv_path = os.path.realpath(xp)

            if schema is None and schema_local is None:
                if csv_contributor is not None:
                    xml_output = voc_to_ap(csv_path, csv_contributor=csv_contributor,
                                           schema=schema,
                                           schema_local=schema_local)
                else:
                    raise click.UsageError(
                        'Missing path to contributor CSV: --csv_contributor {path}')

            else:
                xml_output = voc_to_ap(csv_path, csv_contributor=csv_contributor,
                                       schema=schema,
                                       schema_local=schema_local)

        else:
            raise click.UsageError(
                'Missing arguments: --output {path} and/or --title {AP title}')

    elif ap and csv is not None and schema is None and schema_local is None:
        if csv_contributor is not None:
            xml_output = voc_to_ap(csv, csv_contributor=csv_contributor, schema=schema,
                                     schema_local=schema_local)
        else:
            raise click.UsageError(
                'Missing path to contributor CSV: --csv_contributor {path}')

    elif ap and csv is not None:
        xml_output = voc_to_ap(csv, csv_contributor=csv_contributor, schema=schema,
                                 schema_local=schema_local)

    elif contributors and csv is not None:
        if target is not None:
            xml_output = contributor_to_rdf(csv, target, schema=schema,
                                     schema_local=schema_local)
        else:
            click.UsageError(
                'Missing arguments input target --target {column}')

    elif merge and rdf is not None and rdf_contributor is not None:
        merged = merge_rdf(rdf, rdf_contributor)
        if output is None:
            click.echo_via_pager(merged)
        else:
           output.write(merged)

    else:
        raise click.UsageError(
            'Missing argument: input CSV --csv {path} or RDF --rdf {path}')

    if xml_output:
        if output is None:
            click.echo_via_pager(ET.tostring(xml_output.getroot()))
        else:
            xml_output.write(output)


if __name__ == '__main__':
    process_args()
