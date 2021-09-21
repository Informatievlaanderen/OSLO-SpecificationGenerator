import type { OSLOReport, ISpecification } from '@oslo-flanders/types';
import { logger } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import { helper } from './Helpers';

export interface IVocabularyGeneratorOptions {
  outputFile: string;
  language: string;
}

export class VocabularyGenerator implements ISpecification {
  public report: OSLOReport;
  public options: IVocabularyGeneratorOptions;

  public constructor(report: OSLOReport, options: IVocabularyGeneratorOptions) {
    this.report = report;
    this.options = options;
  }

  public generateSpecification = async (): Promise<void> => {
    const reportObject: any = JSON.parse(JSON.stringify(this.report));
    this.prepareJsonLd(reportObject, this.options.language);
    const vocabulary = this.generateVocabulary(reportObject, this.options.language);

    jsonfile.writeFile(this.options.outputFile, vocabulary, { spaces: 2 })
      .then(res => {
        logger.info(`[VocabularyGenerator]: Write complete and file was saved to '${this.options.outputFile}'.`);
      })
      .catch(error => {
        logger.error(`[VocabularyGenerator]: An error occurred while writing to '${this.options.outputFile}':`);
        logger.error(error);
        process.exitCode = 1;
      });
  };

  // FIXME: recursive function returns before all recursiveness is finished
  public prepareJsonLd = (reportObject: any, language: string): void => {
    Object.keys(reportObject).forEach(key => {
      if (reportObject[key] && reportObject[key][language]) {
        reportObject[key][language] = helper.mapEmptyString(reportObject[key][language]);
      }

      switch (key) {
        case 'range':
        case 'domain':
          break;

        case 'usage':
          reportObject[key] = helper.mapUsageProperty(reportObject[key], this.options.language);
          break;

        case 'foaf:mbox':
          reportObject[key] = helper.mapFoafMailboxProperty(reportObject[key]);
          break;

        default:
          if (typeof reportObject[key] === 'object') {
            this.prepareJsonLd(reportObject[key], language);
          }
          break;
      }
    });
  };

  // TODO: check if this still exists and/or should be added to OSLOReport
  // jsonVocabulary['@title']
  public generateVocabulary = (preparedJsonLd: OSLOReport, language: string): any => ({
    '@id': preparedJsonLd.documentId,
    '@type': preparedJsonLd.documentType,
    label: preparedJsonLd.label,
    authors: preparedJsonLd.authors,
    contributors: preparedJsonLd.contributors,
    editors: preparedJsonLd.editors,
    ...preparedJsonLd.baseUriabbreviation && { baseURIabbrev: preparedJsonLd.baseUriabbreviation },
    ...preparedJsonLd.baseUri && { baseURI: preparedJsonLd.baseUri },
    license: preparedJsonLd.license,
    issued: preparedJsonLd.issued,
    navigation: preparedJsonLd.navigation,
    namespace: preparedJsonLd.namespace,
    'publication-state': preparedJsonLd.publicationState,
    'publication-date': preparedJsonLd.publicationDate,
    classes: this.extractClasses(preparedJsonLd.classes),
    externals: this.extractExternals(preparedJsonLd.externals, 'rdfs:Class'),
    properties: this.extractProperties(preparedJsonLd.properties),
    externalproperties: this.extractExternals(preparedJsonLd.externalProperties, 'rdf:Property'),
  });

  public extractClasses = (classes: any[]): any[] => {
    const newClasses: any[] = [];

    classes.forEach(classObject => {
      const newClassObject: any = this.extractGeneralAttributes(classObject, this.options.language);

      if (classObject.parents) {
        newClassObject.parents = classObject.parents;
      }

      newClasses.push(newClassObject);
    });

    return newClasses;
  };

  public extractExternals = (externals: any[], type: string): any[] => {
    const newExternals: any[] = [];

    externals.forEach(external => {
      if (external.extra && external.extra.Scope !== 'NOTHING') {
        newExternals.push({
          name: helper.getValidValueObject(external.label),
          '@id': helper.getValidValueObject(external['@id']),
          '@type': type,
        });
      }
    });

    return newExternals;
  };

  public extractProperties = (properties: any[]): any[] => {
    const newProperties: any[] = [];

    properties.forEach(property => {
      if (property) {
        const newProperty: any = this.extractGeneralAttributes(property, this.options.language);
        newProperty.domain = helper.getValidValueArray(property.domain).map((t: any) => t.uri);
        newProperty.range = helper.getValidValueArray(property.range).map((t: any) => t.uri);
        newProperty.generalization = helper.getValidValueArray(property.generalization);

        newProperties.push(newProperty);
      }
    });

    return newProperties;
  };

  public extractGeneralAttributes = (object: any, language: string): any => {
    const extendedObject: any = {};

    extendedObject['@id'] = object['@id'];
    extendedObject['@type'] = object['@type'];

    helper.addLanguageDependingValue(extendedObject, object, 'name', this.options.language);
    helper.addLanguageDependingValue(extendedObject, object, 'definition', this.options.language);
    helper.addLanguageDependingValue(extendedObject, object, 'usage', this.options.language);

    return extendedObject;
  };
}
