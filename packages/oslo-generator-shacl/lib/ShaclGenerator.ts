import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import { SHA1 } from 'crypto-js';
import jsonfile = require('jsonfile');
import { helper } from './Helper';

export interface IShaclGeneratorOptions {
  outputFile: string;
  domain: string;
  language: string;
  mode: string;
  constraints: string[];
  publishedAt: string;
  useConstraintLabel: boolean;
}

export class ShaclGenerator implements ISpecification {
  public report: OSLOReport;
  public options: IShaclGeneratorOptions;

  public constructor(report: OSLOReport, options: IShaclGeneratorOptions) {
    this.report = report;
    this.options = options;
  }

  public generateSpecification = async (): Promise<void> => {
    const classes = [...this.report.classes, ...this.report.externals];
    const properties = [...this.report.properties, ...this.report.externalProperties];

    const classPropertiesMap = this.groupPropertiesPerClass(classes, properties);
    const entityNameObjectMap = this.mapEntityNameToObject([...classes, ...properties]);
    const shacl = this.generateShacl(this.options.mode, classPropertiesMap, entityNameObjectMap);

    jsonfile.writeFile(this.options.outputFile, shacl)
      .then(res => {
        console.log(`[ShaclGenerator]: Write complete, file saved to: ${this.options.outputFile}`);
      })
      .catch(error => {
        console.error(error);
        process.exitCode = 1;
      });
  };

  public groupPropertiesPerClass = (classes: any[], properties: any[]): Map<string, any> => {
    const classPropertiesMap = new Map<any, any>();

    classes.forEach(classObject => {
      classPropertiesMap.set(classObject.extra['EA-Name'], []);
    });

    properties.forEach(propertyObject => {
      let domains: string[];

      if (Array.isArray(propertyObject.domain)) {
        domains = propertyObject.domain;
      } else {
        domains = [propertyObject.domain];
      }

      domains.forEach((domain: any) => {
        if (classPropertiesMap.has(domain['EA-Name'])) {
          classPropertiesMap.set(domain['EA-Name'], [...classPropertiesMap.get(domain['EA-Name']), propertyObject]);
        } else {
          classPropertiesMap.set(domain['EA-Name'], [propertyObject]);
        }
      });
    });

    return classPropertiesMap;
  };

  public mapEntityNameToObject = (entities: any[]): Map<string, any> => {
    const entityNameObjectMap = new Map<string, any>();

    entities.forEach(entity => {
      entityNameObjectMap.set(entity.extra['EA-Name'], entity);
    });

    return entityNameObjectMap;
  };

  public generateShacl = (mode: string,
    classPropertiesMap: Map<string, any>,
    entityNameObjectMap: Map<string, any>): any => {
    let shacl;
    if (mode === 'grouped') {
      shacl = this.createGroupedShacl(classPropertiesMap, entityNameObjectMap, this.options.language);
    } else {
      shacl = this.createIndividualShacl(classPropertiesMap, entityNameObjectMap, this.options.language);
    }

    return shacl;
  };

