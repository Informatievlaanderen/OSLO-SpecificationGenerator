export class OSLOReport {
  public context: object;
  public documentId: string;
  public documentType: string;
  public label: Record<string, string>;
  public issued: string;
  public license: string;
  public title: Record<string, string>;
  public extra: object;
  public authors: object[];
  public contributors: object[];
  public editors: object[];
  public classes: object[];
  public properties: object[];
  public externals: object[];
  public externalProperties: object[];

  public name: string;
  public type: string;

  public eapFile: string;
  public eaDiagram: string;
  public template: string;
  public titleWithOSLOPrefix: string;
  public publicationState: string;
  public publicationDate: string;
  public contributorsFile: string;
  public contributorsColumn: string;
  public feedbackUrl: string;
  public standardsRegisterUrl: string;
  public configurationFile: string;
  public urlReference: string;
  public repository: string;
  public branchtag: string;
  public filename: string;
  public navigation: unknown;
  public dummyValue: string;
  public documentCommit: string;
  public toolchainCommit: string;
  public hostname: string;

  public baseUriabbreviation: string;
  public baseUri: string;
  public namespace: string;

  public constructor(data: any) {
    this.context = data['@context'] || {};
    this.documentId = data['@id'] || '';
    this.documentType = data['@type'] || '';

    this.label = {};
    Object.keys(data.label).forEach(language => {
      this.label[`${language}`] = data.label[language];
    });

    this.issued = data.issued || '';
    this.license = data.license || '';

    this.title = {};
    Object.keys(data).forEach(key => {
      if (key.includes('title')) {
        const language = key.split('title-').pop();
        this.title[language!] = data[key];
      }
    });

    this.extra = data.extra || {};
    this.authors = data.authors || [];
    this.editors = data.editors || [];
    this.contributors = data.contributors || [];
    this.classes = data.classes || [];
    this.properties = data.properties || [];
    this.externals = data.externals || [];
    this.externalProperties = data.externalproperties || [];

    this.name = data.name || '';
    this.type = data.type || '';
    this.eapFile = data.eap || '';
    this.eaDiagram = data.diagram || '';
    this.template = data.template || '';
    this.titleWithOSLOPrefix = data.title || '';
    this.publicationState = data['publication-state'] || '';
    this.publicationDate = data['publication-date'] || '';
    this.configurationFile = data['contributors-file'] || '';
    this.contributorsColumn = data['contributors-column'] || '';
    this.feedbackUrl = data.feedbackurl || '';
    this.standardsRegisterUrl = data.standaardenregisterurl || '';
    this.configurationFile = data.config || '';
    this.urlReference = data.urlref || '';
    this.repository = data.repository || '';
    this.branchtag = data.branchtag || '';
    this.filename = data.filename || '';
    this.navigation = data.navigation || {};
    this.dummyValue = data.dummy || '';
    this.documentCommit = data.documentcommit || '';
    this.toolchainCommit = data.toolchaincommit || '';
    this.hostname = data.hostname || '';

    this.baseUriabbreviation = data.baseURIabbrev || '';
    this.baseUri = data.baseURI || '';
  }
}
