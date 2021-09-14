export class Helpers {
  public camelize(text: string): string {
    return text.replace(/(?:^\w|[A-Z]|\b\w)/gu, (word: string, index: number) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/gu, '');
  }

  public extractName = (object: any, language: string, labelChoice: string): string => {
    if (labelChoice === 'label' && object.label && object.label[language]) {
      return this.camelize(object.label[language]);
    }
    return object.extra['EA-Name'];
  };

  public extractIdentifier = (object: any): string => object['@id'];

  public capitalizeFirst = (name: string): string => {
    if (typeof name !== 'string') {
      return '';
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
}

export const helper = new Helpers();
