import postMigrationAssertions from '../misc/postMigrationAssertionsFlow'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
    job(
        'Verify post-migration chain state',
        postMigrationAssertions
    )
})
