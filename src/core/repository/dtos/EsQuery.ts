/**
 * Es仓储查询
 */
export class EsQuery {
    /**
     * 构造函数
     */
    constructor(query: {
        Filter: any,
        Size?: number,
        GroupBy?: any,
        Aggs?: any,
        Select?: any
    }) {
        this.filter = query.Filter;
        this.size = query.Size;
        this.groupby = query.GroupBy;
        this.aggs = query.Aggs;
        this.select = query.Select;
    }
    filter: any;
    size?: number;
    groupby?: any;
    aggs?: any;
    select?: any;
}

/**
 * Es仓储Dsl查询
 */
export class EsQueryDsl {
    /**
     * 构造函数
     */
    constructor(query: {
        Query: any,
        Size?: number,
        Aggs?: any,
        Select?: any
    }) {
        this.query = query.Query;
        this.size = query.Size;
        this.aggs = query.Aggs;
        this._source = query.Select;
    }

    query: any;
    size?: number;
    aggs?: any;
    _source?: any;
}
