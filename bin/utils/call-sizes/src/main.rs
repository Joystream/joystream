use joystream_node_runtime::*;

fn main() -> Result<(), String> {
    println!(
        "referendum: {}",
        core::mem::size_of::<referendum::Call<Runtime, referendum::Instance1>>()
    );

    println!("forum: {}", core::mem::size_of::<forum::Call<Runtime>>());

    println!(
        "constitution: {}",
        core::mem::size_of::<pallet_constitution::Call<Runtime>>()
    );

    println!(
        "joystream_utility: {}",
        core::mem::size_of::<joystream_utility::Call<Runtime>>()
    );

    println!(
        "project_token: {}",
        core::mem::size_of::<project_token::Call<Runtime>>()
    );

    println!(
        "proposals_discussion: {}",
        core::mem::size_of::<proposals_discussion::Call<Runtime>>()
    );

    println!("bounty: {}", core::mem::size_of::<bounty::Call<Runtime>>());

    println!(
        "storage: {}",
        core::mem::size_of::<storage::Call<Runtime>>()
    );

    println!(
        "working_group: {}",
        core::mem::size_of::<working_group::Call<Runtime, working_group::Instance1>>()
    );

    println!(
        "membership: {}",
        core::mem::size_of::<membership::Call<Runtime>>()
    );

    println!(
        "proposals_engine: {}",
        core::mem::size_of::<proposals_engine::Call<Runtime>>()
    );

    println!(
        "proposals_codex: {}",
        core::mem::size_of::<proposals_codex::Call<Runtime>>()
    );

    println!(
        "proposals_discussion: {}",
        core::mem::size_of::<proposals_discussion::Call<Runtime>>()
    );

    println!(
        "content: {}",
        core::mem::size_of::<content::Call<Runtime>>()
    );

    println!(
        "council: {}",
        core::mem::size_of::<council::Call<Runtime>>()
    );

    println!("----\nRuntime: {}", core::mem::size_of::<Call>());

    Ok(())
}
