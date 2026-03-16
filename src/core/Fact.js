/**
 * Fact - Đại diện cho một fact (sự kiện) trong working memory
 */
export class Fact {
  constructor(factId, factType, data, source = 'initial', derivedFrom = []) {
    this.factId = factId;
    this.factType = factType;
    this.data = data;
    this.source = source;
    this.derivedFrom = derivedFrom;
    this.timestamp = new Date();
  }

  toString() {
    return `Fact(${this.factId}, type=${this.factType}, source=${this.source})`;
  }
}
