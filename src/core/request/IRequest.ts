
export interface IRequest {

    /**
     * 请求数据源
     * @param method  请求方式
     * @param url  请求路径
     * @param data  请求数据
     */
    Request(method: string, url: string, data?: any): Promise<any>;

    /**
     * 并行请求数据(axios.all[()])
     * @param promise 请求的那啥 [] 类型;
     */
    All(promise: ({}[] | Promise<{}[]>)[]): Promise<{}[][]>;
}