import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import { helper } from './Helpers';

export interface IContextGeneratorOptions {
  outputFile: string;
  language: string;
  forceDomain: boolean;
  labelChoice: string;
}

export class ContextGenerator implements ISpecification {
  public report: OSLOReport;
  public options: IContextGeneratorOptions;

  public constructor(report: OSLOReport, options: IContextGeneratorOptions) {
    this.report = report;
    this.options = options;
  }

  /**
   * Generates a JSON-LD context and writes it to a file
   */
  public generateSpecification = async (): Promise<void> => {
    const duplicates = this.identifyDuplicates(
      [...this.report.properties, ...this.report.externalProperties],
      this.options.language,
    );
    const enterpriseArchitectClassNames = this.getEANameClasses(
      [...this.report.classes, ...this.report.externals],
      this.options.language,
    );
    const classNameIdMap = this.getClassNameIdMap(this.report.classes, this.options.language);
    const propertyContext = this.getPropertyContext(
      enterpriseArchitectClassNames,
      duplicates,
      this.report.properties,
      this.options.language,
    );
    const externalNameIdMap = this.getExternalsNameIdMap(this.report.externals, this.options.language);
    const externalPropertyContext = this.getPropertyContext(
      enterpriseArchitectClassNames,
      duplicates,
      this.report.externalProperties,
      this.options.language,
    );

    const context = this.generateContext(classNameIdMap, propertyContext, externalNameIdMap, externalPropertyContext);

    jsonfile.writeFile(this.options.outputFile, Object.fromEntries(context), { spaces: 2 })
      .then(res => {
        console.log(`[ContextGenerator]: JSON-LD context successfully save to ${this.options.outputFile}.`);
      })
      .catch(error => {
        console.log(`[ContextGenerator]: Something went wrong when writing to ${this.options.outputFile}.`);
        console.log(error);
      });
  };

  /**
   * Identifies all duplicate properties in the report. Because of modelling,
   * a term can be used multiple times within another class
   * and with another URI. These terms are identified by this function and must be disambiguated.
   *
   * @param properties
   * @param language
   * @returns a map containing all properties and their URIs
   */
  private readonly identifyDuplicates = (properties: any[], language: string): Map<string, string[]> => {
    const termIdMap = new Map<string, string[]>();

    properties.reduce(
      (accumulator, currentValue) => this.termIdReducer(accumulator, currentValue, language), termIdMap,
    );

    const duplicates = new Map<string, string[]>();
    termIdMap.forEach((value: string[], key: string) => {
      if (value.length > 1) {
        const unique = new Set(value);
        if (unique.size > 1) {
          duplicates.set(key, value);
        }
      }
    });

    return duplicates;
  };

  /**
   * Generates the JSON-LD context
   *
   * @param classNameIdMap
   * @param propertiesContext
   * @param externalNameIdMap
   * @param externalPropertiesContext
   * @returns a map with '@context' as key and the actual context as value
   */
  private readonly generateContext = (
    classNameIdMap: Map<string, string>,
    propertiesContext: Map<string, unknown>,
    externalNameIdMap: Map<string, string>,
    externalPropertiesContext: Map<string, unknown>,
  ): Map<string, unknown> => {
    console.log(`[ContextGenerator]: Start creating context for ${this.report.documentId}`);

    const context = new Map<string, any>();

    if (classNameIdMap.size > 0) {
      classNameIdMap.forEach((value: string, key: string) => {
        context.set(key, value);
      });
    }

    if (propertiesContext.size > 0) {
      propertiesContext.forEach((value: unknown, key: string) => {
        context.set(key, value);
      });
    }

    if (externalNameIdMap.size > 0) {
      externalNameIdMap.forEach((value: string, key: string) => {
        context.set(key, value);
      });
    }

    if (externalPropertiesContext.size > 0) {
      externalPropertiesContext.forEach((value: unknown, key: string) => {
        context.set(key, value);
      });
    }

    const result = new Map();
    result.set('@context', Object.fromEntries(context));

    return result;
  };

  /**
   * Maps class names to their identifiers
   *
   * @param classes
   * @param language
   * @returns a map containing class names as keys and their identifiers as values
   */
  private readonly getClassNameIdMap = (classes: any[], language: string): Map<string, string> => {
    const classNameIdMap = new Map<string, string>();
    classes.map(classObject => this.mapClassNameToId(classObject, language, classNameIdMap));

    return classNameIdMap;
  };

  /**
   * Creates context object for all property (disambiguation, sets correct types, ...)
   *
   * @param eaClassNames
   * @param duplicates
   * @param properties
   * @param language
   * @returns a map containing the property identifiers as keys with their context object as values
   */
  private readonly getPropertyContext = (
    eaClassNames: Map<string, string>,
    duplicates: Map<string, string[]>,
    properties: any[], language: string,
  ): Map<string, unknown> => {
    const propertyContextMap = new Map<string, unknown>();
    properties.map(
      property => this.createPropertyContext(property, eaClassNames, duplicates, language, propertyContextMap),
    );

    return propertyContextMap;
  };

  /**
   * Maps external class names to their identifiers
   *
   * @param externals
   * @param language
   * @returns a map containing the external class names as keys and their identifiers as values
   */
  private readonly getExternalsNameIdMap = (externals: any[], language: string): Map<string, string> => {
    const externalsNameIdMap = new Map<string, string>();
    externals.map(external => this.mapExternalsNameToId(external, language, externalsNameIdMap));

    return externalsNameIdMap;
  };

