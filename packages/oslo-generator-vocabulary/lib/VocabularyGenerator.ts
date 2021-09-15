import type { OSLOReport, ISpecification } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IVocabularyGeneratorOptions } from '../bin/vocabulary';
import { helper } from './Helpers';

export class VocabularyGenerator implements ISpecification {
  public report: OSLOReport;
  public options: IVocabularyGeneratorOptions;

  public constructor(report: OSLOReport, options: IVocabularyGeneratorOptions) {
    this.report = report;
    this.options = options;
  }

  public generateSpecification = async (): Promise<void> => {
    const reportObject: any = JSON.parse(JSON.stringify(this.report));
    const preparedJsonLd = this.prepareJsonLd(reportObject, this.options.language);
    const vocabulary = this.generateVocabulary(preparedJsonLd, this.options.language);

    jsonfile.writeFile(this.options.outputFile, vocabulary, { spaces: 2 })
      .then(res => {
        console.log(`[VocabularyGenerator]: Write complete; The file was saved to: ${this.options.outputFile}.`);
      })
      .catch(error => {
        console.error(error);
        process.exitCode = 1;
      });
  };

  public prepareJsonLd = (reportObject: any, language: string): any => {
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
            // Give NodeJS the chance to clear the stack
            setTimeout(() => {
              reportObject[key] = this.prepareJsonLd(reportObject[key], this.options.language);
            }, 100);
          }
          break;
      }
    });

    return reportObject;
  };

  public generateVocabulary = (preparedJsonLd: OSLOReport, language: string): any => {
    const jsonVocabulary: any = {};

    jsonVocabulary['@id'] = preparedJsonLd.documentId;
    jsonVocabulary['@type'] = preparedJsonLd.documentType;
    jsonVocabulary.label = preparedJsonLd.label;
    jsonVocabulary.authors = preparedJsonLd.authors;
    jsonVocabulary.contributors = preparedJsonLd.contributors;
    jsonVocabulary.editors = preparedJsonLd.editors;

    jsonVocabulary.baseURIabbrev = preparedJsonLd.baseUriabbreviation;
    jsonVocabulary.baseURI = preparedJsonLd.baseUri;
    jsonVocabulary.license = preparedJsonLd.license;
    jsonVocabulary.issued = preparedJsonLd.issued;
    jsonVocabulary.navigation = preparedJsonLd.navigation;
    jsonVocabulary.namespace = preparedJsonLd.namespace;

    // TODO: check if this still exists and/or should be added to OSLOReport
    // jsonVocabulary['@title']

    jsonVocabulary['publication-state'] = preparedJsonLd.publicationState;
    jsonVocabulary['publication-date'] = preparedJsonLd.publicationDate;

    jsonVocabulary.classes = this.extractClasses(preparedJsonLd.classes);
    jsonVocabulary.externals = this.extractExternals(preparedJsonLd.externals, 'rdfs:Class');
    jsonVocabulary.properties = this.extractProperties(preparedJsonLd.properties);
    jsonVocabulary.externalproperties = this.extractExternals(preparedJsonLd.externalProperties, 'rdf:Property');

    return jsonVocabulary;
  };

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
