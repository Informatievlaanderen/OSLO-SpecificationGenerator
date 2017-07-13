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
prefix sh: <	http://www.w3.org/ns/shacl#>
"""


def convertap_from_rdf(rdf, title):
    g = rdflib.Graph()
    if rdf.endswith('.xml'):
        g.parse(os.path.realpath(rdf),
                format='xml')
    else:
        g.parse(os.path.realpath(rdf),
                format=rdflib.util.guess_format(os.path.realpath(rdf)))

    result = []

    # add header
    result.append(["EA-Type", "EA-Package", "EA-Name", "EA-GUID", "EA-Parent", "EA-Domain", "EA-Domain-GUID", "EA-Range", "ap-label-nl", "ap-definition-nl", "ap-usageNote-nl", "ap-codelist", "external term", "namespace", "localname", "type", "domain", "range", "parent", "min card", "max card"])

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              ?v a owl:Ontology .
              OPTIONAL { ?v rdfs:label ?label . FILTER(LANGMATCHES(LANG(?label), "nl")) } .
              OPTIONAL { ?v dcterms:abstract ?abstract . FILTER(LANGMATCHES(LANG(?abstract), "nl")) } .
              OPTIONAL { ?v dcterms:title ?title . FILTER(LANGMATCHES(LANG(?title), "nl")) } .
              OPTIONAL { ?v rdfs:comment ?comment . FILTER(LANGMATCHES(LANG(?comment), "nl")) } .
              OPTIONAL { ?v dcterms:rights ?rights } .
           } LIMIT 1""")

    for row in qres:
        if row['v'] is not None:
            result += "uri=%s\n" % row['v']
        if row['label'] is not None:
            result += "label=%s\n" % row['label']
        if row['title'] is not None:
            result += "title=%s\n" % row['title']
        if row['abstract'] is not None:
            result += "abstract=%s\n" % re.sub(r'\n', ' ', row['abstract'])
        if row['rights'] is not None:
            result += "rights=%s\n" % row['rights']

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT ?s
           WHERE {
              { ?c rdfs:subPropertyOf ?s }.
           }""")

    parents = dict()

    for row in qres:
        if row['s'] is not None:
            parents[row['c']] = row['s']

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT ?s
           WHERE {
              { ?c rdfs:subClassOf ?s }.
           }""")

    parentClasses = dict()

    for row in qres:
        if row['s'] is not None:
            parentClasses[row['c']] = row['s']

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { ?class a owl:Class } UNION { ?class a rdfs:Class } .
              ?class rdfs:label ?label .
              FILTER(LANGMATCHES(LANG(?label), "nl"))
           } ORDER BY ?label""")

    classes = []
    class_uris = []

    for row in qres:
        if row['class'] is not None:
            classes.append(row['label'])
            class_uris.append(row['class'])

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { { ?p a owl:ObjectProperty } UNION { ?p a owl:DatatypeProperty } } UNION { ?p a rdf:Property } .
              ?p rdfs:label ?label .
              OPTIONAL { ?p rdfs:domain ?s . ?s rdfs:label ?sLabel . FILTER(LANGMATCHES(LANG(?sLabel), "nl")) } .
              FILTER(LANGMATCHES(LANG(?label), "nl"))
           } ORDER BY ?label""")

    properties = []
    prop_uris = []

    for row in qres:
        if row['p'] is not None:
            if row['sLabel'] is not None:
                properties.append("%s (%s)" % (row['label'], row['sLabel']))
            else:
                properties.append(row['label'])
            prop_uris.append(row['p'])

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { ?class a owl:Class } UNION { ?class a rdfs:Class } .
              ?class rdfs:label ?label .
              FILTER(LANGMATCHES(LANG(?label), "nl")) .
              OPTIONAL { ?class dcterms:identifier ?identifier } .
              ?class rdfs:comment ?comment .
              FILTER(LANGMATCHES(LANG(?comment), "nl")) .
              OPTIONAL { ?class vann:usageNote ?usageNote } .
              OPTIONAL { ?class rdfs:isDefinedBy ?definedBy } .
              OPTIONAL { ?class wdsr:describedBy ?describedBy } .
           } ORDER BY ?label""")

    for row in qres:
        if row['class'] is not None:
            result += '\n[class_nl:%s]\n' % row['class']
            if row['label'] is not None:
                result += "label=%s\n" % row['label']
            if row['identifier'] is not None:
                result += "identifier=%s\n" % row['identifier']
            if row['comment'] is not None:
                result += "comment=%s\n" % re.sub(r'\n', ' ', row['comment'])
            if row['usageNote'] is not None:
                result += "usageNote=%s\n" % re.sub(r'\n', ' ',
                                                    row['usageNote'])
            if row['definedBy'] is not None:
                result += "definedBy=%s\n" % row['definedBy']
            if row['describedBy'] is not None:
                result += "describedBy=%s\n" % row['describedBy']

    qres = g.query(  # Mandatory -> required; Optional -> OPTIONAL
        PREFIXES +
        """SELECT DISTINCT *
           WHERE {
              { { ?p a owl:ObjectProperty } UNION { ?p a owl:DatatypeProperty } } UNION { ?p a rdf:Property } .
              ?p rdfs:label ?label .
              FILTER(LANGMATCHES(LANG(?label), "nl")) .
              OPTIONAL { ?p dcterms:identifier ?identifier } .
              ?p rdfs:comment ?comment .
              FILTER(LANGMATCHES(LANG(?comment), "nl")) .
              OPTIONAL { ?p rdfs:domain ?domain } .
              OPTIONAL { ?p rdfs:range ?range } .
              OPTIONAL { ?p vann:usageNote ?usageNote } .
              OPTIONAL { ?p rdfs:isDefinedBy ?definedBy } .
              OPTIONAL { ?p wdsr:describedBy ?describedBy } .
              OPTIONAL { ?e a sh:PropertyShape ;
                    sh:targetNode ?domain ;
                    sh:path ?p .
                 OPTIONAL { ?e sh:minCount ?min } .
                 OPTIONAL { ?e sh:maxCount ?max } } .
           } ORDER BY ?label""")

    for row in qres:
        if row['p'] is not None:
            result += '\n[property_nl:%s]\n' % row['p']
            if row['label'] is not None:
                result += "label=%s\n" % row['label']
            if row['identifier'] is not None:
                result += "identifier=%s\n" % row['identifier']
            if row['domain'] is not None:
                result += "domain=%s\n" % row['domain']
            if row['range'] is not None:
                result += "range=%s\n" % row['range']
            if row['comment'] is not None:
                result += "comment=%s\n" % re.sub(r'\n', ' ', row['comment'])
            if row['usageNote'] is not None:
                result += "usageNote=%s\n" % re.sub(r'\n', ' ',
                                                    row['usageNote'])
            if row['definedBy'] is not None:
                result += "definedBy=%s\n" % row['definedBy']
            if row['describedBy'] is not None:
                result += "describedBy=%s\n" % row['describedBy']

    return result
