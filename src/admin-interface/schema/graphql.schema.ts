
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface GetUsersOutput {
    users?: Nullable<Nullable<User>[]>;
}

export interface IQuery {
    getUsers(): Nullable<GetUsersOutput> | Promise<Nullable<GetUsersOutput>>;
}

export interface User {
    id: string;
    email?: Nullable<string>;
    phone?: Nullable<string>;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
}

type Nullable<T> = T | null;
