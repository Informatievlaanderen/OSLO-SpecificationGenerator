import fs = require('fs/promises');
import path = require('path');
import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import pluralize = require('pluralize');
import { helper } from './Helpers';

export interface IMuConfigGeneratorOptions {
  outputDirectory: string;
  targetLanguage: string;
  stringType: boolean;
  includeExternals: boolean;
}

// TODO: check if output contains correct new lines
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

    this.createDomainLispFile(reportObject);
    this.createRepositoryLispFile();
  };

  private readonly createRepositoryLispFile = (): void => {
    const repositoryLispContent = `
      (in-package :mu-cl-resources)
      ;; NOTE
      ;; docker-compose stop; docker-compose rm; docker-compose up
      ;; after altering this file.
      ;; Describe the prefixes which you'll use in the domain file here.
      ;; This is a short-form which allows you to write, for example,
      ;; (s-url "http://purl.org/dc/terms/title")
      ;; as (s-prefix "dct:title")
       (add-prefix "sh" "http://www.w3.org/ns/shacl#")\n`;

    const outputFile = path.resolve(this.options.outputDirectory, `repository.lisp`);
    fs.writeFile(outputFile, repositoryLispContent)
      .then(() => {
        console.log(`[MuConfigGenerator]: Succesfully saved content to ${outputFile}.`);
      })
      .catch((error: any) => {
        console.log(`[MuConfigGenerator]: Encountered error while writing to ${outputFile}.`);
        console.error(error);
      });
  };

  private readonly createDomainLispFile = (reportObject: any): void => {
    let domainListContent = `
      (in-package :mu-cl-resources)
      ;; NOTE
      ;; docker-compose stop; docker-compose rm; docker-compose up
      ;; after altering this file.\n\n`;

    reportObject.classes.array.forEach((classObject: any) => {
      domainListContent += this.initClass(classObject, reportObject);
      domainListContent += this.initDomain(classObject, reportObject.properties, reportObject.classes);
      domainListContent += this.initRange(classObject, reportObject.properties, reportObject.classes);
      domainListContent += this.endClass(classObject);
    });

    const outputFile = path.resolve(this.options.outputDirectory, 'domain.lisp');
    fs.writeFile(outputFile, domainListContent)
      .then(() => {
        console.log(`[MuConfigGenerator]: Succesfully saved content to ${outputFile}`);
      })
      .catch((error: any) => {
        console.log(`[MuConfigGenerator]: Encoutered error while writing to ${outputFile}`);
        console.error(error);
      });
  };

  private readonly initClass = (classObject: any, reportObject: any): string => {
    let domainBuilder = `(define-resource ${helper.getLabel(classObject, this.options.targetLanguage)} ()
    :class (s-url "${classObject['@id']}")`;

    domainBuilder += helper.addPropertiesToDomain(
      classObject,
      reportObject,
      this.options.targetLanguage,
      this.stringTypeAsString,
    );

    return domainBuilder;
  };

  private readonly initDomain = (classObject: any, properties: any[], classes: any[]): string => {
    let domainBuilder = '';

    properties.forEach(propertyObject => {
      propertyObject.domain.array.forEach((domainObject: any) => {
        if (domainObject.uri === classObject['@id']) {
          domainBuilder = this.addDomain(classes, propertyObject.range, propertyObject['@id']);
        }
      });
    });

    return domainBuilder;
  };

  private readonly addDomain = (classes: any[], ranges: any[], identifier: string): string => {
    let domainBuilder = '';
    ranges.forEach((rangeObject: any) => {
      const equivalentClass = this.getEquivalentClass(classes, rangeObject.uri);

      if (equivalentClass) {
        const label = helper.getLabel(equivalentClass, this.options.targetLanguage);
        domainBuilder += `   :has-one \`((${label} :via ,(s-url "${identifier}")
                                :as "${label}"))\n`;
      }
    });

    return domainBuilder;
  };

  private readonly initRange = (classObject: any, properties: any[], classes: any[]): string => {
    let domainBuilder = '';

    properties.forEach((propertyObject: any) => {
      if (propertyObject.range) {
        propertyObject.range.array.forEach((rangeObject: any) => {
          if (rangeObject.uri === classObject['@id']) {
            domainBuilder = this.addRange(classes, propertyObject.domain, propertyObject['@id']);
          }
        });
      }
    });

    return domainBuilder;
  };

  private readonly addRange = (classes: any[], domains: any[], identifier: string): string => {
    let domainBuilder = '';

    domains.forEach((domainObject: any) => {
      const equivalentClass = this.getEquivalentClass(classes, domainObject.uri);

      if (equivalentClass) {
        const label = helper.getLabel(equivalentClass, this.options.targetLanguage);
        domainBuilder += `'   :has-many \`((${label} :via ,(s-url "${identifier}")
                                :inverse t\n`;
        const name = pluralize.plural(label);
        domainBuilder += `                        :as "${name}"))\n`;
      }
    });

    return domainBuilder;
  };

  private readonly endClass = (classObject: any): string => {
    const label = helper.getLabel(classObject, this.options.targetLanguage);
    const name = pluralize.plural(label);

    return `:resource-base (s-url "${classObject['@id']}")
    :on-path "${name}")\n\n`;
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
