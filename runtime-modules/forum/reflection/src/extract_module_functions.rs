use syn::{ItemStruct, ItemEnum, Fields, FieldsUnnamed, Type, Ident, PathSegment};
use syn::token::Colon2;
use syn::punctuated::Punctuated;
use std::fmt;

pub struct ModuleFunction {
    name: Ident,
    arguments: Vec<Punctuated<PathSegment, Colon2>>,
}

impl fmt::Debug for ModuleFunction {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        //let arguments = &self.arguments.iter().as_slice().join(", ");
        //let arguments = &self.arguments.iter().map(|item| item.to_string()).collect::<Vec<u8>>().as_slice().join(", ");
        //let arguments = &self.arguments.iter().map(|item| item.to_string()).collect::<String>().to_string().as_slice().join(", ");
        //let arguments = &self.arguments.iter().map(|item| item.to_string()).collect::<String>();
        let arguments = &self.arguments.iter()
            .map(|item| {
                //item.ident.to_string()
                /*
                item.iter()
                    .map(|tmp_item| tmp_item.ident.to_string())
                    .collect::<String>()
                    //.into_bytes();
                    .to_string()
                    */
                println!("xxx {:?}", item);
                item.iter()
                    .map(|path_segment| path_segment.ident.to_string())
                    .collect::<Vec<String>>()
                    .join(", ")
            })
            .collect::<String>();
            //.into_bytes();
            //.to_string();

        f.write_str(&format!("ModuleFunction - {}({})", &self.name, arguments))

/*
        f.debug_struct("ModuleFunction")
            .field("name", &self.name)
            .field("arguments", &self.arguments)
            //.field("arguments", &self.arguments.iter().as_slice().join(", "))
            .finish()
*/
    }
}

//pub struct ModuleFunctionArgument(Vec<u8>);

pub fn extract_module_functions(input: &ItemEnum) -> Vec<ModuleFunction> {
    let mut functions = vec![];

    let len = input.variants.len();
    for i in 0..len {

        let ident = &input.variants[i].ident;
        if ident.to_string() == "__PhantomItem" { // some weird item present at the start of an array
            continue;
        }

        let field_type_names = match &input.variants[i].fields {
            Fields::Unnamed(unnamed_fields) => process_unnamed_fields(unnamed_fields),
            _ => panic!("not implemented"),
        };

        let function = ModuleFunction {
            //name: input.variants[i].ident.to_string().into_bytes(),
            name: ident.clone(),
            arguments: field_type_names,
        };
        functions.push(function);
    }

    functions
}

fn process_unnamed_fields(unnamed_fields: &FieldsUnnamed) -> Vec<Punctuated<PathSegment, Colon2>> {
    //println!("{:?}", unnamed_fields);
    let mut arguments = vec![];

    let len = unnamed_fields.unnamed.len();
    for i in 0..len {
        let argument_type = process_ident_path(&unnamed_fields.unnamed[i].ty);

        arguments.push(argument_type);
    }

    arguments
}

fn process_ident_path(ty: &Type) -> Punctuated<PathSegment, Colon2> {
    println!("----------- {:?}", ty);

    match ty {
        Type::Path(type_path) => {
            let argument_type = type_path.path.segments.clone();
            /*
            let argument_type = type_path.path.segments
                .iter()
                .map(|item| item.ident.to_string())
                .collect::<String>()
                //.into_bytes();
                .to_string();
                */

            //println!("{:?}", type_path.path.segments[0].ident.to_string());
            //println!("{:?}", type_path.path.segments[0].ident.to_string());
            //println!("{:?}", type_path.path.segments.to_string());
            //println!("{:?}", type_path.path.segments.iter().map(|item| item.ident.to_string()).collect::<String>().join());

            //println!("{:?}", argument_type);

            argument_type
        },
        _ => panic!("not implemented"),
    }
}