  public createGroupedShacl = (classPropertiesMap: Map<string, any>,
    entityNameObjectMap: Map<string, any>,
    language: string): any => {
    const shaclMap = new Map<string, any>();
    const shaclShapes: any[] = [];

    classPropertiesMap.forEach((properties: any[], className: string) => {
      const shape: any = {};

      shape['@id'] = `${this.options.domain}#${className}Shape`;
      shape['@type'] = 'sh:NodeShape';

      if (entityNameObjectMap.has(className)) {
        shape['sh:targetClass'] = entityNameObjectMap.get(className)['@id'];
      } else {
        console.log(`[ShaclGenerator]: Shacl shape for unknown class: ${className}`);
      }

      shape['sh:closed'] = false;
      const sortedProperties = properties.sort(helper.alphabeticalSort);
      const shaclProperties: any[] = [];

      sortedProperties.forEach(propertyObject => {
        const shaclProperty = helper.createShaclProperty(propertyObject, language);

        if (propertyObject.range && propertyObject.range.length > 1) {
          console.log(`[ShaclGenerator]: More than 1 range for property: ${propertyObject['@id']}.`);
        } else if (propertyObject.range && propertyObject.range.length === 1) {
          if (propertyObject['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
            shaclProperty['sh:datatype'] = propertyObject.range[0].uri;
          } else {
            shaclProperty['sh:class'] = propertyObject.range[0].uri;
          }
        }

        if (propertyObject.maxCardinality &&
          propertyObject.maxCardinality !== '*' &&
          propertyObject.maxCardinality !== 'n') {
          shaclProperty['sh:maxCount'] = propertyObject.maxCardinality;
        }

        if (propertyObject.minCardinality &&
          propertyObject.minCardinality !== '0') {
          shaclProperty['sh:minCount'] = propertyObject.minCardinality;
        }

        if (propertyObject.extra && propertyObject.extra['ap-codelist']) {
          shaclProperty['qb:codeList'] = propertyObject.extra['ap-codelist'];
        }

        shaclProperties.push(shaclProperty);
      });

      shape['sh:property'] = shaclProperties;
      shaclShapes.push(shape);
    });

    shaclMap.set('@context', helper.getGroupedShaclContext(this.options.domain));
    shaclMap.set('@id', this.options.domain);
    shaclMap.set('shapes', shaclShapes);

    return shaclMap;
  };

  public createIndividualShacl = (classPropertiesMap: Map<string, any>,
    entityNameObjectMap: Map<string, any>,
    language: string): any => {
    const shaclMap = new Map<string, any>();
    const shaclShapes: any[] = [];

    classPropertiesMap.forEach((properties: any[], className: string) => {
      const shape: any = {};
      const classShapeUri = `${this.options.domain}#${className}Shape`;

      shape['@id'] = classShapeUri;
      shape['@type'] = `sh:NodeShape`;
      shape['sh:closed'] = false;

      if (entityNameObjectMap.has(className)) {
        shape['sh:targetClass'] = entityNameObjectMap.get(className);
      } else {
        console.log(`[ShaclGenerator]: Shacl shape for unknown class: ${className}.`);
      }

      let shaclProperties: any[] = [];
      const sortedProperties = properties.sort(helper.alphabeticalSort);

      sortedProperties.forEach(propertyObject => {
        const shaclProperty = helper.createShaclProperty(propertyObject, language);
        let shaclPropertyName = '';

        if (shaclProperty['sh:name'] && shaclProperty['sh:name'][language]) {
          shaclPropertyName = shaclProperty['sh:name'][language];
        }
        helper.addSeeAlso(propertyObject, className, shaclPropertyName, this.options.publishedAt);

        if (propertyObject.range && propertyObject.range.length > 1) {
          console.log(`[ShaclGenerator]: Range has more than one value for property: ${propertyObject['@id']}.`);
        } else if (propertyObject.raneg && propertyObject.range.length === 1) {
          let shaclPropertyCopy = { ...shaclProperty };
          let shaInput = `${shaclPropertyName}range`;

          shaclPropertyCopy['@id'] = `${classShapeUri}/${SHA1(shaInput)}`;

          if (propertyObject['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
            shaclPropertyCopy['sh:datatype'] = propertyObject.range[0].uri;
          } else {
            shaclPropertyCopy['sh:class'] = propertyObject.range[0].uri;
          }
          shaclProperties.push(shaclPropertyCopy);

          if (this.options.constraints.includes('uniqueLanguages') &&
            propertyObject.range[0].uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
            console.log(`[ShaclGenerator]: Adding uniqueLanguage constraint.`);

            shaclPropertyCopy = { ...shaclProperty };
            shaInput = `${shaclPropertyName}uniqueLanguage`;
            shaclPropertyCopy = `${classShapeUri}/${SHA1(shaInput)}`;
            shaclPropertyCopy['sh:uniqueLang'] = 'true';

            shaclProperties.push(shaclPropertyCopy);
          }

          if (this.options.constraints.includes('nodekind')) {
            console.log(`[ShaclGenerator]: Adding nodeKind constraint.`);

            shaclPropertyCopy = { ...shaclProperty };
            shaInput = `${shaclPropertyName}nodekind`;
            shaclPropertyCopy['@id'] = `${classShapeUri}/${SHA1(shaInput)}`;

            if (propertyObject['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
              shaclPropertyCopy['sh:nodekind'] = 'sh:Literal';
            } else {
              shaclPropertyCopy['sh:nodekind'] = 'sh:BlankNodeOrIRI';
            }

            shaclProperties.push(shaclPropertyCopy);
          }
        }

        if (propertyObject.maxCardinality &&
          propertyObject.maxCardinality !== '*' &&
          propertyObject.maxCardinality !== 'n') {
          const shaclPropertyCopy = { ...shaclProperty };
          const shaInput = `${shaclPropertyName}maxCount`;
          shaclPropertyCopy['@id'] = `${classShapeUri}/${SHA1(shaInput)}`;

          shaclPropertyCopy['sh:maxCount'] = propertyObject.maxCardinality;
          shaclProperties.push(shaclPropertyCopy);
        }

        if (propertyObject.minCardinality && propertyObject.minCardinality !== '0') {
          const shaclPropertyCopy = { ...shaclProperty };
          const shaInput = `${shaclPropertyName}minCount`;
          shaclPropertyCopy['@id'] = `${classShapeUri}/${SHA1(shaInput)}`;

          shaclPropertyCopy['sh:minCount'] = propertyObject.minCardinality;
          shaclProperties.push(shaclPropertyCopy);
        }

        if (propertyObject['ap-codelist']) {
          // TODO: add codelist reasoning support

          const nodeRestriction = {
            '@type': 'sh:NodeShape',
            'rdfs:comment': 'codelist restriction',
            'sh:property': {
              'sh:class': 'skos:ConceptScheme',
              'sh:hasValue': propertyObject['ap-codelist'],
              'sh:minCount': '1',
              'sh:nodeKind': 'sh:IRI',
              'sh:path': 'skos:inScheme',
            },
          };

          const shaclPropertyCopy = { ...shaclProperty };
          const shaInput = `${shaclPropertyName}codelist`;
          shaclPropertyCopy['@id'] = `${classShapeUri}/${SHA1(shaInput)}`;
          shaclPropertyCopy['sh:nodeKind'] = 'sh:IRI';
          shaclPropertyCopy['sh:severity'] = 'sh:Warning';
          shaclPropertyCopy['sh:node'] = nodeRestriction;
          shaclProperties.push(shaclPropertyCopy);
        }
      });

      shaclProperties = shaclProperties.sort(helper.attributeSort);
      shape['sh:property'] = shaclProperties;
      shaclShapes.push(shape);
    });

    shaclMap.set('@context', helper.getIndividalShaclContext(this.options.domain));
    shaclMap.set('@id', this.options.domain);
    shaclMap.set('shapes', shaclShapes);

    return shaclMap;
  };
}
