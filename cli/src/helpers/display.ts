import { cli } from 'cli-ux';
import chalk from 'chalk';
import { NameValueObj } from '../Types';

export function displayHeader(caption: string, placeholderSign: string = '_', size: number = 50) {
    let singsPerSide: number = Math.floor((size - (caption.length + 2)) / 2);
    let finalStr: string = '';
    for (let i = 0; i < singsPerSide; ++i) finalStr += placeholderSign;
    finalStr += ` ${ caption} `;
    while (finalStr.length < size) finalStr += placeholderSign;

    process.stdout.write("\n" + chalk.bold.blueBright(finalStr) + "\n\n");
}

export function displayNameValueTable(rows: NameValueObj[]) {
    cli.table(
        rows,
        {
            name: { minWidth: 30, get: row => chalk.bold.white(row.name) },
            value: { get: row => chalk.white(row.value) }
        },
        { 'no-header': true }
    );
}

