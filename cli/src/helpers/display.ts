import { cli, Table } from 'cli-ux';
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

export function displayTable(rows: { [k: string]: string }[], minColumnWidth = 0) {
    if (!rows.length) {
        return;
    }
    const columnDef = (columnName: string) => ({
        get: (row: typeof rows[number])  => chalk.white(row[columnName]),
        minWidth: minColumnWidth
    });
    let columns: Table.table.Columns<{ [k: string]: string }> = {};
    Object.keys(rows[0]).forEach(columnName => columns[columnName] = columnDef(columnName))
    cli.table(rows, columns);
}

export function toFixedLength(text: string, length: number, spacesOnLeft = false): string {
    if (text.length > length && length > 3) {
        return text.slice(0, length-3) + '...';
    }
    while(text.length < length) { spacesOnLeft ? text = ' '+text : text += ' ' };

    return text;
}
