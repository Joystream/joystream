use syn::{ItemStruct, ItemEnum, Fields, FieldsUnnamed, Type, Ident, PathSegment, PathArguments, GenericArgument, AngleBracketedGenericArguments};
use syn::token::Colon2;
use syn::punctuated::Punctuated;
use std::fmt;

pub struct ModuleFunctionArgument(Punctuated<PathSegment, Colon2>);

pub struct ModuleFunction {
    name: Ident,
    arguments: Vec<ModuleFunctionArgument>,
}

impl fmt::Debug for ModuleFunctionArgument {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fn format_generic(parameter_data: &AngleBracketedGenericArguments) -> String {
            let mut generics = vec![];

            for i in 0..parameter_data.args.len() {
                let formated_generic = match &parameter_data.args[i] {
                    GenericArgument::Type(ty) => format!("{:?}", process_ident_path(&ty)),
                    _ => panic!("not implemented"),
                };

                generics.push(formated_generic);
            }

            format!("<{}>", generics.join(", "))
        }

        fn format_argument_segment(segment: &PathSegment) -> String {
            let segment_detail = match &segment.arguments {
                PathArguments::AngleBracketed(parameter_data) => format_generic(parameter_data),
                PathArguments::Parenthesized(_) => panic!("not implemented"),
                PathArguments::None => "".to_string(),
            };

            format!("{}{}", segment.ident.to_string(), segment_detail)
        }

        fn format_argument(argument: &Punctuated<PathSegment, Colon2>) -> String {
            argument
                .iter()
                .map(format_argument_segment)
                .collect::<Vec<String>>()
                .join("::")
        }

        let arguments = format_argument(&self.0);

        f.write_str(&format!("{}", arguments))
    }
}

impl fmt::Debug for ModuleFunction {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fn format_arguments(arguments: &Vec<ModuleFunctionArgument>) -> String {
            arguments
                .iter()
                .map(|item| format!("{:?}", item))
                .collect::<Vec<String>>()
                .join(", ")
        }

        let arguments = format_arguments(&self.arguments);

        f.write_str(&format!("ModuleFunction - {}({})", &self.name, arguments))
    }
}

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
            name: ident.clone(),
            arguments: field_type_names,
        };
        functions.push(function);
    }

    functions
}

fn process_unnamed_fields(unnamed_fields: &FieldsUnnamed) -> Vec<ModuleFunctionArgument> {
    let mut arguments = vec![];

    let len = unnamed_fields.unnamed.len();
    for i in 0..len {
        let argument_type = process_ident_path(&unnamed_fields.unnamed[i].ty);

        arguments.push(argument_type);
    }

    arguments
}

fn process_ident_path(ty: &Type) -> ModuleFunctionArgument {
    match ty {
        Type::Path(type_path) => {
            let argument_type = type_path.path.segments.clone();

            ModuleFunctionArgument(argument_type)
        },
        _ => panic!("not implemented"),
    }
}
