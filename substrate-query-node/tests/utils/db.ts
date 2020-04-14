import { getRepository, getConnection, Connection } from "typeorm";

export async function clearDBData(model: string, connection: Connection) {
  const records = await connection.getRepository(model).find();
  console.log("Records", records);
  records.forEach(async (record) => {
    await connection.getRepository(model).delete({ id: record["id"] });
  });
}
