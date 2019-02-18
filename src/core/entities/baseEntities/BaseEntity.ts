import { IBrand } from './IBrand';
import { IFullAudit } from './IAudit';
import { IStore } from './IStore';

/**
 * 实体的主接口 所有的必须继承这玩意
 */
export interface IEntity<TPrimaryKey extends number | string> {
    _id?: string;
    id?: TPrimaryKey;

    /**
     * 检查是不是继承了某一个接口
     * @param interfaceName  接口名称
     */
    CheckImplements(interfaceName: string): boolean;

    /**
     * 获取对象信息
     */
    GetEntityInfo(): { Name: string, Index: string, Type: string };
}

export abstract class BaseEntity<TPrimaryKey extends string | number> implements IEntity<TPrimaryKey>, IBrand {

    constructor() {
        this.id = undefined;
        this.brandId = undefined;
    }

    /**
     * 唯一的Id
     */
    public id?: TPrimaryKey;

    /**
     * Es的Id
     */
    public _id?: string;

    /**
     * 品牌Id 
     */
    public brandId?: number;

    /**
     * 标识是不是继承了IBrand接口
     */
    ImplementsIBrand(): boolean {
        return true;
    }

    /**
     * 判断是不是继承了这个接口
     * @param key 接口名称字符串
     */
    CheckImplements(interfaceName: string): boolean {
        let implementsKey = "Implements" + interfaceName;
        let obj = <any>this;
        let func: Function | undefined = obj[implementsKey]
        if (func && func())
            return true;
        return false;
    }

    abstract GetEntityInfo(): { Name: string; Index: string; Type: string; };
}

/**
 * 全继承接口 所有的限制都会加上 （PS:不包括软删除,由于业务需要所以...）
 */
export abstract class FullAuditEntity<TPrimaryKey extends string | number> extends BaseEntity<TPrimaryKey> implements IFullAudit, IStore {

    constructor() {
        super();
    }

    /**
     * 门店Id
     */
    public storeId?: number;

    /**
     * 创建时间
     */
    public created?: number;
    public creationMemberId?: number;
    public creationMemberName?: string;


    /**
     * 修改时间
     */
    public modified?: number;
    public modificationMemberId?: number;
    public modificationMemberName?: string;

    abstract GetEntityInfo(): { Name: string; Index: string; Type: string; };

    ImplementsIBrand() {
        return true;
    }

    ImplementsIStore() {
        return true;
    }

    ImplementsIHasCreationTime() {
        return true;
    }

    ImplementsIHasCreationMember() {
        return true;
    }

    ImplementsIHasModificationTime() {
        return true;
    }

    ImplementsIHasModificationMember() {
        return true;
    }

}
