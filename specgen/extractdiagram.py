import csv
import pydash
import os

def convert_to_diagram(path):
    ap = []
    result = ""

    with open(path) as csvfile:
        dialect = csv.Sniffer().sniff(csvfile.read(4096))
        dialect.doublequote = True
        csvfile.seek(0)
        reader = csv.reader(csvfile, dialect)
        header = False

        for row in reader:
            if not header:
                header = row
            else:
                item = {}
                for i in range(0, len(row)):
                    item[header[i]] = row[i]
                ap.append(item)

    domains = pydash.without(pydash.uniq(pydash.map_(ap, 'EA-Domain')), '', None)
    codelists = pydash.filter_(ap, {'EA-Type': 'ENUMERATION'})
    domains = list(set(domains) - set(pydash.map_(codelists.copy(), 'EA-Name')))
    domains.sort()
    classes = pydash.filter_(ap, {'EA-Type': 'CLASS'}) + pydash.filter_(ap, {'EA-Type': 'DATATYPE'})
    packages = pydash.uniq(pydash.map_(classes, 'EA-Package'))
    datatypes = pydash.map_(pydash.filter_(ap, {'EA-Type': 'DATATYPE'}), 'EA-Name')
    classes_only = pydash.map_(pydash.filter_(ap, {'EA-Type': 'CLASS'}), 'EA-Name')
    attributes = pydash.filter_(ap, {'EA-Type': 'attribute'})
    attributes = pydash.sort_by(attributes, 'EA-Domain')
    connectors = pydash.filter_(ap, {'EA-Type': 'connector'})
    connectors = pydash.sort_by(connectors, 'EA-Domain')

    # for enumeration in codelists:
    #    attributes = pydash.remove(attributes, {'EA-Domain': enumeration})

    if len(domains) > 0:
        for domain in domains:
            klassen = pydash.filter_(classes, {'EA-Name': domain})
            for klasse in klassen:
                domain_attributes = pydash.filter_(attributes, {
                    'EA-Domain-GUID': klasse['EA-GUID']})
                domain_attribute_pairs = pydash.map_(domain_attributes, lambda a: a['EA-Name'] + ':' + a['EA-Range'])
                if len(domain_attribute_pairs) > 0:
                    result += '[%s|%s],' % (
                    klasse['EA-Name'], ';'.join(domain_attribute_pairs))
                else:
                    result += '[%s],' % klasse['EA-Name']

                domain_connectors = pydash.filter_(connectors, {
                    'EA-Domain-GUID': klasse['EA-GUID']})
                domain_connector_guids = pydash.without(
                    pydash.uniq(pydash.map_(domain_connectors, 'EA-GUID')), '',
                    None)  # localname
                for connector in domain_connector_guids:
                    domain_connector = pydash.find(domain_connectors,
                                                   {'EA-GUID': connector})
                    if domain_connector is not None:
                        result += '[%s]-%s %s..%s>[%s],' % (klasse['EA-Name'],
                                                           domain_connector[
                                                               'EA-Name'],
                                                           domain_connector[
                                                               'min card'] if
                                                           domain_connector[
                                                               'min card'] != '' else "0",
                                                           domain_connector[
                                                               'max card'] if
                                                           domain_connector[
                                                               'max card'] != '' else "*",
                                                           domain_connector[
                                                               'EA-Range'])


        for pkg in packages:  # groups and classes
            if pkg is not None:
                group_klassen = pydash.map_(pydash.filter_(classes,
                                                           {'EA-Package': pkg,
                                                            'EA-Type': 'CLASS'}),
                                            'EA-Name')
                group_klassen = pydash.filter_(group_klassen,
                                               lambda c: c in domains)
                if len(group_klassen) > 0:
                   result += '[%s [%s]],' % (pkg, ']['.join(group_klassen))

    return result
