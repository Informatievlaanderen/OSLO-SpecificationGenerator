import jsonpath = require('jsonpath');

export const attributes = [
  {
    ascending: true,
    attribute: '$[\'sh:name\'].nl',
  },
  {
    ascending: true,
    attribute: '$[\'@id\']',
  },
];

export class Helper {
  public alphabeticalSort = (objectA: any, objectB: any): number => {
    if (objectA.extra['EA-Name'] < objectB.extra['EA-Name']) {
      return -1;
    }

    if (objectA.extra['EA-Name'] > objectB.extra['EA-Name']) {
      return 1;
    }

    return 0;
  };

  public attributeSort = (objectA: any, objectB: any): number => {
    for (const element of attributes) {
      const aAttribute = jsonpath.query(objectA, element.attribute);
      const bAttribute = jsonpath.query(objectB, element.attribute);

      if (element.ascending) {
        if (aAttribute < bAttribute) {
          return -1;
        }
        if (aAttribute > bAttribute) {
          return 1;
        }
      } else {
        if (aAttribute < bAttribute) {
          return 1;
        }
        if (aAttribute > bAttribute) {
          return -1;
        }
      }
    }

    return 0;
  };

  public createShaclProperty = (propertyObject: any, language: string): any => {
    const name = (propertyObject.label && propertyObject.label[language]) || null;
    const definition = (propertyObject.definition && propertyObject.definition[language]) || null;
    const identifier = propertyObject['@id'];

    let shaclProperty: any;
    if (name && definition) {
      shaclProperty = {
        'sh:name': {
          [language]: name,
        },
        'sh:definition': {
          [language]: definition,
        },
        'sh:path': identifier,
      };
    } else if (name && !definition) {
      shaclProperty = {
        'sh:name': {
          [language]: name,
        },
        'sh:path': identifier,
      };
    } else if (!name && definition) {
      shaclProperty = {
        'sh:definition': {
          [language]: definition,
        },
        'sh:path': identifier,
      };
    } else {
      shaclProperty = { 'sh:path': identifier };
    }

    return shaclProperty;
  };

  public addSeeAlso = (
    propertyObject: any,
    className: string,
    shaclPropertyName: string,
    publishedAt: string,
  ): void => {
    if (publishedAt) {
      const url = `${className}:${shaclPropertyName}`;
      propertyObject['rdfs:seeAlso'] = `${publishedAt}#${encodeURIComponent(url)}`;
    }
  };

  public getGroupedShaclContext = (domain: string): any => (
    {
      sh: 'http://www.w3.org/ns/shacl#',
      qb: 'http://purl.org/linked-data/cube#',
      'sh:class': { '@type': '@id' },
      'sh:datatype': { '@type': '@id' },
      'sh:path': { '@type': '@id' },
      'sh:property': { '@type': '@id' },
      'sh:targetClass': { '@type': '@id' },
      shapes: { '@type': '@id' },
      'sh:minCount': {
        '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      },
      'sh:maxCount': {
        '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      },
      'qb:codeList': {
        '@type': '@id',
      },
      ...domain !== 'undefined' && { '@vocab': domain },
      'sh:definition': { '@container': '@language' },
      'sh:name': { '@container': '@language' },
    }
  );

  public getIndividalShaclContext = (domain: string): any => (
    {
      sh: 'http://www.w3.org/ns/shacl#',
      qb: 'http://purl.org/linked-data/cube#',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      'sh:class': {
        '@id': 'sh:class',
        '@type': '@id',
      },
      'sh:datatype': {
        '@id': 'sh:datatype',
        '@type': '@id',
      },
      'sh:path': {
        '@id': 'sh:path',
        '@type': '@id',
      },
      'sh:property': {
        '@id': 'sh:property',
        '@type': '@id',
      },
      'sh:targetClass': {
        '@id': 'sh:targetClass',
        '@type': '@id',
      },
      'sh:node': {
        '@id': 'sh:node',
        '@type': '@id',
      },
      'sh:nodeKind': {
        '@id': 'sh:nodeKind',
        '@type': '@id',
      },
      'sh:hasValue': {
        '@id': 'sh:hasValue',
        '@type': '@id',
      },
      'sh:severity': {
        '@id': 'sh:severity',
        '@type': '@id',
      },
      'sh:minCount': {
        '@id': 'sh:minCount',
        '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      },
      'sh:maxCount': {
        '@id': 'sh:maxCount',
        '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      },
      'sh:definition': {
        '@id': 'sh:definition',
        '@container': '@language',
      },
      'sh:name': {
        '@id': 'sh:name',
        '@container': '@language',
      },
      'sh:uniqueLang': {
        '@id': 'sh:uniqueLang',
        '@type': 'http://www.w3.org/2001/XMLSchema#boolean',
      },
      'qb:codeList': {
        '@id': 'qb:codeList',
        '@type': '@id',
      },
      'rdfs:comment': {
        '@id': 'rdfs:comment',
      },
      shapes: {
        '@id': 'rdfs:member',
        '@type': '@id',
      },
      ...domain !== 'undefined' && { '@vocab': domain },
    }
  );
}

export const helper = new Helper();
