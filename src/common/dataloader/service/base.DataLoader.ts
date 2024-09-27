// const NEST_LOADER_CONTEXT_KEY = 'NEST_LOADER_CONTEXT_KEY';

// @Injectable({ scope: Scope.REQUEST })
// export class BaseLoader<K, V extends ObjectLiteral> {
//   private dataLoader: DataLoader<K, V> | DataLoader<K, V[]>;
//   private valueRepo: Repository<V>;
//   private options: BaseLoaderInput;

//   constructor(inp: BaseLoaderInput) {
//     this.options = { ...defaultBaseLoaderInput, ...inp };
//     this.valueRepo = getRepository(inp.valueEntity);
//     if (this.options.isOneType) {
//       this.dataLoader = new DataLoader<K, V>(
//         getBatchLoadFn<K, V>(
//           this.valueRepo,
//           // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
//           this.options.fieldName!,
//           this.options.relations,
//         ),
//       );
//     } else {
//       this.dataLoader = new DataLoader<K, V[]>(
//         getBatchLoadFn<K, V>(
//           this.valueRepo,
//           // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
//           this.options.fieldName!,
//           this.options.relations,
//           false,
//         ),
//       );
//     }
//   }

//   public getLoader() {
//     return this.dataLoader;
//   }
// }

// //types of keys.. add docs
// export class KeyTypes {
//   STRING: 'string' = 'string';
//   NUMBER: 0 = 0;
// }

// //type to accept class as parameter
// export type Newable<T> = { new (...args: any[]): T };

// //type of InjectDataLoader input 'data'
// export interface BaseLoaderInput {
//   valueEntity: Newable<any>;
//   keyType?: keyof KeyTypes;
//   isOneType?: boolean;
//   fieldName?: string;
//   relations?: string[] | undefined;
//   where?: ObjectLiteral;
//   [key: string]: any;
// }

// export const defaultBaseLoaderInput = {
//   isOneType: true,
//   fieldName: 'id',
//   relations: undefined,
// };

// /**
//  * Custom Decorator to be used to inject dataloader
//  */
// export const InjectDataLoader = createParamDecorator(
//   async (data: BaseLoaderInput, context: ExecutionContext) => {
//     data['name'] = context.getHandler().name;
//     return addDataLoaderToContext(data, context);
//   },
// );

// export async function addDataLoaderToContext(
//   data: BaseLoaderInput,
//   context: ExecutionContext,
// ) {
//   const ctx: any = GqlExecutionContext.create(context).getContext();
//   if (ctx[NEST_LOADER_CONTEXT_KEY] === undefined) {
//     ctx[NEST_LOADER_CONTEXT_KEY] = {
//       contextId: ContextIdFactory.create(),
//       //TODO:change 'any' to concrete type
//       getDataLoader: async (
//         dataInp: BaseLoaderInput,
//       ): Promise<BaseLoader<any, any>> => {
//         const name = dataInp.name;
//         if (ctx[name] === undefined) {
//           const obj = new BaseLoader<
//             typeof dataInp.keyType,
//             typeof dataInp.valueEntity
//           >(dataInp);
//           ctx[name] = obj;
//         }
//         return ctx[name];
//       },
//     };
//   }
//   const baseLoader: BaseLoader<any, any> = await ctx[
//     NEST_LOADER_CONTEXT_KEY
//   ].getDataLoader(data);
//   const dataLoader = baseLoader.getLoader();
//   return dataLoader;
// }
