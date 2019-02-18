import { IRepository } from "./IRepository";
import { EsQuery, EsQueryDsl } from './dtos/EsQuery';
import { ConfigCenter } from "../config/ConfigCenter";
import { FrameworkCache } from "../cache/Cache";
import { ICache } from "../cache/ICache";
import { AddCacheDto } from "../cache/dtos/AddCacheDto";
import { IEntity } from "../entities/baseEntities/BaseEntity";
import { GetCacheInput } from "../cache/dtos/GetCacheInput";
import { IHasCreationTime, IHasCreationMember, IHasModificationTime, IHasModificationMember } from "../entities/baseEntities/IAudit";
import { IBrand } from "../entities/baseEntities/IBrand";
import { IStore } from "../entities/baseEntities/IStore";
import { Common } from "../common/Common";
import { IRequest } from "../request/IRequest";

export class RepositoryFactory {
    private static readonly ConfigCenter: ConfigCenter = ConfigCenter.GetInstance();
    private static readonly FrameworkCache: ICache = FrameworkCache.GetCacheInstance();

    static CreateRepositoryInstance<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number>(Entity: { new(): TEntity; }): boolean {

        let esClient = this.ConfigCenter.GetEsClientInstance();
        let repository: IRepository<TEntity, TPrimaryKey>;
        let entityInfo = new Entity().GetEntityInfo();

        if (esClient)
            repository = new EsClientRepository<TEntity, TPrimaryKey>(entityInfo.Index, entityInfo.Type, Entity);
        else
            repository = new EsHttpRepository<TEntity, TPrimaryKey>(entityInfo.Index, entityInfo.Type, Entity);

        let cashKey = "R_" + entityInfo.Name;
        let obj = new AddCacheDto(cashKey, repository, 0);
        this.FrameworkCache.AddCache(obj);
        return true;
    }

    static GetRepositoryInstance<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number>(Entity: { new(): TEntity; }): IRepository<TEntity, TPrimaryKey> {
        let entityInfo = new Entity().GetEntityInfo();
        let cashKey = "R_" + entityInfo.Name;
        let input = new GetCacheInput(cashKey);
        return this.FrameworkCache.GetCache(input);
    }

}

