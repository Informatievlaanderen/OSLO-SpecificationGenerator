# =================================================================
# Copyrighted 2016 by Laurens De Vocht - iMinds - UGent
# All rights reserved
# =================================================================

import rdflib
import os
import re
import sys
import time

if sys.version_info >= (3, 0):
    from urllib.parse import urlparse
else:
    from urlparse import urlparse

PREFIXES = """prefix foaf: <http://xmlns.com/foaf/0.1/>
prefix dcterms: <http://purl.org/dc/terms/>
prefix dc: <http://purl.org/dc/elements/1.1/>
prefix dcat: <http://www.w3.org/ns/dcat#>
prefix xsd: <http://www.w3.org/2001/XMLSchema#>
prefix vcard: <http://www.w3.org/2006/vcard/ns#>
prefix prov: <http://www.w3.org/ns/prov#>
prefix content: <http://www.w3.org/2011/content#>
prefix owl: <http://www.w3.org/2002/07/owl#>
prefix skos: <http://www.w3.org/2004/02/skos/core#>
prefix locn: <http://www.w3.org/ns/locn#>
prefix gsp: <http://www.opengis.net/ont/geosparql#>
prefix geo: <https://www.iana.org/assignments/media-types/application/vnd.geo+>
prefix schema: <http://schema.org/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
prefix adms: <http://www.w3.org/ns/adms#>
prefix iso: <http://def.seegrid.csiro.au/isotc211/iso19115/2003/metadata#>
prefix cc: <http://creativecommons.org/ns#>
prefix rec: <http://www.w3.org/2001/02pd/rec54#>
prefix vann: <http://purl.org/vocab/vann/>
prefix wdsr: <http://www.w3.org/2007/05/powder-s#>
prefix sh: <http://www.w3.org/ns/shacl#>
prefix voaf: <http://purl.org/vocommons/voaf#>
"""


def spliturl(url):
    parsedurl = urlparse(url)
    line = str(parsedurl.scheme) + '://' + str(parsedurl.netloc) + str(parsedurl.path)
    if len(parsedurl.fragment) == 0:
        return [line[:line.rfind("/")], line[line.rfind("/") + 1:]]
    else:
        return [line + '#', parsedurl.fragment]

