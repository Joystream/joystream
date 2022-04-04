//! Contains procedural macros.
//! Heavily influenced by [derive_new](https://github.com/nrc/derive-new)

use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;

/// Generates setters methods for each field of the struct in the format `with_*`.
/// Supports only structs with named fields. It supports generics.
/// Usage:
/// ```no_run
/// #[derive(Fixture, Default)]
/// pub struct Foo{
///    pub val1: u32,
///    pub val2: u32,
/// }
///
/// fn some() {
///     let foo = Foo::default()
///         .with_val1(55)
///         .with_val2(88);
///
///     ...
/// }
/// ```
#[proc_macro_derive(Fixture)]
pub fn derive(input: TokenStream) -> TokenStream {
    // Parse the input token stream for the struct.
    let ast: syn::DeriveInput =
        syn::parse(input).expect("Couldn't parse AST(derive Fixture macro)");

    // Select struct type as the only supported type.
    match ast.data {
        syn::Data::Struct(ref s) => {
            // Parse generics.
            let (impl_generics, ty_generics, where_clause) = ast.generics.split_for_impl();

            // Get s struct name.
            let struct_name = &ast.ident;

            // Create a new output token stream for the setters.
            let mut token_stream = TokenStream2::new();

            // Select named fields as the only supported field type.
            match s.fields {
                syn::Fields::Named(ref fields) => {
                    for f in fields.named.clone() {
                        // Get field identifier & type.
                        let field_name = f.ident.expect("Works only with named fields");
                        let field_type = f.ty;

                        // Format setter name.
                        let setter_name = quote::format_ident!("with_{}", field_name);

                        // Generate output setter-function token stream.
                        let imp = quote::quote!(
                            impl #impl_generics #struct_name #ty_generics #where_clause {
                                pub fn #setter_name(self, #field_name: #field_type) -> Self {
                                    Self{
                                            #field_name,
                                            ..self
                                        }
                                }
                            }
                        );

                        // Append the last token stream to the output token stream.
                        token_stream.extend(imp);
                    }
                }
                _ => panic!("Works only with named fields."),
            }

            // Return the total generated token stream.
            token_stream.into()
        }
        _ => panic!("Works only with structs."),
    }
}
