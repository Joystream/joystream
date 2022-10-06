import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'

export class SetSudoKeyFixture extends BaseFixture {
    protected new_key: string

    public constructor(api: Api, new_key: string) {
        super(api)
        this.new_key = new_key
    }

    async execute(): Promise<void> {
        const tx = this.api.tx.sudo.setKey(this.new_key)
        await this.api.makeSudoCall(tx)
    }
}