def convertap_from_rdf(rdf, title):
    g = rdflib.Graph()
    if rdf.endswith('.xml'):
        g.parse(os.path.realpath(rdf),
                format='xml')
    else:
        g.parse(os.path.realpath(rdf),
                format=rdflib.util.guess_format(os.path.realpath(rdf)))

    result = []
    namespace = False

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { ?v a owl:Ontology } UNION { ?v a voaf:Vocabulary } .
              OPTIONAL { ?v rdfs:label ?label . FILTER(LANGMATCHES(LANG(?label), "nl")) } .
              OPTIONAL { ?v dcterms:abstract ?abstract . FILTER(LANGMATCHES(LANG(?abstract), "nl")) } .
              OPTIONAL { ?v dcterms:title ?title . FILTER(LANGMATCHES(LANG(?title), "nl")) } .
              OPTIONAL { ?v rdfs:comment ?comment . FILTER(LANGMATCHES(LANG(?comment), "nl")) } .
              OPTIONAL { ?v dcterms:rights ?rights } .
           } LIMIT 1""")

    for row in qres:
        namespace = spliturl(row['v'])[0]
        abbr_title = os.path.splitext(os.path.basename(title))[0].replace(' AP','')
        result.append(
            {"EA-Type": "Package", "EA-Name": abbr_title, "EA-GUID": row['v'],
             "namespace": spliturl(row['v'])[0],
             "localname": spliturl(row['v'])[1],
             "type": "http://www.w3.org/2002/07/owl#Ontology"})

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { { ?class a owl:Class } UNION { ?class a rdfs:Class } } UNION { { ?s rdfs:subClassOf ?class } UNION { ?class rdfs:domain ?s } } .
              OPTIONAL { ?class rdfs:label ?label } .
              FILTER(LANGMATCHES(LANG(?label), "nl")) .
              OPTIONAL { ?class rdfs:subClassOf ?parent . OPTIONAL { ?parent rdfs:label ?plabel . FILTER(LANGMATCHES(LANG(?plabel), "nl")) } } .
              OPTIONAL { ?class dcterms:identifier ?identifier } .
              OPTIONAL { ?class rdfs:comment ?comment } .
              FILTER(LANGMATCHES(LANG(?comment), "nl")) .
              OPTIONAL { ?class vann:usageNote ?usageNote } .
              OPTIONAL { ?class rdfs:isDefinedBy ?definedBy } .
           } ORDER BY ?class""")

    for row in qres:
        if row['class'] is not None and row['definedBy'] is not None:
            result.append(
                {"EA-Type": "CLASS",
                 "EA-Package": spliturl(row['definedBy'])[1],
                 "EA-Name": row['label'] if (row['label'] is not None) else
                 spliturl(row['class'])[1],
                 "EA-GUID": row['class'],
                 "EA-Parent": row['plabel'] if (row['plabel'] is not None) else
                 spliturl(row['parent'])[1] if (
                 row['parent'] is not None) else None,
                 "ap-definition-nl": row['comment'],
                 "ap-label-nl": row['label'],
                 "ap-usageNote-nl": row['usageNote'],
                 "external term": spliturl(row['class'])[0] == namespace,
                 "namespace": spliturl(row['class'])[0],
                 "localname": spliturl(row['class'])[1],
                 "parent": row['parent'],
                 "type": "http://www.w3.org/2000/01/rdf-schema#Class"})

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { { ?p a owl:ObjectProperty } UNION { ?p a owl:DatatypeProperty } } UNION { ?p a rdf:Property } .
              OPTIONAL { ?p rdfs:label ?label } .
              ?p a ?type .
              FILTER(LANGMATCHES(LANG(?label), "nl")) .
              OPTIONAL { ?p dcterms:identifier ?identifier } .
              OPTIONAL { ?p rdfs:comment ?comment } .
              FILTER(LANGMATCHES(LANG(?comment), "nl")) .
              OPTIONAL { ?p rdfs:domain ?domain .
                         OPTIONAL { ?domain rdfs:label ?domainLabel .
                         FILTER(LANGMATCHES(LANG(?domainLabel), "nl")) } } .
              OPTIONAL { ?p rdfs:range ?range .
                         OPTIONAL { ?range rdfs:label ?rangeLabel .
                         FILTER(LANGMATCHES(LANG(?rangeLabel), "nl")) } } .
              OPTIONAL { ?p vann:usageNote ?usageNote } .
              OPTIONAL { ?p rdfs:isDefinedBy ?definedBy } .
              OPTIONAL { ?p rdfs:subPropertyOf ?parent } .
              OPTIONAL { ?e a sh:PropertyShape ;
                    sh:targetNode ?domain ;
                    sh:path ?p .
                 OPTIONAL { ?e sh:minCount ?min } .
                 OPTIONAL { ?e sh:maxCount ?max } } .
           } ORDER BY ?p""")

    for row in qres:

        if row['p'] is not None:
            if ( row['type'] == rdflib.URIRef("http://www.w3.org/2002/07/owl#ObjectProperty") or row['type'] == rdflib.URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#") ) and not 'Concept' in row['range']:
                try:
                    result.append(
                        {"EA-Type": "connector",
                         "EA-Package": spliturl(row['definedBy'])[1],
                         "EA-Name": row['label'] if (
                         row['label'] is not None) else spliturl(row['p'])[1],
                         "EA-GUID": row['p'],
                         "EA-Domain-GUID": row['domain'],
                         "EA-Domain": row['domainLabel'] if (
                         row['domainLabel'] is not None) else
                         spliturl(row['domain'])[1],
                         "EA-Range-GUID": row['range'],
                         "EA-Range": row['rangeLabel'] if (
                         row['rangeLabel'] is not None) else
                         spliturl(row['range'])[1],
                         "ap-definition-nl": row['comment'],
                         "ap-label-nl": row['label'],
                         "ap-usageNote-nl": row['usageNote'],
                         "external term": spliturl(row['p'])[0] == namespace,
                         "namespace": spliturl(row['p'])[0],
                         "localname": spliturl(row['p'])[1],
                         "parent": row['parent'],
                         "domain": row['domain'],
                         "range": row['range'],
                         "type": row['type'],
                         "min card": row['min'],
                         "max card": row['max']
                         })
                except:
                    print("Unexpected error:", sys.exc_info()[0])
                    raise

            elif row['type'] == rdflib.URIRef(
                    "http://www.w3.org/2002/07/owl#DatatypeProperty") or 'Concept' in row['range']:
                try:
                    result.append(
                        {"EA-Type": "attribute",
                         "EA-Package": spliturl(row['definedBy'])[1],
                         "EA-Name": row['label'],
                         "EA-GUID": row['p'],
                         "EA-Domain-GUID": row['domain'],
                         "EA-Domain": row['domainLabel'] if (
                         row['domainLabel'] is not None) else
                         spliturl(row['domain'])[1],
                         "EA-Range-GUID": row['range'],
                         "EA-Range": row['rangeLabel'] if (
                         row['rangeLabel'] is not None) else
                         spliturl(row['range'])[1],
                         "ap-definition-nl": row['comment'],
                         "ap-label-nl": row['label'],
                         "ap-usageNote-nl": row['usageNote'],
                         "external term": spliturl(row['p'])[0] == namespace,
                         "namespace": spliturl(row['p'])[0],
                         "localname": spliturl(row['p'])[1],
                         "parent": row['parent'],
                         "domain": row['domain'],
                         "range": row['range'],
                         "min card": row['min'],
                         "max card": row['max']})
                except:
                    print("Unexpected error:", sys.exc_info()[0])
                    raise

    result = list({x['EA-GUID']: x for x in result}.values())
    result.insert(0,
                  ["EA-Type", "EA-Package", "EA-Name", "EA-GUID", "EA-Parent",
                   "EA-Domain", "EA-Domain-GUID", "EA-Range", "EA-Range-GUID",
                   "ap-label-nl", "ap-definition-nl", "ap-usageNote-nl",
                   "ap-codelist", "external term", "namespace", "localname",
                   "type", "domain", "range", "parent", "min card",
                   "max card"])

    return result
