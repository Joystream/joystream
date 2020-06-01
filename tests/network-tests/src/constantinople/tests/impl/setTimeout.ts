import tap from 'tap';
import { ApiWrapper } from '../../utils/apiWrapper';

export async function setTimeout(apiWrapper: ApiWrapper, durationInBlocks: number) {
  tap.test('retrieving time necessary for the test', async () => {
    const durationInMillis = (await apiWrapper.getBlockDuration()).muln(durationInBlocks).toNumber();
    tap.setTimeout(durationInMillis);
  });
}
