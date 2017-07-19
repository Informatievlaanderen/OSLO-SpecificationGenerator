import csv
import pydash

def convert_to_p_diagram(path):
    ap = []
    result = "@startuml\nscale max 2000 width\nskinparam linetype ortho\n"

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

    domains = pydash.without(pydash.uniq(pydash.map_(ap, 'EA-Domain')), '',
                             None)
    codelists = pydash.filter_(ap, {'EA-Type': 'ENUMERATION'})
    domains = list(set(domains) - set(pydash.map_(codelists.copy(), 'EA-Name')))
    domains.sort()
    classes = pydash.filter_(ap, {'EA-Type': 'CLASS'}) + pydash.filter_(ap, {
        'EA-Type': 'DATATYPE'})
    attributes = pydash.filter_(ap, {'EA-Type': 'attribute'})
    attributes = pydash.sort_by(attributes, 'EA-Domain')
    connectors = pydash.filter_(ap, {'EA-Type': 'connector'})
    connectors = pydash.sort_by(connectors, 'EA-Domain')

    if len(domains) > 0:
        for domain in domains:
            klassen = pydash.filter_(classes, {'EA-Name': domain})
            for klasse in klassen:
                domain_attributes = pydash.filter_(attributes, {
                    'EA-Domain-GUID': klasse['EA-GUID']})
                domain_attribute_pairs = pydash.map_(domain_attributes,
                                                     lambda a: a['EA-Name'] + ':' +
                                                               a['EA-Range'])
                if len(domain_attribute_pairs) > 0:
                    result += 'class %s.%s {\n%s\n}\n' % (klasse['EA-Package'].replace('-',''),
                        klasse['EA-Name'].replace(' ',''), '\n'.join(domain_attribute_pairs))
                else:
                    result += 'class %s.%s\n' % (klasse['EA-Package'].replace('-',''), klasse['EA-Name'].replace(' ',''))

                if klasse['EA-Parent'] is not None and klasse['EA-Parent'] != "":
                    parent_class = pydash.find(classes, {'EA-Name': klasse['EA-Parent']})
                    if parent_class is not None:
                        result += '%s.%s <|- %s.%s\n' % (parent_class['EA-Package'].replace('-',''), parent_class['EA-Name'].replace(' ',''), klasse['EA-Package'].replace('-',''), klasse['EA-Name'].replace(' ',''))

                domain_connectors = pydash.filter_(connectors, {
                    'EA-Domain-GUID': klasse['EA-GUID']})
                domain_connector_guids = pydash.without(
                    pydash.uniq(pydash.map_(domain_connectors, 'EA-GUID')), '',
                    None)  # localname
                for connector in domain_connector_guids:
                    domain_connector = pydash.find(domain_connectors,
                                                   {'EA-GUID': connector})
                    range_class = pydash.find(classes, {'EA-Name' : domain_connector['EA-Range']})
                    if domain_connector is not None and range_class is not None:
                        result += '%s.%s --> "%s..%s" %s.%s : %s >\n' % (klasse['EA-Package'].replace('-',''),
                                                  klasse['EA-Name'].replace(' ',''),
                                                  domain_connector[
                                                      'min card'] if
                                                  domain_connector[
                                                      'min card'] != '' else "0",
                                                  domain_connector[
                                                      'max card'] if
                                                  domain_connector[
                                                      'max card'] != '' else "*",
                                                  range_class['EA-Package'].replace('-',''),
                                                  domain_connector[
                                                      'EA-Range'].replace(' ',''),
                                                  domain_connector[
                                                      'EA-Name'].replace(' ',''))

    result += "\nhide empty members\nhide methods\nhide circle\n@enduml\n"
    return result


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
    attributes = pydash.filter_(ap, {'EA-Type': 'attribute'})
    attributes = pydash.sort_by(attributes, 'EA-Domain')
    connectors = pydash.filter_(ap, {'EA-Type': 'connector'})
    connectors = pydash.sort_by(connectors, 'EA-Domain')

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
