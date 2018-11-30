import csv
import pydash
import os


def convert_oj(path):
    """
    Reads in a CSV entity/property/ontology catalog and converts it to a dict containing all described entities.

    :param path: path to a utf-8 encoded csv file
    :return: a dict of all entities
    """
    ap = []

    with open(path, encoding="utf-8") as csvfile:
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

    codelists = {}

    for row in ap:
        if "ENUMERATION" == row['EA-Type'] and row['ap-codelist']:
            codelists[row['EA-Name']] = row['ap-codelist']

    entities = []
    properties = []

    for row in ap:
        if "CLASS" == row['EA-Type'] or "DATATYPE" == row['EA-Type']:
            entities.append({
                'guid': row['EA-GUID'],
                'uri': row['namespace'] + row['localname'],
                'label': row['ap-label-nl'],
                'definition': row['ap-definition-nl'],
                'usage_note': row['ap-usageNote-nl'],
                'parent_uris': row['parent'].split(', '),
                'source_type': row['EA-Type'].lower(),
                'name': row['EA-Name'],
                'parent': row['EA-Parent'],
                'package': row['EA-Package'],
                'properties': []
            })
        elif "connector" == row['EA-Type'] or "attribute" == row['EA-Type']:
            if row['min card'] != row['max card']:
                cardinality = "%s...%s" % (row['min card'], row['max card'])
            else:
                cardinality = row['min card']

            properties.append({
                'guid': row['EA-GUID'],
                'uri': row['namespace'] + row['localname'],
                'label': row['ap-label-nl'],
                'definition': row['ap-definition-nl'],
                'usage_note': row['ap-usageNote-nl'],
                'parent_uris': row['parent'].split(', '),
                'domain_uri': row['domain'],
                'domain_guid': row['EA-Domain-GUID'],
                'domain_label': "", # Filled in below
                'domain_ea': row['EA-Domain'],
                'range_label': row['EA-Range'],  # This assumes the class/datatype name matches the AP-label,
                                                 # which isn't guaranteed, but should be true.
                                                 # Attribute datatypes such as "String" will not have a matching entity.
                'range_uri': row['range'],
                'codelist_uri': row['ap-codelist'] or codelists.get(row['EA-Range']),
                'cardinality': cardinality,
                'source_type': row['EA-Type'].lower()
            })


    # URIs are not valid index keys: they can occur multiple times for entities and properties!
    # Guids are valid index keys, but only usable for domain, since datatypes can be referenced as string in attribute datatypes
    guid_entity = {entity['guid']: entity for entity in entities}

    for prop in properties:
        if prop['domain_guid'] not in guid_entity:
            # Property is an enum value
            continue

        domain_entity = guid_entity[prop['domain_guid']]
        domain_entity['properties'].append(prop)
        prop['domain_label'] = domain_entity['label']
        child_entities = {value['guid'] for value in entities if value['parent'] == prop['domain_ea']}
        for child in child_entities:
            for child_entity in entities:
                if child_entity['guid'] == child:
                    child_entity['properties'].append(prop)
                    child_n2_entities = {value['guid'] for value in entities if value['parent'] == child_entity['name']}
                    for child_n2 in child_n2_entities:
                        for child_n2_entity in entities:
                            if child_n2_entity['guid'] == child_n2:
                                child_n2_entity['properties'].append(prop)
                                child_n3_entities = {value['guid'] for value in entities if value['parent'] == child_n2_entity['name']}
                                for child_n3 in child_n3_entities:
                                    for child_n3_entity in entities:
                                        if child_n3_entity['guid'] == child_n3:
                                            child_n3_entity['properties'].append(prop)
                                            child_n4_entities = {value['guid'] for value in entities if value['parent'] == child_n3_entity['name']}
                                            for child_n4 in child_n4_entities:
                                                for child_n4_entity in entities:
                                                    if child_n4_entity['guid'] == child_n4:
                                                        child_n4_entity['properties'].append(prop)
                                                        child_n5_entities = {value['guid'] for value in entities if value['parent'] == child_n4_entity['name']}
                                                        for child_n5 in child_n5_entities:
                                                            for child_n5_entity in entities:
                                                                if child_n5_entity['guid'] == child_n5:
                                                                    child_n5_entity['properties'].append(prop)
                                                                    child_n6_entities = {value['guid'] for value in entities if value['parent'] == child_n5_entity['name']}
                                                                    for child_n6 in child_n6_entities:
                                                                        for child_n6_entity in entities:
                                                                            if child_n6_entity['guid'] == child_n6:
                                                                                child_n6_entity['properties'].append(prop)
                                                                                child_n7_entities = {value['guid'] for value in entities if value['parent'] == child_n6_entity['name']}
                                                                                for child_n7 in child_n7_entities:
                                                                                    for child_n7_entity in entities:
                                                                                        if child_n7_entity['guid'] == child_n7:
                                                                                            child_n7_entity['properties'].append(prop)
           
    result = [entity for entity in entities if entity['package'] != "Model"]                                                                    
    return result
