const targetAttributes: string[] = [
  'label',
  'definition',
  'usage',
];

export class Helper {
  public extractTargetAttributesToNewObject = (
    originalObject: any,
    baseLanguage: string,
    targetLanguage: string,
  ): any => {
    const resultObject: any = {};

    resultObject['EA-Guid'] = originalObject['EA-Guid'];
    resultObject.name = originalObject.name ? originalObject.name : '';

    if (targetLanguage !== baseLanguage) {
      this.extractTargetAttributes(originalObject, resultObject, baseLanguage, targetLanguage);
    } else {
      this.extractTargetAttributesBaseLanguage(originalObject, resultObject, baseLanguage);
    }

    return resultObject;
  };

  public translateProperty = (
    simplifiedReportObjectProperties: any[],
    originalReportObject: any,
    baseLanguage: string,
    targetLanguage: string,
    type: string,
  ): any => {
    const result: any[] = [];

    simplifiedReportObjectProperties.forEach(propertyObject => {
      const originalObject = this.getOriginalObject(type, originalReportObject, propertyObject) || {};
      result.push(this.createUpdatedObject(originalObject, propertyObject, baseLanguage, targetLanguage));
    });
  };

  private readonly extractTargetAttributes = (
    originalObject: any,
    newObject: any,
    baseLanguage: string,
    targetLanguage: string,
  ): void => {
    targetAttributes.forEach(attribute => {
      if (originalObject[attribute]) {
        newObject[attribute] = originalObject[attribute];
        if (originalObject[attribute][baseLanguage]) {
          newObject[attribute][baseLanguage] = originalObject[attribute][baseLanguage];
          newObject[attribute][targetLanguage] = 'Enter your translation here';
        }
      }
    });
  };

  private readonly extractTargetAttributesBaseLanguage = (
    originalObject: any,
    newObject: any,
    baseLanguage: string,
  ): void => {
    targetAttributes.forEach(attribute => {
      if (originalObject[attribute]) {
        newObject[attribute] = originalObject[attribute];
        newObject[attribute][baseLanguage] = originalObject[attribute][baseLanguage];
      }
    });
  };

  private readonly getOriginalObject = (
    type: string,
    originalReportObject: any,
    translationPropertyObject: any,
  ): any => {
    translationPropertyObject[type].array.forEach((element: any) => {
      if (element['EA-Guid'] === originalReportObject.extra['EA-Guid']) {
        return element['EA-Guid'];
      }
    });

    return null;
  };

  private readonly createUpdatedObject = (
    objectToTranslate: any,
    propertyObject: any,
    baseLanguage: string,
    targetLanguage: string,
  ): any => {
    const updatedObject: any = {};

    updatedObject.name = propertyObject.name;
    updatedObject['EA-Guid'] = propertyObject['EA-Guid'];
    targetAttributes.forEach(attribute => {
      if (baseLanguage !== targetLanguage) {
        this.addAttributeForDifferentLanguage(
          objectToTranslate,
          propertyObject,
          baseLanguage,
          targetLanguage,
          attribute,
          updatedObject,
        );
      } else {
        this.addAttributeForSameLanguage(objectToTranslate, propertyObject, baseLanguage, attribute, updatedObject);
      }
    });

    return updatedObject;
  };

  /**
   * This function is called when the prime and goallanguage are the same. When that is the case,
   * the updatedjson will simply get all
   * values as they are from the jsonld. If they have been changed since the original translation json was created,
   * they will be tagged as '[UPDATED]'.
   */
  private readonly addAttributeForSameLanguage = (
    objectToTranslate: any,
    propertyObject: any,
    baseLanguage: string,
    attribute: string,
    resultObject: any,
  ): void => {
    if (propertyObject[attribute] && propertyObject[attribute][baseLanguage]) {
      resultObject[attribute] = {};

      if (objectToTranslate[attribute] &&
        objectToTranslate[attribute][baseLanguage] &&
        objectToTranslate[attribute][baseLanguage] !== propertyObject[attribute][baseLanguage] &&
        !objectToTranslate[attribute][baseLanguage].includes('[UPDATED]')) {
        resultObject[attribute][baseLanguage] = `[UPDATED] ${propertyObject[attribute][baseLanguage]}`;
      } else {
        resultObject[attribute][baseLanguage] = propertyObject[attribute][baseLanguage];
      }
    }
  };

  /**
   * If two different languages are given, this method will compare the
   * jsonld and json input based on a defined attribute. If that attribute is not present in the jsonld,
   * it won't be in the updated translation json. If it is, there first is determined
   * if the attribute was already translated. If so, it will get the additional tag '[UPDATED]'
   * when the attribute's value for the prime language has been changed.
   * If not the translation is simply kept. If there is no translation present,
   * the goallanguage will have the value 'Enter your translation here'.
  */
  private readonly addAttributeForDifferentLanguage = (
    objectToTranslate: any,
    propertyObject: any,
    baseLanguage: string,
    targetLanguage: string,
    attribute: string,
    resultObject: any,
  ): void => {
    if (propertyObject[attribute] && propertyObject[attribute][baseLanguage]) {
      resultObject[attribute] = {};
      resultObject[attribute][baseLanguage] = propertyObject[attribute][baseLanguage];

      if (objectToTranslate[attribute] && objectToTranslate[attribute][targetLanguage]) {
        if (objectToTranslate[attribute][baseLanguage] !== propertyObject[attribute][baseLanguage] &&
          objectToTranslate[attribute][targetLanguage].includes('[UPDATED]') < 0 &&
          objectToTranslate[attribute][targetLanguage] !== 'Enter your translation here') {
          resultObject[attribute][targetLanguage] = `[UPDATED] ${objectToTranslate[attribute][targetLanguage]}`;
        } else {
          resultObject[attribute][targetLanguage] = objectToTranslate[attribute][targetLanguage];
        }
      } else {
        resultObject[attribute][targetLanguage] = 'Enter your translation here';
      }
    }
  };
}

export const helper = new Helper();
