import csv
import pydash
import os


def convert_codelist(path, title):
    """
    Reads in a CSV entity/property/ontology catalog and converts it to a dict containing all described entities.

    :param path: path to a utf-8 encoded csv file
    :return: a dict of all entities
    """
    ap = []

    with open(path) as csvfile:
        dialect = csv.Sniffer().sniff(csvfile.read(8192))
        dialect.doublequote = True
        csvfile.seek(0)
        reader = csv.reader(csvfile, dialect)
        header = False

        for row in reader:
            if not header:
                header = row
            else:
                if (len(row) != len(header)):
                    raise ValueError('Error reading csv file: rows have varying number of columns.')
                item = {}
                for i in range(0, len(row)):
                    item[header[i]] = row[i]
                ap.append(item)


    entities = []
    properties = []
    namespace = "http://data.vlaanderen.be/id/conceptschema/"

    for row in ap:
        if "ENUMERATION" == row['EA-Type'] and title == row['EA-Name']:
            entities.append({
                'guid': row['EA-GUID'],
                'uri': namespace + row['EA-Name'],
                'label': row['ap-label-nl'],
                'definition': row['ap-definition-nl'],
                'usage_note': row['ap-usageNote-nl'],
                'source_type': row['EA-Type'].lower(),
                'properties': []
            })

        elif "attribute" == row['EA-Type'] and title == row['EA-Domain']:
            properties.append({
                'guid': row['EA-GUID'],
                'uri': namespace + row['EA-Domain'] + "#" + row['EA-Name'].replace(' ', '_'),
                'label': row['ap-label-nl'],
                'definition': row['ap-definition-nl'].replace('\"', ''),
                'usage_note': row['ap-usageNote-nl'].replace('\"', ''),
                'domain_uri': namespace + row['EA-Domain'],
                'domain_guid': row['EA-Domain-GUID'],
                'domain_label': "", # Filled in below
                'source_type': row['EA-Type'].lower(),
                'notation': row['EA-Name'].replace(' ', '_')
            })

    # URIs are not valid index keys: they can occur multiple times for entities and properties!
    # Guids are valid index keys, but only usable for domain, since datatypes can be referenced as string in attribute datatypes
    guid_entity = {entity['guid']: entity for entity in entities}

    for prop in properties:
        if prop['domain_guid'] not in guid_entity:
            # Property is not an enum value
            continue

        domain_entity = guid_entity[prop['domain_guid']]
        domain_entity['properties'].append(prop)
        prop['domain_label'] = domain_entity['label']

    return entities
