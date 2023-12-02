export default class QueryProcessor {
  constructor(query, queryObj) {
    this.query = query;
    this.queryParams = queryObj;
  }

  /**
   * Filter resources by fields such as tours by duration,price,maxGroupSize,ratingsAverage,ratingsQuantity
   * {{URL}}api/v1/tours/?duration[lte]=5&price[lt]=1500&ratingsAverage[gte]=4
   */
  filter() {
    const fields = this.#filterProtectedUndefFields(Object.keys(this.queryParams));

    const filterParams = {};
    fields.forEach((field) => { filterParams[field] = this.queryParams[field]; });

    const queryStr = JSON.stringify(filterParams).replaceAll(/\b(?<op>gt|gte|lt|lte)\b/g, '$$$&');

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Sort resources based on field such as tours by duration
   * {{URL}}api/v1/tours?fields=name,duration&sort=duration
   */
  sort() {
    if (this.queryParams.sort) {
      this.query = this.query.sort(this.queryParams.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Only give results for certain fields
   * {{URL}}api/v1/tours?fields=name,duration&sort=duration
   */
  fields() {
    if (this.queryParams.fields) {
      const fields = this.#filterProtectedUndefFields(this.queryParams.fields.split(','));
      this.query.locals = fields;
      this.query = this.query.select(fields);
    }
    return this;
  }

  /**
   * Split result in pages based on given limit
   * {{URL}}api/v1/tours?fields=name,duration&sort=duration&limit=3&page=1
   */
  paginate() {
    // eslint-disable-next-line no-magic-numbers
    const limit = Number(this.queryParams.limit) || 1000;
    const page = Number(this.queryParams.page) || 1;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  #filterProtectedUndefFields(arr) {
    const { schema } = this.query.model;
    return arr.filter((el) => schema.pathType(el) === 'real' && schema.path(el).options.select !== false);
  }
}
