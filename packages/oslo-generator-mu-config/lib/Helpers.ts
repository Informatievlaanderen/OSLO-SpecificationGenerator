import camelCase = require('camelcase');

export class Helper {
  public mergeExternals = (reportObject: any): void => {
    reportObject.classes = [...reportObject.classes, ...reportObject.externals];
    reportObject.properties = [...reportObject.properties, ...reportObject.externalproperties];
  };

  public readonly addPropertiesToDomain = (
    classObject: any,
    reportObject: any,
    language: string,
    stringType: string,
  ): string => {
    const propertyIdLiteral = this.extractPropertiesForClassObject(classObject, reportObject, language);
    let config = '';

    if (propertyIdLiteral.length > 0) {
      config += `   :properties \`((`;

      propertyIdLiteral.forEach((literal: any, index: number) => {
        const name = literal.label.replace(' \', \'');
        const id = literal.id;

        if (index !== 0) {
          config += '\n';
          config += '                 (';
        }
        config += `:${name} ${stringType} ,(s-url "${id}"))`;
      });

      config += ')\n';
    }

    return config;
  };

  public readonly extractPropertiesForClassObject = (classObject: any, reportObject: any, language: string): any[] => {
    let propertyIdLiteral: any[] = [];

    reportObject.properties.array.forEach((propertyObject: any) => {
      propertyObject.domain.array.forEach((domainObject: any) => {
        if (domainObject.uri === classObject['@id']) {
          propertyIdLiteral = this.extractPropertyLiterals(propertyObject, language);
        }
      });
    });

    return propertyIdLiteral;
  };

  public extractPropertyLiterals = (propertObject: any, language: string): any[] => {
    const propertyIdLiteral: any[] = [];

    propertObject.range.array.forEach((rangeObject: any) => {
      if (this.propertyIsLiteral(rangeObject.uri)) {
        let label = this.getLabel(propertObject, language);
        label = this.lowerCaseFirstLetter(label);

        propertyIdLiteral.push({
          id: propertObject['@id'],
          label,
        });
      }
    });

    return propertyIdLiteral;
  };

  public propertyIsLiteral = (uri: string): boolean => {
    const literals = [
      'http://www.w3.org/2001/XMLSchema#',
      'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'https://www.w3.org/TR/xmlschema11-2/#',
    ];

    return literals.includes(uri);
  };

  public getLabel = (propertyObject: any, language: string): string => {
    if (propertyObject.label && propertyObject.label[language]) {
      let label: string = this.toCamelCase(propertyObject.label[language]);
      label = label.toLowerCase();
      return this.capitalizeFirstLetter(label);
    }

    console.log(`[MuConfigGenerator]: No label present for language '${language}', using EA - Name instead.`);
    return propertyObject.extra['EA-Name'];
  };

  private readonly toCamelCase = (text: string): string => {
    let camelCased = camelCase(text);
    camelCased = camelCased.replace(/\s\(source\)/gu, '(source)').replace(/\s\(target\)/gu, '(target)');

    return camelCased;
  };

  private readonly capitalizeFirstLetter = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

  private readonly lowerCaseFirstLetter = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

  public getStringTypeAsString = (stringType: boolean): string => {
    if (stringType) {
      return ':language-string';
    }

    return ':string';
  };
}

export const helper = new Helper();
