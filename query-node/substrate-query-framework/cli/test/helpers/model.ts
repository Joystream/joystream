import { WarthogModel, Field } from "../../src/model";

const threadObjType = {
    name: "Thread",
    fields: [new Field("initial_body_text", "String"),  
        new Field("title", "String"), 
        new Field("id", "ID")]
}

const postObjType = {
    name: "Post",
    fields: [new Field("initial_body_text", "String"), 
        new Field("title", "String"), 
        new Field("id", "ID")]
}

const createModel = () => {
    const warthogModel = new WarthogModel();
    warthogModel.addObjectType(threadObjType);
    warthogModel.addObjectType(postObjType);
    return warthogModel;
}

export { threadObjType, postObjType, createModel }