  /**
   * Maps label names to their respective Enterprise Architect names
   * In case the useLabel's options "uml" was provided, key and value are the same
   *
   * @param classes
   * @param language
   * @returns a map containing the enterprise architect name as keys and their label names as values
   */
  private readonly getEANameClasses = (classes: any[], language: string): Map<string, string> => {
    const termEaNameMap = new Map<string, string>();

    classes.reduce(
      (accumulator, currentValue) => this.eaNameReducer(accumulator, currentValue, language), termEaNameMap,
    );

    return termEaNameMap;
  };

  /**
   * Reducer function to identify all duplicates in an array of properties
   *
   * @param accumulator
   * @param object
   * @param language
   * @returns an updated map of terms mapped to their URIs
   */
  private readonly termIdReducer = (accumulator: any, object: any, language: string): Map<string, string[]> => {
    const term = helper.extractName(object, language, this.options.labelChoice);

    if (accumulator.has(term)) {
      accumulator.set(term, [...accumulator.get(term), object['@id']]);
    } else {
      accumulator.set(term, [object['@id']]);
    }

    if (term === 'inhoud') {
      if (accumulator.has(term)) {
        console.log(`Term already in map, so adding it`);
      } else {
        console.log(`First time`);
        accumulator.set(term, [object['@id']]);
      }
    }

    return accumulator;
  };

  /**
   * Reducer function to extract label name and/or enterprise architect names from class objects
   *
   * @param accumulator
   * @param object
   * @param language
   * @returns a map with enterprise architect names as key and their label name or enterprise architect name as value
   */
  private readonly eaNameReducer = (accumulator: any, object: any, language: string): Map<string, string> => {
    const term = helper.extractName(object, language, this.options.labelChoice);
    const eaName = object.extra['EA-Name'];

    if (accumulator.has(eaName)) {
      console.log(`[ShaclGenerator]: Multiple values for the same EA-Name: ${eaName}.`);
      console.log(`[ShaclGenerator]: Value '${accumulator.get(eaName)}'' will be overwritten with '${term}'.`);
      accumulator.set(eaName, term);
    } else {
      accumulator.set(eaName, term);
    }

    return accumulator;
  };

  /**
   * Extract the class name and the identifier from a class objects and adds it to a map
   *
   * @param classObject
   * @param language
   * @param result
   */
  private readonly mapClassNameToId = (classObject: any, language: string, result: Map<string, string>): void => {
    const className = helper.extractName(classObject, language, this.options.labelChoice);
    const identifier = helper.extractIdentifier(classObject);

    result.set(helper.capitalizeFirst(className), identifier);
  };

  /**
   * Extract the external name and the identifier from an external class object and adds it to a map
   *
   * @param external
   * @param language
   * @param result
   */
  private readonly mapExternalsNameToId = (external: any, language: string, result: Map<string, string>): void => {
    const externalName = helper.extractName(external, language, this.options.labelChoice);
    const identifier = helper.extractIdentifier(external);

    result.set(helper.capitalizeFirst(externalName), identifier);
  };

  /**
   * Generates context object for a property and adds it to a map
   * @param property
   * @param eaClassNames
   * @param duplicates
   * @param language
   * @param result
   */
  private readonly createPropertyContext = (
    property: any,
    eaClassNames: Map<string, string>,
    duplicates: Map<string, string[]>,
    language: string, result: Map<string, unknown>,
  ): void => {
    let rangeObject;
    let rangeUri;

    if (property.range.length === 0) {
      console.log(`[ContextGenerator]: No range found for '${property.name}'.`);
    } else {
      if (property.range.length > 1) {
        console.log(`[ContextGenerator]: More than one type was found for '${property.name}', but first type will be used.`);
      }

      rangeObject = property.range[0];
      rangeUri = rangeObject.uri;
    }

    let propertyType;

    if (property['@type'] === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
      propertyType = '@id';
    } else {
      propertyType = rangeUri;
    }

    const propertyName = helper.extractName(property, language, this.options.labelChoice);
    let propertyContext;
    let propertyIdentifier;

    if (duplicates.has(propertyName) || this.options.forceDomain) {
      const domain = property.extra['EA-Domain'];

      if (domain === '' || domain === undefined) {
        console.error(`[ContextGenerator]: No domain found to disambiguate for '${propertyName}'.`);
        propertyIdentifier = '';
      } else {
        propertyIdentifier = `${helper.capitalizeFirst(eaClassNames.get(domain)!)}.${propertyName}`;
      }
    } else {
      propertyIdentifier = propertyName;
    }

    if (Number(property.maxCardinality) > 1) {
      propertyContext = {
        '@id': property['@id'],
        '@type': propertyType,
        '@container': '@set',
      };
    } else {
      propertyContext = {
        '@id': property['@id'],
        '@type': propertyType,
      };
    }

    if (!result.has(propertyIdentifier)) {
      result.set(propertyIdentifier, propertyContext);
    } else {
      console.error(`[ContextGenerator]: key '${propertyIdentifier}' already exists with value '${JSON.stringify(result.get(propertyIdentifier)!)}'.`);
    }
  };
}