abstract class BaseRepository<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number>
    implements IRepository<TEntity, TPrimaryKey> {
    protected Index: string;
    protected Type: string;
    protected ConfigCenter: ConfigCenter;
    protected Request: IRequest;
    protected EntityInfo: TEntity;


    constructor(index: string, type: string, Entity: { new(): TEntity }) {
        this.EntityInfo = new Entity();
        this.Index = index;
        this.Type = type;
        this.ConfigCenter = ConfigCenter.GetInstance();
        this.Request = this.ConfigCenter.GetRequestInstance();
    }

    /**
     * 构建Dsl语句
     * @param params 
     */
    protected ConstructionDsl(params: EsQuery): EsQueryDsl {
        let query = new EsQueryDsl({ Query: { and: [] } });
        //构建Dsl查询对象
        for (const key in params.filter) {
            if (params.filter.hasOwnProperty(key)) {
                const element = params.filter[key];
                let dslObjType = 'term';
                if (element && element.gte) {
                    dslObjType = 'range';
                }
                else if (element && element._match) {
                    dslObjType = 'match';
                }
                else {
                    if (Object.prototype.toString.call(element) == '[object Array]') {
                        dslObjType = 'terms';
                    } else {
                        dslObjType = 'term';
                    }
                }
                if (element && element._match)
                    query.query.and.push(this.ParmsToDsl(dslObjType, key, element._match));
                else if (element == "_exists" || element == "_missing") {
                    let pObj: any;
                    if (element == "_exists")
                        pObj = { exists: { field: key } };
                    else
                        pObj = { missing: { field: key } };

                    query.query.and.push(pObj);
                }
                else
                    query.query.and.push(this.ParmsToDsl(dslObjType, key, element));
            }
        }

        //TODO：写了Agg 就别写groupby了 实在要高级查询就自己写Dsl查询
        if (params.aggs) {
            query.aggs = {};
            //构建Dsl聚合对象
            for (const key in params.aggs) {
                if (params.aggs.hasOwnProperty(key)) {
                    const element: Array<any> = params.aggs[key];
                    if (element.length < 1)
                        break;
                    element.forEach(item => {
                        query.aggs[key + '_' + item] = this.ParmsToDsl(key, 'field', item);
                    });
                }
            }
        }
        else if (params.groupby) {
            query.aggs = {};
            //TODO:对不起小弟水平有限，实在写不出这玩意，希望哪位大哥能给我加上 (能用就将就用吧)
            for (const key in params.groupby) {
                if (params.groupby.hasOwnProperty(key)) {
                    const element = params.groupby[key];
                    if (element) {
                        if (element.length < 1)
                            break;

                        let terms = { "field": key, "size": 500 };
                        let aggregations: { [key: string]: any } = {};
                        for (const aggKey in element) {
                            if (element.hasOwnProperty(aggKey)) {
                                const aggElement: Array<any> = element[aggKey];
                                if (aggElement.length < 1)
                                    break;

                                aggElement.forEach((item: any) => {
                                    aggregations[aggKey + '_' + item] = this.ParmsToDsl(aggKey, 'field', item);
                                });
                            }
                        }

                        query.aggs[key] = {
                            terms: {
                                "field": key,
                                "size": 500
                            },
                            aggregations: aggregations
                        };
                    }

                }
            }
        }
        //构建指定字段
        query._source = params.select;

        if (params.size)
            query.size = params.size;

        //构建Dsl分组对象
        // console.log("生成的Dsl语句是:", query);
        return query;
    }

    /**
     * 构建默认参数
     * @param filter 
     */
    protected CtorDefaultParams(filter: any): any {
        //这个地方可以修改的
        // this.EntityInfo.CheckImplements('IBrand') 用这个玩意

        let storeInfo = this.ConfigCenter.GetStoreInfo();
        let brandInfo = this.ConfigCenter.GetBrandInfo();
        if (filter && typeof filter === "object") {
            for (const key in filter) {
                if (filter.hasOwnProperty(key)) {
                    if (filter[key] && typeof filter[key] === "object") {
                        //如果是brandId 属性下面的Array  就执行绑定操作
                        if (key === "brandId" || key === "brand_id" || key === "storeId" || key === "store_id") {
                            if (Object.prototype.toString.call(filter[key]) === '[object Array]') {
                                let storeIdOrBrandId = (key === "brandId" || key === "brand_id") ? brandInfo.brandId : storeInfo.storeId;
                                for (let index = 0; index < filter[key].length; index++) {
                                    const element = filter[key][index];
                                    if (element === '#')
                                        filter[key][index] = storeIdOrBrandId + "";
                                }
                            }
                        }
                        else
                            this.CtorDefaultParams(filter[key]);
                    }
                    else {
                        //给品牌Id赋值
                        if ((key === "brandId" || key === "brand_id") && filter[key] === '#') {
                            filter[key] = brandInfo.brandId + '';
                        }
                        //给门店Id赋值
                        if ((key === "storeId" || key === "store_id") && filter[key] === '#') {
                            filter[key] = storeInfo.storeId + '';
                        }
                    }
                }
            }
        }
        return filter;
    }

    protected CtorDefaultImpleData(entity: TEntity) {
        let date = new Date();
        if (!entity.id) {
            entity.id = <TPrimaryKey>Common.GetUuid();

            if (entity.CheckImplements("IBrand")) {
                let brandIdInfo = this.ConfigCenter.GetBrandInfo();
                (<IBrand>(<any>entity)).brandId = brandIdInfo.brandId;
            }

            if (entity.CheckImplements("IStore")) {
                let storeInfo = this.ConfigCenter.GetStoreInfo();
                (<IStore>(<any>entity)).storeId = storeInfo.storeId;
            }

            if (entity.CheckImplements("IHasCreationTime")) {
                (<IHasCreationTime>(<any>entity)).created = date.getTime();
            }

            if (entity.CheckImplements("IHasCreationMember")) {
                let sysInfo = this.ConfigCenter.GetSysInfo();
                if (sysInfo.isUser) {
                    (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.sysId;
                    (<IHasCreationMember>(<any>entity)).creationMemberName = sysInfo.sysName;
                }
                else {
                    (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.memberId;
                    (<IHasCreationMember>(<any>entity)).creationMemberName = "Member";
                }
            }

        } else {
            if (entity.CheckImplements("IHasModificationTime")) {
                (<IHasModificationTime>(<any>entity)).modified = date.getTime();
            }

            if (entity.CheckImplements("IHasModificationMember")) {
                let sysInfo = this.ConfigCenter.GetSysInfo();
                if (sysInfo.isUser) {
                    (<IHasModificationMember>(<any>entity)).modificationMemberId = sysInfo.sysId;
                    (<IHasModificationMember>(<any>entity)).modificationMemberName = sysInfo.sysName;
                }
                else {
                    (<IHasModificationMember>(<any>entity)).modificationMemberId = sysInfo.memberId;
                    (<IHasModificationMember>(<any>entity)).modificationMemberName = "Member";
                }
            }
        }
    }

    /**
     * 参数转换为Dsl参数
     */
    protected ParmsToDsl = function (type: string, key: string, val: any) {
        let obj: { [key: string]: any } = {};
        obj[type] = {};
        obj[type][key] = val;
        return obj;
    };

    /**
     * 根据Dsl查询
     * @param query 
     */
    public abstract GetAllByDsl(query: EsQueryDsl): Promise<any>;

    /**
     * 根据EsQuery查询
     * @param query 
     */
    public GetAll(query: EsQuery): Promise<any> {
        let dsl = this.ConstructionDsl(query);
        return this.GetAllByDsl(dsl);
    }

    public abstract UpdateByQuery(query: any, entity: TEntity): Promise<boolean>;

    UpdateById(entity: TEntity): Promise<boolean> {
        return this.UpdateByQuery({}, entity);
    }
    UpdateByEsId(entity: TEntity, esId: TPrimaryKey): Promise<boolean> {
        entity.id = esId;
        return this.CreateOrUpdate(entity);
    }

    public Create(entity: TEntity): Promise<boolean> {
        let date = new Date();
        if (!entity.id) {
            entity.id = <TPrimaryKey>Common.GetUuid();
        }

        if (entity.CheckImplements("IBrand")) {
            let brandIdInfo = this.ConfigCenter.GetBrandInfo();
            (<IBrand>(<any>entity)).brandId = brandIdInfo.brandId;
        }

        if (entity.CheckImplements("IStore")) {
            let storeInfo = this.ConfigCenter.GetStoreInfo();
            (<IStore>(<any>entity)).storeId = storeInfo.storeId;
        }

        if (entity.CheckImplements("IHasCreationTime")) {
            (<IHasCreationTime>(<any>entity)).created = date.getTime();
        }

        if (entity.CheckImplements("IHasCreationMember")) {
            let sysInfo = this.ConfigCenter.GetSysInfo();
            if (sysInfo.isUser) {
                (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.sysId;
                (<IHasCreationMember>(<any>entity)).creationMemberName = sysInfo.sysName;
            }
            else {
                (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.memberId;
                (<IHasCreationMember>(<any>entity)).creationMemberName = "Member";
            }
        }

        return this.CreateOrUpdate(entity);
    };
    public abstract CreateOrUpdate(entity: TEntity): Promise<boolean>;

    public abstract DeleteByQuery(query: any): Promise<boolean>;
    public abstract DeleteById(id: TPrimaryKey): Promise<boolean>;
    public abstract DeleteByEsId(esId: TPrimaryKey): Promise<boolean>;

    public abstract Bulk(data: TEntity[], opt: "Update" | "Create"): Promise<boolean>;
}


class EsHttpRepository<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number>
    extends BaseRepository<TEntity, TPrimaryKey> {
    private readonly _esProxyUrl: string;
    private readonly _fullRequestUrl: string;

    /**
     * 初始化Es仓储
     * @param index Es的Index 
     * @param type  es的Type
     */
    constructor(index: string, type: string, Entity: { new(): TEntity }) {
        super(index, type, Entity);
        this._esProxyUrl = this.ConfigCenter.GetGlobalUrl().EsProxyUrl;
        this._fullRequestUrl = `${this._esProxyUrl}${this.Index}/${this.Type}/`;
    }

    public GetAllByDsl(query: EsQueryDsl): Promise<any> {
        let dsl = this.CtorDefaultParams(query);
        let url = `${this._fullRequestUrl}_search`;
        if (!query._source) {
            query._source = [];
            let fileds = Object.keys(this.EntityInfo);
            for (let index = 0; index < fileds.length; index++) {
                const filedName = fileds[index];
                const filed = (this.EntityInfo as any)[filedName];

                //效率要求，只过滤两层，太多了吃不消
                if (filed && typeof filed === "object") {
                    let childFileds = Object.keys(filed);
                    for (let index = 0; index < childFileds.length; index++) {
                        const childFiledName = `${filedName}.${childFileds[index]}`;
                        query._source.push(childFiledName);
                    }
                }
                else {
                    query._source.push(filedName);
                }
            }
        }
        return this.Request.Request("POST", url, dsl).then((res: any) => {
            if (res) {
                let data: TEntity[] = [];
                let aggs: any;
                if (res.hits && res.hits.hits) {
                    res.hits.hits.forEach((element: any) => {
                        if (element && element._source) {
                            let entity = element._source as TEntity;
                            entity._id = element._id;
                            data.push(entity); //这里写的不好
                        }
                    });
                }
                //如果有聚合
                if (res.aggregations) {
                    aggs = res.aggregations;
                }
                return { data: data, aggs: aggs, total: res.hits.total };
            }
            return null;
        }, err => {
            console.error(err);
            return null;
        });
    }

    public UpdateByQuery(params: any, entity: TEntity): Promise<boolean> {
        let date = new Date();
        if (!params || !params.filter)
            throw new Error("查询条件为空!");

        params = this.CtorDefaultParams(params);

        let script = {
            inline: ""
        }

        if (entity.CheckImplements("IHasModificationTime")) {
            (<IHasModificationTime>(<any>entity)).modified = date.getTime();
        }
        if (entity.CheckImplements("IHasModificationMember")) {
            let sysInfo = this.ConfigCenter.GetSysInfo();
            (<IHasModificationMember>(<any>entity)).modificationMemberId = sysInfo.sysId;
            (<IHasModificationMember>(<any>entity)).modificationMemberName = sysInfo.sysName;
        }

        for (const key in entity) {
            if (params.doc.hasOwnProperty(key)) {
                const element = entity[key];
                if (element) {
                    let sourceScrpit = "";
                    if (typeof element == 'string')
                        sourceScrpit = 'ctx._source.' + key + ' = "' + element + '";';
                    else if (typeof element == 'number')
                        sourceScrpit = 'ctx._source.' + key + ' = ' + element + ';';
                    else
                        throw new Error('因为作者水平低，所以不支持对象更新，只支持number和string的数据类型更新，要更新对象的话请自行解决。')
                    script.inline += sourceScrpit;
                }
            }
        }

        let queryDsl = this.ConstructionDsl({ filter: params.filter });
        let url = `${this._fullRequestUrl}_update`;
        let data = {
            query: queryDsl.query, //这里必须构建为Dsl
            script: script
        };
        return this.Request.Request("POST", url, data).then(res => {
            console.log("EsUpdateByParams", res);
            return res.data.updated;
        }, err => {
            console.error(err);
            return null;
        });
    }

    public CreateOrUpdate(entity: TEntity): Promise<boolean> {
        let date = new Date();
        if (!entity.id) {
            entity.id = <TPrimaryKey>Common.GetUuid();

            if (entity.CheckImplements("IBrand")) {
                let brandIdInfo = this.ConfigCenter.GetBrandInfo();
                (<IBrand>(<any>entity)).brandId = brandIdInfo.brandId;
            }

            if (entity.CheckImplements("IStore")) {
                let storeInfo = this.ConfigCenter.GetStoreInfo();
                (<IStore>(<any>entity)).storeId = storeInfo.storeId;
            }

            if (entity.CheckImplements("IHasCreationTime")) {
                (<IHasCreationTime>(<any>entity)).created = date.getTime();
            }

            if (entity.CheckImplements("IHasCreationMember")) {
                let sysInfo = this.ConfigCenter.GetSysInfo();
                if (sysInfo.isUser) {
                    (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.sysId;
                    (<IHasCreationMember>(<any>entity)).creationMemberName = sysInfo.sysName;
                }
                else {
                    (<IHasCreationMember>(<any>entity)).creationMemberId = sysInfo.memberId;
                    (<IHasCreationMember>(<any>entity)).creationMemberName = "Member";
                }
            }

        } else {
            if (entity.CheckImplements("IHasModificationTime")) {
                (<IHasModificationTime>(<any>entity)).modified = date.getTime();
            }

            if (entity.CheckImplements("IHasModificationMember")) {
                let sysInfo = this.ConfigCenter.GetSysInfo();
                if (sysInfo.isUser) {
                    (<IHasModificationMember>(<any>entity)).modificationMemberId = sysInfo.sysId;
                    (<IHasModificationMember>(<any>entity)).modificationMemberName = sysInfo.sysName;
                }
                else {
                    (<IHasModificationMember>(<any>entity)).modificationMemberId = sysInfo.memberId;
                    (<IHasModificationMember>(<any>entity)).modificationMemberName = "Member";
                }
            }
        }

        let url = `${this._fullRequestUrl}${entity.id}`;
        return this.Request.Request("POST", url, entity).then(res => {
            return res.created;
        });
    }

    public DeleteByQuery(query: any): Promise<boolean> {
        throw new Error("暂时不支持DeleteByQuery;");
    }

    public DeleteById(id: TPrimaryKey): Promise<boolean> {
        throw new Error("暂时不支持本操作;");
    }

    public DeleteByEsId(esId: TPrimaryKey): Promise<boolean> {
        let url = `${this._fullRequestUrl}${esId}`;
        return this.Request.Request("DELETE", url).then(res => {
            return res.found;
        });
    }

    public Bulk(data: TEntity[], opt?: "Update" | "Create"): Promise<boolean> {
        let url = `${this._fullRequestUrl}_bulk`;
        let bulkData: any[] = [];

        data.forEach(element => {
            this.CtorDefaultImpleData(element);//构建默认接口参数
            if (opt) {
                let optHeader = { "index": { "_id": element.id } };
                bulkData.push(optHeader);
            }
            bulkData.push(element);
        });
        let serializeJson = this.BulkBody(bulkData);
        return this.Request.Request("POST", url, serializeJson).then((res: any) => {
            return res;
        });
    }

    private Serialize(val: [] | string, replacer?: any, spaces?: any): string {
        switch (typeof val) {
            case 'string':
                return val;
            case 'object':
                if (val) {
                    return JSON.stringify(val, replacer, spaces);
                }
            default:
                return "";
        }
    }
    private BulkBody(val: any): any {
        let body = '', i;
        if (Array.isArray(val)) {
            for (i = 0; i < val.length; i++) {
                body += this.Serialize(val[i]) + '\n';
            }
        } else if (typeof val === 'string') {
            // make sure the string ends in a new line
            body = val + (val[val.length - 1] === '\n' ? '' : '\n');
        } else {
            throw new TypeError('Bulk body should either be an Array of commands/string, or a String');
        }

        return body;
    }
}

class EsClientRepository<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number>
    extends BaseRepository<TEntity, TPrimaryKey>{


    public GetAllByDsl(query: EsQueryDsl): Promise<any> {
        throw new Error("Method not implemented.");
    }
    public UpdateByQuery(query: any, entity: TEntity): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public CreateOrUpdate(entity: TEntity): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public DeleteByQuery(query: any): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public DeleteById(id: TPrimaryKey): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public DeleteByEsId(esId: TPrimaryKey): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public Bulk(data: TEntity[], opt?: "Update" | "Create"): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
