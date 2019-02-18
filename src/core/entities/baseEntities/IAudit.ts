/**
 * 有创建时间
 */
export interface IHasCreationTime {
    created?: number;

    ImplementsIHasCreationTime(): boolean;
}

/**
 * 有创建审计日志
 */
export interface IHasCreationMember {
    creationMemberId?: number;
    creationMemberName?: string;

    ImplementsIHasCreationMember(): boolean;
}


/**
 * 修改时间
 */
export interface IHasModificationTime {
    modified?: number;

    ImplementsIHasModificationTime(): boolean;
}

/**
 * 修改人
 */
export interface IHasModificationMember {
    modificationMemberId?: number;
    modificationMemberName?: string;

    ImplementsIHasModificationMember(): boolean;
}

/**
 * 软删除接口 
 */
export interface IHasSoftDelete {
    isDeleted?: boolean;
    ImplementsIHasSoftDelete(): boolean;
}

/**
 * 修改审计日志
 */
export interface IFullModificationAudit extends IHasModificationTime, IHasModificationMember {
}

/**
 * 创建审计日志
 */
export interface IFullCreationAudit extends IHasCreationTime, IHasCreationMember {
}

/**
 * 所有审计日志
 */
export interface IFullAudit extends IFullCreationAudit, IFullModificationAudit {
}

//PS: TS这玩意 不能判断是不是实现了接口， 只能判断是不是继承了父类 ，所以软删除这东西，只能手动加了。