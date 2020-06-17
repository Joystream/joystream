/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { WarthogModel, Field } from "../../src/model";

import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import { WarthogModelBuilder } from '../../src/helpers/WarthogModelBuilder';

const threadObjType = {
    name: "Thread",
    isEntity: true,
    fields: [new Field("initial_body_text", "String"),  
        new Field("title", "String"), 
        new Field("id", "ID")]
}

const postObjType = {
    name: "Post",
    isEntity: true,
    fields: [new Field("initial_body_text", "String"), 
        new Field("title", "String"), 
        new Field("id", "ID")]
}

const createModel = ():WarthogModel => {
    const warthogModel = new WarthogModel();
    warthogModel.addObjectType(threadObjType);
    warthogModel.addObjectType(postObjType);
    return warthogModel;
}

export function fromStringSchema (schema: string): WarthogModel {
    const tmpobj = tmp.fileSync();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    fs.writeSync(tmpobj.fd, schema);
    const modelBuilder = new WarthogModelBuilder(tmpobj.name);
    return modelBuilder.buildWarthogModel();
}

export { threadObjType, postObjType, createModel }