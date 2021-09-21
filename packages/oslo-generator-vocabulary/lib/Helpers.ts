export class Helper {
  public mapEmptyString = (text: string): string => text || '';

  public mapUsageProperty = (usageProperty: any, language: string): any => usageProperty[language] ? usageProperty : {};

  public mapFoafMailboxProperty = (foafMBox: string): string => foafMBox ? `mailto:${foafMBox}` : 'mailto:oslo@kb.vlaanderen.be';

  public getValidValueArray = (array: any): any[] => array || [];

  public getValidValueObject = (object: any): any => object || {};

  public addValueIfExists = (key: any, value: any, resultObject: any): void => {
    if (value) {
      resultObject[key] = value;
    }
  };

  public addLanguageDependingValue = (
    result: any,
    object: any,
    label: string,
    language: string,
  ): void => {
    if (object[label] && object[label][language]) {
      const value = object[label][language];
      if (!result[label]) {
        result[label] = {};
      }
      result[label][language] = value === 'Enter your translation here' ? 'A translation has yet to be added' : value;
    }
  };
}

export const helper = new Helper();
