import { IEntity } from '../entities/baseEntities/BaseEntity';
import { EsQueryDsl, EsQuery } from './dtos/EsQuery';

/**
 * 仓储接口 (PS：语言貌似不支持对TEntity进行接口限制 所以就没写了)
 */
export interface IRepository<TEntity extends IEntity<TPrimaryKey>, TPrimaryKey extends string | number> {
    GetAll(query: EsQuery): Promise<any>;
    GetAllByDsl(query: EsQueryDsl): Promise<any>;

    UpdateByQuery(query: any, entity: TEntity): Promise<boolean>;
    UpdateById(entity: TEntity): Promise<boolean>;
    UpdateByEsId(entity: TEntity, esId: TPrimaryKey): Promise<boolean>;

    DeleteByQuery(query: any): Promise<boolean>;
    DeleteById(id: TPrimaryKey): Promise<boolean>;
    DeleteByEsId(esId: TPrimaryKey): Promise<boolean>;

    Create(entity: TEntity): Promise<boolean>;

    /**
     *  [-- 请把下面的这一段看完 --]
     *  调用这个函数创建的时候，并且Id需要自定义的
     *  如果需要创建时间和创建人，请自己把创建时间创建人加上
     * @param entity 
     */
    CreateOrUpdate(entity: TEntity): Promise<boolean>;

    Bulk(data: TEntity[], opt?: "Update" | "Create"): Promise<boolean>;
}
