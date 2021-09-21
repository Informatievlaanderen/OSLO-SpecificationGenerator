import fs = require('fs/promises');
import path = require('path');
import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import pluralize = require('pluralize');
import { helper } from './Helpers';
const StringBuilder = require('string-builder');

export interface IMuConfigGeneratorOptions {
  outputDirectory: string;
  targetLanguage: string;
  stringType: boolean;
  includeExternals: boolean;
}

export class MuConfigGenerator implements ISpecification {
  public report: OSLOReport;
  public options: IMuConfigGeneratorOptions;
  public stringTypeAsString: string;

  public constructor(report: OSLOReport, options: IMuConfigGeneratorOptions) {
    this.report = report;
    this.options = options;
    this.stringTypeAsString = helper.getStringTypeAsString(options.stringType);
  }

  public generateSpecification = async (): Promise<void> => {
    const reportObject = JSON.parse(JSON.stringify(this.report));
    if (this.options.includeExternals) {
      helper.mergeExternals(reportObject);
    }

    const domainLisp = this.createDomainLispFile(reportObject);
    const repositoryLisp = this.createRepositoryLispFile();

    const repositoryLispFile = path.resolve(this.options.outputDirectory, `repository.lisp`);
    const domainLispFile = path.resolve(this.options.outputDirectory, `domain.lisp`);

    await fs.mkdir(this.options.outputDirectory, { recursive: true });
    await Promise.all([
      helper.writeResultToFile(repositoryLispFile, repositoryLisp),
      helper.writeResultToFile(domainLispFile, domainLisp),
    ]);
  };

  private readonly createRepositoryLispFile = (): string => {
    const repositoryLispContent = new StringBuilder();

    repositoryLispContent.append('(in-package :mu-cl-resources)').appendLine();
    repositoryLispContent.append(';; NOTE').appendLine();
    repositoryLispContent.append(';; docker-compose stop; docker-compose rm; docker-compose up').appendLine();
    repositoryLispContent.append(';; after altering this file.').appendLine().appendLine();
    repositoryLispContent.append(';; Describe the prefixes which you\'ll use in the domain file here.').appendLine();
    repositoryLispContent.append(';; This is a short-form which allows you to write, for example,').appendLine();
    repositoryLispContent.append(';; (s-url "http://purl.org/dc/terms/title")').appendLine();
    repositoryLispContent.append(';; as (s-prefix "dct:title")').appendLine();
    repositoryLispContent.append(' (add-prefix "sh" "http://www.w3.org/ns/shacl#")');

    return repositoryLispContent.toString();
  };

  private readonly createDomainLispFile = (reportObject: any): string => {
    const domainLispContent = new StringBuilder();

    domainLispContent.append('(in-package :mu-cl-resources)').appendLine();
    domainLispContent.append(';; NOTE').appendLine();
    domainLispContent.append(';; docker-compose stop; docker-compose rm; docker-compose up').appendLine();
    domainLispContent.append(';; after altering this file.').appendLine().appendLine();

    reportObject.classes.forEach((classObject: any) => {
      this.initClass(domainLispContent, classObject, reportObject);
      this.initDomain(domainLispContent, classObject, reportObject.properties, reportObject.classes);
      this.initRange(domainLispContent, classObject, reportObject.properties, reportObject.classes);
      this.endClass(domainLispContent, classObject);
    });

    return domainLispContent.toString();
  };

  private readonly initClass = (
    domainLispContent: typeof StringBuilder,
    classObject: any,
    reportObject: any,
  ): void => {
    domainLispContent.append(`(define-resource ${helper.getLabel(classObject, this.options.targetLanguage)} ()`).appendLine();
    domainLispContent.append(`   :class (s-url "${classObject['@id']}")`).appendLine();

    helper.addPropertiesToDomain(
      domainLispContent,
      classObject,
      reportObject,
      this.options.targetLanguage,
      this.stringTypeAsString,
    );
  };

  private readonly initDomain = (
    domainLispContent: typeof StringBuilder,
    classObject: any,
    properties: any[],
    classes: any[],
  ): void => {
    properties.forEach(propertyObject => {
      propertyObject.domain.array.forEach((domainObject: any) => {
        if (domainObject.uri === classObject['@id']) {
          this.addDomain(domainLispContent, classes, propertyObject.range, propertyObject['@id']);
        }
      });
    });
  };

  private readonly addDomain = (
    domainLispContent: typeof StringBuilder,
    classes: any[],
    ranges: any[],
    identifier: string,
  ): void => {
    ranges.forEach((rangeObject: any) => {
      const equivalentClass = this.getEquivalentClass(classes, rangeObject.uri);

      if (equivalentClass) {
        const label = helper.getLabel(equivalentClass, this.options.targetLanguage);
        domainLispContent.append(`   : has - one \`((${label} :via ,(s-url "${identifier}")`).appendLine();
        domainLispContent.append(`                        :as "${label}"))`).appendLine();
      }
    });
  };

  private readonly initRange = (
    domainLispContent: typeof StringBuilder,
    classObject: any,
    properties: any[],
    classes: any[],
  ): void => {
    properties.forEach((propertyObject: any) => {
      if (propertyObject.range) {
        propertyObject.range.array.forEach((rangeObject: any) => {
          if (rangeObject.uri === classObject['@id']) {
            this.addRange(domainLispContent, classes, propertyObject.domain, propertyObject['@id']);
          }
        });
      }
    });
  };

  private readonly addRange = (
    domainLispContent: typeof StringBuilder,
    classes: any[],
    domains: any[],
    identifier: string,
  ): void => {
    domains.forEach((domainObject: any) => {
      const equivalentClass = this.getEquivalentClass(classes, domainObject.uri);

      if (equivalentClass) {
        const label = helper.getLabel(equivalentClass, this.options.targetLanguage);
        domainLispContent.append(`   :has-many \`((${label} : via, (s - url "${identifier}")`).appendLine();
        domainLispContent.append(`                        :inverse t`).appendLine();
        const name = pluralize.plural(label);
        domainLispContent.append(`                        :as "${name}"))`).appendLine();
      }
    });
  };

  private readonly endClass = (domainLispContent: typeof StringBuilder, classObject: any): void => {
    const label = helper.getLabel(classObject, this.options.targetLanguage);
    const name = pluralize.plural(label);

    domainLispContent.append(`:resource-base (s-url "${classObject['@id']}")`).appendLine();
    domainLispContent.append(`:on-path "${name}")`).appendLine();
  };

  private readonly getEquivalentClass = (classes: any[], identifier: string): any => {
    classes.forEach((classObject: any) => {
      if (classObject['@id'] === identifier) {
        return classObject;
      }
    });

    return null;
  };
}
